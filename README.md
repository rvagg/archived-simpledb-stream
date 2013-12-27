# simpledb-stream

**Stream the contents of a SimpleDB domain**

Requires a configured instance of an [aws-sdk](https://github.com/aws/aws-sdk-js) `SimpleDB` and you get back a Node Streams2 object (based on [through2](https://github.com/rvagg/through2)).

## Example

```js
var simpledbStream = require('simpledb-stream')
var AWS  = require('aws-sdk')

AWS.config.update({
    "accessKeyId"     : "access key"
  , "secretAccessKey" : "secret key"
  , "region"          : "ap-southeast-2"
})

var simpledb = new AWS.SimpleDB()

simpledbStream(simpledb, 'MyDataDomain')
  .on('data', function (data) {
    console.log(data)
  })
```

You'll end up with data something like this for *each item* in your domain:

```js
{
  "key": "1ab07b19-6ebb-11e3-b3e2-c321aed38186",
  "value": {
    "Date": "2013-12-27T05:52:43.696Z",
    "RandomNumber": "0.8521310975775123"
  }
}
```

So `'Name'` is converted to `'key'` and `'Attributes'` are squashed into a standard JavaScript object with keys and values representing the `'Name'` and `'Value'` pairs. Use [through2-map](https://github.com/brycebaril/through2-map) to adjust the items if you need the output to be a different shape.

## Options

### `chunkSize`

```js
simpledbStream(simpledb, { domain: 'MyDataDomain', chunkSize: 100 })
```

By default **simpledb-stream** will try for the maximum chunk size it can get from SimpleDB. This can mean larger buffering and longer pauses. If you are close to a SimpleDB end-point then you can shorten the chunk size to stream more efficiently.

### `criteria`

```js
simpledbStream(simpledb, { domain: 'MyDataDomain', criteria: "Date != '0' and Date > '2013-12-27T05:59:11.510Z'"})
```

Use a `'criteria'` to limit your result set. The criteria will be appended to a `'where ...'`.

## Tests

To execute the tests you need a **test-aws-config.json** file with your AWS credentials. The test suite will create a SimpleDB domain, test the streaming, then delete the test domain.

The test-aws-config.json file should look something like this:

```json
{
    "accessKeyId"     : "access key"
  , "secretAccessKey" : "secret key"
  , "region"          : "ap-southeast-2"
}
```

Alternatively this data can be placed, stringified, in a `AWS_CONFIG` environment variable prior to test execution.

## License

**simpledb-stream** is Copyright (c) 2013 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
