# project

The final project for CIS555, a distributed search engine comprised of a crawler, 
indexer, PageRank, and UI.

## Team members
Harsh Parekh (hpar)
Alex Hirsch (hirschal)
Neil Shweky (nshweky)
David Yastremsky (dyas)

## Description

We implemented several features in building this distributed, performant, fault-tolerant search engine. These are described in detail in our [final report](https://github.com/Handy-Search/project/blob/main/Handy%20Search%20-%20Final%20Report.pdf), but at a high level:
* A crawler and indexer implemented on top of Apache Flink to crawl and process pages across the web.
* PageRank implemented on Hadoop MapReduce to calculate the authority of different hosts.
* A search engine query on MongoDb.
* A server and UI built on top of React for users to access the search engine.

In terms of extra credit, we leveraged Flink's exactly once semantic checkpointing to build out a fault-tolerant crawler/indexer. When our crawler running locally failed for two hours in the middle of the night due to an internet outage, Flink recovered and continued crawling/indexing. This helped us emulate the continuous crawling and indexing of a modern day search engine.

## Source Files

There are many files included, with code documented inside. At a high level, we broke down our repository into sub-modules for each component, with each containing both main source files and extensive testing for those files. Many contain individual deployment instructions for the component.
* Crawler contains all source files for the crawler, broken down into factories, filters, functions, interfaces, mappers, sinks, and sources. The way these plug into the Flink topology can be seen at src/Crawler.java.
* Handy-search contains the main program for running the crawler and indexer.
* Indexer contains all source files for the indexer, broken down into constants, mappers, and sinks. How these plug into a Flink topology can be seen in Indexer.java.
* Interfaces contains all shared APIs/interfaces. These are broken down into adapters, functional, http (synchronous and asynchronous), interfaces, models, regex, and robots. These also hold some shared MongoDB and S3 API components.
* Node-server contains the Node server for the search query calculations. These are broken up into models and routes.
* Pagerank contains everything necessary for PageRank, broken down into mapper and reducers for each step of the process.
* Search-engine contains the React files for running the search engine. These are broken down into components, styles, and different classes such as App, Utilities, and ReportWebVital.

## Build Instructions

Individual sub-modules tend to be self-encapsulated, with some containing instructions for starting individual components like React. Follow instructions from the next sections to clone the sub-modules and set up MongoDB.

Handy-Search's main class can be packaged into a JAR for running on AWS on KDA for a fully-managed Flink instance, EMR for an instance with greater control, or EC2 for a single node instance. It can also be run locally, if preferred. The seed file must be in S3 and MongoDB must be started. The JAR must be run with the arguments MongoDB URI and S3 seed file location, or a warning will be returned prompting you to do so.

Once done, TestTFIDF in Indexer can be called to generate the TFIDF scores. Concurrently, you can run PageRank by packaging it as a JAR and deploying that JAR as an AWS EMR job until it completes.

At that point, the search results are ready. Follow the instructions in search-engine submodule to set it up, either on your machine or a cloud-based one like Amazon EC2. Search away!

## Cloning

To clone the repo and all its sub modules run:

```sh
git clone --recurse-submodules git@github.com:Handy-Search/project.git
```

## Running

To build the entire project navigate to root then run:

```sh
mvn clean install
```

To build only a particular component run the above command from the component's directory.

Components can be run from their directory using:

```sh
mvn exec:java
```

## Setting up MongoDB

To install the MongoDB CLI:
```
brew install mongodb/brew/mongodb-community-shell
```
Then open up a terminal and run:
```
mongod --dbpath=/Users/<user>/data/db
```
While that's running open another terminal and run:
```
mongo "mongodb+srv://cluster0.4azy8.mongodb.net/myFirstDatabase" --username handy
Enter password: search
```
Now you're in the mongo shell! Here are some commands to try:
```
show databases
use <database>
db.getCollectionNames()
db.<collection>.findOne()
```
