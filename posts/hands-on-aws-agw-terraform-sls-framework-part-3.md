---
title: 'AWS API Gateway + Terraform + Serverless Framework - Part 3'
date: '2021-02-06'
tags: 'javascript,nodejs,serverless,terraform,lambda,aws,aws api gateway,rest api'
---

---
Hi, everyone!
For this "Hands on!" we're building a REST API with **AWS API Gateway**, provisioned with **Terraform** and backed by **AWS Lambda** built with **Serverless Framework**.  
The REST API will allow us to send SMS Messages using **AWS SNS**. Sounds like a lot of things, but it's no that lot of working.  
For this part 3, we'll secure the API with OAUTH using AWS Cognito and for part 1 and 2:

<a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-1">Part 1: provisioning an AWS API Gateway with Terraform</a>  
<a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-2">Part 2: coding the backend with Serverless Framework</a>

---

## About the tech stack
- [AWS](https://aws.amazon.com/): Most popular Cloud provider. You need an account to follow this article properly;
- [AWS API Gateway](https://aws.amazon.com/api-gateway/): AWS managed API Gateway that will expose our rest endpoints;
- [AWS Lambda](https://aws.amazon.com/lambda/): serverless functions on AWS working as our backend;
- [AWS SNS](https://aws.amazon.com/sns/): AWS Simple Notification Service that, among other types of notifications, allow us to send SMS for a phone number;
- [Terraform](https://www.terraform.io/): IaC (Infrastructure as Code) tool that allow us to provision cloud resources supporting several cloud providers;
- [Serverless Framework](https://www.serverless.com/): a Framework for support building and deploying serverless functions grouped as a Serverless Service, allowing also the provisioning of resources need for these functions;
- [NodeJS](https://nodejs.org/): JS runtime where our JavaScript lambda functions gonna be running;
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): Of course, the programing language we'll write our lambda.

---

### AWS Cognito
Cognito is an AWS resource that provides several patterns of authentication and authorization.  
We are going to choose OAuth, in a very basic way, with the only purpose of see how to provision it with Terraform a set it to secure our API. For a production purpose, there are other details you should care about.

### Setting project
For secure and API through a combination of client and secret keys, we need to provision a Cognito User Pool, set a Domain, Resource Server and App Client

Back to terraform files, create cognito.tf:
```java
# cognito.tf
resource "aws_cognito_user_pool" "pool" {
  name = "my-api-user-pool"
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = "my-api-serverless"
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_resource_server" "resource_server" {
  identifier   = "my-api"
  name         = "resource-server-my-api"
  user_pool_id = aws_cognito_user_pool.pool.id
  scope {
    scope_name        = "sms"
    scope_description = "All resources"
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                                 = "my-api-client"
  user_pool_id                         = aws_cognito_user_pool.pool.id
  generate_secret                      = true
  explicit_auth_flows                  = ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["client_credentials"]
  allowed_oauth_scopes                 = ["my-api/sms"]
  supported_identity_providers         = ["COGNITO"]
  depends_on                           = [aws_cognito_resource_server.resource_server]
}
```
- `aws_cognito_user_pool`: creates a pool;
- `aws_cognito_user_pool_domain`: defines the url that client application calls to authenticate. The url has the form https://\<domain\>.auth.\<aws region\>.amazoncognito.com/oauth2/token. Obviously, the domain should be unique between all amazon cognito domains in this region;
- `aws_cognito_resource_server`: defines a server that protects the resources, allowing only requests with valid token to access them. The scope is the level of access. For example, you can create a scope of read and other for writing to resources;
- `aws_cognito_user_pool_client`: here we configure a client for the pool, specifying allowed oauth flows and scopes. Note the `depends_on` telling terraform explicitly that it depends on another resource (since resource_server is not referecend in any attribute in this block, Terraform don't know that).  
We also have to set an authorizer for the API provisioned on Part 1. Add this in `api-gateway.tf` file:
```java
resource "aws_api_gateway_authorizer" "authorizer" {
  name          = "cognito"
  rest_api_id   = aws_api_gateway_rest_api.api_gateway.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.pool.arn]
}
```
With this, we gonna have an authorizer associated with our API which can be set as the authorizer of any endpoint of that. We will reference the id of the authorizer in the http event of serverless function later:
`$ terraform apply`

On the Authorizers on AWS Console's Amazon API Gateway, we should see the authorizer created. We need it's ID:  
../images/posts/hands-on-aws-agw-terraform-sls-framework-part-3/aws_api_gateway_authorizer_id.png

Back to Serverless Framework project, in `functions` attribute of `serverless.yml`, we set the authorizer like that:
```yaml
functions:
  hello:
    handler: handler.hello
    events:
      - http:
          method: POST
          path: /sms
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: 2n2p57
            scopes:
              - my-api/sms
```
Note the `scope` attribute, the same of `allowed_oauth_scopes` on `aws_cognito_user_pool_client` in `cognito.tf`.  

Run `$ sls deploy` and let's test our API with Postman:  
../images/posts/hands-on-aws-agw-terraform-sls-framework-part-3/aws_api_gateway_authorizer_test.png

Oops! We got `401 Unauthorized`. Let's get a token now.  
On AWS Console, go to `Cognito -> Manage User Pools -> my-api-user-pool`. On the left painel, click on App clients and lok for "client id" and "client secret". Convert "\<client id\>:\<client secret\>" to base64 and use it as a Basic header Authorizer.  
The curl of the request should be like that:
```bash
curl --location --request POST 'https://my-api-serverless.auth.us-east-1.amazoncognito.com/oauth2/token' \
--header 'Authorization: Basic slkfjdsalfsdkfjhskjfhalkfnasjkdnsakjdnaskfnakfjsndkfjsndkfjsdnfkjd==' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials'
```
And the response should be a Json with access token:
```json
{
  "access_token": "eyJraWQiOiJFZHpCcFo1YWZ6NXVcLzBuZ3JBRUh2WDZWTVE2V0k2Z3JKMUtxclNMRTNHVT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2YXYzZ245bWk5YmFjc2loNG1jaG1qcTE3bSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoibWluaGEtYXBpXC9zbXMiLCJhdXRoX3RpbWUiOjE1ODkyMDU5NDUsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX2ZEa2dXdW9GUSIsImV4cCI6MTU4OTIwOTU0NSwiaWF0IjoxNTg5MjA1OTQ1LCJ2ZXJzaW9uIjoyLCJqdGkiOiI2NzRiZmM2ZS1iZWU2LTQ5MjUtYTUwNy1iODk4MDEwNDY3ODIiLCJjbGllbnRfaWQiOiI2YXYzZ245bWk5YmFjc2loNG1jaG1qcTE3bSJ9.nnmaGMapSCRtY4b4bHZac8_AD-UeM-MRQcf6Ug02kCHWurfZH_SuNtyr8hqXME-23wUOKj8PQdwIzL0EnBcUpjih6XzAG-AEKzCxwJCS2CPaNVkIX7ScMBhIf_J7OFrPNCXCu_hFifLMD-LQ_9E_5fRhxLitKOkesQSwFvsJKB7uwVfDZftwK-lHYBfTNDL6F_F8aF1cc2xMqAxv1xBLndO1pTCySDBMXR7NGaNQGSU8OrrSs2rLbAb5Vd95zgs_XA-FGQoFd1btYQCZgcVmQs_hpKv6bWsFoU8aKDwpDmN-Vi7A1pVpN3fBHqPhy61ms6IDxTgxFNai7Ujtvv2qJA",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

Setting the access token on the Authorization header os the request for the SMS API, it works fine again:  
../images/posts/hands-on-aws-agw-terraform-sls-framework-part-3/aws_api_gateway_authorizer_test_with_auth.png

<br />
<br />

---

That's it! We finished our API provisioned on AWS with Terraform, backed by AWS Lambda built with Serverless Framework and secured with Amazon Cognito.

Full code here [viniciusvasti](https://github.com/viniciusvasti/aws-rest_api_gateway-terraform-serverless-training)  

* Some details are different because a implemented this in portuguese before. So "my api" is "minha api" in the images, sorry for that.

### Related Posts
- <a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-1">AWS API Gateway + Terraform + Serverless Framework - Part 1</a>
- <a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-2">AWS API Gateway + Terraform + Serverless Framework - Part 2</a>
- <a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-3">AWS API Gateway + Terraform + Serverless Framework - Part 3</a>
