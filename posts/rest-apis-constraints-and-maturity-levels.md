---
title: REST API's Constraints and Maturity Levels
date: 2024-04-23
tags:
  - rest
  - api
  - restful
---

REST became the most popular and adopted standard for providing Web API's.
Especially with the split of Frontend and Backend into two different projects.

However, many developers are not aware that REST is an **Architectural Style**. To call your API a REST (**RE**presentational **S**tate **T**ransfer) API, it needs to follow the principles and respect the constraints of this Architectural style. Otherwise, it's just an HTTP API serving JSON.

## REST Constraints
#### Uniform interface
That means that we need to be consistent in modeling our API resources.
Once An API user gets familiar with a few resources of our API, he/she should be able to guess accurately how to interact with other resources.
For example:
If an API has a resource like `<url>/authors/123/books` to get all the books from a particular author, it should be correct to assume that `<url>/authors` will get me all the authors in the database.
If the default response format is `JSON`, it should be safe to assume that it's the same for any other resource in the API as well as the format of the payload requests the Server would expect.
#### Client-server
Client and Server are independent of each other both physically and logically.
All the Client needs to know is the API's interface: its allowed methods, content types, resources URI's, etc.
All the server needs to do is respect the defined interface and not provide breaking changes.
#### Stateless
Stateless is just a reflection of HTTP's constraint, once REST relies heavily on it.
That means a Server should treat each request as something completely isolated from other previous requests performed by the client.
Each request coming from the client should contain every information the Server needs to process the request.
But that doesn't mean the System as a whole is stateless. Most of the Systems need to manage some state. Remember that the constraints are about the REST API. Databases, cache and file storage, and authentication providers are out of the API's scope. Those resources are just consumed by the REST API.
The most common mistake and challenge when trying to provide REST APIs from legacy systems is the user session being stored in memory in the server.
I guess the high adoption of REST APIs is the cause of why JWT became so popular.
#### Cacheable
The API should explicitly declare what resources could be cached by the client.
That's great for both the Client (which can answer faster to user interactions and skip having to perform network requests) and the Server (which will have to handle fewer requests).
#### Layered system
REST can have distinct distributed layers, each one running in a distinct server such as the API itself, the Database, the Cache Storage, the Auth provider, and so on, and that is going to be transparent to the Client.

When you have an API respecting all those constraints, they say you have a "truly RESTful" API.
However, if you need to adapt and disrespect one or two of them, you're still doing RESTful, just not "truly" doing it.

By the way:
- REST: the architectural style;
- RESTful: the implementation following the architectural style.

## Maturity Model
**Richardson Maturity Model** describes levels of REST API's maturity.
This is a framework to evaluate how much a web service is REST compliant.
### Level 0 - Remote Calls
Simply HTTP calls requesting an operation to be executed on the server (old RPC way).
Doesn't follow many patterns and standards (meaningful URIs, HTTP methods (usually just POST), hypertext).
SOAP Web Services are typically here.
### Level 1 - Resources
It introduces Resources. They can be identified in the URI as user and documents in `GET <base-uri>/users/documents`.
It's not RESTful yet because it's still missing using different HTTP methods for different purposes and HATEOAS.
### Level 2 - HTTP Verbs
Here we start to leverage the HTTP Verbs to represent the purpose of the operation.
Not everyone follows the table below (especially regarding the distinction between POST, PUT, and PATCH) but it looks like what most REST advocates recommend:

| Verb   | Intent                            |
| ------ | --------------------------------- |
| GET    | Get resource's data               |
| POST   | Create new resource's data        |
| PUT    | Update resource's data entirely*  |
| PATCH  | Update resource's data partially* |
| DELETE | Delete a resource                 
\*Using PUT should, ideally, update the whole resource data. If some fields are omitted, they would be set to a null/empty value, whereas using PATCH, the omitted fields would be ignored, and therefore not touched.

I've seen most of the called RESTful APIs stop here.
Especially when the API is internal only, being called by other company internal services and/or the Frontend App.
That's probably because once the API users have easy and direct contact with the API developers, it might not be worth it to spend time implementing HATEOAS.
Furthermore, the Open API standards + Swagger UI might be enough for letting API users to know how to interact with all the API resources.
### Level 3 - Hypermedia (HATEOAS)
Introduces metadata response body that provides the API client info about how to interact with the resources in the response, like
- Endpoints for other operations
- Query a just-created resource
- Pagination metadata
This is key for easy discoverability and self-descriptiveness.

---

References:
- https://restfulapi.net
- https://martinfowler.com/articles/richardsonMaturityModel.html
- https://restfulapi.net/richardson-maturity-model/

---

Thanks for reading =)