---
title: "Java Concurrency: Threads"
date: 2024-05-01
tags:
  - java
  - concurrency
  - multithread
  - threads
---

# Thread
It's a single sequential flow in a program process.
Usually, a program has a **Main** thread which can create other threads.
Working in a single-threaded environment is trivial, whereas working with multiple threads brings some challenges to the table:
- How to deal with shared resources;
- Race conditions;
- Deadlocks;
- Testing;
- Debugging;
- Tracking/Troubleshooting.
And some advantages as well:
- Concurrency;
- Performance improvements;
- Simplify implementation of remote procedure calls (e.g. HTTP APIs).

Let's deep dive into how is it to work with multiple threads in Java.

# Threads in Java
There are essentially 2 types of threads in a Java program: User threads (including the Main thread) and Daemon threads.

## User Thread
It's the default thread type created in a Java application.
The main thread is a User thread initiated automatically when an application is started through its `main` method.
You can programmatically create other User threads to process computations concurrently, fire and forget calls, etc.
The program execution will run until at least 1 User thread is active.

\*\*\*\* Something very important to have in mind when delegating the execution to other threads is that there are no guarantees about when and in which order they will execute. The will JVM execute them when possible (depending on the available resources).  \*\*\*\*

Now, let's check different ways of creating threads in Java.
#### Creating a thread by extending the Thread.class

```Java
public class MultiThreadingExtending {
    static class MyThread extends Thread {
        public MyThread(String name) {
            super(name);
        }

        @Override
        public void run() {
            Utils.printNumbers(10);
        }
    }

    public static void main(String[] args) {
        Thread t1 = new MyThread("Thread A");
        Thread t2 = new MyThread("Thread B");
        t1.start();
        t2.start();
    }
}
```

The drawback of extending `Thread.class` is that you can extend only one class in Java. Therefore, it's less flexible than the next option.

#### Creating a thread by implementing the Runnable interface

```Java
public class MultiThreadingRunnable {
    static class MyThread implements Runnable {
        @Override
        public void run() {
            Utils.printNumbers(10);
        }
    }
    
    public static void main(String[] args) {
        Thread t1 = new Thread(new MyThread(), "Thread A");
        Thread t2 = new Thread(new MyThread(), "Thread B");
        t1.start();
        t2.start();
    }
}
```

Java allows the implementation of several interfaces, and you can still extend a class if needed.
#### Creating a thread using Lambda

```Java
public class MultiThreadingLambda {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            Utils.printNumbers(10);
        }, "Thread A");
        Thread t2 = new Thread(() -> {
            Utils.printNumbers(10);
        }, "Thread B");
        t1.start();
        t2.start();
    }
}
```

This way you reduce the boilerplate. It's a good option if the code to run in the thread is short.

Here is the output of the execution (could be from any of the 3 code snippets above):

```bash
Thread A: 0
Thread A: 1
Thread B: 0
Thread A: 2
Thread B: 1
Thread A: 3
Thread A: 4
Thread B: 2
Thread A: 5
Thread B: 3
Thread A: 6
Thread B: 4
Thread A: 7
Thread B: 5
Thread B: 6
Thread A: 8
Thread B: 7
Thread A: 9
Thread B: 8
Thread B: 9
```

Not how the order is messed up, because they're two independent threads.
## Daemon Threads
Daemon threads are low priority and usually provide service to User threads. They are killed at the end of a program's execution.
That means:
If all the User threads finish, all the running Daemon threads will be killed by the JVM.

Some possible use cases for Daemon threads could be:
- Collecting metrics and statistics about the application execution
- Writing/sending execution logs
- Listening for incoming connections

The advantage of Daemon threads in scenarios where the thread is responsible for auxiliary tasks, and it's not critical if they're killed in the middle of a task (losing some data) is that you don't need any work to finish those threads when you want the application to exit.

Some points to pay attention to:
- When a thread is created by a Daemon thread, it is going to be a Daemon thread by default (you can explicitly tell that it should be a user thread by setting the daemon flag to false);
- When the daemon threads are killed (because all the users' threads are finished), not even `finally` blocks nor calls in the call stack are executed.

#### Creating a Daemon thread
```Java
public class MultiThreadingDaemonThread {
    public static void main(String[] args) {
        Thread t1 = new MyThread("Thread A", 100);
        Thread t2 = new MyThread("Thread B", 10);
        t1.setDaemon(true);

        t1.start();
        t2.start();
    }

    static class MyThread extends Thread {
        private int n = 10;

        public MyThread(String name) {
            super(name);
        }

        public MyThread(String name, int n) {
            super(name);
            this.n = n;
        }

        @Override
        public void run() {
            Utils.printNumbers(n);
        }
    }
}
```

To set a thread as Daemon, call `t1.setDaemon(true)`.
Here is the output of that execution in my machine:

```bash
Thread B: 0
Thread A: 0
Thread A: 1
Thread B: 1
Thread A: 2
Thread B: 2
Thread A: 3
Thread B: 3
Thread A: 4
Thread B: 4
Thread A: 5
Thread B: 5
Thread A: 6
Thread B: 6
Thread A: 7
Thread B: 7
Thread A: 8
Thread B: 8
Thread A: 9
Thread B: 9
Thread A: 10
Thread A: 11
Thread A: 12
Thread A: 13
Thread A: 14
Thread A: 15
Thread A: 16
Thread A: 17
Thread A: 18
```

Note how `Thread A` stopped printing at `18`. That's because, the `main` thread and `Thread B`, a User thread, were done and had to print from 0 to 9 only.
After all the User threads were finished, `Thread A`, a Daemon thread, was killed even though it didn't finish printing from 0 to 99.

---

The code can be found [here](https://github.com/viniciusvasti/java-training/tree/main/src/main/java/com/vas/concurrency/threads)

Thanks for reading :)

Related posts:
- https://vinisantos.dev/posts/java-concurrency-multi-threading-sync
- https://vinisantos.dev/posts/java-concurrency-thread-safe-singleton
- https://vinisantos.dev/posts/java-concurrency-thread-safe-queue