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
