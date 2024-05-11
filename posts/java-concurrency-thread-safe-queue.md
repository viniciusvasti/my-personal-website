---
title: "Java Concurrency: Thread Safe Blocking Queue"
date: 2024-05-11
tags:
  - java
  - concurrency
  - threads
  - multithread
---

This time let's explore another important topic about threads: blocking, waiting, and unblocking.
To demonstrate those concepts, I will use a Queue.

---

# Implementing a Thread-Safe Blocking Queue
Before going into the code, let's define the requirements for this queue:
1. We shouldn't allow two distinct threads to try to enqueue or dequeue data concurrently. Otherwise, we could have a race condition, causing the queue to be in an inconsistent state.
2. The queue has a limited capacity;
3. We should void to lose data. That means if a Publisher tries to enqueue data, but the queue is out of capacity, the Publisher should wait until the queue gets free space (some thread dequeues data from the queue);
4. If a Listener tries to dequeue data, but the queue is empty, the Listener should wait until there is some data to be consumed (some thread publishes data to the queue).

To accomplish rules 3 and 4, we will use the Object's methods `wait()` and `notifyAll()` methods.
### `wait()`
It puts the thread in a waiting state.
That means it releases the lock of that method. Therefore, other threads can fight for that lock.
But "waiting" for what? For any other thread to call either `notifyAll()` or `notify()` methods.
### `notifyAll()`
It notifies all the threads in a `waiting` state (for the same lock context) that they can resume. However, keep in mind that those waiting threads will not resume immediately. They have to fight for the lock again to resume its execution.
`notifyAll()` awakes all waiting threads, whereas `notify()` awakes a single arbitrarily.

Here's the implementation of the Queue:

```Java
public class ThreadSafeQueue {
    private Queue<Integer> queue;
    private int capacity;

    public ThreadSafeQueue(int capacity) {
        this.queue = new LinkedList<>();
        this.capacity = capacity;
    }

    synchronized public boolean enqueue(int data) {
        if (queue.size() == capacity) {
            try {
                this.wait(); // 1
            } catch (InterruptedException e) {
            }
        }
        queue.add(data);
        this.notifyAll(); // 2
        return true;
    }

    synchronized public int dequeue() {
        if (queue.isEmpty()) {
            try {
                this.wait(); // 3
            } catch (InterruptedException e) {
            }
        }
        int i = queue.remove();
        this.notifyAll(); // 4
        return i;
    }

    public Queue<Integer> getQueue() {
        return queue;
    }

    @Override
    public String toString() {
        return "ThreadSafeQueue [queue=" + queue + ", capacity=" + capacity + "]";
    }
}
```

If you're not familiar with the `synchronized` keyword in Java, take a look at the related posts at the end of this post. I covered that before.

So here is what happens if a Publisher tries to publish to a Queue that's out of capacity:
1. A Publisher calls `enqueue`;
2. The Publisher gets the lock for the Queue;
3. The Publisher is blocked and moves to a waiting state;
4. The Publisher releases the lock;
5. A Listener calls `dequeue` and gets the lock for the Queue;
6. The Listener calls `notifyAll` and releases the lock;
7. The Publisher gets the lock back;
8. The Publisher `enqueues` new data and releases the lock.

And what happens if a Listener tries to dequeue from an empty Queue is:
1. A Listener calls `dequeue`;
2. The Listener gets the lock for the Queue;
3. The Listener is blocked and moves to a waiting state;
4. The Listener releases the lock;
5. A Publisher calls `enqueue` and gets the lock for the Queue;
6. The Publisher calls `notifyAll` and releases the lock;
7. The Listener gets the lock back;
8. The Listener `dequeues` new data and releases the lock.

---

The code can be found [here](https://github.com/viniciusvasti/java-training/blob/main/src/main/java/com/vas/concurrency/blocking_waiting/ThreadSafeQueue.java)

That's all. Thank you!

Related posts:
- https://vinisantos.dev/posts/java-concurrency-multi-threading
- https://vinisantos.dev/posts/java-concurrency-multi-threading-sync
- https://vinisantos.dev/posts/java-concurrency-thread-safe-singleton