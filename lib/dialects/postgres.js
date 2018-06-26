const _ = require('lodash');

class Postgres {
	constructor(sequelize) {
		this.sequelize = sequelize;
		if (sequelize) {
			this.queryInterface = sequelize.getQueryInterface();
		}
	}
	async getTables() {
		const self = this;
		if (self.sequelize.options.schema) {
			var showTablesSql = self.dialect.showTablesQuery(self.options.schema);
			return _.flatten(await self.sequelize.query(showTablesSql, {
				raw: true,
				type: self.sequelize.QueryTypes.SHOWTABLES
			}));
		} else {
			return await self.queryInterface.showAllTables();
		}
	}
	/**
   * Generates an SQL query that returns all foreign keys of a table.
   *
   * @param  {String} tableName  The name of the table.
   * @param  {String} schemaName The name of the schema.
   * @return {String}            The generated sql query.
   */
	getForeignKeysQuery(tableName, schemaName) {
		return `SELECT
      o.conname AS constraint_name,
      (SELECT nspname FROM pg_namespace WHERE oid=m.relnamespace) AS source_schema,
      m.relname AS source_table,
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = m.oid AND a.attnum = o.conkey[1] AND a.attisdropped = false) AS source_column,
      (SELECT nspname FROM pg_namespace WHERE oid=f.relnamespace) AS target_schema,
      f.relname AS target_table,
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = f.oid AND a.attnum = o.confkey[1] AND a.attisdropped = false) AS target_column,
      o.contype,
		(SELECT d.adsrc AS extra FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid,  d.adnum)
			 WHERE NOT a.attisdropped AND a.attnum > 0 AND a.attrelid = o.conrelid AND a.attnum = o.conkey[1] LIMIT 1)
    FROM pg_constraint o
    LEFT JOIN pg_class c ON c.oid = o.conrelid
    LEFT JOIN pg_class f ON f.oid = o.confrelid
    LEFT JOIN pg_class m ON m.oid = o.conrelid
    WHERE o.conrelid = (SELECT oid FROM pg_class WHERE relname = '` + tableName + "' LIMIT 1)";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual foreign key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isForeignKey(record) {
		return _.isObject(record) && _.has(record, 'contype') && record.contype === "f";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is a unique key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isUnique(record) {
		return _.isObject(record) && _.has(record, 'contype') && record.contype === "u";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual primary key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isPrimaryKey(record) {
		return _.isObject(record) && _.has(record, 'contype') && record.contype === "p";
	}
	/**
   * Determines if record entry from the getForeignKeysQuery
   * results is an actual serial/auto increment key
   *
   * @param {Object} record The row entry from getForeignKeysQuery
   * @return {Bool}
   */
	isSerialKey(record) {
		return _.isObject(record) && this.isPrimaryKey(record) && (_.has(record, 'extra') &&
          _.startsWith(record.extra, 'nextval')
        && _.includes(record.extra, '_seq')
        && _.includes(record.extra, '::regclass'));
	}
	/**
   * Overwrites Sequelize's native method for showing all tables.
   * This allows custom schema support
   * @param {String} schema The schema to list all tables from
   * @return {String}
   */
	showTablesQuery(schema) {
		return "SELECT table_name FROM information_schema.tables WHERE table_schema = '" + schema + "' AND table_type LIKE '%TABLE' AND table_name != 'spatial_ref_sys';";
	}
}

module.exports = function() {
	return new Postgres(...arguments);
};