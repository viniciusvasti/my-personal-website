---
title: E-commerce Backend - From Monolith to Microservices with Quarkus - Part 1
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

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-1.png)

## C4-2 - Containers

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-2.png)

## C4-3 - Components

![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus/c4-3.png)


\*The diagrams may change during the development process. It's what happens in real-life engineering too. And I will be evolving the architecture by adding external caching, authentication, etc.

---

That's it for this post. The next one will be actual implementation =).