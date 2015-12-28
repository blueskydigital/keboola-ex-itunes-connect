var assert = require("assert")
var command = require("../src/lib/command")

describe("There are properly set default values if input arguments are empty", function() {
  it("data directory is equal '/data' by default", function() {
    assert.equal(command.data, '/data')
  }),

  it("outputFile argument returns 'itunes_sales.csv' by default", function() {
    assert.equal(command.outputFile, 'itunes_sales.csv')
  }),

  it("iTunesType argument returns 'sales' by default", function() {
    assert.equal(command.iTunesType, 'sales')
  }),

  it("reportType argument returns 'summary' by default", function() {
    assert.equal(command.reportType, 'summary')
  })

  it("grain argument returns 'daily' by default", function() {
    assert.equal(command.grain, 'daily')
  })

  it("salesDateFrom contains the same value as salesDateTo by default", function() {
    assert.equal(command.salesDateFrom, command.salesDateTo)
  })
})
