/**
 * build on the top of es6 fetch API.
 * use isomorphic-fetch as polyfill
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @see https://github.com/matthew-andrews/isomorphic-fetch
 * @see https://github.com/github/fetch
 * @author gwuhaolin
 */
var request = require('./request');
var entity = require('./entity');

exports.request = request;
exports.entity = entity;
