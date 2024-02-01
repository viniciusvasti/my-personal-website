---
title: Hexagonal Architecture with Golang
date: 2024-01-31
tags: architecture,api,golang
---

---

# Hexagonal Architecture  (aka Ports and Adapters)
This architectural approach brings several benefits to a complex application. It might be bit a over for very simple ones, but anyways, who knows how much will our application grow?

The Ports and Adapter represent interfaces to connect external resources to our interface in a decoupled manner.
![Ports & Adapters](../images/posts/Ports and Adapters.png)

The idea is to isolate the core of the application (the business layer) from external resources that are just technology tools.
The business doesn't care which type of databases we're using or which framework we're using to implement an HTTP API.
In this article, we're building a very simple HTTP API CRUD for Weddings. For this example, the business just cares about a few things: being able to register, fetch, and change a Wedding record. To make it simple, we're going to use SQLite to store the data, and neither the business nor our application core cares about that.
### Allows sustainable growth of an Application
It's easier to scale up the App if its core is decoupled from external resources.
You can defer infrastructure decisions, not related to your Use Cases/User's Stories to later and focus on core the implementation first.
It's even much easier to use a lighter infrastructure resource for development purposes.
In the implementation example of this post, we're going to use SQLite for our DB because it's much easier to set it up than a Postgres database for example. But when it's time to deploy to a robust environment, it's very easy and safe to change it.

### Avoid the corruption of domain/business logic imposed by a framework
ORM's are a good example of that. Sometimes (maybe most of the time) ORMs or persistence frameworks require our mapped entities to implement getters and setters for all the entity fields. But maybe our business requires some fields to be immutable, thus we should avoid implementing setters for that.
But if we decouple do application core from frameworks, we're safe.
### Supports replacement of application pieces
As I mentioned before, it makes it easy and safe to replace databases, frameworks, external APIs, and so on.
### Allows the app to be equally driven by users, programs, automated tests, and scripts and to be developed and tested in isolation from its runtime devices and external resources
If the application core is decoupled from any UI framework, you run automated tests that don't need to emulate users' UI interaction.
Also, you can easily add a CLI interface for users to interact with your application if they want.
### Build a boundary around the application's core logic
That's the mental model for implementing this architectural approach. Imagine a boundary protecting your application from concrete implementations of anything that is not part of the app's business logic.
In practice, ask yourself if your code still compiles and if its tests run successfully if you delete every file that is not part of the application core. That is the concrete database repository implementations, HTTP controllers, queue listeners, etc.
### Decoupling the business logic from external resources
### Facilitates breaking a monolith into microservices
### This is supported by SOLID's Dependency Inversion Principle

---

...Content

---

...Related posts