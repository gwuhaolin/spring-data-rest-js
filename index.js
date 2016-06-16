var fetch = require('node-fetch');
var _spring = require('./spring');
/**
 * @type {{request: request, entity: entity}}
 */
module.exports = _spring(fetch);