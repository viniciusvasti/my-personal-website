---
title: 'Awesome Backend - Part 4 - Modeling the REST API'
date: '2021-02-18'
tags: 'architecture,microservices,rest api'
---

---
Hi, everyone!
This is the part 4 of Awesome Backend series.
More info at <a href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
For this part, I'm going to design the REST API requesting an Order for Awesome Online Store.  
For now, it isn't going to be RESTFull, I will keep it simple.

So, hands on!

---

## About the tech stack
- [REST API](https://restfulapi.net/);
- [A really good guide for designing REST API's](https://restfulapi.net/resource-naming/) following a concise and clean structure of paths, resource names and so on.

---

### The API Base Path
Usually, the base path url of an API is consisted of its DNS and API version. There are 
different approaches to versioning an API, including in the path is the one I rather.
I'm thinking on `awesome-online-store.com/api/v1`. I decided to add `/api` thus I can reuse the DNS of the Web App.


### The API resources for each Microservice
As showed before, I'm going to have and API Gateway exposing the API for clients.
It acts as a proxy. So each request on a resource is directed to one of the Microservices:
- `.../api/v1/order-management`: Orders Microservice;
- `.../api/v1/payment-management`: Payments Microservice;
- `.../api/v1/stock-management`: Stock Microservice;

### The Orders API operations
Ordering products: 
- **Method:** `POST`
- **URI:** `.../api/v1/order-management/orders`
- **Request body:** 
  ```json
  {
      "customerName": "string",
      "products": [
          {
            "sku": "number",
            "name": "string",
            "price": "number"
          }
      ],
      "payment": {
          "paymentMethod": "string"
      }
  }
  ```
  Obviously this is not ok for real life, because it's easy to set fake products prices.
- **Success Response Status:** 201
- **Response body:** 
  ```json
  {
      "id": "string"
  }
  ```
- **Failed Response Status:** 400
- **Not Found Response body:** 
  ```json
  {
      "message": "<description of what went wrong>"
  }
  ```

Listing orders: 
- **Method:** `GET`
- **URI:** `.../api/v1/order-management/orders`
- **Success Response Status:** 200
- **Response body:** 
  ```json
  [
      {
        "id": "string",
        "customerName": "string",
        "products": [
            {
                "sku": "number",
                "name": "string",
                "price": "number"
            }
        ],
        "payment": {
          "paymentMethod": "string"
        },
        "approved": "boolean",
        "paymentProcessed": "boolean"
      }
  ]
  ```

Fetching an order: 
- **Method:** `GET`
- **URI:** `.../api/v1/order-management/orders/{order_id}`
- **Success Response Status:** 200
- **Response body:** 
  ```json
  {
      "id": "string",
      "customerName": "string",
      "products": [
          {
            "sku": "number",
            "name": "string",
            "price": "number"
          }
      ],
      "payment": {
          "paymentMethod": "string"
      },
        "approved": "boolean",
        "paymentProcessed": "boolean"
  }
  ```
- **Failed Response Status:** 404
- **Not Found Response body:** 
  ```json
  {
      "message": "Order with <order_id> not found."
  }
  ```

### The Payments API operations
Listing available payments methods: 
- **Method:** `GET`
- **URI:** `.../api/v1/payment-management/payment-methods?active=true`
- **Success Response Status:** 200
- **Response body:** 
  ```json
  {
      "id": "string",
      "description": "string"
  }
  ```

### The Stock API operations
Listing available products: 
- **Method:** `GET`
- **URI:** `.../api/v1/stock-management/products?available=true`
- **Success Response Status:** 200
- **Response body:** 
  ```json
  {
      "sku": "number",
      "name": "string",
      "price": "number",
      "inventoryAmount": "number"
  }
  ```


---
That's it for now.  
See you soon on next posts.

See all posts series at <a href="../posts/awesome-backend">Awesome Backend - High Available, robust, modern, backend architecture hands on</a>  
