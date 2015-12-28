// A small helper for parsing the command-line arguments.
var moment = require('moment')
var program = require('commander')

program
  .version('1.0.0')
  .option('-d, --data <path> (optional)', 'set data path, defaults to ./data', '/data')
  .parse(process.argv)

module.exports = program
