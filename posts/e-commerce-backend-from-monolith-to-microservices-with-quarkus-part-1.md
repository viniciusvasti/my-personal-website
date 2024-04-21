---
title: E-commerce Backend - Monolith - Overall Architecture - (Part 1)
date: 2024-04-03
tags:
  - api
  - rest
  - quarkus
  - java
  - systemsdesign
---

A few years ago I started (and never continued) the process of designing and developing the backend of a fictional e-commerce app (the Awesome Backend).
I didn't put much effort into it after I was hired by an American company and started my journey as a Brazilian dev working remotely for international companies.

Now I have decided to learn Java Quarkus and I think it's gonna be fun to get back to that project to practice it.
I will not look back to what I designed before, so in this post, I will start from scratch.

---

# Starting with Monolith
As anyone should be aware at this time, Monoliths should be the way to go for most companies. The "why" is of the scope of this post. But it's the reason why I will start my project as a monolith and simulate a company environment where it makes sense to evolve to a Microservices Architecture in the future. It will also be good to demonstrate how to transform Monolith into Microservices.
# The Project
Again, the project is going to be a simplified e-commerce backend with a catalog of products, orders, and so on.
# The Modules
## Products Catalog
Responsible for listing all products organized into categories. CRUD operations in essence.
## Inventory
Responsible for controlling the stock of products (available amount to be sold per product).
## Products Pricing
Responsible for setting the prices for the products and probably discounts/promotions.
## Orders
Responsible for receiving orders from customers.
## Payments
Responsible for processing payments from customers regarding their orders.
## Shipping
Responsible for shipping the packages with the products ordered.
# Architecture
## C4-1 - System Context
Here is described the macro view of the E-commerce system:
1. A customer who can navigate the website, search products, add them to the cart, and purchase an order;
2. A store employee who can register/change products, set prices, adjust inventory stock, etc;
3. The e-commerce system itself, maintained by the company's engineering team (me);
4. And a third-party system which provides the delivering service for us.

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-1.png)

## C4-2 - Containers
Zooming in, we can see that the E-commerce system is a compound of 2 applications and a database.
1. A web SPA built upon React.js;
2. The backend monolith built with Java and Quarkus;
3. The MySQL database which stores products, payments, shipments, and orders data.

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-2.png)

## C4-3 - Components
Zooming in a bit more, here is what is more of our interest as developers. An inside view of the Monolith backend app.
The initial architecture is pretty simple: A RestController handles the HTTP requests and calls either a Service or a Use Case class. Maybe I should decide to name them either Service or Use Case, but I decided to mix it up depending on the intention of that.
I'm calling Service components that just run CRUD operations to manage the data. Whereas Use Cases are classes that implement rich, real-life-based processes like ordering products for example. And finally, the data layer is represented by the repositories which communicate with the database. This architecture may (will) evolve and get more layers, components, and adapters for other external resources besides the database.

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-3.png)


\*The diagrams may change during the development process. It's what happens in real-life engineering too. And I will be evolving the architecture by adding external caching, authentication, etc.

---

That's it for this post. The next one will be actual implementation =).