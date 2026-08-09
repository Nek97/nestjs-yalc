# NestJS-yalc library

This is the layer of the nestjs-yalc libraries which are distributed open-source under the AGPL3 license.

Nest-yalc stands for **NestJS - Yet Another Library Collection**.

## NPM package.json and Workspaces

To handle scripts and dependencies between all the libraries of this collection, we use a root `package.json`.
At the moment, it handles both the `devDependencies` needed to run the tests and the build process, as well as the dependencies of the libraries themselves.

The [npm workspace](https://docs.npmjs.com/cli/v7/using-npm/workspaces) approach must be preferred. It allows us to specify the dependencies and some scripts directly inside the package itself but still having the possibility of managing them from the root `package.json` (see the `aws-helpers` library for example).

## Unit tests

The main `package.json` contains scripts to run unit tests for all the libraries of this collection.
It uses the Jest `projects` feature in the background, configured by `jest.config.ts`, using a customized mechanism implemented in our `@nestjs-yalc/jest` library.

To run the tests with coverage, use `npm run test:cov` and then you can check the status of the tests by running `npm run test:cov:serve`.
Then you should be able to browse the coverage reports via: [http://127.0.0.1:8080/lcov-report/](http://127.0.0.1:8080/lcov-report/)

## Pipeline

Currently, our GitHub pipeline checks that the linter and the tests are passing with a 100% coverage threshold.
