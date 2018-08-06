const Sequelize = require('sequelize');
const _ = require('lodash');
const fs = require('fs');
const util = require('util');
const path = require('path');
const mkdirp = util.promisify(require('mkdirp'));
const pluralize = require('pluralize');

fs.writeFileAsync = util.promisify(fs.writeFile);
fs.readFileAsync = util.promisify(fs.readFile);
fs.accessAsync = util.promisify(fs.access);

function SequelizeTemplates(options) {
	if (options && options.dialect === 'sqlite' && !options.storage) {
		options.storage = options.database;
	}
	options.logging = false;
	options.operatorsAliases = false;

	if (options.database instanceof Sequelize) {
		this.sequelize = options.database;
	} else {
		this.sequelize = new Sequelize(options.database, options.user, options.password, options);
	}

	this.queryInterface = this.sequelize.getQueryInterface();
	this.data = {};
	try {
		const dialect = require('./dialects/' + options.dialect);
		this.dialect = dialect(this.sequelize);
	} catch (error) {
		console.error('Dialect "' + options.dialect + '" is not supported', error);
		process.exit(1);
	}

	this.options = options;
}

SequelizeTemplates.prototype.getData = async function () {
	var self = this;

	async function mapTable(table) {
		self.data[table] = {
			table,
			columns: await self.queryInterface.describeTable(table, self.options.schema),
			foreignKeys: {},
			references: []
		};
	}

	if (_.isFunction(this.dialect.getTables)) {
		await processTables(await this.dialect.getTables());
	} else {
		await processTables(await this.queryInterface.showAllTables());
	}

	async function processTables(tables) {

		if (self.options.tables) {
			tables = _.intersection(tables, self.options.tables);
		} else if (self.options.skipTables) {
			tables = _.difference(tables, self.options.skipTables);
		}

		await Promise.all(tables.map(async (table) => {
			await mapTable(table);
			await mapForeignKeys(table);
		}));
	}

	async function mapForeignKeys(table, fn) {
		if (!self.dialect) { return; }

		const sql = self.dialect.getForeignKeysQuery(table, self.sequelize.config.database);

		const result = await self.sequelize.query(sql, {
			type: self.sequelize.QueryTypes.SELECT,
			raw: true
		});
		_.each(result, assignColumnDetails);

		function assignColumnDetails(ref) {
			// map sqlite's PRAGMA results
			ref = _.mapKeys(ref, function (value, key) {
				switch (key) {
					case 'from':
						return 'source_column';
					case 'to':
						return 'target_column';
					case 'table':
						return 'target_table';
					default:
						return key;
				}
			});

			ref = _.assign({
				source_table: table,
				source_schema: self.sequelize.options.database,
				target_schema: self.sequelize.options.database
			}, ref);

			if (!_.isEmpty(_.trim(ref.source_column)) && !_.isEmpty(_.trim(ref.target_column))) {
				ref.isForeignKey = true;
				ref.foreignSources = _.pick(ref, ['source_table', 'source_schema', 'target_schema', 'target_table', 'source_column', 'target_column']);
			}

			if (_.isFunction(self.dialect.isUnique) && self.dialect.isUnique(ref)) { ref.isUnique = true; }

			if (_.isFunction(self.dialect.isPrimaryKey) && self.dialect.isPrimaryKey(ref)) { ref.isPrimaryKey = true; }

			if (_.isFunction(self.dialect.isSerialKey) && self.dialect.isSerialKey(ref)) { ref.isSerialKey = true; }

			if (ref.isSerialKey) {
				self.data[table].columns[ref.source_column].serialKey = true;
			}

			self.data[table].foreignKeys[ref.source_column] = _.assign({}, self.data[table].foreignKeys[ref.source_column], ref);
			if (ref.target_table) {
				self.data[ref.target_table].references.push(ref);
			}
		}
	}
	this.sequelize.close();
};

SequelizeTemplates.prototype.buildTemplates = async function () {
	const self = this;
	const jsrender = require('jsrender');
	jsrender.views.converters({
		kebab: _.kebabCase,
		camel: _.camelCase,
		snake: _.snakeCase,
		start: _.startCase,
		lower: _.lowerCase,
		singular: pluralize.singular,
		plural: pluralize.plural,
		dataType: require('./data-type-converter')
	});
	jsrender.views.helpers({
		pluralize,
		_
	});

	self.templates = [];

	await Promise.all(self.options.templates.map(async (template) => {
		try {
			const templateContent = await fs.readFileAsync(path.resolve(process.cwd(), template.file), 'utf8');
			const templateRenderer = jsrender.templates(templateContent);
			const fileNameRenderer = jsrender.templates(template.destination);

			await Promise.all(_.keys(self.data).map(async (table) => {
				try {
					const data = self.data[table];
					const fileName = path.resolve(process.cwd(), fileNameRenderer(data));
					let content;
					if (self.options.force || template.overwrite || !(await fileExists(fileName))) {
						content = templateRenderer(data);
					}
					self.templates.push({
						fileName,
						content
					});
				} catch (error) {
					console.error("Could not generate template for '" + template.file + "' for '" + table + "'", error);
					process.exit(1);
				}
			}));
		} catch (error) {
			console.error("Could not generate template for '" + template.file + "'", error);
			process.exit(1);
		}
	}));
};

SequelizeTemplates.prototype.writeTemplates = async function () {
	await Promise.all(this.templates.map(async (t) => {
		if (t.content) {
			console.log('writing: ' + t.fileName);
			await mkdirp(path.dirname(t.fileName));
			await fs.writeFileAsync(t.fileName, t.content);
		} else {
			console.log('skipping: ' + t.fileName);
		}
	}));
};

SequelizeTemplates.prototype.run = async function () {
	await this.getData();
	await this.buildTemplates();
	await this.writeTemplates();
};

module.exports = SequelizeTemplates;

async function fileExists(file) {
	try {
		await fs.accessAsync(file);
		return true;
	} catch (error) {
		return false;
	}
}