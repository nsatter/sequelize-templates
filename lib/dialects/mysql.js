const _ = require('lodash');

class Mysql {
	/**
   * Generates an SQL query that returns all foreign keys of a table.
   *
   * @param  {String} tableName  The name of the table.
   * @param  {String} schemaName The name of the schema.
   * @return {String}            The generated sql query.
   */
	getForeignKeysQuery(tableName, schemaName) {
		return `SELECT
        K.CONSTRAINT_NAME as constraint_name
      , K.CONSTRAINT_SCHEMA as source_schema
      , K.TABLE_SCHEMA as source_table
      , K.COLUMN_NAME as source_column
      , K.REFERENCED_TABLE_SCHEMA AS target_schema
      , K.REFERENCED_TABLE_NAME AS target_table
      , K.REFERENCED_COLUMN_NAME AS target_column
      , C.extra
      , C.COLUMN_KEY AS column_key
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS K
      LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS C
        ON C.TABLE_NAME = K.TABLE_NAME AND C.COLUMN_NAME = K.COLUMN_NAME
      WHERE
        K.TABLE_NAME = '` + tableName + "' AND K.CONSTRAINT_SCHEMA = '" + schemaName + "';";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual foreign key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isForeignKey(record) {
		return _.isObject(record) && _.has(record, 'extra') && record.extra !== "auto_increment";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is a unique key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isUnique(record) {
		return _.isObject(record) && _.has(record, 'column_key') && record.column_key.toUpperCase() === "UNI";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual primary key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isPrimaryKey(record) {
		return _.isObject(record) && _.has(record, 'constraint_name') && record.constraint_name === "PRIMARY";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual serial/auto increment key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isSerialKey(record) {
		return _.isObject(record) && _.has(record, 'extra') && record.extra === "auto_increment";
	}
}

module.exports = function() {
	return new Mysql(...arguments);
};