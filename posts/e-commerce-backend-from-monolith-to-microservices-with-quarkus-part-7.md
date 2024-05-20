---
title: E-commerce Backend - Monolith - Kubernetes Probes - (Part 7)
date: 2024-05-20
tags:
  - api
  - java
  - docker
  - backend
  - devops
  - kubernetes
---
This post is part of a series that already has:
- [E-commerce Backend - Monolith - Overall Architecture - (Part 1)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-1)
- [E-commerce Backend - Monolith - Starting with Quarkus - (Part 2)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-2)
- [E-commerce Backend - Monolith - Caching with Redis - (Part 3)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-3)
- [E-commerce Backend - Monolith - Decoupling Components with Event Bus - (Part 4)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-4)
- [E-commerce Backend - Monolith - Docker Compose to run the App and Infra locally - (Part 5)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-5)
- [E-commerce Backend - Monolith - Local Kubernetes with Kind - to run the App and Infra - (Part 6)](https://vinisantos.dev/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-6)

---

## Introduction
In Kubernetes, 3 kinds of probes help the control-pane to check the health of our services.  
Let's learn about them and implement them for the E-commerce Monolith.

#### Tools used in this post
- [Kind](https://kind.sigs.k8s.io)
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/kubectl/)
- [Docker](http://docker.com)
- [Quarkus](https://quarkus.io)

---

## Heath Check in Quarkus
If you're working with other frameworks/languages, no problem. The concepts are the same.
To have health check endpoints implemented automagically in Quarkus, we just need to install the `quarkus-smallrye-health` extension.

After installing it, we get the following endpoints:  
#### http://localhost:8080/q/health
It checks combines all health checks, returning something like:

```json
{
    "status": "UP",
    "checks": [
        {
            "name": "Redis connection health check",
            "status": "UP",
            "data": {
                "default": "PONG"
            }
        },
        {
            "name": "Database connections health check",
            "status": "UP",
            "data": {
                "<default>": "UP"
            }
        }
    ]
}
```

It also automatically covers checks for the services that our services are connected to. It feels like magic because those services were managed by Quarkus extensions (`quarkus-jdbc-postgresql` and `quarkus-redis-cache`).  
If we had manually implemented integrations with external resources (like an HTTP API), we would need to implement the check manually.

#### http://localhost:8080/q/health/live
It just checks if the service is live. It doesn't matter if it can reach the database or any other external service.

```json
{
    "status": "UP",
    "checks": [
    ]
}
```

#### http://localhost:8080/q/health/ready
It checks if the service can reach the external services it depends on.

```json
{
    "status": "UP",
    "checks": [
        {
            "name": "Redis connection health check",
            "status": "UP",
            "data": {
                "default": "PONG"
            }
        },
        {
            "name": "Database connections health check",
            "status": "UP",
            "data": {
                "<default>": "UP"
            }
        }
    ]
}
```

#### http://localhost:8080/q/health/started
It checks if the application started. The difference from `/q/health/live` is that the second may do additional checks (but not on external services).

```json
{
    "status": "UP",
    "checks": [
    ]
}
```

#### Service UP but not Ready
If I stop my database service, for instance, that's what I'd get for each health endpoint:

```json
# /q/health/started
{
    "status": "UP",
    "checks": [
    ]
}

# /q/health/live
{
    "status": "UP",
    "checks": [
    ]
}

# /q/health/ready
{
    "status": "DOWN",
    "checks": [
        {
            "name": "Redis connection health check",
            "status": "UP",
            "data": {
                "default": "PONG"
            }
        },
        {
            "name": "Database connections health check",
            "status": "DOWN",
            "data": {
                "<default>": "DOWN"
            }
        }
    ]
}
```

## Kubernetes Deployment Probes
Now we can leverage those health check endpoints in our Monolith Kubernetes deployment.
The purpose of those probes for Kubernetes controllers is to make sure it:
- Restart unhealthy pods
- Do not direct requests to pods that are not ready
- Only starts calling the checks after the service has started

There are a few properties to control the Kubernetes controllers' behavior over the probes. They're omitted there because I'm using the defaults, but we can set them if needed:
- `initialDelaySeconds`, defaults to 0 and defines the amount of time to wait before starting to run the probes against the pods.
- `periodSeconds`, which defaults to 10, defines that the probe will be checked every 5 seconds.
- `timeoutSeconds`, which defaults to 1, defines that the probe will fail if the response of the probe endpoint takes more than 1 second.
- `failureThreshold`, which defaults to 3, defines that Kubernetes will restart the pod only after 3 consecutive Liveness Probe failures.
- `successThreshold`, which defaults to 1, defines that Kubernetes will consider the pod healthy after 1 successful probe check after having failed.

### Liveness Probe
```yaml
# /infra/k8s/4-monolith.deployment.yaml
...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  ...
  template:
    ...
    spec:
      containers:
        - image: viniciusvas90/ecommerce-monolith:1.0.0-SNAPSHOT
          name: ecommerce-monolith
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /q/health/live
              port: 8080
            periodSeconds: 10
          envFrom:
            ...
```

Long-living applications sometimes turn into an unhealthy state, and can only recover after restarting.  
Kubernetes controllers use the Liveness Probe to check if a pod should be restarted.  
However, as per the default value of `failureThreshold`, the `ecommerce-monolith` pods will only be restarted after failing the liveness probe 3 times in a row.  
The liveness probe calls `/q/health/live`. It checks the health of the service (w/o checking if it's ready, as we saw before).  
As defined by `periodSeconds`, it will do the checks in intervals of 10 seconds.
### Readiness Probe
```yaml
# /infra/k8s/4-monolith.deployment.yaml
...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  ...
  template:
    ...
    spec:
      containers:
        - image: viniciusvas90/ecommerce-monolith:1.0.0-SNAPSHOT
          name: ecommerce-monolith
          ports:
            - containerPort: 8080
          livenessProbe:
            ...
          readinessProbe:
            httpGet:
              path: /q/health/ready
              port: 8080
            periodSeconds: 10
          envFrom:
            ...
```

Sometimes an application is up but not ready to receive requests yet, and we don't want it to be killed. For example, an application might need to connect to databases, message brokers, and an external API to process requests successfully. 
The Readiness Probe tells Kubernetes if a pod is ready to handle requests. If not, Kubernetes will not route requests to it.
### Startup Probe
```yaml
# /infra/k8s/4-monolith.deployment.yaml
...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  ...
  template:
    ...
    spec:
      containers:
        - image: viniciusvas90/ecommerce-monolith:1.0.0-SNAPSHOT
          name: ecommerce-monolith
          ports:
            - containerPort: 8080
          startupProbe:
            failureThreshold: 3
            httpGet:
              path: /q/health/started
              port: 8080
              scheme: HTTP
            initialDelaySeconds: 4
            periodSeconds: 1
            successThreshold: 1
            timeoutSeconds: 1
          livenessProbe:
            ...
          readinessProbe:
            ...
          envFrom:
            ...
```

Applications usually take some time to start.  
We don't want to start performing health checks against an application that didn't start yet.  
Depending on your Liveness Probe configs, it might even cause your pods to be killed before it had a chance to start.  
That's the purpose of Startup Probes. It gives the pods some time before Kubernetes starts to check its health.  
I defined its `initialDelaySeconds` as 4 because I verified that my application takes 3.5 seconds to start on average.  
That's from the logs of one of my pods:

```bash
ecommerce-monolith 1.0.0-SNAPSHOT on JVM (powered by Quarkus 3.9.2) started in 3.309s.
```

However, if for any reason it happens to the pod to take more time, that's what is going to happen:  
If it takes...
- 5 seconds: the Startup Probe will fail on the first check, wait 1 second, try again, and then succeed.
- 6 seconds: the Startup Probe will fail on the first check, wait 1 second, fail again, wait 1 second, fail again. That was 3 consecutive failures, the pod will be restarted.

Not that my configs give my pod only 6 seconds to start (4 seconds delay + 1 second before another attempt + 1 second before another attempt).  
You need to think about the worst case to set those configs.
If, in the worst acceptable case, my pod would take more than 6 seconds to start, I should either increase the `failureThreshold` (allowing more attempts to check if it started) or increase the `periodSeconds` (waiting more time between checks).

---

And that's all for this post. Thanks for reading.

[Code here](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/blob/51d043476232cc6dfbbd8d1df8d9fc8eff9d1c30/infra/k8s/4-monolith.deployment.yaml)