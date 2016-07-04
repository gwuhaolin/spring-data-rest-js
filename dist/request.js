/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

"use strict";
"use strict";
function buildHttpMethodFunction(method) {
    /**
     * make http request user fetch API.
     * if path param is a complete url then fetch ues path as url,
     * else path is not a complete url string but just a path then fetch url=requestConfig.baseURL+path
     * url string will been auto revised, etc: http://localhost/api//user///id/ will convert to http://localhost/api/user/id
     * @param path url path
     */
    function httpRequest(path) {
        var url = path;
        if (!/^https?:\/\/.+$/g.test(path)) {
            url = exports.requestConfig.baseURL + '/' + path;
        }
        url = url.replace(/\/{2,}/g, '/').replace(/:\//g, '://');
        return new Request({ url: url, method: method });
    }
    return httpRequest;
}
/**
 * Object.assign like function to assign fetch options
 * @param args
 * @returns {SpringRequestInit}
 */
function assignFetchOption() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var orgOption = args[0];
    if (args.length > 1) {
        for (var i = 1; i < args.length; i++) {
            var options = args[i];
            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    if (key == 'headers') {
                        for (var key_1 in options.headers) {
                            if (options.headers.hasOwnProperty(key_1)) {
                                orgOption.headers[key_1] = options.headers[key_1];
                            }
                        }
                    }
                    else {
                        orgOption[key] = options[key];
                    }
                }
            }
        }
    }
    return orgOption;
}
var Request = (function () {
    /**
     * @param fetchOptions
     */
    function Request(fetchOptions) {
        /**
         * store fetch options
         */
        this.options = {
            headers: {}
        };
        /**
         * has this request been send
         */
        this.hasSend = false;
        /**
         * The Response interface of the Fetch API represents the response to a request.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
         */
        this.response = null;
        /**
         * if error happen during request error will store in there,else this will be null
         */
        this.error = null;
        assignFetchOption(this.options, exports.requestConfig.globalFetchOptions, fetchOptions);
    }
    /**
     * reset query param in request url by append ? and query param to end of url
     * @param obj
     */
    Request.prototype.queryParam = function (obj) {
        if (obj != null) {
            var arr = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    arr.push(key + "=" + obj[key]);
                }
            }
            this.options.url = this.options.url.split('?')[0] + '?' + arr.join('&');
        }
        return this;
    };
    /**
     * set request body use json
     * HTTP Header Content-Type will set as application/json
     * @param obj
     */
    Request.prototype.jsonBody = function (obj) {
        this.options.body = JSON.stringify(obj);
        this.options.headers['Content-Type'] = 'application/json';
        return this;
    };
    /**
     * set request body as form type
     * parse obj to form string
     * HTTP Header Content-Type will set as application/x-www-form-urlencoded
     * @param obj
     */
    Request.prototype.formBody = function (obj) {
        var arr = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(key + "=" + obj[key]);
            }
        }
        this.options.body = arr.join('&');
        this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        return this;
    };
    /**
     * send fetch request
     * get response's data
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    Request.prototype.send = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.hasSend) {
                if (_this.error == null) {
                    resolve(_this.responseData);
                }
                else {
                    reject(_this.error);
                }
            }
            else {
                _this.hasSend = true;
                var fetchStartHook = exports.requestConfig.fetchStartHook, fetchEndHook_1 = exports.requestConfig.fetchEndHook;
                fetchStartHook && fetchStartHook(_this);
                fetch(_this.options.url, _this.options).then(function (response) {
                    _this.response = response;
                    var contentType = response.headers.get('content-type');
                    if (contentType == null) {
                        return Promise.resolve();
                    }
                    else {
                        if (/.*json.*/.test(contentType)) {
                            //noinspection JSUnresolvedFunction
                            return response.json();
                        }
                        else {
                            return response.text();
                        }
                    }
                }).then(function (data) {
                    _this.responseData = data;
                    if (_this.response.ok) {
                        return Promise.resolve(data);
                    }
                    else {
                        return Promise.reject(data);
                    }
                }).then(function (data) {
                    fetchEndHook_1 && fetchEndHook_1(_this);
                    resolve(data);
                }).catch(function (err) {
                    _this.error = err;
                    fetchEndHook_1 && fetchEndHook_1(_this);
                    reject(_this);
                });
            }
        });
    };
    /**
     * send request follow _links's href
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    Request.prototype.follow = function (keys) {
        var _this = this;
        var self = this;
        return new Promise(function (resolve, reject) {
            function doFollow(data) {
                var key = keys.shift();
                if (key) {
                    var links = data['_links'];
                    var url = links[key];
                    if (url != null) {
                        url = url['href'];
                        exports.get(url).send().then(function (data) {
                            doFollow(data);
                        }).catch(function (self) {
                            reject(self);
                        });
                    }
                    else {
                        self.error = "no key=" + key + " in links " + JSON.stringify(links, null, 4);
                        reject(this);
                    }
                }
                else {
                    resolve(data);
                }
            }
            _this.send().then(function (data) {
                doFollow(data);
            }).catch(function (self) {
                reject(self);
            });
        });
    };
    return Request;
}());
exports.Request = Request;
exports.requestConfig = {
    globalFetchOptions: {
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    },
    baseURL: '/',
    fetchStartHook: null,
    fetchEndHook: null
};
/**
 * make http get request
 * @param path url path
 */
exports.get = buildHttpMethodFunction('GET');
/**
 * make http post request
 * @param path url path
 */
exports.post = buildHttpMethodFunction('POST');
/**
 * make http patch request
 * @param path url path
 */
exports.patch = buildHttpMethodFunction('PATCH');
/**
 * make http put request
 * @param path url path
 */
exports.put = buildHttpMethodFunction('PUT');
//noinspection ReservedWordAsName
/**
 * make http remove request
 * @param path url path
 */
exports.deleteMethod = buildHttpMethodFunction('DELETE');
/**
 * mockRequest a request with data
 * @param {object} data
 */
function mockRequest(data) {
    var url = data['_links']['self']['href'];
    var req = new Request({ url: url, method: 'GET' });
    req.responseData = data;
    req.hasSend = true;
    return req;
}
exports.mockRequest = mockRequest;
//# sourceMappingURL=request.js.map

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ }
/******/ ]);