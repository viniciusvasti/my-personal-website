---
title: E-commerce Backend - Monolith - Docker Compose to run the App and Infra locally - (Part 5)
date: 2024-05-12
tags:
  - api
  - quarkus
  - java
  - docker
  - backend
---
This post is part of a series that already has:
- [E-commerce Backend - Monolith - Overall Architecture - (Part 1)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-1)
- [E-commerce Backend - Monolith - Starting with Quarkus - (Part 2)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-2)
- [E-commerce Backend - Monolith - Caching with Redis - (Part 3)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-3)
- [E-commerce Backend - Monolith - Decoupling Components with Event Bus - (Part 4)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4)

---

# Introduction
So far we're running the App in Dev mode while leveraging Quarkus Dev Services.
While running like that, the Quarkus platform runs containers for the supporting services.
Those services are a Postgres database and a Redis server until this moment.

I want to run the App a bit closer to how it would be in production, but still locally.
To accomplish that, I will leverage [Docker Compose](https://docs.docker.com/compose/) which as the name suggests, composes several services that compound a System.

---

First, I needed to set up Postgres and Redis connection properties.
I set them as `prod`, because by default when running a Quarkus App from its built `.jar`, with `quarkus run`, or from its native executable, it runs with the `prod` profile:

```yaml
# application.properties
# The database type we're connecting to
%prod.quarkus.datasource.db-kind=postgresql
# It's a good practice to use the same version of the database in development and production for leveraging the same features
%prod.quarkus.datasource.db-version = ${DATABASE_VERSION}
%prod.quarkus.datasource.username=${DATABASE_USERNAME}
%prod.quarkus.datasource.password=${DATABASE_PASSWORD}
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
# Just to be safe that the database won't be dropped and recreated in production
%prod.quarkus.hibernate-orm.database.generation=none
%prod.quarkus.hibernate-orm.sql-load-script=no-file
%prod.quarkus.redis.hosts=redis://${REDIS_HOST}:${REDIS_PORT}
```

And the Docker Compose file:

```yaml
# compose.dev.yaml

# The yaml format which is suitable for running with Docker Engine 1.13.0+
version: '3'
# The services composition name
name: ecommerce-monolith
services:
  em-app:
    # Use the app docker image built by Quarkus
    image: viniciussantos/ecommerce-monolith:1.0.0-SNAPSHOT
    # Redirect requests aiming locahost:8080 to the container 8080 port
    ports:
      - 8080:8080
    # Defines the Environment Variables needed by the App to run
    environment:
      DATABASE_USERNAME: root
      DATABASE_PASSWORD: password
      # Note that I used the name of the DB service as the host, "localhost" would not work because we're inside the Docker Daemon here.
      DATABASE_HOST: em-postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: postgres
      DATABASE_URL: postgresql://em-postgres:5432/postgres
      DATABASE_VERSION: 13.2
      # Same as above
      REDIS_HOST: em-redis
      REDIS_PORT: 6379
    # Defines that the App should be started after those two. That's because the App needs those services running. But it's IMPORTANT to be aware that this only defines the start of em-app being triggered after the start of em-postgres and em-redis. Therefore, the App may start faster than the Postgres DB, causing the App to be unable to connect to the database. That would cause a start failure caused by the Flyway migrations check.
    depends_on:
      - em-postgres
      - em-redis

  em-postgres:
    container_name: em-postgres
    image: postgres:13.2
    environment:
      POSTGRES_USER: root
      POSTGRES_DB: postgres
      POSTGRES_PASSWORD: password
      PGDATA: /data/postgres
    ports:
      - 5499:5432

  em-redis:
    image: redis:6.2.1
    ports:
      - 6399:6379

```

Note the caveat of `depends-on` property. Fortunately, there are ways to force a service to start only after another one is ready.
To run the app along with those services, we need to:
1. build the App docker image: `quarkus image build docker`
2. run the compose command: `docker-compose -f compose.dev.yaml`

We could set the image build in the `compose.dev.yaml` file too.
I chose to leverage the built-in Quarkus command to build the App's image, but the other way would require a single command.

---

And that's it for this post. Thanks for reading.

[Code here](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/tree/monolith/products-catalog-rest-api)