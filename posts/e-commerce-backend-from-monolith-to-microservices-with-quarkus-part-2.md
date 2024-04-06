---
title: E-commerce Backend - From Monolith to Microservices with Quarkus - Part 2
date: 2024-04-05
tags:
  - api
  - rest
  - quarkus
  - java
  - systemsdesign
---
This post is part of a series that starts with:
[E-commerce Backend - From Monolith to Microservices with Quarkus - Part 1](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-1)

In the last post, I designed the Architecture of the application I will be building to learn [Quarkus](https://quarkus.io).
In this post, I will share some thoughts on starting with the Quarkus platform.

---

# Quarkus
Quarkus is not just a framework, it is more of a Stack for building Cloud Native apps.
I achieve that by providing a lightweight deployment package, low memory footprint, and fast startups (compared to other Java Platforms/Frameworks). It's tailored for GraalVM and HotSpot.
Quarkus also calls itself Kube-Native, meaning that its integration with Kubernetes stands out for some reason that I'll find out when setting up my App's deployment.

The only trade-off I'm aware of about Quarkus so far, is about the libraries you can add to your Quarkus project.
Quarkus also allows you to build native binaries. That means the output of the native build is an executable that runs independently of the JVM, which brings some restrictions to the way the libraries in the Quarkus project are implemented.
That means that most libraries need to be refactored for Quarkus compatibility, and you can notice that by the prefix of some libraries as in:

```xml
<dependency>
	<groupId>io.quarkus</groupId>
	<artifactId>quarkus-hibernate-orm-panache</artifactId>
</dependency>
```

For the majority of modern new applications, it's not a big deal.
There are libraries available for almost anything you need to build modern web services.
And for migrating an existing application to Quarkus, I bet it's just a matter of setting up a Quarkus project, throwing the code in it, and checking if it compiles. If you're using any libraries that are not compatible with Quarkus, you decide if it is worth it to replace with with another one available in order to leverage the Quarkus benefits.
# Building my first Quarkus App
Getting right to the point, here is what I've developed so far: https://github.com/viniciusvasti/practicing-quarkus-ecommerce/tree/monolith/products-catalog-rest-api
It's a simple REST API for the Products Category resource.
I had to add that Resource to the Diagram I built in the first post because I hadn't thought about that at that time.
So far, it's possible to create, update, list all, and list by id.
## Some stuff I already knew and put into practice
#### Clean Architecture / Hexagonal Architecture / Ports & Adapters
I followed the concepts of those architectural approaches.
Not blindly though. If you try to follow them as a rule of thumb, you will get too much boilerplate, classes, and mappings from one object to another just to keep your core domain logic 100% away from frameworks stuff (like `@Inject`, `@ApplicationScoped`, and `@Entity` annotations).
But you're very unlikely to move to another framework, and if so, it's not that hard to remove those w/o breaking your domain logic.

Regarding my own implementation, you can notice in that repository that my package structure looks like:

```
- business domain
  - core                      // the core of the business needs to be isolated from infra and presentation, with no coupling to them
  - infra                     // everything related to external infrastructure goes here: database access, message broker producers/consumers, etc 
  - presentation              // everything related to presentation: rest api, graphql api, webpages, cli interface, etc
```

I achieved the goal of letting the core decoupled from infra and presentation layers by defining interfaces for the core layer inbound and outbound (ports and adapters).
#### Domain Driven Design
There isn't much about that in this project to talk about so far. But I have it in mind when organizing my Java packages.
In the future you can expect to find in that domain folder level above:
- Products
- Inventory
- Pricing
- Orders
- Payments
- Shipping

That's me imagining that a large e-commerce company would probably have those distinct departments in the organization.
## Some new stuff I learned so far
For someone with Spring Boot experience, it's very easy to start with Quarkus.
Even though most of the utilities and annotations are from `Jakarta EE`, Spring is built upon `Jakarta EE` specifications, so it's easy to transfer Spring knowledge to Quarkus.

To define a class as a Bean ready to be Injected into another class by the CDI (stands for Contexts and Dependency Injection), you annotate the class with `@ApplicationScoped`. I didn't dig much into the CDI specifications, but I assume it's the equivalent to Spring's `@Component` annotation (and its specific stereotypes `@Service`, `@Repository`, etc)

To implement HTTP Rest handlers, for example, it's very similar to how it's done with Spring:

```Java
@Path("/products-catalog")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@POST
@Transactional
public RestResponse<ProductCategory> createProduct(CreateProductCategoryDTO productCategory) {
	// TODO: handle invalid product category exception
	var created = service.create(productCategory.name());
	return RestResponse.status(Status.CREATED, created);
}
```

You may have noted the `@Transaction` there.
The recommended ORM for Quarkus is Hibernate with Panache. Panache makes it easier to interact with the database.
When executing operations that change the database, we need to annotate the method with `@Transaction`. That could be at any CDI bean in the methods chain executing that. That is, you can put that in the Rest Controller, in the Service, or the Repository class.
The Quarkus team recommends putting that in the Rest Controller level.
That's for making sure that either all or none of the changes made are committed to the database.
Imagine that you're dispatching an order request and you need to run 2 database operations:
1. Persist the order.
2. Decrease the stock count for each product in the order from the inventory;

If step 2 fails, you don't want 1 to be committed.
But we need to be smart about using Transactions because it can roll back instructions made to the database only.
Now imagine the dispatch order operation runs in 4 steps:
1. Persist the order;
2. Call the Shipping API of a partner to trigger the shipping of the products in the order;
3. Decrease the stock count for each product in the order from the inventory;

Now if step 3 fails, the Transaction can rollback step 1, but it has no control at all over step 3. Hopefully, the Shipping API will provide an endpoint to cancel the shipping we can call in a `catch` block.
#### Active Record Pattern
It's the first time I heard this and it's how data access is documented on the [quarkus website](https://quarkus.io)
This is implemented at [ProductCategory.java](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/blob/monolith/products-catalog-rest-api/ecommerce-monolith/src/main/java/org/vas/product/catalog/core/domain/ProductCategory.java) by extending `PanacheEntity`.
This allows the entity object to interact with the database directly, without having to implement a repository class.
If I'm not wrong, that's the foundation of .NET's Entity Framework as well.
The simplification Quarkus did with Panache over Hibernate is very cool. It reduced the verbosity of the type of queries we use most of the time as you can learn [here](https://quarkus.io/guides/hibernate-orm-panache#simplified-queries).
#### Quarkus Dev Service
- Because I added Postgres JDBC to the project dependencies, it automatically starts up a PostgreSQL docker container when starting the service and also when running tests. That was cool.
- Its live reload is very fast. Much faster than Spring Boot's live reload.
- Re-running tests is also very fast and productive (just run `quarkus test` in your terminal)
## What I may improve
- My core domain objects are coupled to the infra persistence layer because of their extending `PanacheEntity` as mentioned. To keep my architecture cleaner, I could implement the DB entities separately, in the persistence layer and create a map utility to convert domain objects into DB entities and vice-versa. I will probably do that later.
- Also, I'm using DTO for HTTP request payloads. It would be a good practice to use it in the response as well. I'll also do it later.
- Better attending REST standards. Maybe even implement RESTFul and HATEOAS.

---

That's it for this post. The next one will be more focused on the infrastructure =).

Repository: https://github.com/viniciusvasti/practicing-quarkus-ecommerce/tree/monolith/products-catalog-rest-api