---
title: 'Awesome Backend - Part 2 - Designing Microservices Architecture and C4 Level 2 Diagram'
date: '2021-02-15'
tags: 'architecture,microservices,apigateway,event-driven,message-driven,apache kafka,c4model,ddd'
---

---

Hi, everyone!
This is the part 2 of Awesome Backend series.
More info at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
For this part, I'm going to model the System, identifying business domain contexts for a decoupled backend as a microservice architecture.  
I'm going to draw it as a C4 Model Container Diagram as well.

So, hands on!

---

## About the tech stack
- [C4 Model](https://c4model.com/): A simple, easy to write, architecture diagram model;
- [PlantUML](https://plantuml.com/): A component that allows to quickly write diagrams as code;

---

### Identifying Contexts
The functional flowchart of the app discussed on part 1 ended up like this:
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg">
     <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg" />
      <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.puml">checkout-flow-chart.puml on github</a></figcaption>
    </figure>
</a>

First off all, I will identify the subjects over any operation is executed:
- Add **product** to **cart**
- Choose a **payment method**
- Submit an **order**
- Check product availability on **stock**
- Process **payment**
- Decrease product **stock**
- Send **email**
- Trigger **shipment**

Then I can use these subjects to identify the bounded contexts of the business domain:
- Product could have a Product Microservice, with the single responsibility of maintaining a catalog of products. I'm going to ignore that for now. I believe a CRUD of products would be too trivial.  
So, a **Stock Microservice** might handle listing for products plus operations over stock products count. It may look like this microservice shouldn't be responsible for listing products, but actually it's the only one who knows which products of the catalog are available for sale. Imagine that it has in its database at least the id and name of products, replicated from a non-implemented Products Microservice, associated with the number of items on stock.  
- For payments, a **Payments Microservice** could handle payment methods and payment processing through an integration with a third party payment broker.  
- An **Orders Microservice** would handle the orders, what includes managing customers cart.  
- An email sender microservice would be too small and specific, let's call it **Notifications Microservice**, we could use it for SMS or Whatsapp messages later.  
- Finally, **Shipments Microservice** would be responsible for managing shipment and integrate with a third party shipping company.

### C4 Model - Level 2 - Containers Diagram
Putting it all together, this is the Containers Diagram presenting the "blocks" that compound the Awesome Online Store:
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome%20Online%20Store/conteiners.svg">
     <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome%20Online%20Store/conteiners.svg" />
      <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/Awesome%20Online%20Store/conteiners.puml">context.puml on github</a></figcaption>
    </figure>
</a>

#### Containers
Besides, the Microservices identified above, you can see some other containers:
- **Web App**: our customer need an interface, he's not going to order products using Postman or cURL haha;
- **API Gateway**: it's a powerful tool for helping us to secure the microservices from a centralized container, as well as managing api traffic, allow changing backend easily without the frontend even know, between other benefits;
- **Databases**: the microservices needs their own databases for achieving decoupling. Of course, there are cases where a microservice don't need a database, Payments Microservice and Notifications Microservice are some examples of it.

For not to make the diagram too big, I'm omitting the databases, so I'm describing it here:
- **Stock Microservice Database**: I'm choosing MySQL, a relational database, because of the nature of the data. ACID is important for this kind of data;
- **Orders Microservice Database**: MySQL again, for the same reason above;
- **Shipments Microservice Database**: I'm having MongoDB for this. The data structure is a 
  simple json with shipping data and consistency is not essential here, I want just to be able to 
  query shipping requests sent to Shipment Company.

I've said early, **Payments Microservice** does not need a database. The payment method and status will be stored along with the orders' data.  
**Notifications Microservice** don't need a database either, it only needs to send the message. I may define a flag on order entity for knowing if message was sent and retry those which wasn't.

#### Communication between Containers
I decided not to include Apache Kafka on the Diagram, but it is the Message Broker I'm going to use to allow asynchronous communication between microservices.  
All the messages represented as an arrow containing "async" on description have Apache Kafka in the middle.  
For a better view of how the communication works, in a further post I will present a Dynamic Diagram.  
The essence is that for each async communication, the flow looks like this:
1. A `Producer` (sender) publish a message/event to a `Kafka Topic`;
2. A `Consumer` (receiver) polls the message/event from the `Kafka Topic` and processes it;
3. The `Consumer` "become a Producer" publishing an event of success or error for the original Producer.

It's worth to mention that the difference between event and message in this context is just semantics.  
**Message** is headed to someone. E.g. if everything is ok with the user's order, Orders Microservice sends a message to Payments Microservice: "Process this payment".  
**Event** is a notification telling that something just happened and anyone subscribed to the 
event will be notified, but I don't care about whom. E.g. if everything is ok with the customer's order, Orders Microservice triggers an async event of type: "New order approved with \<data\>". Shipment Microservice listen to this event and starts shipping process. Also, Notifications Microservice listens to this event and sends an email to the customer. Stocks Microservice is another one subscribed to this event.

---

That's it for now.  
See you soon on next posts.

See all posts series at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
