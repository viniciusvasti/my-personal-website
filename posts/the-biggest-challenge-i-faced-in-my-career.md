---
title: The biggest challenge I've faced in my career
date: 2024-05-08
tags:
  - career
  - tech-lead
---

It might be cool to share the details and aspects of my biggest career challenge as a Software Engineer. I hope it will be inspiring to other developers somehow.

# The Company and  Business
It was one of the biggest Brazilian fast-fashion retail companies.
They run ~300 physical stores around the country plus the online store.
They also have a factory responsible for a relevant portion of clothes at sale.
# Where I was before that challenge
I joined the company to be part of its Innovation Team as a Mid Level Software Engineer.
Our job was to research trends and innovations in the retail market and identify what would bring value to the company. Here are a few examples of what we discussed about:
- Digital "magic" mirror: a tech mirror where you could see yourself (as a regular mirror) but wearing any of the store products;
- Autonomous physical stores;
- Mobile Point of Sales devices around the store to reduce queues in the checkout area;
- Smart lockers to withdraw goods ordered through the online store;
- Among others.

I've architected and developed the Backend services for the Smart Lockers, but this post story starts with that Mobile Point of Sales.

When I joined the team, 2 other developers had already started the development of the PoS. It was built upon the React Native framework.
I joined them after I finished the Smart Locker development, which took me ~2 months.
After I glanced at the Mobile PoS codebase, I noticed several issues related to not following the React Native standards and good practices.
For instance: they implemented a Singleton Class to deal with the app's global state whereas they should have leveraged Redux, the most popular State Management Library at that time.
whenever I'm willing to do something, I try it the right way, even though my focus is on the Backend.
So I aligned with them that I would do some refactoring. They rapidly agreed when they realized I knew what I was talking about, while they just started coding without studying the Tech Stack they were working with a little more.
That also included refactoring the components for reuse and decoupling the business logic from the UI.

Also and most importantly, I've identified flaws in the implemented sales flow (like beeping product barcodes, checking prices, checking for discounts, listing available payment methods, asking and processing payment, and finally printing the invoice).
I can't remember what was wrong. But I demonstrated how it could go wrong to the team (especially the project's Product Owner), and we reviewed and fixed that flow.

