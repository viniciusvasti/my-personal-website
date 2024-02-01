---
title: 'Apache Kafka Consumer main configs for Resilience, Performance and Consistency'
date: '2021-03-24'
tags: [apache kafka]
---

---

Hi, everyone!
In this post, I'm going to discuss the main configurations for a Kafka Consumer

---

## About the tech stack
- [Apache Kafka](https://kafka.apache.org/): a reliable, scalable, and highly available event streaming tool.

---

A Consumer is a service that reads (consumes) messages from one or more Kafka Topics.  

## Important Configs for a Consumer

### group.id
If you want more than one instance of a consumer service, all the instances need to have the same `group.id` to be considered as one unique consumer by the server.  
There is no default for this config. If you don't set it and 2 instances of the same consumer are running, both of them will receive each message on topics they are subscribed to.

### fetch.max.bytes
As well as Producers attempt to send messages in batches, consumers fetch messages in batches.  
This config sets up the maximum size of a batch that the server should respond to consumer requests.  
However, the consumer performs multiple fetches in parallel, so this config doesn't define the throughput.  
Also, there are configs on the broker level related to the size of these batches.  
`Default: 52428800` (50 mebibytes)

### fetch.min.bytes
This config sets up the minimum size of batches that the server should respond to consumer's fetch requests.  
If that isn't sufficient data for it, the server will await new messages.  
A value of 1 byte (default), means that the server responds to fetch requests as soon as possible.  
A higher value can increase throughput. Latency would be a trade-off.  
Also, for not letting the consumer starve while awaiting new messages to achieve this batch size, `fetch.max.wait.ms` defines the maximum time for this awaiting.  
`Default: 1`

### fetch.max.wait.ms
Defines the maximum time for awaiting new messages when there isn't sufficient data for filling the `fetch.min.bytes`.  
`Default: 500`

### max.partition.fetch.bytes
Defines the maximum number of bytes the server returns per partition.  
That is, a consumer needs to have available memory compatible with this value x number of partitions it is assigned to. Otherwise, the consumer will have problems trying to read messages.  
`Default: 1048576` (1 mebibyte)

### session.timeout.ms
Defines the time that the server waits for a consumer heartbeat before the server assumes it's 
dead and initiate the rebalance of partitions' assignments between the alive consumers.  
`Default: 10000` (10 seconds)

### auto.offset.reset
This config defines the strategy for a new consumer (or a consumer with no offset info on the server) to start reading messages.  
- `earliest`: The consumer starts from the earliest offset on the partition. this means the first message if no message's deletion has happened yet;
- `latest`: The consumer starts reading from the latest offset on the partition. That is: old messages are ignored;
- `none`: The consumer throws an exception if there is no previous offset.  
`Default: latest`

### enable.auto.commit
If true the consumer's offset will be periodically committed in the background.  
Setting it to false gives more control for developers, allows for preventing duplications, and requires to manually commit offsets after processing a message successfully.  
`Default: true`

### auto.commit.interval.ms
Defines the interval in which the consumer offsets are automatically committed to the server.  
`Default: 5000` (5 seconds)

### max.poll.interval.ms
Defines the maximum time between consumer polls for new messages.  
If this interval is exceeded, the server will assume the consumer is dead and initiate a rebalance between topic partitions and consumer instances of a group.  
`Default: 300000` (5 minutes)

### max.poll.records
Stands for the maximum records (message/events) returned in response to a consumer's read request.  
This config affects throughput and workloads over the consumer instances.  
`Default: 500`

### request.timeout.ms
Defines the amount of time a consumer waits for a response to a read request.  
After this time has elapsed, it will retry or fail.    
`Default: 30000` (30 seconds)

### retry.backoff.ms
The delay between retries for failed message reading actions.  
`Default: 100`

---

### Related Posts
- <a className="text-slate-700 hover:text-blue-400" href="../posts/kafka-producer-configs">Apache Kafka Producer main configs for Resilience, Performance and Consistency</a>  
- <a className="text-slate-700 hover:text-blue-400" href="../posts/kafka-topic-configs">Apache Kafka Topic main configs for Resilience, Performance and Consistency</a>
