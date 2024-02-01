---
title: 'Awesome Backend - Part 1 - User Stories and C4 Level 1 Diagram'
date: '2021-02-14'
tags: [BDD,architecture,c4model]
---

---

Hi, everyone!
This is part 1 of the Awesome Backend series.
More info at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands-on</a>  
For this part, I'm going to write business use cases and present de first level of the C4 Model
So, hands-on!

---

## About the tech stack
- [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) way of writing User Stories;
- [C4 Model](https://c4model.com/): A simple, easy to write, architecture diagram model;
- [PlantUML](https://plantuml.com/): A component that allows to quickly write diagrams as code;

---

### Functional flowchart
I'm building the checkout process of a fictional online store.  
So let's think about the flow and possible scenarios the application should cover:  
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.svg">
    <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.svg" />
    <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/happy-checkout-flow-chart.puml">happy-checkout-flow-chart.puml on GitHub</a></figcaption>
    </figure>
</a>

This is the happy path, but things may always not work as expected:
- A product in the order may be sold out between the "add to cart" event and "order submitted" event;
- The payment may be denied by the payment broker.
There is also an improvement in the flow I can see: the last three actions may occur at the same time, in parallel.

Including these details in the flow, this is the result:  
<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg">
    <figure>
        <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.svg" />
      <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/flowcharts/checkout-flow-chart.puml">checkout-flow-chart.puml on GitHub</a></figcaption>
    </figure>
</a>

### User Stories
Now that we have mapped the application flow, we can write user stories.  
I'm going to follow [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development#Behavioral_specifications) way of describing how the app should behave:

**Feature**: Awesome Online Store product ordering.  
**As an** Awesome Online Store's customer...  
**I want** to be able to order products from the store...  
**So that** I can enjoy the comfort of buying things without leaving home.

**Scenario 1**
- **Given:** a list of products available in stock **and**** a compliant payment method...
- **When:** the customer submits the order...
- **Then:** decrease stock, send the user an order confirmation email, **and** trigger the shipment of the order.

**Scenario 2**
- **Given:** a list of products with one or more products of the list unavailable in stock **and** an accordant payment method...
- **When:** the customer submits the order...
- **Then:** send the user an email apologizing for the inconvenience.

**Scenario 3**
- **Given:** a list of products available in stock **and** a noncomplying payment method...
- **When:** the customer submits the order...
- **Then:** send the user an email informing them that his payment was denied by the payment broker and the reason.

This is an exercise, the focus here is on software. There are a lot of details to consider 
for a real ordering process.

### C4 Model - Level 1 - Context Diagram
It's time to assume the Software Architect role.  
The Context Diagram of [C4 Model](https://c4model.com/) is really useful to contextualize the System aside from other external Systems and actors.  
It is useful for anyone, in a technical role or not, to have a view of how and who the System interacts with.

<a target="_blank" rel="noopener noreferrer" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.svg">
 <figure>
    <img src="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.svg" />
  <figcaption><a className="text-slate-700 hover:text-blue-400" href="https://raw.githubusercontent.com/viniciusvasti/awesome-backend/master/awesome-backend-docs/src/context.puml">context.puml on github</a></figcaption>
</figure>
</a>

---

That's it for now.  
See you soon on the next posts.

See all posts series at <a className="text-slate-700 hover:text-blue-400" href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands-on</a>  
