---
title: 'When to change a Rest API version'
date: '2021-02-11'
tags: 'rest api'
---

---

Hi, everyone!
If you are familiar with de concepts of API, you know that most time it's built for other developers to consume it. It doesn't matter the kind of API: HTTP APIs, libs, packages, etc. Either it is an external API, for anyone in the world who asks you for an API key, or an internal API for other teams inside the same company.  
Yesterday a colleague from the company I'm currently employed complained about a breaking change in a Rest API his application consumes from another team.  
He wasn't advised about the change, and his application broke in production. A breaking change in a Rest API shouldn't happen even when advising all the consumers.  
The risk is too high, you may forget someone. Besides that, everyone should synchronize the change, so the application users have no impact.

So I'm listing some rules to guide us about when to generate a new version of a Rest API instead of simply changing it in the current version.
Changes that require generating a new API version
- Removing a resource. E.g. `api.com/store` is been removed;
- Removing a method of a resource. E.g. `PUT` on `api.com/store/products/123` is been removed;
- Removing an API path. E.g. `api.com/store/products` is been removed;
- Removing a query param of a request. E.g. query parameter `?color=red` is been removed;
- Renaming a query parameter. E.g. query parameter `?color=red` now is `?product-color=red`;
- Renaming a body attribute on request or response. E.g. `{ ..., "color": "red" }` now is `{ ..., "product-color": "red" }`;
- Turning a parameter from optional to required, either path param, query param, or the request body;
- Changing acceptable values for an enumerator param;
- Denying a content-type that was accepted earlier, either on response or request;
- Adding a required request header;
- Removing a response header;
- Removing a response body attribute;
- Changing a parameter or attribute type, either on the request or response;
- Increasing restrictions for as parameter, either a path, query string, or body param. E.g. not accepting the `name` attribute over 50 characters;
Changing the default value of an optional parameter. E.g. default value for `payment-method` if it is not informed will be `credit`, but it used to be `debit`;
- Adding a new HTTP Status Code response. For when there aren't any products in the bag, `GET products` used to return HTTP `200` and an empty array, but now it's going to return `404; Removing an HTTP Status Code response. E.g. opposite of the above example.

### Changes that may be handled on the current API version
- Adding a new resource;
- Adding a new supported method to an API resource;
- Adding a new resource path;
- Turning to optional a required parameter, either it is a path, query string or body attribute param;
- Adding new optional parameters;
- Adding new attributes to an API response.
