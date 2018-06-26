const _ = require('lodash');

const lookup = {
	bit: 'BOOLEAN',
	smallint: integerConverter,
	mediumint: integerConverter,
	tinyint: integerConverter,
	int: integerConverter,
	varchar: lengthConverter,
	varying: 'STRING',
	character: 'STRING',
	nvarchar: 'STRING',
	char: lengthConverter,
	ntext: 'TEXT',
	datetime: 'DATE',
	date: 'DATEONLY',
	timestamp: 'DATE',
	float: floatConverter,
	numeric: 'DOUBLE',
	uuid: 'UUIDV4',
	uniqueidentifier: 'UUIDV4',
	bytea: 'BLOB',
	time: 'TIME' //to handle 'TIME WITHOUT TIME ZONE'
};

function floatConverter(type) {
	if (type === 'float8') {
		return 'DOUBLE';
	}
	return 'FLOAT';
}

function lengthConverter(type) {
	const length = type.match(/\(\d+\)/);
	return type.toUpperCase() + (!_.isNull(length) ? length : '');
}

function integerConverter(type) {
	const length = type.match(/\(\d+\)/);
	let val = 'INTEGER' + (!_.isNull(length) ? length : '');

	const unsigned = type.match(/unsigned/i);
	if (unsigned) { val += '.UNSIGNED'; }

	const zero = type.match(/zerofill/i);
	if (zero) { val += '.ZEROFILL'; }

	return val;
}

module.exports = function (type) {
	type = type.toLowerCase();
	const firstWord = type.match(/\w+/);

	let val = lookup[firstWord] || type.toUpperCase();

	if (_.isFunction(val)) {
		val = val(type);
	}

	return val;
};
