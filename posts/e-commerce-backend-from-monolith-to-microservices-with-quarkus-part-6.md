---
title: E-commerce Backend - Monolith - Local Kubernetes with Kind - to run the App and Infra - (Part 6)
date: 2024-05-18
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

---

## Introduction
In the last post, we set up Docker Compose to manage our services.  
Let's get a little bit closer to a Production environment by running them in a Kubernetes cluster.  
However, we're not in the cloud yet. It's still a local environment, so we'll leverage [Kind](https://kind.sigs.k8s.io), which is kind of an implementation of Kubernetes specs for learning/development purposes.

#### Tools used in this post
- [Kind](https://kind.sigs.k8s.io)
- [Kubectl](https://kubernetes.io/docs/reference/kubectl/kubectl/)
- [Docker](http://docker.com)

---

## Setting Kind up
First of all, we need a Kind cluster running. You can follow the official [quick start docs](https://kind.sigs.k8s.io/docs/user/quick-start/).

Then we need a cluster config yaml file:

```yaml
# infra/k8s/kind/kind-config.yaml
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
name: quarkus-ecommerce-k8s-cluster

nodes:
# the control plane node config
- role: control-plane
  kubeadmConfigPatches:
  # node-labels only allow the ingress controller to run on a specific node(s) matching the label selector
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  # allow the local host to make requests to the Ingress controller over ports 80/443
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
# set three worker nodes
- role: worker
- role: worker
- role: worker
```

To make things easier, let's create two bash scripts. One for create a cluster and another one to destroy it.

```bash
# infra/k8s/kind/create-cluster.sh
#!/bin/sh

echo "Creating a new Kubernetes cluster..."

kind create cluster --config kind-config.yaml

echo "\n-----------------------------------\n"

echo "Installing NGINX Ingress Controller..."

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "\n-----------------------------------\n"

echo "Waiting for the Ingress Controller to be ready..."

sleep 10

kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s

echo "\n"

echo "Cluster created successfully!"
```

Kubernetes doesn't come with an Ingress, we needed to install one. Here I'm using Nginx, but there are a few options (Nginx, Contour, and Kong are known to work at the time this post was written).

```bash
# infra/k8s/kind/destroy-cluster.sh
#!/bin/sh

echo "Destroying Kubernetes cluster..."

kind delete cluster --name quarkus-ecommerce-k8s-cluster
```

## Kubernetes Resources needed
### ConfigMap
Kubernetes provides resources for external configuration and secrets.  
We already know what configs our services need, so let's start with it.
I named my Kubernetes resources yaml configs starting with a number so the code editor shows the files in a meaningful order.
In the following yaml file, I set values in ConfigMap that can be referenced by other resources.  
I also set secrets for sensitive values. Database user and password should be secrets. Those values are base64 encoded.
\*Keep in mind that secrets are stored unencrypted by default. Anyone with access to the cluster's API can see it. In production, further steps should be taken for security's sake.
### Persistent Volume
We need a persistent volume because:
- The pods are ephemeral units. If a pod is killed, all data living there will die along with it;
- If we scale our Postgres pods, we want them to share the same data, therefore requiring the data to live somewhere outside.

### Persistent Volume Claim
This is used for pods to say "Hey, I want to provision this amount of store for me".  
Then the cluster will assign a Persistent Value to it with capacity for the required amount.  
### Service
If we want a deployment to serve other deployments w/o having to hard code pods' IPs, we need to set up a service pointing to it and exposing ports for it to be reached by the other deployments.  
It identifies pods running the specified application.
For instance, we want the Postgres deployment to serve our E-commerce Monolith API deployment. Think of it like this:  
`E-commerce Monolith Quarkus API` -> `Postgres Service` -> `Postgres Pods (created through Postgres Deployment)`
### Deployment
You can think of Kubernetes Deployments as Classes whereas Pods are objects.
A Deployment is a blueprint specifying how a Pod should be created.
### Ingress
To expose a service to the outside world, there are two common options:
- Set the Service type as NodePort (you will get a port to the nodes)
- Set up an Ingress

The last option is more flexible because you can define rules for routing, and expose multiple services throughout a single endpoint.
It relies on third-party Ingress Controllers (Nginx Ingress Controller in our case).  
It's primarily designed to handle web traffic (HTTP/HTTPS).

In the end, we should have something like this:
![](../images/posts/e-commerce-backend-from-monolith-to-microservices-with-quarkus-part-6/draw-ecommerce-kubernetes-deployment.png)
## Shared ConfigMap yaml

```yaml
# infra/k8s/1-monolith.configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: monolith-config
data:
  # It should match the name of the Postgres Service we'll create later
  database_host: postgres-monolith
  database_port: "5432"
  database_name: postgres
  database_version: "14.0"
  # It should match the name of the Redis Service we'll create later
  redis_host: redis-monolith
  redis_port: "6379"

---
apiVersion: v1
kind: Secret
metadata:
  name: monolith-secrets
# arbitrary user-defined data
type: Opaque
data:
  database_username: cm9vdA==
  database_password: cGFzc3dvcmQ=
```

Now if we need to change any of those values, we apply this file with the changes and restart the services that use the changed values.

## Postgres on Kubernetes
Before setting it up, let me make it clear that running a database in Kubernetes this way only fulfills learning purposes.  
In production, we should rather follow other patterns to have a robust database instance or leverage a Database service from any cloud provider like AWS, Azure, GCP, etc.

Ok, the yaml for Postgres will be more complex, so let's break it into a few pieces here, but it will still be a single file in the code repo.

#### Postgres Persistent Volume yaml
Here I'm setting a Persistent Volume with 2 gigabytes of capacity, in an access mode that states that the volume can be mounted as read-write by a single node.

```yaml
# infra/k8s/2-postgres-monolith.deployment.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-monolith-pv
spec:
  storageClassName: 'standard'
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 2Gi
  hostPath:
    path: /data/db
...
```

#### Postgres Persistent Volume Claim yaml
We're claiming 1 gigabyte for the Postgres instance, which the Persistent Volume we created above will still have 1 gigabyte available.

```yaml
# infra/k8s/2-postgres-monolith.deployment.yaml
...
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-monolith-pvc
spec:
  storageClassName: 'standard'
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
...
```

#### Postgres Service yaml

```yaml
# infra/k8s/2-postgres-monolith.deployment.yaml
...
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-monolith
spec:
  selector:
    # It has to match a Deployment template label to direct requests to it
    app: postgres-monolith
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
...
```

#### Postgres Deployment yaml

```yaml
# infra/k8s/2-postgres-monolith.deployment.yaml
...
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-monolith
spec:
  # Just one Postgres pod running
  replicas: 1
  # Specifies that these specs apply to pods annotated with the specified label
  selector:
    matchLabels:
      app: postgres-monolith
  template:
    metadata:
      labels:
        # Needs this label to be selected by the specs above and the previous defined Service
        app: postgres-monolith
    spec:
      # From this points, it's very close to what we defined for the Docker Compose file
      containers:
      - image: postgres:14-alpine
        name: postgres-monolith
        ports:
        - name: postgres
          containerPort: 5432
        env:
        - name: POSTGRES_USER
	      # That's how we reference secret values
          valueFrom:
            secretKeyRef:
              name: monolith-secrets
              key: database_username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: monolith-secrets
              key: database_password
        - name: POSTGRES_DB
	      # That's how we reference config map values
          valueFrom:
            configMapKeyRef:
              name: monolith-config
              key: database_name
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        # Specifying a volume to be mounted for the data
        volumeMounts:
          - name: postgres-monolith-storage
            mountPath: /var/lib/postgresql/data
      # References the previous defined Persistent Volume Claim
      volumes:
        - name: postgres-monolith-storage
          persistentVolumeClaim:
            claimName: postgres-monolith-pvc
```

## Redis on Kubernetes
The Redis instance is much simpler because I will not persist the data to a Persistent Volume. I will let the data vanish if the instance is restarted. It's fine because it's just used as a cache.

```yaml
# infra/k8s/3-redis.deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-monolith
spec:
  selector:
    app: redis-monolith
  ports:
    - protocol: TCP
      port: 6379
      targetPort: 6379
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-monolith
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-monolith
  template:
    metadata:
      labels:
        app: redis-monolith
    spec:
      containers:
      - image: redis:6.2.1
        name: redis-monolith
        ports:
        - name: redis
          containerPort: 6379
```

## Java App on Kubernetes
The definitions of the Java/Quarkus deployment are simple too, but with more environment values to set.

```yaml
# infra/k8s/4-monolith.deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-monolith
spec:
  selector:
    app: ecommerce-monolith
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-monolith
  labels:
    app: ecommerce-monolith
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ecommerce-monolith
  template:
    metadata:
      labels:
        app: ecommerce-monolith
    spec:
      containers:
      - image: viniciusvas90/ecommerce-monolith:1.0.0-SNAPSHOT
        name: ecommerce-monolith
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: monolith-config
        - secretRef:
            name: monolith-secrets
```

## Ingress yaml

```yaml
# infra/k8s/5-nginx.ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - http:
      paths:
      - pathType: Prefix
        path: /api(/|$)(.*) # This is the path that will be used to access the service
        backend:
          service:
            name: ecommerce-monolith
            port:
              number: 8080
```

## Putting all together
Now that all the configuration is in place, let's see everything run.  
If we navigate to `infra/k8s/kind` and run the create cluster script we should get:

```bash
➜  ./create-cluster.sh 
Creating a new Kubernetes cluster...
Creating cluster "quarkus-ecommerce-k8s-cluster" ...
 ✓ Ensuring node image (kindest/node:v1.29.2) 🖼 
 ✓ Preparing nodes 📦 📦 📦 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
 ✓ Joining worker nodes 🚜 
Set kubectl context to "kind-quarkus-ecommerce-k8s-cluster"
You can now use your cluster with:

kubectl cluster-info --context kind-quarkus-ecommerce-k8s-cluster

Not sure what to do next? 😅  Check out https://kind.sigs.k8s.io/docs/user/quick-start/

-----------------------------------

Installing NGINX Ingress Controller...
...<omitted>...
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created

-----------------------------------

Waiting for the Ingress Controller to be ready...
pod/ingress-nginx-controller-7b76f68b64-7xr8x condition met


Cluster created successfully!
```

And then we go back to `infra/k8s` and run `kubectl apply -f .`:

```bash
➜  kubectl apply -f .
configmap/monolith-config created
secret/monolith-secrets created
persistentvolume/postgres-monolith-pv created
persistentvolumeclaim/postgres-monolith-pvc created
service/postgres-monolith created
deployment.apps/postgres-monolith created
service/redis-monolith created
deployment.apps/redis-monolith created
service/ecommerce-monolith created
deployment.apps/ecommerce-monolith created
Warning: path /api(/|$)(.*) cannot be used with pathType Prefix
ingress.networking.k8s.io/ecommerce-api-ingress created
```

Double-checking that everything was really created:

```bash
➜  kubectl get all   
NAME                                     READY   STATUS    RESTARTS        AGE
pod/ecommerce-monolith-9c4594d44-4czzw   1/1     Running   2 (4m19s ago)   4m51s
pod/ecommerce-monolith-9c4594d44-gpg78   1/1     Running   2 (4m20s ago)   4m51s
pod/postgres-monolith-5497c8c57d-wjsrh   1/1     Running   0               4m51s
pod/redis-monolith-597bbb7d8b-bjhkd      1/1     Running   0               4m51s

NAME                         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/ecommerce-monolith   ClusterIP   10.96.18.211   <none>        8080/TCP   4m51s
service/kubernetes           ClusterIP   10.96.0.1      <none>        443/TCP    8m49s
service/postgres-monolith    ClusterIP   10.96.136.21   <none>        5432/TCP   4m51s
service/redis-monolith       ClusterIP   10.96.54.252   <none>        6379/TCP   4m51s

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/ecommerce-monolith   2/2     2            2           4m51s
deployment.apps/postgres-monolith    1/1     1            1           4m51s
deployment.apps/redis-monolith       1/1     1            1           4m51s

NAME                                           DESIRED   CURRENT   READY   AGE
replicaset.apps/ecommerce-monolith-9c4594d44   2         2         2       4m51s
replicaset.apps/postgres-monolith-5497c8c57d   1         1         1       4m51s
replicaset.apps/redis-monolith-597bbb7d8b      1         1         1       4m51s
```

Testing the RESTFul API:

```bash
➜  curl -w "\n" localhost/api/products/1      
{"id":1,"sku":"00000001","name":"The Pragmatic Programmer","description":"Your journey to mastery","category":{"id":1,"name":"Books"}}
```

---

And that's all for this post. Thanks for reading.

[Code here](https://github.com/viniciusvasti/practicing-quarkus-ecommerce/)