Those actions I took, and the approaches I followed to talk to the team regarding what they did wrong, rapidly caught my manager's attention, so I naturally became the team's Tech Leader (before that, the PO was also kind doing the TL's job).
# Where I was asked to be
As you can imagine, a company of that size and age (70+ years) already had a team responsible for the Desktop Point of Sales and Sales Backoffice Services. Therefore, the idea was that we (the Innovation Team), would build a Proof of Concept (that ended up becoming an MVP), try it in a physical store, then pass the project's knowledge and responsibilities to that team.

However, the company's general tech Manager observed that:
- I had great leadership skills + knowledge of modern software development stacks and patterns (Java Spring, NodeJS, React/React Native, Microservices, RESTFul APIs...)
- The Desktop Point of Sale, as well as all the back-office services needed to be rebuilt to leverage modern technologies, and integrated better with third-party services and the company's internal services (E-commerce, BI Data Lake, Omni channel services, among others)
- The guys maintaining the 15-year-old legacy system needed to "modernize themselves" to

So he decided I would move to that team along with that Mobile PoS project and lead them on modernizing the whole system.
That included:
- Evolving the Mobile PoS to include needed features that were out of its MVP
- Migrating the (mostly) SOAP back-office services to a fleet of RESTFul Microservices-based Event-Drive architecture (proposed by myself)
- Migrating all the backend services from on-premises infrastructure to the cloud (AWS)
- Migrating the Desktop PoS from Java/Swift to Typescript/React\.js/Electron.js
- Training the Java developers on Typescript/React.js

# What were the challenging aspects and what I've learned
### Designing a Microservice-based Event-Driven Architecture
I had read about Event-Driven and the Saga Patterns before. The curious thing is that I had designed and implemented something very similar for that Smart Locker (we had events like locker slot requested, locker slot assigned, package stored, customer notified, package withdrawn by the customer, and package withdrawn by the store's employee) before reading about it. That's why it's a pattern, isn't it? Because it's a good solution for a common problem.

I implemented that again, especially for processing sales.
There were several other services interested in the "store A sold products" event like:
- The BI feeds its Data Lake, does its analysis, and collects insights
- The E-commerce offers products from the online store related to what customers had bought in the physical store
- The Loyalty Program System added points to the customers based on the amount spent with the store's private label card
- Among others...

I also had to provide high availability, fault tolerance, observability, etc.
These were the leveraged tools:
- Java and Spring for the Microservices
- NodeJS for AWS Lambdas
- React/React Native for the frontend
- Kafka as a message broker/events backbone
- Redis for caching
- Kubernetes orchestrating several replicas of each service
- Rancher for managing Kubernetes services
- Application Load balancer distributing the workload through the replicas of the service
- An API gateway centralizing the API's requests and authentication
- ELK Stack for visualizing logs (Elasticsearch, Logstash, Kibana)
- Dynatrace for monitoring application failures
- Amazon RDS (Postgres), DocumentDB, DynamoDB, Lambda, MSK (Kafka), SNS, Amazon MQ, API Gateway
- Azure DevOps for CI/CD pipelines

### React Native vs External Devices
The sales process in a physical store includes integrations with distinct external devices to:
1. Beep product barcodes
2. Interact with the Credit Card PIN pad to process the payment
3. Send the invoice raw text to a small computer plugged into a printer to print the customers' invoice

To solve number 1, we had to try different barcode readers from different vendors until we found one that best integrated with the React Native app,  and that had reliable hardware communication. We handle that using Native Modules and Java.

Regarding number 2, the PIN pad vendor provided a Java library that we integrated through a Java Native Module again. The complexity was mostly at reading their docs and implementing all the possible payment methods. In Brazil, you can pay the whole amount at once with a Debit Card or a Credit Card, or even divide the amount using the Credit Card so you would be billed monthly until the total amount is paid.

And finally the hardest one. Dealing with hardware is not one of my strengths. Here I learned to delegate and rely 100% on teammates who had the skills I missed.
I followed up with their tries and final solution, then learned from them:
- We set a printing service queue in the small computer running Linux
- Connected it to the printer through the store's local network
- Established socket a connection between the React Native app and the Linux computer to send out the raw invoice's text to be printed

### The Mobile PoS vs the Invoice Printer
As I mentioned earlier, I've delegated that part to other developers who were more proficient with hardware.
But even they couldn't make it work 100% of the time. 
Around 1 every 50 sales, we had an issue printing an invoice. The deal is that: by law, the customer has the right to get the invoice, but we couldn't try to print it again because of constraints that I won't describe right now.
Then I brought out 2 options that I discussed with the Store Operations team. In case of the invoice printing fails, we could either:
- The store employee could go to a computer, access the Brazilian Federal Taxes website, consult the invoice by its number, and print it
- Send the invoice by email (that we could do how many times he wanted, just pushing a button in the app)

The last one is preferred, because it would be much faster and easier. The first should happen only if the customer strongly demands a paper-printed invoice.
The Operations Team agreed with those solutions.
### Physical Stores' poor network connection
Another big deal was that among the 300 physical stores, tens of those, maybe hundreds, had a poor internet connection. That means the requests to the APIs running in the cloud could have delayed responses or even failed if the internet was down.

The old Desktop PoSs had contingency strategies for that. It had a local database containing product info, prices, inventory, discounts, promotions, and any other data needed to perform the sale successfully when offline.
We had to implement mechanisms to do the same and keep the data in sync with the cloud servers in the React Native app too.
Not a big deal, it's the same logic as the Desktop version. But this is a mobile device with a small storage disk.

Then I decided to leverage those small computers required for connecting to the invoice printer. We installed a database on them and implemented services to download all that data and keep it in sync, then serve the data as a RESTFul API through the store's local network to the Mobile PoS.
### Getting Devs up-to-speed with a new Tech Stack
To rebuild such a big and complex system (involves much more than just beeping products and billing the buyers. For instance: selling gift cards includes calling third-party services, allowing customers to pay the bill of their store's privately labeled card, interacting with the loyalty program APIs, etc), I worked with the Product Owner on refining hundreds of User Story tickets.

My strategy for training those Java developers used to work with an outdated tech stack was:
1. I've curated a list of articles and crash courses for them to learn Typescript/React/React Native and shared with them. Fortunately, there are several similarities between Typescript and Java
2. I scaffolded the projects of each application type we would develop (mobile, desktop, microservices, AWS lambda functions)
3. Once they were ready, I started to distribute the tasks starting from the easiest tickets
4. I set myself as a required Pull Request reviewer in our git remote platform
5. I asked everyone to go through each PR I've approved and see the code and the comments I made to learn from those
6. I made myself 100% available for them to ask for help during the working hours
7. I observed who was gaining confidence and proficiency in the new tech stack, and asked them to review each PR before myself. So I could make sure they were ready to share the code review responsibility with me
8. At some point, I got confident enough to set PR constraints to 2 approvals without myself being required, therefore removing the bottleneck I was

---

I think that that's it.
As always: thanks for reading =)