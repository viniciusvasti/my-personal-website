---
title: "Java Concurrency: Threads Synchronization"
date: 2024-05-02
tags:
  - java
  - concurrency
  - multithread
  - threads
---

In the [Java Concurrency: Threads](https://vinisantos.dev/posts/java-concurrency-multi-threading) post I talked about Java user and daemon threads, and how to create them.

Now let's talk about an important topic for concurrency: Synchronization.

When working with a multi-thread environment, one of the concerns developers need to have is about resources, values, or methods that need to be `thread-safe`, i.e. prevent multiple threads from accessing it at the same time.
Typically this kind of control is required for operations that change something.
Read-only operations usually are not prone to cause issues when accessed by two or more threads simultaneously.
For this post, I will demonstrate how to implement synchronization between threads that interact with a Stack structure.

---

# Synchronizing the Stack methods
## Why to synchronize?
Here is the code that implements a non-thread-safe Stack.

```Java
public class MultiThreadingSynchronizationMissing {
    public static void main(String[] args) {
        Stack stack = new Stack(5);
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                System.out.println(Thread.currentThread().getName() + " pushing " + stack.push(i));
            }
        }, "Thread A").start();
        new Thread(() -> {
            for (int i = 0; i < 10; i++) {
                System.out.println(Thread.currentThread().getName() + " popping " + stack.pop());
            }
        }, "Thread B").start();
    }

    static class Stack {
        private int[] stack;
        private int top;

        public Stack(int size) {
            stack = new int[size];
            top = -1;
        }

        public boolean push(int value) {
            if (isFull()) {
                return false;
            }
            ++top;
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            stack[top] = value;
            return true;
        }

        public int pop() {
            if (isEmpty()) {
                return Integer.MIN_VALUE;
            }
            int value = stack[top];
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            top--;
            return value;
        }

        // ...
    }

}

```

For demonstration purposes, I've added a 1-second sleep between lines that might cause the Stack to be inconsistent in case of two or more threads calling `push` and/or `pop`:
- Push increments the `top` pointer, then adds the new value to the Stack;
- Pop removes the value from the Stack, then decrements the `top` pointer;

That Stack is not thread-safe because the following could happen:
1. Thread A: calls push with int 5;
2. Thread A: increments top = 0;
3. Thread B: calls push with int 8;
4. Thread B: increments top = 1;
5. Thread A: adds 5 to the stack\[top] which is equals stack\[1]
6. Thread B: adds 8 to the stack\[top] which is equals stack\[1]

See how the Stack is inconsistent?
The 5 (Thread A) was overwritten by 8 (Thread B).
Furthermore, the Stack's position at index 0 is empty.

Here is the output of the execution:

```bash
Thread A pushing true
Thread B popping 0
Thread B popping 0
Thread A pushing true
Thread B popping -2147483648
Thread B popping 1
Thread A pushing true
Thread B popping -2147483648
Thread B popping 2
Thread A pushing true
Thread B popping -2147483648
Thread B popping 3
Thread B popping -2147483648
Thread A pushing true
Thread B popping -2147483648
Thread A pushing true
Thread A pushing true
Thread A pushing true
Thread A pushing true
Thread A pushing true
```

How come `0` was popped two times?
And how come, in line 5, the Stack was empty (we got the minimum integer), and right after we got a 1, w/o a push in the middle?
## Synchronizing Push and Pop independently
Java provides a `synchronized` keyword that allows the implementation of thread synchronization easily. It can be used as a block inside a method (to make just a portion of the code thread-safe) or in a method signature (to make the whole method thread-safe).

Our first attempt to fix that issue will be to synchronize each method with different lock objects.

```Java
public class MultiThreadingSynchronizationIndependentLocks {
    public static void main(String[] args) {
        // ...
    }

    static class Stack {
        // ...
        private Object pushLock = new Object();
        private Object popLock = new Object();

        // ...
        
        public boolean push(int value) {
            // ..
            synchronized (pushLock) {
                ++top;
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                stack[top] = value;
            }
            return true;
        }

        public int pop() {
            // ..
            synchronized (popLock) {
                int value = stack[top];
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                top--;
                return value;
            }
        }

        // ...
    }

}
```

Note that I've created two ordinary objects to pass as the lock object to the `synchronized` block. It accepts any Object. That object is used so that you leverage the same lock for different methods. That is: you can lock several methods to a single threat at the same time if you pass the same object to the `synchronized` block.

Let's check the execution output with those locks implemented:

```bash
Thread B popping 0
Thread A pushing true
Thread B popping -2147483648
Thread B popping 0
Thread A pushing true
Thread B popping -2147483648
Thread B popping 1
Thread A pushing true
Thread B popping -2147483648
Thread A pushing true
Thread B popping 2
Thread A pushing true
Thread B popping 3
Thread B popping 4
Thread A pushing true
Thread B popping -2147483648
Thread A pushing true
Thread A pushing true
Thread A pushing true
Thread A pushing true
```

It's still not working properly. `Thread B` popped a `0` before any value was pushed.
That's because we've created distinct locks for `push` and `pop`, methods. Therefore, `Thread B` can access it while `Thread A` is in the middle of a push.
That's easy to fix. Just use a single lock object for both methods `synchronized` blocks.
## Synchronizing Push and Pop independently
But I will show the same solution mentioned above in a little different manner.

```Java
public class MultiThreadingSynchronizationMethod {
    public static void main(String[] args) {
        // ...
    }

    static class Stack {
        // ...

        public synchronized boolean push(int value) {
            // ...
        }

        public synchronized int pop() {
            // ...
        }

        // ...
    }

}

```

Here I used the `synchronized` keyword at the method level. Behind the scenes at compiling, it's the same as `synchronized (this) {...}`.
You see? `synchronized` accepts any object. Therefore, we can pass the Stack instance itself.
And since I did the same for `push` and `pop`, they share the same lock object.
Now, If `Thread A` gets the `push` lock, `Thread B` will need to wait until it's done to be able to call either `pop` or `push`.

And this time the output looks beautiful:

```bash
Thread A pushing true
Thread B popping 0
Thread A pushing true
Thread B popping 1
Thread A pushing true
Thread B popping 2
Thread A pushing true
Thread B popping 3
Thread A pushing true
Thread B popping 4
Thread A pushing true
Thread B popping 5
Thread A pushing true
Thread B popping 6
Thread A pushing true
Thread B popping 7
Thread A pushing true
Thread B popping 8
Thread A pushing true
Thread B popping 9
```

No `-2147483648` being popped, no weird sequence of pops getting the same values without a push in the middle.

---

The code can be found [here](https://github.com/viniciusvasti/java-training/tree/main/src/main/java/com/vas/concurrency/synchronization)

Thanks for reading :)

---

Related posts:
- https://vinisantos.dev/posts/java-concurrency-multi-threading
- https://vinisantos.dev/posts/java-concurrency-thread-safe-singleton
- https://vinisantos.dev/posts/java-concurrency-thread-safe-queue