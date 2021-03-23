---
title: 'Apache Kafka Producer Main Configs for Resilience, Performance and Consistency'
date: '2021-03-23'
tags: 'apache kafka'
---

---
Hi, everyone!
In this post I'm going to discuss main configurations for a Kafka Producer

---

## About the tech stack
- [Apache Kafka](https://kafka.apache.org/): a reliable, scalable and highly available event streaming tool.

---

A producer is a service that posts (produces) as message to one or more Kafka Topics.  

## Important Configs for a Producer

### acks
First, let's remember that the recommended way of architecture Kafka is having a cluster of kafka brokers.  
For each topic partition, there is a broker leader and other brokers are the followers.  
When a producer sends a message, it is sent to the leader then it has the duty of replicating it 
to the followers.

This `acks` config is about how many brokers the producer requires to confirm that the message was received.
- `0`: Producer assumes the message was received since it have sent it. It improves latency and 
  throughput. Be aware that messages may be lost, since the Producer won't know about fails and won't perform a retry;
- `1`: Producer awaits for the leader to confirm that message was received, but don't care about the followers. It's safer than `0`, but there is no guarantee of replication;
- `all` or `-1`: The safest options for be sure that no messages are lost. If sending a message fails, the producer is able to perform retries.

### buffer.memory
It stands for the maximum amount of memory the producer can use to buffer the messages awaiting to be sent to the server.  
Be aware about the messages' throughput. The higher it is, more chances this value to be achieved and producer will block messages sending and throw an exception.  
`Default: 33554432`

### batch.size
For a better performance on the producer and even on the server, producer attempts to send messages in batches.  
Think about a System with a high throughput, say 1000 per second. It's better for the producer to send one request of a batch of 500 messages each half second than sending 1000 requests to the server in on second.

This configuration defines the size of that batch.
It works only during a throughput of messages higher than they can be sent out to server.  
If you want to reduce the number of request even during lower throughput, the `linger.ms` configuration can do this.  
`Default: 16384`

### linger.ms
It defines the amount of time to wait for new messages for filling the batch capacity set by 
`batch.size`.  
That is, if the size of batch is 500kb, but the messages in batch together have a size of 450kb, the producer will wait for the time set in `linge.ms` configuration for new messages to achieve 500kb or more.  
The trade off here is, the higher this value, higher will be the producer and broker performance.
Messages might be delayed for filling the batch during lower loads. Plus, it will keep more messages in memory.  
`Default: 0`

### max.in.flight.requests.per.connection
This configuration sets the number of unacknowledged (with no receive confirmation from brokers) messages the producer will send before blocking.  
If this value is 5, it means that if the producer don't receive broker confirmations for the requests sent, it will keep sending at most 5 request before blocking.  
Be aware that if one or more of these 5 requests fails, the order of messages are not guaranteed while doing retries.
If order is important, set it to 1.  
`Default: 5`

### retry.backoff.ms
It sets the amount of time to wait until resend failed requests.  
This is very useful in scenarios of unavailability, since it could be more effective to wait a little before trying again.  
`Default: 100`
