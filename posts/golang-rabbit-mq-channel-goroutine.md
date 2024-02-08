---
title: Golang and RabbitMQ - Improving the Consumer's throughput with Concurrency
date: 2024-02-08
tags:
  - golang
  - concurrency
  - rabbitmq
  - messaging
  - event-driven
  - throughput
---

---

In this post I will show how to use the Golang concurrency approach supported by `goroutines` and `channels` to improve the throughput of a RabbitMQ consumer/listener.

If you want to jump directly to the code, here is the repository: https://github.com/viniciusvasti/golang-rabbit-mq-channel-goroutine-demo

This application is compound of 3 components described below, and they have the goal of:
- Produce messages containing the amount of products and the price of each unit
- Consume the messages and print the total amount for each message (amount * price)
## RabbitMQ
Working as a message broker, running as a container service defined by a `docker-compose.yaml` file:

```yaml
version: '3.7'

services:
  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      RABBITMQ_HOST: rabbitmq
      RABBITMQ_PORT: 5672
      RABBITMQ_USER: admin
      RABBITMQ_PASS: admin
    restart: on-failure
    depends_on:
      - rabbitmq
    links:
      - rabbitmq
```
## Producer
Responsible for producing/publishing messages to the queue.
It's built to run as a standalone executable that produces 100 messages, therefore not been defined in the docker-compose.
All it needs to run is to be executed like:
```bash
go run ./cmd/producer/main.go
```
(or you can build the program and execute it)

