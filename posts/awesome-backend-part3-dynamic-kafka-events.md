---
title: 'Awesome Backend - Part 3 - Dynamic between microservices and Kafka as a backbone of events'
date: '2021-02-17'
tags: 'architecture,microservices,event-driven,message-driven,apache kafka,c4model'
---

---

Hi, everyone!
This is part 3 of the Awesome Backend series.
More info at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
For this part, I'm going to design the events/messages flow through the microservices when an Order is requested by a customer.  
I want my microservices to be decoupled one from another, so as discussed in part 2, Apache Kafka will be the message broker acting as a backbone of events for this architecture.  
Apache Kafka allows us to have more the one event listener with the guarantee that the event is 
going to be delivered to each one of them, it's highly available, fault-tolerant, and scalable. 
However, in more simple Systems, Apache Kafka could be considered over-engineering, since 
RabbitMQ, for example, could do the job and is simpler to configure and maintain.

So, hands-on!

---

## About the tech stack
- [C4 Model](https://c4model.com/): A simple, easy to write, architecture diagram model;
- [PlantUML](https://plantuml.com/): A component that allows to quickly write diagrams as code;
- [Apache Kafka](https://kafka.apache.org/): A distributed event streaming platform.

---

### Dynamic between microservices and Kafka as a backbone of events on Ordering action
I'm following the approach of having a backbone of events supporting communication between the microservices of the System.  
For a detailed description of this approach, it's worth reading this article from [confluent](https://www.confluent.io/blog/build-services-backbone-events/).

This is the Dynamic diagram, one of the C4 supplementary diagrams. Since the core diagrams are static representations of the architecture, this is the best one to describe the flow of actions at runtime:
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome Online Store/Dynamic/events-backbone-for-ordering.svg">
    <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome Online Store/Dynamic/events-backbone-for-ordering.svg" />
    <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome Online Store/Dynamic/events-backbone-for-ordering.puml">checkout-flow-chart.puml on github</a></figcaption>
    </figure>
</a>

For those not familiar with Kafka, to put it simply, the actors are three:
- A Producer, who publishes messages/events to a topic of an Apache Kafka broker;
- A Broker which is a cluster of instances of Apache Kafka, keeps logs of messages for a while and tracks which one was consumed by each subscribed consumer;
- A Consumer, who listens to messages held on a topic it has subscribed to.

If it isn't clear, let me explain each message:
1. This is pretty straightforward, the front makes an HTTP request to the API Gateway to post an order;
2. Straightforward as well, API Gateway passes along the request to `Orders Microservice`;
3. `Orders Microservice` produces a message to Kafka asking if the product items contained in the order are available for sale;
4. `Stock Microservice` consumes that message and verifies the stock for each product;
5. `Stock Microservice` answers by producing a message informing that order products are 
   available, thus the order can continue;
6. `Orders Microservice` consumes the answer from `Stock Microservice`;
7. `Orders Microservice` produces a message asking for payment to be processed;
8. `Payments Microservice` consumes the message with the data for payment processing;
9. `Payments Microservice` requests the Payment Broker to do it;
10. `Payments Microservice` produces an event informing that payment has been succeeded;
11. `Orders Microservice` consumes the event of success on the payment process;
12. `Orders Microservice` produces an event informing that the order is approved;
13. In parallel, three guys consume the order approved event and take action: `Stock Microservice` decreases stock for each product in the order, `Shipments Microservice` triggers the shipping process and `Notifications Microservice` sends an email to the customer informing that his/her order was approved.

Note that by this level of decoupling between microservices, each one doesn't care who will listen to its messages/events.  
Orders Microservice doesn't care about who is going to process payment, it only needs it to be done to proceed.  
I can easily replace Payments Microservice for a Serverless function, use a legacy System, or anything else without side effects to Orders Microservice. This is the beauty here.

---

That's it for now.  
See you soon on the next posts.

See all posts series at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands-on</a>  
