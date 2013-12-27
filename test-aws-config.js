var config

try {
  config = require('./test-aws-config.json')
} catch (e) {
  try {
    config = JSON.parse(process.env.AWS_CONFIG)
  } catch (e) {}
}

if (typeof config != 'object')
  throw new Error('No aws-config.json or $AWS_CONFIG to work with')

module.exports = config