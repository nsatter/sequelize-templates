const _ = require('lodash');

class Mssql {
	constructor(sequelize) {
		this.sequelize = sequelize;
		if (sequelize) {
			this.queryInterface = sequelize.getQueryInterface();
		}
	}
	async getTables() {
		const tables = await this.queryInterface.showAllTables();
		return _.map(tables, 'tableName');
	}
	/**
   * Generates an SQL query that returns all foreign keys of a table.
   *
   * @param  {String} tableName  The name of the table.
   * @param  {String} schemaName The name of the schema.
   * @return {String}            The generated sql query.
   */
	getForeignKeysQuery (tableName, schemaName) {
		return `SELECT
      ccu.table_name AS source_table,
      ccu.constraint_name AS constraint_name,
      ccu.column_name AS source_column,
      kcu.table_name AS target_table,
      kcu.column_name AS target_column,
      tc.constraint_type AS constraint_type,
      c.is_identity AS is_identity
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
      ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
    LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      ON kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
    INNER JOIN sys.COLUMNS c
      ON c.name = ccu.column_name
      AND c.object_id = OBJECT_ID(ccu.table_name)
    WHERE ccu.table_name = '` + tableName + "'";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual foreign key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isForeignKey (record) {
		return _.isObject(record) && _.has(record, 'constraint_type') && record.constraint_type === "FOREIGN KEY";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual primary key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isPrimaryKey (record) {
		return _.isObject(record) && _.has(record, 'constraint_type') && record.constraint_type === "PRIMARY KEY";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual serial/auto increment key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isSerialKey (record) {
		return _.isObject(record) && exports.mssql.isPrimaryKey(record) && (_.has(record, 'is_identity') &&
      record.is_identity);
	}
}

module.exports = function() {
	return new Mssql(...arguments);
};