---
title: 'Application logging with Correlation ID'
date: '2021-02-23'
tags: 'java,spring boot,logging'
---

---
Hi, everyone!
if you have already had any experience with production software, you know the importance of logging for an app.  
For web applications, we usually have multi threaded instances, receiving several requests.  
It could be tricky to analyze several log lines for a specific execution. E.g. POST request for a specific resource performed by a specific user at certain timestamp.
A good solution is to have a Correlation ID for a execution flow.
Let me show how to do that in a Spring Boot App.

---

## About the tech stack
- [Spring Boot]: most popular Java framework for building backend web applications;

---

### The problem
Let me show a simple example of some lines of log for a request:
```bash
2021-02-23 13:52:11.386  INFO 39105 --- OrderCommandController       : Receiving HTTP POST with body CreateOrderDTO[customerName=string, products=[ProductDTO[sku=0, name=string, price=0.0]], payment=PaymentDTO[paymentMethod=CREDIT]]
2021-02-23 13:52:11.390  INFO 39105 --- OrderRequestServiceImpl  : Creating order: CreateOrderDTO[customerName=string, products=[ProductDTO[sku=0, name=string, price=0.0]], payment=PaymentDTO[paymentMethod=CREDIT]]
2021-02-23 13:52:11.392  INFO 39105 --- OrderRepository      : Persisting Order(id=8e6dd1ad-8f9e-4002-9f4b-4faceb2a2b5e, customerName=string, products=[Product(sku=0, name=string, price=0.0)], payment=Payment(paymentMethod=CREDIT))
2021-02-23 13:52:11.641  INFO 39105 --- OrderRepository      : Success while persisting
2021-02-23 13:52:11.642  INFO 39105 --- KafkaOrderReceivedProducer   : Publishing event OrderReceivedEventDTO(id=8e6dd1ad-8f9e-4002-9f4b-4faceb2a2b5e, customerName=string, products=[OrderReceivedEventDTO.Product(sku=0, name=string, price=0.0)], payment=OrderReceivedEventDTO.Payment(paymentMethod=CREDIT))
2021-02-23 13:52:12.364  INFO 39105 --- KafkaOrderReceivedProducer   : Success while publishing
```
It's easy to follow this execution flow. But if it was running in a cluster, with several instances, receiving hundreds of requests for second, it would be very difficult to figure it out which order the last line (Success while publishing) is associated with.

### The solution
First thing is to intercept every request and set a CID (Correlation ID) if it's not provided by the client as an HTTP request heade:
```java
@Component
public class RequestLoggingFilter implements Filter {

    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {

        final var httpServletRequest = (HttpServletRequest) servletRequest;
        String currentCorrId = httpServletRequest.getHeader("CID");

        if (currentCorrId == null) {
            currentCorrId = UUID.randomUUID().toString();
        }
        MDC.put("CID", currentCorrId);

        try {
            filterChain.doFilter(httpServletRequest, servletResponse);
        } finally {
            MDC.remove("CID");
        }
    }

    @Override
    public void destroy() {}

}
```

In the code above, I'm filtering Servlet requests, trying to retrieve a CID from headers and if no present, generating one.  
Then I put the CID on MDC*, let the request go forward and finally, clear the CID (it happens on the same thread).

### The result
Executing the same action, note the new log field `CID=48eaba9a-dca9-44da-93e2-f95d93652846`:
```bash
2021-02-23 15:20:12.308  INFO CID=48eaba9a-dca9-44da-93e2-f95d93652846 47388 --- OrderCommandController       : Receiving HTTP POST with body CreateOrderDTO[customerName=string, products=[ProductDTO[sku=0, name=string, price=0.0]], payment=PaymentDTO[paymentMethod=CREDIT]]
2021-02-23 15:20:12.312  INFO CID=48eaba9a-dca9-44da-93e2-f95d93652846 47388 --- OrderRequestServiceImpl  : Creating order: CreateOrderDTO[customerName=string, products=[ProductDTO[sku=0, name=string, price=0.0]], payment=PaymentDTO[paymentMethod=CREDIT]]
2021-02-23 15:20:12.314  INFO CID=48eaba9a-dca9-44da-93e2-f95d93652846 47388 --- OrderRepository      : Persisting Order(id=0f14d935-c7e2-431e-8624-e1f359aa69ea, customerName=string, products=[Product(sku=0, name=string, price=0.0)], payment=Payment(paymentMethod=CREDIT))
2021-02-23 15:20:12.336  INFO CID=48eaba9a-dca9-44da-93e2-f95d93652846 47388 --- OrderRepository      : Success while persisting
2021-02-23 15:20:12.337  INFO CID=48eaba9a-dca9-44da-93e2-f95d93652846 47388 --- KafkaOrderReceivedProducer   : Publishing event OrderReceivedEventDTO(id=0f14d935-c7e2-431e-8624-e1f359aa69ea, customerName=string, products=[OrderReceivedEventDTO.Product(sku=0, name=string, price=0.0)], payment=OrderReceivedEventDTO.Payment(paymentMethod=CREDIT))
2021-02-23 15:20:12.388  INFO  47388 --- [ad | producer-6] KafkaOrderReceivedProducer   : Success while publishing
```
Now it is easy to correlate log lines for a single process execution and filter log by the CID for better visualization of the application flow.  

But note also the last log line. It has no CID, because it is executed in an async operation.  
As a said early, the MDC scope is the thread, but the last line happens in another thread. Thus we have a tricky improvement to work with.

*[Mapped Diagnostic Context](http://logback.qos.ch/manual/mdc.html)

---
That's it for now. Se you later!
