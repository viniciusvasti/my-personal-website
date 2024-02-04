---
title: Java Spring Boot Testing - AWS SQS Listener
date: 2024-02-01
tags:
  - java
  - spring
  - aws
  - sqs
---
This post is going to be a short one to walk through the process I just followed to be able to run unit tests against an SQS Listener in a Java Spring Boot Microservice.

It's out of the scope to provide a complete code. I will just leave the snippets and a few explanations. It may be more for myself than for any reader who falls here from a search.

---

## Context
I have a Spring component that
1. Listens to an AWS SQS queue
2. Converts the String message to a Java Object
3. Calls a service responsible for processing the data
I need to write a test to make sure all those 3 steps happen without having to call the `receiveMessage` directly. I want it to listen to a message as it should do in production.

`LocalStack` will do the job of simulating a running SQS service. It provides several services running in a container that try to mimic AWS services to support local development and testing without depending on actual AWS service, which would be an expensive and complex environment setup.

Another guy who will help with the job is `Testcontainers`. A JUnit Jupiter extension that automatically manages the containers required by a Test Case.

---

## Coding
The first step is adding the needed dependencies to the project (I'm using Gradle):

```Groovy
testImplementation "org.testcontainers:localstack:${testContainersVersion}"  
testImplementation 'org.testcontainers:junit-jupiter:1.17.4'  
testImplementation 'io.awspring.cloud:spring-cloud-aws-test'
```

And the testing class:

```Java
@ActiveProfiles("test")
@Testcontainers
@SqsTest(MessageListener.class)
public class MessageListenerTest {

    @MockBean
    private ProcessorService processorService;
    @Autowired
    private QueueMessagingTemplate queueMessagingTemplate;
    @Value("${cloud.aws.queue.sqs.name}")
    private String sqs;

    @Container
    static LocalStackContainer localStack = new LocalStackContainer(DockerImageName.parse("localstack/localstack:1.3.1"))
            .withClasspathResourceMapping("/localstack", "/docker-entrypoint-initaws.d", BindMode.READ_ONLY)
            .withServices(SQS)
            .waitingFor(Wait.forLogMessage(".*Initialized\\.\n", 1));

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("cloud.aws.sqs.endpoint", () -> localStack.getEndpointOverride(SQS).toString());
        registry.add("cloud.aws.credentials.access-key", () -> "foo");
        registry.add("cloud.aws.credentials.secret-key", () -> "bar");
        registry.add("cloud.aws.region.static", () -> localStack.getRegion());
        registry.add("order-queue-name", () -> "test-order-queue");
    }

    @Test
    void testReceiveMessage() throws IOException {
        // Given
        doNothing().when(processorService.process(any()));
        String message;
        try (InputStream resourceAsStream = ClassLoader.getSystemClassLoader().getResourceAsStream("message.json")) {
            message = new String(Objects.requireNonNull(resourceAsStream).readAllBytes(), UTF_8);
        }
        var mySqsEvent = buildObjectMapperWithJavaTimeModule().readValue(message, MySqsEvent.class);
        
        // When
        queueMessagingTemplate.convertAndSend(sqs, message);
        
        // Then
        await().atMost(Duration.ofSeconds(3))
                .untilAsserted(() -> {
                     verify(processorService, times(1)).process(eq(mySqsEvent));
                });
    }
}
```

The `MessageListener.class` parameter to `@SqsTest` is optional, but it's nice to have it. It makes the spring context load only the been required by the component we're testing, making the test run faster.

The `QueueMessagingTemplate` is a helper that publishes a message to the desired SQS queue.

`@Container` annotation works in conjunction `Testcontainers` to define the containers to be managed during the test run. It annotates a `LocalStackContainer` that we instantiate by
- Defining the `localstack` container image
- Specifying a Classpath resource to be mapped into the container. The resource is a script to create the `SQS` queue that you can find below
- Specifying the `localstack` services to run on this container
- And finally ask it to wait for a specific message to be logged to the container before assuming it's ready (we want it to wait until the SQS queue is created by the mentioned script)

The script under `src/test/resources/localstack` looks like this:

```bash
# init.sh
awslocal sqs create-queue --queue-name test-aws-queue-sqs-name  
  
echo "Initialized."
```
If you're familiar with AWS CLI, you figured out that it's creating a new SQS queue.

Next, we override a few application properties to point out the AWS APIs to `localstack` through the `static void properties(DynamicPropertyRegistry registry)` method.

Finally, we have the test method where I
- Read a `message.json` file as the message to be published to the SQS queue
- Publish the message with `queueMessagingTemplate.convertAndSend` method
- use `Testcontainers`' `await` method to wait for 3 seconds just to give some time to the message to be consumed by the listener
- Assert that `processorService.process` is called with the object constructed upon the SQS message

---

And that's all!
We're testing an AWS SQS Java Spring Boot Listener without depending on AWS.

ps* I can't guarantee the exact code snippets work flawlessly because the snippets are copied and changed a bit from a real code I wrote for my client's project. I had to change the code for this post to omit sensitive info and I have no time right now to run it after the changes.