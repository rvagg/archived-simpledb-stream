const through2 = require('through2')

function itemToObject (item) {
  var obj = { key: item.Name, value: {} }
  item.Attributes.forEach(function (a) {
    obj.value[a.Name] = a.Value
  })
  return obj
}

function query (simpledb, expr, stream, nextToken) {
  var opt = { SelectExpression: expr }

  if (nextToken)
    opt.NextToken = nextToken

  simpledb.select(opt, function (err, data) {
    if (err)
      return stream.emit('error', err)
    if (!data)
      return stream.emit('error', new Error('Invalid select() response'))
    if (!data.Items || !data.Items.length)
      return stream.push() // end

    data.Items.forEach(function (item) {
      stream.push(itemToObject(item))
    })

    if (data.NextToken)
      query(simpledb, expr, stream, data.NextToken)
    else
      stream.push()
  })
}

function simpledbStream (simpledb, options) {
  var domain    = typeof options == 'string' ? options : options && options.domain
    , chunkSize = options && typeof options.chunkSize == 'number' ? options.chunkSize : 2500
    , criteria  = options && typeof options.criteria == 'string' ? options.criteria : null
    , stream    = through2({ objectMode: true })
    , expr

  if (typeof domain != 'string')
    throw new TypeError('Must provide a "domain"')

  expr = 'select * from `' + domain + '`'
  if (criteria)
    expr += ' where ' + criteria
  expr += ' limit ' + chunkSize

  process.nextTick(function () {
    query(simpledb, expr, stream, null)
  })

  return stream
}

module.exports = simpledbStream