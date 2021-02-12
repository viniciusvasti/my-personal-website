---
title: 'When to change an Rest API version'
date: '2021-02-11'
tags: 'rest api'
---

---
Hi, everyone!
If are familiar with de concepts of API, you know that most of time it's built to other developers to consume it. It doesn't matter the kind of API: HTTP API's, libs, packages, etc. Either it is a external API, for anyone in the world who ask you for an API key or an internal API for other teams inside same company.  
Yesterday a colleague from the company I'm currently employed complained about a breaking change in a Rest API his application consumes from another team.  
He wasn't advised about the change and his application broke in production.  
Actually, a breaking changing in a Rest API shouldn't happens even when advising all the consumers.  
The risk is to high, you may forget someone. Besides that, everyone should synchronize the change so the application users have no impact.

So I'm listing some rules to guide us about when to generate a new version of a Rest API instead of simply changing it in the current version.

---

### Changes that requires generating a new API version
- Removing a resource. E.g. `api.com/store` is been removed;
- Removing a method of a resource. E.g. `PUT` on `api.com/store/products/123` is been removed;
- Removing an API path. E.g. `api.com/store/products` is been removed;
- Removing a query param of a request. E.g. query parameter `?color=red` is been removed;
- Renaming a query parameter. E.g. query parameter `?color=red` now is `?product-color=red`;
- Renaming a body attribute on request or on response. E.g. `{ ..., "color": "red" }` now is `{ ..., "product-color": "red" }`;
- Turning a parameter from optional to required, either path param, query param or the request body;
- Changing acceptable values for an enumerator param;
- Denying a content-type that was accepted earlier, either on response or request;
- Adding an required request header;
- Removing a response header;
- Removing a response body attribute;
- Changing a parameter or attribute type, either on the request or response;
- Increasing restrictions for as parameter, either a path, query string or body param. E.g not not accept attribute `name` over 50 characters;
- Changing default value of an optional parameter. E.g. default value for `payment-method` if it is not informed will be `credit`, but it used to be `debit`;
- Adding a new Http Status Code response. E.g. when there aren't any products in the bag, `GET products` used to return Http `200` and an empty array, but now it gonna return `404`;
- Removing a Http Status Code response. E.g. opposite of the above example;

### Changes that may be handled on the current API version
- Adding a new resource;
- Adding a new supported method to an API resource;
- Adding a new resource path;
- Turning to optional a required parameter, either it is a path, query string or body attribute param;
- Adding new optional parameters;
- Adding new attributes to an API response;
