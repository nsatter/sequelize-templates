# Sequelize-Generator

This project was originally forked from sequelize-auto, but uses a template engine to generate the models.

Generating the tempaltes will generate the template(s) for each table found in the given schema.

Uses [jsRender](http://www.jsviews.com/#jsrapi) for the template engine.

## Prerequisites

You will need to install the correct dialect binding globally before using sequelize-generator.

Example for MySQL/MariaDB

`npm install -g mysql`

Example for Postgres

`npm install -g pg pg-hstore`

Example for Sqlite3

`npm install -g sqlite`

Example for MSSQL

`npm install -g mssql`

*See [Sequelize](http://docs.sequelizejs.com/) for more information*

## Usage

Sequelize-Generator can be used as a command line utility or can be imported as a node module

### Command Line Example

`sequelize-generator g generator.json --host localhost`

Call `sequelize-generator` with no parameters for the full list of settings

*All settings can be configured in the config file, but the command line takes priority.*

## Testing

You must setup a database called `sequelize_generator_test` first, edit the `test/config.js` file accordingly, and then enter in any of the following:

    # for all
    npm run test

    # mysql only
    npm run test-mysql

    # postgres only
    npm run test-postgres

    # postgres native only
    npm run test-postgres-native

    # sqlite only
    npm run test-sqlite

