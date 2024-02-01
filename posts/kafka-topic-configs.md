---
title: 'Apache Kafka Topic main configs for Resilience, Performance and Consistency'
date: '2021-03-24'
tags: [apache kafka]
---

---

Hi, everyone!
In this post, I'm going to discuss the main configurations for a Kafka Topic

---

## About the tech stack
- [Apache Kafka](https://kafka.apache.org/): a reliable, scalable, and highly available event streaming tool.

---

A Topic is a container of messages/events to which a Producer posts messages, and a Consumer 
reads messages from.  

## Important Configs for a Topic

### min.insync.replicas
This configuration takes effect for producers which have set `acks` config to "all" (or "-1").  
This configuration specifies the minimum number of replicas which should be in sync with 
the leader.  
A common scenario is: having 3 broker servers, set producers `acks` as "all" and `min.insync.replicas`.  
It means that it is acceptable to have 33% of replicas in a not-sync state, but it requires the majority of replicas to be in sync and confirm that the message was received.  
`Default: 1`

### retention.bytes
If you are using a "delete" retention policy, this configuration specifies the maximum size in bytes a partition can grow.  
It's useful if you care about space for the machine running the brokers.  
As soon as this value is achieved, older messages begin to be deleted.  
`Default: -1` (deactivated)

### retention.ms
As well as `retention.bytes` defines the maximum size for message retention, this config defines the maximum time for it.  
As soon as this value is achieved, older messages begin to be deleted.  
`Default: 604800000 (7 days)`

---

### Related Posts
- <a className="text-slate-700 hover:text-blue-400" href="../posts/kafka-producer-configs">Apache Kafka Producer main configs for Resilience, Performance and Consistency</a>  
- <a className="text-slate-700 hover:text-blue-400" href="../posts/kafka-consumer-configs">Apache Kafka Consumer main configs for Resilience, Performance and Consistency</a>  
