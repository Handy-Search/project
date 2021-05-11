# project

The final project for CIS555, a distributed search engine comprised of a crawler, 
indexer, PageRank, and UI.

## Team members
Harsh Parekh (hpar)
Alex Hirsch (hirschal)
Neil Shweky (nshweky)
David Yastremsky (dyas)

## Description

We implemented several features in building this distributed, performant, fault-tolerant search engine. These are described in detail in our final paper, but at a high level:
* A crawler and indexer implemented on top of Apache Flink to crawl and process pages across the web.
* PageRank implemented on Hadoop MapReduce to calculate the authority of different hosts.
* A search engine query on MongoDb.
* A server and UI built on top of React for users to access the search engine.

In terms of extra credit, we also leveraged Flink's exactly once semantic checkpointing to build out a fault-tolerant crawler/indexer. When our crawler running locally failed for two hours in the middle of the night due to an internet outage, Flink recovered and continued crawling/indexing. This helped us emulate the continuous crawling and indexing of a modern day search engine.

## Source Files

There are many files included, with code documented inside. At a high level, we broke down our repository into sub-modules for each component, with each containing both main source files and extensive testing for those files:
* Crawler contains all source files for the crawler, broken down into factories, filters, functions, interfaces, mappers, sinks, and sources. The way these plug into the Flink topology can be seen at src/Crawler.java.
* Handy-search contains the main program for running the crawler and indexer.
* indexer contains all source files for the indexer, broken down into constants, mappers, and sinks. How these plug into a Flink topology can be seen in Indexer.java.
* interfaces contains all shared APIs/interfaces. These are broken down into adapters, functional, http (synchronous and asynchronous), interfaces, models, regex, and robots. These also hold some shared MongoDB and S3 API components.
* node-server
* pagerank
* server

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
