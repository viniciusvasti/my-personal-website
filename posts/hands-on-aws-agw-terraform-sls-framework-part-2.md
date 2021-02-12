---
title: 'AWS API Gateway + Terraform + Serverless Framework - Part 2'
date: '2021-02-02'
tags: 'javascript,nodejs,serverless,lambda,aws,aws api gateway,rest'
---

---
Hi, everyone!
For this "Hands on!" we're building an REST API with **AWS API Gateway**, provisioned with **Terraform** and backed by **AWS Lambda** built with **Serverless Framework**.  
The REST API will allow us to send SMS Messages using **AWS SNS**. Sounds like a lot of things, but it's no that lot of working.  
For this part 2, we'll code the backend with Serverless Framework and for part 1 and 3:

<a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-1">Part 1: provisioning an AWS API Gateway with Terraform</a>  
<a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-3">Part 3: securing the API with Amazon Cognito</a>

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

### Serverless Framework
The purpose of [Serverless Framework](https://www.serverless.com) is provide a framework development, test, build, deploy and secure serverless applications, grouping functions in a service. Supporting several Cloud Providers as well.

Install it following instructions on https://www.serverless.com/framework/docs/getting-started and...
Hands on!

### Setting project
For create a project from a template for AWS + NodeJS, run on terminal:
```sh
$ sls create --template aws-nodejs
```  
Note the `serverless.yml` file. It's the configuration file of the service. Here we can also set resources provision we might need as DynamoDB tables, SNS topics and so on.
The file has a lot of commented lines, so let's clean it and leave it like this:

```yml
service: sms-sender-api

provider:
  name: aws
  runtime: nodejs12.x
  apiGateway:
    restApiId: wvnnv69jzf
    restApiRootResourceId: 0s0ivf
  region: us-east-1

functions: # defines a function (Lambda since AWS are our provider)
  hello:
    handler: handler.hello # JavaScript function that will handle the event generated for a call to this function
    events:
      - http: # We're defining that the function is triggered by an http call
          method: POST # the http method for the http call
          path: /sms # the api resource path

package:
  # excludes are added first
  exclude:
    - .vscode/**
    - .editorconfig
    - .terraform
    - terraform.*
    - .env
    - .env.**
    - .gitignore
    - .git
    - README.md
    - yarn.log
    - yarn.lock
    - package-lock.json
    - .prettierrc
    - .eslintrc.js
```

`provider.apiGateway.restApiId` and `provider.apiGateway.restApiRootResourceId`: references for the API and the resource path that should be parent of any resource paths created by this service, respectively.  
  We can look for it on the API in AWS Console like this:  
../images/posts/hands-on-aws-agw-terraform-sls-framework-part-2/aws_api_gateway_id.png

Now let's deploy this to AWS running:
```sh
$ sls deploy
```

If everything is ok, we should see on API Console the new resources `/sms` with a POST method.  
We can test it with Postman ou directly on Console:  
../images/posts/hands-on-aws-agw-terraform-sls-framework-part-2/aws_api_gateway_sms_test.png

Once it's working, let's code the handler to send the SMS using Amazon SNS.  
To do that, we need to start the NPM Package Manager and install the AWS SDK:
```sh
$ npm init && npm i aws-sdk --save
```
And the `handler.js` file should be like this:  
```javascript
const AWS = require("aws-sdk");

module.exports.hello = async (event) => {
    AWS.config.update({ region: "us-east-1" });
    try {
        const { phoneNumber, message } = JSON.parse(event.body);
        await new AWS.SNS({ apiVersion: "2010-03-31" })
            .publish({ Message: message, PhoneNumber: `+55${phoneNumber}` })
            .promise();
        return {
            statusCode: 201,
            body: JSON.stringify(
                {
                    message: "SMS sent!",
                },
                null,
                2
            ),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
```

The last thing is to allow the Lambda to access Amazon SNS changing `serverless.yml`:  
```yml
# serverless.yml
...
provider:
  name: aws
  runtime: nodejs12.x
  apiGateway:
    restApiId: xxxxxxxx
    restApiRootResourceId: xxxxx
  region: us-east-1
  iamManagedPolicies:
    - 'arn:aws:iam::aws:policy/AmazonSNSFullAccess'...
```

Testing the api again, this time passing the JSON below, a SMS should be sent to the phone number.
```json
{
    "phoneNumber": "11912345678",
    "message": "testing api"
}
```

<br />
<br />

---

That's it for this post. In part 3 we're implement authentication with Amazon Cognito:

### Related Posts
- <a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-1">AWS API Gateway + Terraform + Serverless Framework - Part 1</a>
- <a href="../posts/hands-on-aws-agw-terraform-sls-framework-part-3">AWS API Gateway + Terraform + Serverless Framework - Part 3</a>