Its core code can be found at [publisher.go](https://github.com/viniciusvasti/golang-rabbit-mq-channel-goroutine-demo/blob/main/internal/mqpublisher/publisher.go).
The most important part of the code is:

```go
func (rp RabbitMQPublisher) Publish() {
	ch, err := rp.conn.Channel()
	util.FailOnError(err, "Failed to open a channel")
	defer ch.Close()

	q := services.CreateQueue(ch)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Println("Publishing to RabbitMQ")
	for _, message := range mockMessages {
		err = ch.PublishWithContext(
			ctx,
			"",     // exchange
			q.Name, // routing key
			false,  // mandatory
			false,  // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        []byte(message),
			},
		)
	}
	util.FailOnError(err, "Failed to publish a message")
	log.Println("Message published")
}
```
Where `mockMessages` is an array of 100 messages in the format `"amount: 3; price: 5.99"`.
There is nothing related to concurrency there. The purpose of this post is to work on the `Consumer`.
## Consumer
It listens to messages published in the queue.
Let's walk through two different approaches. One without implementing concurrency when processing the messages, and another one improved by concurrency with a higher throughput.
#### Without concurrency
Its core code can be found at [publish w/o concurrency](https://github.com/viniciusvasti/golang-rabbit-mq-channel-goroutine-demo/blob/f68ec7e4c6fdcea12f20936019f5eef5d03bbb68/internal/mqlistener/listener.go).
The important part of the code is:

```go
func (rl RabbitMQListener) Listen() {
	ch, err := rl.conn.Channel()

    ...
    msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)

	forever := make(chan string)

	for d := range msgs {
		processMessage(string(d.Body))
	}

	// makes the listener run forever
	<-forever
}
```
As you can see, it has a `for loop` read messages from the `msgs` channel, one by one.

Without leveraging `goroutines` to process several messages in threads apart from the main program thread, the result is 100 seconds to handle 100 messages.
You can check the output of the program below after I've produced 100 messages at once to the RabbitMQ server.
Note that it read the first message at **20:18:20** and the last one at **20:19:59**, totalizing ~100 seconds:

```zsh
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:20 Total: 1000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:21 Total: 4000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:22 Total: 9000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:23 Total: 16000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:24 Total: 25000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:25 Total: 36000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:26 Total: 49000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:27 Total: 64000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:28 Total: 81000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:29 Total: 100000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:30 Total: 121000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:31 Total: 144000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:32 Total: 169000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:33 Total: 196000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:34 Total: 225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:35 Total: 256000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:36 Total: 289000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:37 Total: 324000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:38 Total: 361000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:39 Total: 400000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:40 Total: 441000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:41 Total: 484000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:42 Total: 529000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:43 Total: 576000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:44 Total: 625000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:45 Total: 676000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:46 Total: 729000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:47 Total: 784000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:48 Total: 841000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:49 Total: 900000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:50 Total: 961000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:51 Total: 1024000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:52 Total: 1089000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:53 Total: 1156000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:54 Total: 1225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:55 Total: 1296000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:56 Total: 1369000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:57 Total: 1444000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:58 Total: 1521000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:18:59 Total: 1600000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:00 Total: 1681000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:01 Total: 1764000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:02 Total: 1849000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:03 Total: 1936000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:04 Total: 2025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:05 Total: 2116000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:06 Total: 2209000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:07 Total: 2304000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:08 Total: 2401000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:09 Total: 2500000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:10 Total: 2601000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:11 Total: 2704000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:12 Total: 2809000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:13 Total: 2916000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:14 Total: 3025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:15 Total: 3136000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:16 Total: 3249000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:17 Total: 3364000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:18 Total: 3481000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:19 Total: 3600000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:20 Total: 3721000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:21 Total: 3844000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:22 Total: 3969000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:23 Total: 4096000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:24 Total: 4225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:25 Total: 4356000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:26 Total: 4489000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:27 Total: 4624000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:28 Total: 4761000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:29 Total: 4900000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:30 Total: 5041000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:31 Total: 5184000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:32 Total: 5329000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:33 Total: 5476000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:34 Total: 5625000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:35 Total: 5776000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:36 Total: 5929000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:37 Total: 6084000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:38 Total: 6241000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:39 Total: 6400000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:40 Total: 6561000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:41 Total: 6724000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:42 Total: 6889000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:43 Total: 7056000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:44 Total: 7225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:45 Total: 7396000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:46 Total: 7569000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:47 Total: 7744000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:48 Total: 7921000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:49 Total: 8100000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:50 Total: 8281000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:51 Total: 8464000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:52 Total: 8649000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:53 Total: 8836000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:54 Total: 9025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:55 Total: 9216000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:56 Total: 9409000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:57 Total: 9604000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:58 Total: 9801000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 20:19:59 Total: 10000000
```
#### With concurrency
Now let's see how concurrency is implemented and what's the result of it.
Code here [listener.go](https://github.com/viniciusvasti/golang-rabbit-mq-channel-goroutine-demo/blob/main/internal/mqlistener/listener.go).
And the snippets that matters:

```go
// defining the amount of concurrent workers/threads processing the messages
const workerPoolSize = 5

...

func (rl RabbitMQListener) Listen() {
	ch, err := rl.conn.Channel()
	
	...

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)

	for i := 0; i < workerPoolSize; i++ {
		go worker(msgs)
	}
	
	// makes the listener run forever
	select {}
}

// allows messages in the amqp channel to be processed in a concurrent thread
func worker(dataChannel <-chan amqp.Delivery) {
	for message := range dataChannel {
		processMessage(string(message.Body))
	}
}
```
Now instead of looping over the messages in the `msg` channel, we delegate the work to `worker`s.
We create the amount of workers defined by `workerPoolSize`, and we call the worker functions with the `go` command to execute it in a new thread.
\*also note that I changed the strategy to keep the `Listen` function running from:

```go
forever := make(chan string)
// makes the listener run forever
<-forever
```
to simply `select {}`

Now you can check the output of the program after I've produced 100 messages on the RabbitMQ server again.
It read the first message at **22:14:08** and the last one at **22:14:27**, totalizing ~20 seconds. That is the exact amount of time spent w/o concurrency divided by the number of workers (threads) processing messages concurrently:

```bash
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:08 Total: 9000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:08 Total: 4000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:08 Total: 16000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:08 Total: 1000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:08 Total: 25000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:09 Total: 100000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:09 Total: 64000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:09 Total: 81000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:09 Total: 36000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:09 Total: 49000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:10 Total: 225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:10 Total: 144000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:10 Total: 121000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:10 Total: 169000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:10 Total: 196000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:11 Total: 361000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:11 Total: 256000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:11 Total: 289000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:11 Total: 324000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:11 Total: 400000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:12 Total: 576000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:12 Total: 441000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:12 Total: 484000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:12 Total: 529000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:12 Total: 625000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:13 Total: 900000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:13 Total: 729000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:13 Total: 676000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:13 Total: 784000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:13 Total: 841000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:14 Total: 1225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:14 Total: 1024000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:14 Total: 961000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:14 Total: 1089000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:14 Total: 1156000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:15 Total: 1600000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:15 Total: 1369000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:15 Total: 1296000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:15 Total: 1444000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:15 Total: 1521000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:16 Total: 1936000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:16 Total: 1681000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:16 Total: 1764000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:16 Total: 1849000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:16 Total: 2025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:17 Total: 2500000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:17 Total: 2209000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:17 Total: 2116000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:17 Total: 2304000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:17 Total: 2401000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:18 Total: 2916000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:18 Total: 2601000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:18 Total: 2704000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:18 Total: 2809000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:18 Total: 3025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:19 Total: 3600000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:19 Total: 3481000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:19 Total: 3136000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:19 Total: 3249000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:19 Total: 3364000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:20 Total: 3721000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:20 Total: 3969000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:20 Total: 3844000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:20 Total: 4096000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:20 Total: 4225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:21 Total: 4761000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:21 Total: 4356000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:21 Total: 4489000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:21 Total: 4624000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:21 Total: 4900000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:22 Total: 5476000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:22 Total: 5041000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:22 Total: 5184000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:22 Total: 5329000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:22 Total: 5625000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:23 Total: 6400000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:23 Total: 5929000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:23 Total: 5776000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:23 Total: 6084000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:23 Total: 6241000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:24 Total: 7225000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:24 Total: 7056000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:24 Total: 6561000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:24 Total: 6724000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:24 Total: 6889000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:25 Total: 7396000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:25 Total: 8100000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:25 Total: 7569000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:25 Total: 7921000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:25 Total: 7744000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:26 Total: 8281000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:26 Total: 9025000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:26 Total: 8836000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:26 Total: 8464000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:26 Total: 8649000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:27 Total: 9216000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:27 Total: 10000000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:27 Total: 9604000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:27 Total: 9801000
golang-rabbit-mq-channel-goroutine-demo-app-1       | 2024/02/07 22:14:27 Total: 9409000
```

Now imagine scaling it for hundreds or even thousands of workers depending on the context and needs of your application.
It's extremely powerful and efficient.
I'm pretty sure that creating hundreds of threads like this in `Go` is much less resource-consuming than creating that amount of `threads` in `Java` or `worker threads` in `Node.js` because Java and Node create actual OS threads while Go creates "virtual" threads, which is much lighter and cheaper.

That's all.
Thank you for reading. This is part of my studies/training on Golang, so if you have something to add or if I did/said something wrong, don't be afraid of reaching to me on [LinkedIn](https://linkedin.com/in/vinicius-vas-ti) or send me an email.

Cheers!
