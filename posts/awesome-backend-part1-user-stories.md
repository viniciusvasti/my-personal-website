---
title: 'Awesome Backend - Part 1 - User Stories and C4 Level 1 Diagram'
date: '2021-02-14'
tags: 'BDD,architecture,c4model'
---

---
Hi, everyone!
This is the part 1 of Awesome Backend series.
More info at <a href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
For this part, I'm going to write business use cases and present de first level of C4 Model

So, hands on!

---

## About the tech stack
- [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) way of write User Stories: serverless functions on AWS working as our backend;
- [C4 Model](https://c4model.com/): A simple, easy to write, architecture diagram model;
- [PlantUML](https://plantuml.com/): A component that allows to quickly write diagrams as code;

---

### Functional flowchart
I'm building the checkout process of a fictional online store.  
So let's think about the flow and possible scenarios our application should cover:  
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.svg">
    <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.svg" />
    <figcaption><a href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.puml">happy-checkout-flow-chart.puml on github</a></figcaption>
    </figure>
</a>

This is the happy path, but things always may not work as expected:
- A product in the order may be sold out between the "add to cart" event and "order submitted" event;
- The payment may be denied by the payment broker.

There are also an improvement in the flow I can see: the last three actions may occur at same time, in parallel.

Including this details to the flow, this is the result:  
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg">
 <figure>
    <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg" />
  <figcaption><a href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.puml">checkout-flow-chart.puml on github</a></figcaption>
</figure>
</a>

### User Stories
Now that we have mapped the application flow, we are able to write user stories.  
I'm gonna follow [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development#Behavioral_specifications) way of describing how the app should behave:

**Feature**: Awesome Online Store product ordering.  
**As an** Awesome Online Store's customer...  
**I want** to be able to order products of the store...  
**So that** I can enjoy the comfort of buying things without leaving home.

**Scenario 1**
- **Given:** a list of products available on stock **and** a compliant payment method...
- **When:** the customer submits the order...
- **Then:** decrease products stock **and** sends user an order confirmation email **and** trigger the shipment of order.

**Scenario 2**
- **Given:** a list of products with one or more products of the list unavailable on stock **and** an accordant payment method...
- **When:** the customer submits the order...
- **Then:** send user an email apologizing for the inconvenient.

**Scenario 3**
- **Given:** a list of products available on stock **and** a non compliant payment method...
- **When:** the customer submits the order...
- **Then:** send user an email informing that his payment was denied by the payment broker and the reason.

Obviously, this is an exercise and the focus is on software. There a lot of details to consider for a real ordering process.

### C4 Model - Level 1 - Context Diagram
It's time to assume the Software Architect role.  
The Context Diagram of [C4 Model](https://c4model.com/) is really useful to contextualize the System aside other external Systems and actors.  
It is useful for anyone, in a technical role or not, to have a view of how and who the System interacts with.

<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.svg">
 <figure>
    <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.svg" />
  <figcaption><a href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.puml">context.puml on github</a></figcaption>
</figure>
</a>

---
That's it for now.  
See you soon on next posts.

See all posts series at <a href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
