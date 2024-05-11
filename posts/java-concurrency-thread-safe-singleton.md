---
title: "Java Concurrency: Thread Safe Singleton"
date: 2024-05-10
tags:
  - java
  - concurrency
  - threads
  - multithread
---

In the [Java Concurrency: Threads Synchronization](https://vinisantos.dev/posts/java-concurrency-multi-threading-sync) post I demonstrated how to implement thread-safe/synchronized methods in Java.
Now I want to go further by demonstrating an interesting and complex thread synchronization implementation for one of the most popular Design Patterns which requires you to be smart about it.
Furthermore, let's introduce another concept: volatility.

---

# Implementing a Thread-Safe Singleton
### A straightforward but not optimal approach
Putting into practice what we learned before on [Java Concurrency: Threads Synchronization](https://vinisantos.dev/posts/java-concurrency-multi-threading-sync), we just need to set the `getInstance` method as `synchronized`, right?
So that when the first thread A gets the method's lock, it will instantiate the class, while any other thread (say B, C, and D) waits for its turn. After `thread A` releases the lock, threads `B`, `C`, and `D`, one at a time, will get the created instance.

```Java
public class ThreadSafeSingleton {
    private static ThreadSafeSingleton instance;

    private ThreadSafeSingleton() {
        System.out.println("ThreadSafeSingleton instance created");
    }

    public static synchronized ThreadSafeSingleton getInstance() {
        if (instance == null) {
            instance = new ThreadSafeSingleton();
        }
        doExpensiveOperation();
        return instance;
    }
}
```

Why is that not optimal?
Let's say the instance was already created by `threat A`.
When `thread B` gets the lock of `getInstance`, `thread C` has to wait until `B` releases it, and so `D` has to wait until `C` releases it later. Especially because we have an expensive operation there, it is not an optimal solution.
1. `Thread A` gets the lock
2. `Thread B` waits
3. `Thread C` waits
4. `Thread D` waits
5. `Thread A` creates the instance
6. `Thread A`  gets the instance, executes `doExpensiveOperation`, and releases the lock
7. `Thread B` gets the lock
8. `Thread B`  gets the instance, executes `doExpensiveOperation`, and releases the lock
9. `Thread C` gets the lock
10. `Thread C` gets the instance, executes `doExpensiveOperation`, and releases the lock
9. `Thread D` gets the lock
10. `Thread D` gets the instance, executes `doExpensiveOperation`, and releases the lock

But there is no need for that since B, C, and D will just read the instance, not write or change anything.
In other words, `getInstance` doesn't need to be thread-safe if the instance is already created.
### An optimal approach
So, instead of synchronizing at the method level, let's use a block:

```Java
...
    public static ThreadSafeSingleton getInstance() {
        if (instance == null) {
            synchronized (ThreadSafeSingleton.class) {
                instance = new ThreadSafeSingleton();
            }
        }
        doExpensiveOperation();
        return instance;
    }
...
```

Great! Now there is no useless synchronization if the instance is not null:
1. Thread A gets the lock
2. Thread B waits
3. Thread C waits
4. Thread D waits
5. Thread A creates the instance
6. Thread A releases the lock
7. Threads B, C, and D get the instance

But, there is a bug there.
Imagine that Threads `A` and `B` are inside that `if` at the same time (it's possible because there is no synchronization until that point).
Then thread `A` gets the lock, creates the instance, and releases the lock.
What happens when `B` gets the lock after passing the `instance == null` check? `Thread B` will create a new instance. The Singleton is broken now.
What we need to do to fix that is to double-check, inside the synchronized block, if there is an instance already:

```Java
...
    public static ThreadSafeSingleton getInstance() {
        if (instance == null) {
            synchronized (ThreadSafeSingleton.class) {
                if (instance == null) {
                    instance = new ThreadSafeSingleton();
                }
            }
        }
        doExpensiveOperation();
        return instance;
    }
...
```

Now we're good.
If threads `A` and `B` pass into the first `if`, `A` gets the lock, creates the instance, and releases the lock.
Then `B` gets the lock and does nothing inside the synchronized block because the `instance` is not null. Sweet!

However, there is one more caveat.
### Thread's cached values
Threads may cache values. Getting back to that scenario where  `Thread A` and `Thread B` got into the first `if`, after `Thread A` creates the instance, `Thread B` may still the `instance` as `null`, because it read it before and cached it. Instead, it should immediately see the new value that `Thread A` created.
For that purpose, Java provides the `volatile` keyword. That causes an object's instance to not be cached by the threads, so they also see its last value:

```Java
public class ThreadSafeSingleton {
    private static volatile ThreadSafeSingleton instance;
    ...
}
```

And finally,  our thread-safe Singleton is complete.

---

The code can be found [here](https://github.com/viniciusvasti/java-training/blob/main/src/main/java/com/vas/concurrency/volatilee/ThreadSafeSingleton.java)

That's all. Thank you!

Related posts:
- https://vinisantos.dev/posts/java-concurrency-multi-threading
- https://vinisantos.dev/posts/java-concurrency-multi-threading-sync
- https://vinisantos.dev/posts/java-concurrency-thread-safe-queue