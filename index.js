var fetch = require('isomorphic-fetch');

exports.globalOptions = {};

/**
 * Request
 * @param {object} options
 * @param {string} options.url
 * @returns {Request}
 * @constructor
 */
function Request(options) {
    var self = this;
    /**
     * request options
     * @type {object}
     */
    self._options = Object.assign({headers: {}, body: null}, options, exports.globalOptions);
    /**
     * append query param to url
     * @param {object} obj
     * @returns {Request}
     */
    self.query = function (obj) {
        var arr = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(key + '=' + obj[key])
            }
        }
        self._options.url += '?' + encodeURIComponent(arr.join('&'));
        return self;
    };
    /**
     * set request body as json type
     * @param {object} obj
     * @returns {Request}
     */
    self.body = function (obj) {
        self._options.body = JSON.stringify(obj);
        self._options.headers['Content-Type'] = 'application/json';
        return self;
    };

    self.error = null;
    self.response = null;
    self.data = null;
    self.hasSend = false;
    /**
     * send request
     * @returns {Promise} resolve(data), reject(response)
     */
    this._send = function () {
        return new Promise(function (resolve, reject) {
            if (self.hasSend) {
                if (self.error) {
                    reject();
                } else {
                    resolve(self.data);
                }
            } else {
                self.hasSend = true;
                fetch(self._options.url, self._options).then(function (response) {
                    self.response = response;
                    if (self.response.ok) {
                        return response.json();
                    } else {
                        self.error = response.statusText;
                        reject();
                    }
                }).then(function (json) {
                    self.data = json;
                    resolve(json);
                }).catch(function (err) {
                    self.error = err;
                    reject();
                })
            }
        });
    };

    /**
     * send request follow _links's href
     * @param {string[]} keys
     * @returns {Promise} with json
     */
    this.follow = function (keys) {
        return new Promise(function (resolve, reject) {
            function doFollow(data) {
                var key = keys.shift();
                if (key) {
                    var links = data['_links'];
                    var url = links[key];
                    if (url) {
                        url = url['href'];
                        exports.get(url).data().then(function (data) {
                            doFollow(data);
                        }).catch(function () {
                            reject(self);
                        })
                    } else {
                        self.error = 'no key=' + key + ' \nin links=' + JSON.stringify(links, null, 4);
                        reject(self);
                    }
                } else {
                    resolve(data);
                }
            }

            self.data().then(function (data) {
                doFollow(data);
            }).catch(function () {
                reject(self);
            })

        })
    };

    /**
     * get response's data's embedded
     * @returns {Promise} with json
     */
    this.embedded = function () {
        return new Promise(function (resolve, reject) {
            self._send().then(function (json) {
                resolve(json['_embedded']);
            }).catch(function () {
                reject(self);
            });
        })
    };

    /**
     * get response's data
     * @returns {Promise} with json
     */
    this.data = function () {
        return new Promise(function (resolve, reject) {
            self._send().then(function (json) {
                resolve(json);
            }).catch(function () {
                reject(self);
            })
        });
    };

    return self;
}

/**
 * make http get request
 * @param {string} url
 * @returns {Request}
 */
exports.get = function (url) {
    return new Request({url: url, method: 'GET'});
};

/**
 * make http post request
 * @param {string} url
 * @returns {Request}
 */
exports.post = function (url) {
    return new Request({url: url, method: 'POST'});
};

/**
 * make http patch request
 * @param {string} url
 * @returns {Request}
 */
exports.patch = function (url) {
    return new Request({url: url, method: 'PATCH'});
};

/**
 * make http put request
 * @param {string} url
 * @returns {Request}
 */
exports.put = function (url) {
    return new Request({url: url, method: 'PUT'});
};

/**
 * mock a request with data
 * @param {object} data
 * @returns {Request}
 */
exports.mock = function (data) {
    var url = data['_links']['self']['href'];
    var req = new Request({url: url, method: 'GET'});
    req.data = data;
    req.hasSend = true;
    return req;
};