// var chai = require('chai');
// var expect = chai.expect;
var helpers = require('./helpers');
// var dialect = helpers.getTestDialect();

// var dialects = require('../lib/dialects');
// var _ = helpers.Sequelize.Utils._;

describe(helpers.getTestDialectTeaser('sequelize-auto dialects'), function() {
	describe('getForeignKeysQuery', function () {
		it('mysql', function (done) {
			var query = require('../lib/dialects/mysql')().getForeignKeysQuery('mytable', 'mydatabase');
			expect(query).toMatchSnapshot();
			done();
		});

		it('sqlite', function (done) {
			var query = require('../lib/dialects/sqlite')().getForeignKeysQuery('mytable', 'mydatabase');
			expect(query).toMatchSnapshot();
			done();
		});

		it('postgres', function (done) {
			var query = require('../lib/dialects/postgres')().getForeignKeysQuery('mytable', 'mydatabase');
			expect(query).toMatchSnapshot();
			done();
		});

		it('mssql', function (done) {
			var query = require('../lib/dialects/mssql')().getForeignKeysQuery('mytable', 'mydatabase');
			expect(query).toMatchSnapshot();
			done();
		});
	});

	describe('isForeignKey', function () {
		it('mysql', function (done) {
			const mysql = require('../lib/dialects/mysql')();
			expect(mysql.isForeignKey(null)).toBeFalsy();
			expect(mysql.isForeignKey({some: 'value'})).toBeFalsy();
			expect(mysql.isForeignKey({extra: 'auto_increment'})).toBeFalsy();
			expect(mysql.isForeignKey({extra: 'foreign_key'})).toBeTruthy();
			done();
		});

		it('postgres', function (done) {
			const postgres = require('../lib/dialects/postgres')();
			expect(postgres.isForeignKey(null)).toBeFalsy();
			expect(postgres.isForeignKey({some: 'value'})).toBeFalsy();
			expect(postgres.isForeignKey({contype: 't'})).toBeFalsy();
			expect(postgres.isForeignKey({contype: 'f'})).toBeTruthy();
			done();
		});
	});

	describe('isPrimaryKey', function () {
		it('mysql', function (done) {
			const mysql = require('../lib/dialects/mysql')();
			expect(mysql.isPrimaryKey(null)).toBeFalsy();
			expect(mysql.isPrimaryKey({some: 'value'})).toBeFalsy();
			expect(mysql.isPrimaryKey({constraint_name: 'index'})).toBeFalsy();
			expect(mysql.isPrimaryKey({constraint_name: 'PRIMARY'})).toBeTruthy();
			done();
		});

		it('sqlite', function (done) {
			const sqlite = require('../lib/dialects/sqlite')();
			expect(sqlite.isPrimaryKey(null)).toBeFalsy();
			expect(sqlite.isPrimaryKey({some: 'value'})).toBeFalsy();
			expect(sqlite.isPrimaryKey({primaryKey: false})).toBeFalsy();
			expect(sqlite.isPrimaryKey({primaryKey: true})).toBeTruthy();
			done();
		});

		it('postgres', function (done) {
			const postgres = require('../lib/dialects/postgres')();
			expect(postgres.isPrimaryKey(null)).toBeFalsy();
			expect(postgres.isPrimaryKey({some: 'value'})).toBeFalsy();
			expect(postgres.isPrimaryKey({contype: 'f'})).toBeFalsy();
			expect(postgres.isPrimaryKey({contype: 'p'})).toBeTruthy();
			done();
		});
	});

	describe('isSerialKey', function () {
		it('mysql', function (done) {
			const mysql = require('../lib/dialects/mysql')();
			expect(mysql.isSerialKey(null)).toBeFalsy();
			expect(mysql.isSerialKey({some: 'value'})).toBeFalsy();
			expect(mysql.isSerialKey({extra: 'primary'})).toBeFalsy();
			expect(mysql.isSerialKey({extra: 'auto_increment'})).toBeTruthy();
			done();
		});

		it('postgres', function (done) {
			const postgres = require('../lib/dialects/postgres')();
			expect(postgres.isSerialKey(null)).toBeFalsy();
			expect(postgres.isSerialKey({some: 'value'})).toBeFalsy();
			expect(postgres.isSerialKey({extra: 'primary'})).toBeFalsy();
			expect(postgres.isSerialKey({contype: 'i'})).toBeFalsy();
			expect(postgres.isSerialKey({contype: 'p'})).toBeFalsy();
			expect(postgres.isSerialKey({contype: 'p', extra: null})).toBeFalsy();
			expect(postgres.isSerialKey({contype: 'p', extra: 'primary'})).toBeFalsy();
			expect(postgres.isSerialKey({contype: 'p', extra: 'nextval(table_seq::regclass)'})).toBeTruthy();
			done();
		});
	});
});
