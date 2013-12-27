const AWS            = require('aws-sdk')
    , test           = require('tape')
    , uuid           = require('node-uuid')
    , crypto         = require('crypto')
    , simpledbStream = require('./')
    , awsConfig      = require('./test-aws-config.js')
    , testDomain     = 'simpledb-stream-test-domain-node_' + process.version.replace(/\.\d+$/,'')

    , testData       = (function () {
        var data  = []
          , items = 100

        while (items--) {
          data.push({
              Name: uuid.v1()
            , Attributes: [
                  { Name: 'Date', Value: new Date(Date.now() - items * 100).toISOString() }
                , { Name: 'Rnd' , Value: String(Math.random()) }
                , { Name: 'Blob', Value: crypto.randomBytes(128).toString('hex') }
              ]
          })
        }

        return data
      }())
    , niceTestData   = testData.map(function (item) {
        var value = item.Attributes.reduce(function (p, c) {
          p[c.Name] = c.Value
          return p
        }, {})
        return { key: item.Name, value: value }
      })

AWS.config.update(awsConfig)

var simpledb = new AWS.SimpleDB()

test('setup (delete domain)', function (t) {
  simpledb.deleteDomain({ DomainName: testDomain }, function (err) {
    t.notOk(err, 'no error from deleteDomain')
    t.end()
  })
})

test('setup (populate domain)', function (t) {
  simpledb.createDomain({ DomainName: testDomain }, function (err) {
    t.notOk(err, 'no error from createDomain')

    var batchSize = 25

    ;(function next (start) {
      if (start >= testData.length) 
        return setTimeout(t.end.bind(t), 500) // wait for consistency?

      simpledb.batchPutAttributes(
          { DomainName: testDomain, Items: testData.slice(start, start + batchSize) }
        , function (err) {
            t.notOk(err, 'no error from batchPutAttributes (' + (start) + ')')
            next(start + batchSize)
          }
      )
    })(0)
  })
})

test('test streaming', function (t) {
  var data = []
  simpledbStream(simpledb, { domain: testDomain, chunkSize: 20 })
    .on('data', function (_data) {
      data.push(_data)
    })
    .on('end', function () {
      t.deepEqual(data, niceTestData, 'got complete, correct data!')
      t.end()
    })
})

test('test streaming with just domain arg', function (t) {
  var data = []
  simpledbStream(simpledb, testDomain)
    .on('data', function (_data) {
      data.push(_data)
    })
    .on('end', function () {
      t.deepEqual(data, niceTestData, 'got complete, correct data!')
      t.end()
    })
})

test('test streaming with criteria', function (t) {
  var data = []
  simpledbStream(simpledb, { domain: testDomain, chunkSize: 20, criteria: 'Date < \'' + niceTestData[50].value.Date + '\'' })
    .on('data', function (_data) {
      data.push(_data)
    })
    .on('end', function () {
      t.equal(data.length, 50, 'got expected data')
      t.deepEqual(data, niceTestData.slice(0, 50), 'got complete, correct data!')
      t.end()
    })
})

test('test streaming with criteria for single chunk', function (t) {
  var data = []
  simpledbStream(simpledb, { domain: testDomain, chunkSize: 20, criteria: 'Date < \'' + niceTestData[5].value.Date + '\'' })
    .on('data', function (_data) {
      data.push(_data)
    })
    .on('end', function () {
      t.equal(data.length, 5, 'got expected data')
      t.deepEqual(data, niceTestData.slice(0, 5), 'got complete, correct data!')
      t.end()
    })
})

test('test streaming with criteria for no results', function (t) {
  var data = []
  simpledbStream(simpledb, { domain: testDomain, chunkSize: 20, criteria: 'Date < \'' + niceTestData[0].value.Date + '\'' })
    .on('data', function (_data) {
      data.push(_data)
    })
    .on('end', function () {
      t.equal(data.length, 0, 'got expected data (none)')
      t.end()
    })
})

test('teardown (delete domain)', function (t) {
  simpledb.deleteDomain({ DomainName: testDomain }, function (err) {
    t.notOk(err, 'no error from deleteDomain')
    t.end()
  })
})