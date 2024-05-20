---
title: E-commerce Backend - Monolith - Decoupling Components with Event Bus - (Part 4)
date: 2024-04-21
tags:
  - api
  - rest
  - quarkus
  - java
  - systemsdesign
---
This post is part of a series that already has:
- [E-commerce Backend - Monolith - Overall Architecture - (Part 1)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-1)
- [E-commerce Backend - Monolith - Starting with Quarkus - (Part 2)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-2)
- [E-commerce Backend - Monolith - Caching with Redis - (Part 3)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-3)
- [E-commerce Backend - Monolith - Docker Compose to run the App and Infra locally - (Part 5)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-5)
- [E-commerce Backend - Monolith - Local Kubernetes with Kind - to run the App and Infra - (Part 6)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-6)
- [E-commerce Backend - Monolith - Kubernetes Probes - (Part 7)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-7)

---

This post is about decoupling components by leveraging Quarkus (Verte.x, actually) [EventBus](https://quarkus.io/guides/reactive-event-bus).
It works in a very similar way as the Spring Events

---

# Introduction
To process an Order, there are several services involved:
- Order service to validate and persist the order;
- Payment service to process the order payment;
- Shipment service to trigger the shipping process;
- Notification service to notify the customer about the success or failure of processing his payment and shipping his ordered products.

So far, the process looks like this:
![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4/order-processing-as-is.png)

Here's what it looks like in the code:

```Java
// Order Service
...
	public Order requestOrder(CreateOrderDTO orderDto) { // 2
		Log.tracef("Creating a new order: %s", orderDto);
		Order order = mapToOrder(orderDto);
		Order createdOrder = create(order);
	
		boolean paymentSucceeded = paymentService.chargeOrder(createdOrder); // 3
		if (paymentSucceeded) {
			shippingService.shipOrder(createdOrder); // 8
		}
		        // Had to get it from the database to get the updated status that might change during the
        // payment and shipping process
        return Order.findById(createdOrder.getId()); // 12
	}
...
```

```Java
// Payment Service
...
@Transactional
    public boolean chargeOrder(Order order) { // 3
        Payment payment = new Payment(order.getPaymentAmount(), order);
        Log.debugf("Charging payment: %s", payment);
        var response = paymentGatewayService.charge(payment); // 4 and 5
        if (!response.get("status").equals("201")) {
            Log.errorf("Payment failed: %s", response);
            notificationService
                    .notifyByEmail("Your payment for order " + order.getId() + " failed");
            orderRepository.updateOrderStatus(order.getId(), OrderStatus.PAYMENT_FAILED);
            return false; // 7
        }
        paymentRepository.savePayment(payment);
        notificationService.notifyByEmail("Your payment for order " + order.getId() + " succeeded"); // 6
        orderRepository.updateOrderStatus(order.getId(), OrderStatus.PAID);
        return true; // 7
    }
...
```

```Java
// Shipping Service
...
@Transactional
    public void shipOrder(Order order) {
        Log.debugf("Shipping order: %s", order);
        var response = shippingGatewayService.ship(order);
        if (!response.get("status").equals("201")) {
            Log.errorf("Shipping request failed: %s", response);
            orderRepository.updateOrderStatus(order.getId(), OrderStatus.SHIPPING_FAILED);
            return;
        }
        notificationService.notifyByEmail("Your order " + order.getId() + " has been shipped");
        orderRepository.updateOrderStatus(order.getId(), OrderStatus.SHIPPED);
    }
...
```

```Java
// Notification Service
...
    public void notifyByEmail(String message) {
        Log.infof("Sending email notification: %s", message);
    }
...
```

Note how everything works sequentially and synchronously.
Also, those 4 services are tightly coupled as you can notice in the code snippets below.
# The problem to be solved
Now I want to tackle the following issues in my code:
1. Services are too coupled;
2. Some executions don't have to be synchronous as in:
	1. Calling Notification Services: It is blocking the HTTP request and I don't want to wait until the notification is sent to return the Request Response to the client.
	2. Triggering Shipment: I also don't care about the Shipping Service response. I want to fire and forget about it. If it fails, I will rely on notifications, and logs and let the Operations team of the E-commerce store resolve any problems with that.
3. Because the whole execution flow of Ordering is synchronous and sequential, **the average response time of the endpoint is 450ms** running locally! That's not good;
4. Single Responsibility is being harmed because:
	1. Payment Service takes care of updating the Order Status if payment succeeds or fails. Order Service should be responsible for updating the order status;
	2. Same thing for Shipping Service.

# Solving those problems
My first thought was to implement the [Observer](https://refactoring.guru/design-patterns/observer) design pattern.
But it could be a bit messy because I would have several components acting both as publishers and subscribers:
1. The Order Service publishes `order created event`
2. The Payment Service listens to the `order created event`, then publishes `order payment succeeded event`
3. The Order Service listens to the `order payment succeeded event` and updates the Order Status to `PAID`
4. The Notification Service listens to the `order payment succeeded event` and notifies the Customer
5. The Shipment Service listens to the `order payment succeeded event`, triggers the order shipment, and then publishes the `order shipped event`
6. The Notification Service listens to the `order shipped event` and notifies the Customer
7. The Order Service listens to the `order shipped event` and updates the Order Status to `SHIPPED`

Then I realized I needed an Event Bus to centralize the events. Fortunately, the Quarkus Vert.x extension provides us with the Verte.x Event Bus. [Here is how to use it](https://quarkus.io/guides/reactive-event-bus#dealing-with-messages).
It makes much more sense to a component as a broker of events (the Event Bus).

It's important to note that this Event Bus is on the Application level. It's not an external server allowing communication between different applications/services.
## Implementation
First thing, as I mentioned before, the Event Bus used in Quarkus comes from Vert.x, so we need to add Vert.x extension to the project:

```xml
<dependency>
	<groupId>io.quarkus</groupId>
	<artifactId>quarkus-vertx</artifactId>
</dependency>
```

Then we inject the EventBus, remove the calls to `PaymentService` and `ShippingService`, and publish an event.
We also listen (consume) payment and shipping events to update the Order status accordingly.

```Java
// Order Service

@Inject
private EventBus eventBus;

...
    public Order requestOrder(CreateOrderDTO orderDto) {
        Log.tracef("Creating a new order: %s", orderDto);
        Order order = mapToOrder(orderDto);
        Order createdOrder = create(order);

        eventBus.publish("order.created", createdOrder.id);
        return createdOrder;
    }

    @ConsumeEvent("order.payment.succeeded")
    @Blocking
    @Transactional
    public void onOrderPaymentSucceeded(Long orderId) {
        Log.infof("Listening to order payment succeeded: %s", orderId);
        orderRepository.updateOrderStatus(orderId, OrderStatus.PAID);
    }

    @ConsumeEvent("order.payment.failed")
    @Blocking
    @Transactional
    public void onOrderPaymentFailed(Long orderId) {
        Log.infof("Listening to order payment failed: %s", orderId);
        orderRepository.updateOrderStatus(orderId, OrderStatus.PAYMENT_FAILED);
    }

    @ConsumeEvent("order.shipping.succeeded")
    @Blocking
    @Transactional
    public void onOrderShippingRequestSucceeded(Long orderId) {
        Log.infof("Listening to order shipping succeeded: %s", orderId);
        orderRepository.updateOrderStatus(orderId, OrderStatus.SHIPPED);
    }

    @ConsumeEvent("order.shipping.failed")
    @Blocking
    @Transactional
    public void onOrderShippingRequestFailed(Long orderId) {
        Log.infof("Listening to order shipping failed: %s", orderId);
        orderRepository.updateOrderStatus(orderId, OrderStatus.SHIPPING_FAILED);
    }
...
```

I think that's enough regarding showing the code. I covered both publishing and consuming events. But if you want to check all the changes to the code, here is the commit doing that:
https://github.com/viniciusvasti/practicing-quarkus-ecommerce/commit/0a5191d7ed8eae6a403815fa94ad74280f2a7274

Ah! Now the average response time is under 50ms. Most of the time ~20ms. ~10 to 20x faster =)

The diagram of the Order request now looks like this:
![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4/order-processing-to-be.png)

---

And that's it for this post. Thanks for reading.

[Code here](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/tree/monolith/products-catalog-rest-api)