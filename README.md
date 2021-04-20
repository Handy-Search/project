# project

The final project for CIS555, a distributed search engine comprised of a crawler, 
indexer, PageRank, and UI.

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
