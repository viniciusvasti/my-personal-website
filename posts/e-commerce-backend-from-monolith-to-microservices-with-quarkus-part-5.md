---
title: E-commerce Backend - Monolith - Docker Compose to run the App and Infra locally - (Part 5)
date: 2024-05-12
tags:
  - api
  - java
  - docker
  - backend
  - docker-compose
  - devops
---
This post is part of a series that already has:
- [E-commerce Backend - Monolith - Overall Architecture - (Part 1)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-1)
- [E-commerce Backend - Monolith - Starting with Quarkus - (Part 2)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-2)
- [E-commerce Backend - Monolith - Caching with Redis - (Part 3)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-3)
- [E-commerce Backend - Monolith - Decoupling Components with Event Bus - (Part 4)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4)

---

## Introduction
So far we're running the App in Dev mode while leveraging Quarkus Dev Services.
While running like that, the Quarkus platform runs containers for the supporting services.
Those services are a Postgres database and a Redis server until this moment.

I want to run the App a bit closer to how it would be in production, but still locally.
To accomplish that, I will leverage [Docker Compose](https://docs.docker.com/compose/) which as the name suggests, composes several services that compound a System.

---

## Properties Setup
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
## Docker Compose
In order to make it more flexible, I've created two distinct docker compose files. One for the infrastructure and one for the App. This way, I can run all of them in docker or just the infra.
If I want to run my App out of the docker daemon (with `maven run`, or from the `.jar`, for instance), I can run just the Postgres DB and Redis.

```yaml
# infra/compose/compose.dev.yaml

# The yaml format which is suitable for running with Docker Engine 1.13.0+
version: '3'
# The services composition name
name: ecommerce-monolith
services:
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
    networks:
      - ecommerce-network

  em-redis:
    image: redis:6.2.1
    ports:
      - 6399:6379
    networks:
      - ecommerce-network

# A dedicated and isolated network for those services to communicate in bridge mode
networks:
  ecommerce-network:
    driver: bridge
```

```yaml
# compose-app.dev.yaml

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
      DATABASE_VERSION: 13.2
      # Same as above
      REDIS_HOST: em-redis
      REDIS_PORT: 6379
    # Defines that the App should be started after those two. That's because the App needs those services running. But it's IMPORTANT to be aware that this only defines the start of em-app being triggered after the start of em-postgres and em-redis. Therefore, the App may start faster than the Postgres DB, causing the App to be unable to connect to the database. That would cause a start failure caused by the Flyway migrations check.
    depends_on:
      - em-postgres
      - em-redis
    networks:
      - ecommerce-network
```

Note the caveat of `depends-on` property. Fortunately, there are ways to force a service to start only after another one is ready.

To run the both the infra services and the App, we need to:
1. build the App docker image by running the following command from the `ecommerce-monolith` folder:
   `./mvnw quarkus:image-build`
2. run the compose command:
   `docker-compose -f infra/compose.dev.yaml -f infra/compose-app.dev.yaml`
   That will combine both `yaml` files

If I only need the infra, it's just `docker-compose -f infra/compose-app.dev.yaml`

We could set the image build in the `compose.dev.yaml` file too. However, I chose to leverage the built-in Maven Quarkus Plugin command to build the App's image, because I will use that in my CI jobs later.
## Scripting
Now, I think that having to remember several steps for a specific action might be overwhelming.
I aim for a single action: run my App which depends on a few infra services, but I need to remember to build the App's image, because I may have changed its code, and run `docker-compose` against 2 configuration files.
We can simplify that and reduce things to be remembered by just running:

```bash
./run-local.sh
```

And here is what the script file looks like:

```bash
#!/bin/bash

declare dc_infra=infra/compose.dev.yaml
declare dc_app=infra/compose-app.dev.yaml

# building the App container image
function build_app() {
    cd ecommerce-monolith
    ./mvnw quarkus:image-build -DskipTests
    cd ..
}

# Starting just the Infra
function start_infra() {
    echo "Starting infra..."
    docker-compose -f $dc_infra up -d
}

function stop_infra() {
    echo "Stopping infra..."
    docker-compose -f $dc_infra stop
}

# Starting just the Infra and App
function start() {
    echo "Starting all services..."
    build_app
    docker-compose -f $dc_infra -f $dc_app up -d
    docker-compose -f $dc_infra -f $dc_app logs -f
}

function stop() {
    echo "Stopping all services..."
    docker-compose -f $dc_infra -f $dc_app stop
    docker-compose -f $dc_infra -f $dc_app rm -f
}

# Restarting (in case of changes in the App or in the yaml files)
function restart() {
    stop
    sleep 5
    start
}

# Default action is to start Infra and App
action=start

if [ "$1" == "start" ]; then
    action=start
elif [ "$1" == "stop" ]; then
    action=stop
elif [ "$1" == "restart" ]; then
    action=restart
elif [ "$1" == "start-infra" ]; then
    action=start_infra
elif [ "$1" == "stop-infra" ]; then
    action=stop_infra
else
    echo "Invalid action. Use start, stop, restart, start-infra or stop-infra."
    exit 1
fi

eval $action
```

As you can see in the script, we can also run:
- `./run-local.sh stop`
- `./run-local.sh start_infra`
- `./run-local.sh stop_infra`
- `./run-local.sh restart`

Perfect!

---

And that's it for this post. Thanks for reading.

[Code here](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/)