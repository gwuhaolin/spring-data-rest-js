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
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);


/***/ },
/* 1 */
/***/ function(module, exports) {

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
	        Object.assign(this.options, exports.requestConfig.globalFetchOptions, fetchOptions);
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
	    globalFetchOptions: {},
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
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var spring = __webpack_require__(3);
	window['spring'] = spring;
	//# sourceMappingURL=browser.js.map

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(1));
	__export(__webpack_require__(4));
	//# sourceMappingURL=spring.js.map

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var request = __webpack_require__(1);
	exports.entityConfig = {
	    restBaseURL: '/'
	};
	/**
	 * any is an instanceof Entity
	 * @param any
	 * @returns {boolean}
	 */
	function isEntity(any) {
	    if (any instanceof Object) {
	        var prototype = any.constructor.prototype;
	        return prototype.href && prototype.href.constructor === Function;
	    }
	    return false;
	}
	exports.isEntity = isEntity;
	var Entity = (function () {
	    function Entity() {
	    }
	    return Entity;
	}());
	exports.Entity = Entity;
	/**
	 * build an Entity Entity
	 * @param entity_name spring data rest entity path
	 */
	function extend(entity_name) {
	    var Class = (function () {
	        function Class(initData) {
	            /**
	             * springRest data entity id.
	             * if id is set means this is a exists entity and can use methods:[save,exists,remove]
	             * if id is null,means this is a new entity which will course save() method create a new object
	             */
	            this.id = null;
	            /**
	             * store one entity's data
	             */
	            this._data = {};
	            /**
	             * track modify field
	             */
	            this.modifyFields = [];
	            this.patchData(initData);
	        }
	        /**
	         * get this entity's spring data rest resource uri.
	         * if this entity's has data and data has _link properties,use _data['_links']['self']['href']
	         * else use config.restBaseURL + entityName + '/' + self.id
	         */
	        Class.prototype.href = function () {
	            var links;
	            if (this._data != null) {
	                links = this._data['_links'];
	            }
	            if (links != null) {
	                return links['self']['href'];
	            }
	            else {
	                if (this.id) {
	                    return Class.entityBaseURL + "/" + this.id;
	                }
	                else {
	                    throw new Error("entity without id can't map to backend service:\n" + JSON.stringify(this));
	                }
	            }
	        };
	        /**
	         * get entity properties value by key
	         * @param key properties name
	         */
	        Class.prototype.get = function (key) {
	            return this._data[key];
	        };
	        /**
	         * set entity properties value by key
	         * @param key properties name
	         * @param value
	         */
	        Class.prototype.set = function (key, value) {
	            this.modifyFields.push(key);
	            this._data[key] = value;
	        };
	        /**
	         * get entity data ref
	         */
	        Class.prototype.data = function () {
	            return this._data;
	        };
	        /**
	         * assign a patchData object to entity's properties
	         * if patchData has self link, then id will update by parseIdFromData
	         * @param patchData
	         */
	        Class.prototype.patchData = function (patchData) {
	            for (var key in patchData) {
	                if (patchData.hasOwnProperty(key)) {
	                    this.set(key, patchData[key]);
	                }
	            }
	            try {
	                var id = patchData['_links']['self']['href'].split(/\//);
	                id = id[id.length - 1];
	                if (id != null) {
	                    this.id = id;
	                }
	            }
	            catch (_) {
	            }
	        };
	        /**
	         * create an new entity
	         * send HTTP POST request to create an entity
	         */
	        Class.prototype.create = function () {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                Class.translateRelationEntity(_this.data()).then(function (body) {
	                    return request.post(Class.entityBaseURL).jsonBody(body).send();
	                }).then(function (json) {
	                    _this.patchData(json);
	                    _this.modifyFields = [];
	                    resolve(json);
	                }).catch(function (err) {
	                    reject(err);
	                });
	            });
	        };
	        /**
	         * update an entity
	         * send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
	         * @returns {Promise} resolve(json), reject(Request)
	         * @private
	         */
	        Class.prototype.update = function () {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                var pureChange = {};
	                if (_this.modifyFields.length == 0) {
	                    resolve();
	                    return;
	                }
	                _this.modifyFields.forEach(function (key) {
	                    if (pureChange.hasOwnProperty(key) || key[0] === '_') {
	                        return;
	                    }
	                    else if (_this._data.hasOwnProperty(key)) {
	                        pureChange[key] = _this.get(key);
	                    }
	                });
	                Class.translateRelationEntity(pureChange).then(function (json) {
	                    return request.patch(_this.href()).jsonBody(json).send();
	                }).then(function (json) {
	                    _this.patchData(json);
	                    _this.modifyFields = [];
	                    resolve(json);
	                }).catch(function (err) {
	                    reject(err);
	                });
	            });
	        };
	        /**
	         * create or update entity
	         * if id properties is set update change to service,
	         * else create an new entity to service.
	         */
	        Class.prototype.save = function () {
	            if (this.id != null) {
	                return this.update();
	            }
	            else {
	                return this.create();
	            }
	        };
	        /**
	         * remove this entity
	         */
	        Class.prototype.remove = function () {
	            return Class.remove(this.id);
	        };
	        /**
	         * fetch entity data to keep updated to newest
	         * @returns {Promise} resolve(json), reject(Request)
	         */
	        Class.prototype.fetch = function () {
	            var _this = this;
	            return new Promise(function (resole, reject) {
	                Class.findOne(_this.id).then(function (entity) {
	                    var json = entity.data();
	                    _this.patchData(json);
	                    resole(json);
	                }).catch(function (err) {
	                    reject(err);
	                });
	            });
	        };
	        /**
	         * send request follow this entity's _links's href
	         * @param {string[]} keys links href in order
	         * @returns {Promise} resolve(json), reject(Request)
	         */
	        Class.prototype.follow = function (keys) {
	            var _this = this;
	            return new Promise(function (resole, reject) {
	                function doFollow(data) {
	                    request.mockRequest(data).follow(keys).then(function (json) {
	                        resole(json);
	                    }).catch(function (err) {
	                        reject(err);
	                    });
	                }
	                if (_this.modifyFields.length > 0) {
	                    doFollow(_this.data());
	                }
	                else {
	                    _this.fetch().then(function () {
	                        doFollow(_this.data());
	                    });
	                }
	            });
	        };
	        /**
	         * read spring data rest's response json data then parse and return entity array
	         * @param json
	         */
	        Class.jsonToEntityList = function (json) {
	            var re = [];
	            var arr = json['_embedded'][this.entityName];
	            arr.forEach(function (one) { return re.push(new Class(one)); });
	            return re;
	        };
	        /**
	         * translate entity's data properties which contain Relation Entity instance value to text-uri list
	         * if data has Entity attr,this Entity attr will be replace by is href() value,and if this entity has't be store in service will store this entity first.
	         * @param data entity's data properties can has Entity attr
	         *
	         * resolve: pure json data can send to spring data rest service as request body
	         * reject: Request with error prop
	         */
	        Class.translateRelationEntity = function (data) {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                if (isEntity(data)) {
	                    data.save().then(function () {
	                        resolve(data.href());
	                    }).catch(function (err) {
	                        reject(err);
	                    });
	                }
	                else if (Array.isArray(data)) {
	                    var promiseList_1 = [];
	                    data.forEach(function (one) { return promiseList_1.push(_this.translateRelationEntity(one)); });
	                    Promise.all(promiseList_1).then(function (arr) {
	                        resolve(arr);
	                    }).catch(function (err) {
	                        reject(err);
	                    });
	                }
	                else if (data != null && data.constructor === Object) {
	                    var promiseList = [];
	                    var indexKeyMap_1 = {};
	                    var nowIndex = 0;
	                    for (var key in data) {
	                        if (data.hasOwnProperty(key)) {
	                            indexKeyMap_1[nowIndex++] = key;
	                            promiseList.push(_this.translateRelationEntity(data[key]));
	                        }
	                    }
	                    Promise.all(promiseList).then(function (arr) {
	                        var json = {};
	                        for (var i = 0; i < arr.length; i++) {
	                            json[indexKeyMap_1[i]] = arr[i];
	                        }
	                        resolve(json);
	                    }).catch(function (err) {
	                        reject(err);
	                    });
	                }
	                else {
	                    resolve(data);
	                }
	            });
	        };
	        /**
	         * get entity json data by id
	         * @param {string|number} id entity id
	         * @param {object?} queryParam
	         * @param {string} queryParam.projection the name of the projection you set with @Projection annotation name attributes
	         */
	        Class.findOne = function (id, queryParam) {
	            var _this = this;
	            if (id != null) {
	                return new Promise(function (resolve, reject) {
	                    request.get(_this.entityBaseURL + "/" + id).queryParam(queryParam).send().then(function (json) {
	                        resolve(new Class(json));
	                    }).catch(function (err) {
	                        reject(err);
	                    });
	                });
	            }
	            else {
	                throw new Error('require id');
	            }
	        };
	        /**
	         * collection resource with page and sort.
	         * Returns all entities the repository servers through its findAll(…) method. If the repository is a paging repository we include the pagination links if necessary and additional page metadata.*
	         * @param {object} queryParam
	         * @param {number} queryParam.page the page number to access (0 indexed, defaults to 0).
	         * @param {number} queryParam.size the page size requested (defaults to 20).
	         * @param {string} queryParam.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
	         * etc:name,age,desc
	         */
	        Class.findAll = function (queryParam) {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                request.get(_this.entityBaseURL).queryParam(queryParam).send().then(function (json) {
	                    var re = _this.jsonToEntityList(json);
	                    resolve(re);
	                }).catch(function (err) {
	                    reject(err);
	                });
	            });
	        };
	        /**
	         * search resource if the backing repository exposes query methods.
	         * call query methods exposed by a repository. The path and name of the query method resources can be modified using @RestResource on the method declaration.
	         *
	         * @param {string} searchPath spring data rest searchMethod path string
	         *
	         * @param {Object} queryParam search params
	         * If the query method has pagination capabilities (indicated in the URI template pointing to the resource) the resource takes the following parameters:
	         * @param {number} queryParam.page the page number to access (0 indexed, defaults to 0).
	         * @param {number} queryParam.size the page size requested (defaults to 20).
	         * @param {string} queryParam.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
	         *
	         * @returns {Promise} resolve(Entity|Entity[]) reject(Request)
	         * resolve:
	         *      if response json data has _embedded attr then resolve Entity array,
	         *      else resolve one Entity
	         */
	        Class.search = function (searchPath, queryParam) {
	            var _this = this;
	            return new Promise(function (resolve, reject) {
	                request.get(_this.entityBaseURL + "/search/" + searchPath).queryParam(queryParam).send().then(function (json) {
	                    try {
	                        resolve(_this.jsonToEntityList(json));
	                    }
	                    catch (_) {
	                        resolve(new Class(json));
	                    }
	                }).catch(function (err) {
	                    reject(err);
	                });
	            });
	        };
	        /**
	         * remove entity by id
	         */
	        Class.remove = function (id) {
	            return request.deleteMethod(this.entityBaseURL + "/" + id).send();
	        };
	        return Class;
	    }());
	    Class.entityName = entity_name;
	    Class.entityBaseURL = exports.entityConfig.restBaseURL + "/" + entity_name;
	    return Class;
	}
	exports.extend = extend;
	//# sourceMappingURL=entity.js.map

/***/ }
/******/ ]);