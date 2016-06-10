/**
 * build on the top of es6 fetch API.
 * use isomorphic-fetch as polyfill
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @see https://github.com/matthew-andrews/isomorphic-fetch
 * @see https://github.com/github/fetch
 * @author gwuhaolin
 */
'use strict';
var fetch = require('isomorphic-fetch');

exports.config = {
    /**
     * options used to every fetch request
     */
    globalOptions: {},
    /**
     * API base url
     */
    basePath: '',
    /**
     * springRest data rest base url
     * @type {string}
     */
    restBasePath: ''
};

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
     * store request options
     * @type {object}
     */
    self.options = Object.assign({headers: {}, body: null}, options, exports.config.globalOptions);
    /**
     * has this request been send
     * @type {boolean}
     */
    self.hasSend = false;
    /**
     * The Response interface of the Fetch API represents the response to a request.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
     * @type {object|null}
     */
    self.response = null;
    /**
     * if error happen during request error will store in there,else this will be null
     * @type {object|null}
     */
    self.error = null;
    /**
     * after request finish without error,response json data will store in there,else will be {}
     * @type {object}
     */
    self.responseData = {};


    /**
     * append query param to url
     * @param {object|null} obj
     * @returns {Request}
     */
    self.query = function (obj) {
        if (obj) {
            var arr = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    arr.push(key + '=' + obj[key])
                }
            }
            self.options.url += '?' + arr.join('&');
        }
        return self;
    };
    /**
     * set request body as json type
     * @param {object} obj
     * @returns {Request}
     */
    self.body = function (obj) {
        self.options.body = JSON.stringify(obj);
        self.options.headers['Content-Type'] = 'application/json';
        return self;
    };


    /**
     * send request
     * @returns {Promise} resolve(data), reject()
     */
    this._send = function () {
        return new Promise(function (resolve, reject) {
            if (self.hasSend) {
                if (self.error) {
                    reject();
                } else {
                    resolve(self.responseData);
                }
            } else {
                self.hasSend = true;
                fetch(self.options.url, self.options).then(function (response) {
                    self.response = response;
                    if (self.response.ok) {
                        return response.json();
                    } else {
                        self.error = response.statusText;
                        reject();
                    }
                }).then(function (json) {
                    self.responseData = json;
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
     * @param {string[]} keys links href in order
     * @returns {Promise} resolve(json), reject(Request)
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
                        }).catch(function (self) {
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
            }).catch(function (self) {
                reject(self);
            })

        })
    };

    /**
     * get response's data
     * @returns {Promise} resolve(json), reject(Request)
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

function buildHttpMethodFunction(method) {
    return function (path) {
        var url = path;
        if (/https?:\/\/.+/.test(path) === false) {
            url = exports.config.basePath + path;
        }
        return new Request({url: url, method: method});
    };
}

/**
 * make http get request
 * @param {string} url
 * @returns {Request}
 */
exports.get = buildHttpMethodFunction('GET');

/**
 * make http post request
 * @param {string} url
 * @returns {Request}
 */
exports.post = buildHttpMethodFunction('POST');

/**
 * make http patch request
 * @param {string} url
 * @returns {Request}
 */
exports.patch = buildHttpMethodFunction('PATCH');

/**
 * make http put request
 * @param {string} url
 * @returns {Request}
 */
exports.put = buildHttpMethodFunction('PUT');

/**
 * make http delete request
 * @param {string} url
 * @returns {Request}
 */
exports.delete = buildHttpMethodFunction('DELETE');

/**
 * mock a request with data
 * @param {object} data
 * @returns {Request}
 */
exports.mock = function (data) {
    var url = data['_links']['self']['href'];
    var req = new Request({url: url, method: 'GET'});
    req.responseData = data;
    req.hasSend = true;
    return req;
};


exports.extend = function (entityName) {
    var baseURL = exports.config.restBasePath + '/' + entityName;
    baseURL = baseURL.replace(/\/+/, '/');

    function Entity() {
        var self = this;
        /**
         * springRest data entity id.
         * if id is set means this is a exists entity and can use methods:[save,exists,delete]
         * if id is null,means this is a new entity which will course save() method create a new object
         * @type {string|number|null}
         */
        self.id = null;
        /**
         * store one entity's data
         * @type {object}
         */
        self.data = null;

        /**
         * create or update entity
         * if id properties is set,then will send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
         * if id is null,then will send HTTP POST request to create an entity
         * @returns {Promise} resolve(json), reject(Request)
         */
        self.save = function () {
            if (self.id) {//update
                var change = self.data;//TODO get change
                return exports.patch(baseURL + '/' + self.id).body(change).data();
            } else {//create
                return exports.post(baseURL).body(self.data).data();
                //TODO set id prop
            }
        };

        /**
         * delete this entity
         * @returns {Promise} resolve(json), reject(Request)
         */
        self.delete = function () {
            return Entity.delete(self.id);
        };

        /**
         * fetch entity data to keep updated to newest
         * @returns {Promise} resolve(json), reject(Request)
         */
        self.fetch = function () {
            return new Promise(function (resole, reject) {
                if (self.id) {
                    Entity.findOne(self.id).then(function (json) {
                        self.data = json;
                        resole(json);
                    }).catch(function (err) {
                        reject(err);
                    })
                } else {
                    console.error('require id');
                }
            });
        };

        /**
         * send request follow this entity's _links's href
         * @param {string[]} keys links href in order
         * @returns {Promise} resolve(json), reject(Request)
         */
        self.follow = function (keys) {
            return new Promise(function (resole, reject) {
                function doFollow() {
                    exports.mock(self.data).follow(keys).then(function (data) {
                        resole(data);
                    }).catch(function (err) {
                        reject(err);
                    })
                }

                if (self.data) {
                    doFollow();
                } else {
                    if (self.id) {
                        self.fetch().then(function () {
                            doFollow();
                        })
                    } else {
                        console.error('require id');
                    }
                }
            });
        };

        return self;
    }

    /**
     * get entity json data by id
     * @returns {Promise} resolve(json), reject(Request)
     */
    Entity.findOne = function (id) {
        return exports.get(baseURL + '/' + id).data();
    };

    /**
     * find entity list with page and sort
     * @param {object} opts
     * @param {number} opts.page the page number to access (0 indexed, defaults to 0).
     * @param {number} opts.size the page size requested (defaults to 20).
     * @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
     * etc:name,age,desc
     * @returns {Promise} resolve(), reject(Request)
     */
    Entity.findAll = function (opts) {
        return exports.get(baseURL).query(opts).data();
    };

    /**
     * delete entity by id
     * @returns {Promise} resolve(json), reject(Request)
     */
    Entity.delete = function (id) {
        return exports.delete(baseURL + '/' + id).data();
    };

    return Entity;
};