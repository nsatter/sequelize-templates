const _ = require('lodash');

class Sqlite {
	/**
   * Generates an SQL query that returns all foreign keys of a table.
   *
   * @param  {String} tableName  The name of the table.
   * @param  {String} schemaName The name of the schema.
   * @return {String}            The generated sql query.
   */
	getForeignKeysQuery(tableName, schemaName) {
		return "PRAGMA foreign_key_list(" + tableName + ");";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual primary key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isPrimaryKey(record) {
		return _.isObject(record) && _.has(record, 'primaryKey') && record.primaryKey === true;
	}
}

module.exports = function() {
	return new Sqlite(...arguments);
};