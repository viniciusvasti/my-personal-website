---
title: 'AWS API Gateway + Terraform + Serverles Framework - Part 1'
date: '2021-02-01'
tags: 'javascript,nodejs,serverless,terraform,lambda,aws,aws api gateway,rest'
---

---
Hi everyone!
For this first part of this hands on with **AWS API Gateway**, provisioned with **Terraform** and backed by **AWS Lambda** built with **Serverless Framework**, we're going to build an REST API for sending SMS Messages usign **AWS SNS**. Sounds like a lot of things, but it's no that lot of working.  
For this part 1, we'll provision our API Gateway with Terraform and for part 2 and 3:

<a href="../posts/hands-on-aws-agw-terraform-sls-framwork-part-2">Part 2: coding the backend with Serverles Framework</a>  
<a href="../posts/hands-on-aws-agw-terraform-sls-framwork-part-3">Part 3: securing the API with Amazon Cognito</a>

---

## About the tech stack
- [AWS](https://aws.amazon.com/): Most popular Cloud provider. You need an account to follow this article properly;
- [AWS API Gateway](https://aws.amazon.com/api-gateway/): AWS managed API Gateway that will expose our rest endpoints;
- [AWS Lambda](https://aws.amazon.com/lambda/): serverless functions on AWS working as our backend;
- [AWS SNS](https://aws.amazon.com/sns/): AWS Simple Notification Service that, among other types of notifications, allow us to send SMS for a phone number;
- [Terraform](https://www.terraform.io/): IaC (Infrastructura as Code) tool that allow us to provision cloud resources supporting serveral cloud providers;
- [Serverless Framework](https://www.serverless.com/): a Framework for support building and deploying serverless functions grouped as a Serverless Service, allowing also the provisionment of resources need for theese functions;
- [NodeJS](https://nodejs.org/): JS runtime where our JavaScript lambda functions gonna be running;
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): Of course, the programing language we'll write our lambda.

---

## Why Terraform, since Serverless Framework itself can provision AWS resources?
Well, it's very common to have an API Gateway serving different backend services.  
Ex: endpoint X points to a serverless function, endpoint Y points to Java Spring Boot Microservice, endpoint Z points to third-party API.  
If the API Gateway gets provisioned by the serverless Service, it's infrastructure code gonna be highly coupled to this service and you need to implement the other types of integrations using this service as a proxy (creating more lambdas and increasing the infrastructure cost and complexity).  
Also, if you destroy this Service, the API Gateway gonna be destroyed too.

So, hands on!

### Step 1 - Terraform AWS API Gateway provisionment
If haven't Terraform installed, do it: https://www.terraform.io/downloads.html.  
When provisioning resources, the docs helps a lot: https://www.terraform.io/docs/providers/aws/index.html.  
Nobody should try to memorize the code for the whole bunch of services AWS provides.

Começamos configurando o nosso provider, identificando qual o provedor cloud, região e credenciais IAM com as permissões necessárias para provisionar recursos na AWS (também é possível setar as credenciais como variáveis de ambiente ao invés de explicitá-las no código). Para isso, basta criar um arquivo com a extensão .tf , que chamaremos de provider.tf com o seguinte código:

First, we need set the cloud provider configurations.  
Let's create file `provider.tf` like this:
```java
# provider.tf
provider “aws” {
    region = “us-east-1”
    version = “2.61”
    access_key = "your-access-key”
    secret_key = "your-secret-key” 
}
```
We are telling terraform that our provider is AWS and we want provision resources on `us-east-1` region.
We're also setting aws credentials having the roles and policies needed to manage API Gateway (we could set the credentials as environment variables as well).
I's important set the version of terraform aws plugin to avoid upgrades with breaking changes issues.
Now, we can init terraform in this project running in terminal:  
```$ terraform init```  
You should se the message `Terraform has been successfully initialized!`.  
To finally provision an API Gateway, let's create another `.tf` file as follows:
```java
# api-gateway.tf
resource "aws_api_gateway_rest_api" "my_api_gateway" {
  name        = "My API"
  description = "AWS Rest API example with Terraform"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
```
- `resource`: provision a cloud resource to be managed by Terraform;
- `aws_api_gateway_rest_api`: the type of resource;
- `my_api_gateway`: a name to reference this resource in this project.
  
The content inside the block refers to attributes of the API Gateway. You can look at AWS API Gateway if you are not familiar.

We can now execute the command below to check what Terraform gonna do after we apply the provisionment plan:  
```$ terraform plan```  
Among other output messages, you should see:
```java
Terraform will perform the following actions:
  # aws_api_gateway_rest_api.my_api_gateway will be created
  + resource "aws_api_gateway_rest_api" "my_api_gateway" {
      + api_key_source           = "HEADER"
      + arn                      = (known after apply)
      + created_date             = (known after apply)
      + description              = "AWS Rest API example with Terraform"
      + execution_arn            = (known after apply)
      + id                       = (known after apply)
      + minimum_compression_size = -1
      + name                     = "My API"
      + root_resource_id         = (known after apply)
      + endpoint_configuration {
          + types = [
              + "REGIONAL",
            ]
        }
    }
Plan: 1 to add, 0 to change, 0 to destroy.
```
As we can see on the last line, Terraform gonna add 1 resource, change none and destroy none.  
It's not guaranteed that this plan will be exactly the same applyied. So we could use `$ terraform plan -out`, but this plan is pretty simple.  
To really apply the changes, the command is:
```$ terraform apply```  
Then exactly plan to be executed will be presented again and you can answer `yes`.  
Going to AWS Console and looking for API Gateway Resource (region us-east-1), we can see the API created:

../images/posts/hands-on-aws-agw-terraform-sls-framwork-part-1/aws_api_gateway.png

But clicking on it, there's no api resources paths:

../images/posts/hands-on-aws-agw-terraform-sls-framwork-part-1/aws_api_gateway_no_paths.png

Let's define that our API base path gonna be `<api-url>/my-api/v1`.
Back to Terraform files, we add this code:
```java
# api-gateway.tf
resource "aws_api_gateway_rest_api" "my_api_gateway" {
  ...
}

resource "aws_api_gateway_resource" "my_api" {
  rest_api_id = aws_api_gateway_rest_api.my_api_gateway.id
  parent_id   = aws_api_gateway_rest_api.my_api_gateway.root_resource_id
  path_part   = "my-api"
}

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.my_api_gateway.id
  parent_id   = aws_api_gateway_resource.my_api.id
  path_part   = "v1"
}
```

- `aws_api_gateway_resource`: the type of resource is api gateway resource;
- `rest_api_id`: the id of the API Gateway that owns this resource;
- `parent_id`: the id of parent path, which is the root "/" of the API Gateway;
- `path_part`: the path part we want to create.

Note that for "v1" resource, the parent_id is the id of "my_api" resource, thus the complete path gonna be "/my-api/v1".  
Running apply again:
```$ terraform apply```  
We should see on AWS Console three API resources ("/", "my-api" and "v1"):

../images/posts/hands-on-aws-agw-terraform-sls-framwork-part-1/aws_api_gateway_with_paths.png

<br />
<br />

---

That's it for this post. In part 2 we're going to implement backend with Serverless and part 3 we'll implement authentication with Amazon Cognito:

<a href="../posts/hands-on-aws-agw-terraform-sls-framwork-part-2">AWS API Gateway + Terraform + Serverles Framework - Part 2</a>  
<a href="../posts/hands-on-aws-agw-terraform-sls-framwork-part-3">AWS API Gateway + Terraform + Serverles Framework - Part 3</a>
