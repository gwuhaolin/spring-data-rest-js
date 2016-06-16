/**
 * build on the top of es6 fetch API.
 * use isomorphic-fetch as polyfill
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @see https://github.com/matthew-andrews/isomorphic-fetch
 * @see https://github.com/github/fetch
 * @author gwuhaolin
 */
'use strict';
function spring(exports, fetch) {

    ////////////////////////////////////////// Request ///////////////////////////////////////

    var request = {};

    request.config = {
        /**
         * options used to every fetch request
         */
        globalFetchOptions: {},

        /**
         * fetch request base url
         * @type {string}
         */
        baseURL: '/',

        /**
         * call before send fetch request
         * default do nothing
         * @param {Request} request Request ref
         */
        fetchStartHook: null,

        /**
         * call after fetch request end
         * default do nothing
         * @param {Request} request Request ref
         */
        fetchEndHook: null
    };

    /**
     * Request
     * @param {object} options
     * @param {string} options.url
     * @returns {Request}
     * @constructor
     */
    function Request(options) {

        /**
         * store request options
         * @type {object}
         */
        this.options = Object.assign({headers: {}, body: null}, options, request.config.globalFetchOptions);

        /**
         * has this request been send
         * @type {boolean}
         */
        this.hasSend = false;

        /**
         * The Response interface of the Fetch API represents the response to a request.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
         * @type {object|null}
         */
        this.response = null;

        /**
         * if error happen during request error will store in there,else this will be null
         * @type {object|null}
         */
        this.error = null;

        /**
         * after request finish without error,response json data will store in there,else will be {}
         * @type {object}
         */
        this.responseData = null;

    }

    /**
     * reset query param in request url by append ? and query param to end of url
     * @param {Object} obj
     * @returns {Request}
     */
    Request.prototype.queryParam = function (obj) {
        if (obj != null) {
            var arr = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    arr.push(key + '=' + obj[key])
                }
            }
            this.options.url = this.options.url.split('?')[0] + '?' + arr.join('&');
        }
        return this;
    };

    /**
     * set request body use json
     * support json type only
     * HTTP Header Content-Type will set as application/json
     * @param {object} obj pure json object
     * @returns {Request}
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
     * can't use it to upload file
     * @param obj pure json object
     * @returns {Request}
     */
    Request.prototype.formBody = function (obj) {
        var arr = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(key + '=' + obj[key]);
            }
        }
        this.options.body = arr.join('&');
        this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        return this;
    };

    /**
     * send fetch request
     * get response's data
     * @returns {Promise} resolve(json|null|string), reject(Request)
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    Request.prototype.send = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self.hasSend) {
                if (self.error) {
                    reject(self);
                } else {
                    resolve(self.responseData);
                }
            } else {
                self.hasSend = true;
                var fetchStartHook = request.config.fetchStartHook;
                var fetchEndHook = request.config.fetchEndHook;
                fetchStartHook && fetchStartHook(self);
                //noinspection JSUnresolvedFunction
                fetch(self.options.url, self.options).then(function (response) {//parse response data by content-type
                    self.response = response;
                    var contentType = response.headers.get('content-type');
                    if (contentType == null) {
                        return Promise.resolve();
                    } else {
                        if (/.*json.*/.test(contentType)) {
                            //noinspection JSUnresolvedFunction
                            return response.json();
                        } else {
                            return response.text();
                        }
                    }
                }).then(function (data) {//resolve or reject data by response.status is ok
                    self.responseData = data;
                    if (self.response.ok) {
                        return Promise.resolve(data);
                    } else {
                        return Promise.reject(data);
                    }
                }).then(function (data) {
                    fetchEndHook && fetchEndHook(self);
                    resolve(data);
                }).catch(function (err) {
                    self.error = err;
                    fetchEndHook && fetchEndHook(self);
                    reject(self);
                })
            }
        });
    };

    /**
     * fake Promise.then() method,auto call Request.send() when without call send() to use then()
     * @param resolve
     * @param reject
     * @returns {Promise}
     */
    Request.prototype.then = function (resolve, reject) {
        return this.send().then(resolve).catch(reject);
    };

    /**
     * send request follow _links's href
     * @param {string[]} keys links href in order
     * @returns {Promise} resolve(json|null|string), reject(Request)
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    Request.prototype.follow = function (keys) {
        var self = this;
        return new Promise(function (resolve, reject) {
            function doFollow(data) {
                var key = keys.shift();
                if (key) {
                    var links = data['_links'];
                    var url = links[key];
                    if (url) {
                        url = url['href'];
                        request.get(url).send().then(function (data) {
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

            self.send().then(function (data) {
                doFollow(data);
            }).catch(function (self) {
                reject(self);
            })

        })
    };

    function buildHttpMethodFunction(method) {

        /**
         * make http request user fetch API.
         * if path param is a complete url then fetch ues path as url,
         * else path is not a complete url string but just a path then fetch url=config.baseURL+path
         * url string will been auto revised, etc: http://localhost/api//user///id/ will convert to http://localhost/api/user/id
         * @param {string} path url path
         * @returns {Request}
         */
        function httpRequest(path) {
            var url = path;
            if (!/^https?:\/\/.+$/g.test(path)) {//path is not a full url
                url = request.config.baseURL + '/' + path;
            }
            url = url.replace(/\/{2,}/g, '/').replace(/:\//g, '://');
            return new Request({url: url, method: method});
        }

        return httpRequest;
    }

    /**
     * make http get request
     * @param {string} path url path
     * @returns {Request}
     */
    request.get = buildHttpMethodFunction('GET');

    /**
     * make http post request
     * @param {string} path url path
     * @returns {Request}
     */
    request.post = buildHttpMethodFunction('POST');

    /**
     * make http patch request
     * @param {string} path url path
     * @returns {Request}
     */
    request.patch = buildHttpMethodFunction('PATCH');

    /**
     * make http put request
     * @param {string} path url path
     * @returns {Request}
     */
    request.put = buildHttpMethodFunction('PUT');

    /**
     * make http delete request
     * @param {string} path url path
     * @returns {Request}
     */
    request.delete = buildHttpMethodFunction('DELETE');

    /**
     * mockRequest a request with data
     * @param {object} data
     * @returns {Request}
     */
    request.mockRequest = function (data) {
        var url = data['_links']['self']['href'];
        var req = new Request({url: url, method: 'GET'});
        req.responseData = data;
        req.hasSend = true;
        return req;
    };

    exports.request = request;

    ////////////////////////////////////////// Entity ///////////////////////////////////////
    var entity = {};

    entity.config = {
        /**
         * spring-data-rest-base-path config
         * @type {string}
         */
        restBaseURL: '/'
    };

    /**
     * if any is a Entity instance
     * @param {*} any
     * @returns {boolean}
     */
    entity.isEntity = function (any) {
        if (any) {
            var href = any.href;
            return href != null && href.constructor === Function;
        }
        return false;
    };

    /**
     * translate entity's data properties which contain Relation Entity instance value to text-uri list
     * if data has Entity attr,this Entity attr will be replace by is href() value,and if this entity has't be store in service will store this entity first.
     * @param data entity's data properties can has Entity attr
     * @returns {Promise}
     * resolve: pure json data can send to spring data rest service as request body
     * reject: Request with error prop
     */
    function translateRelationEntity(data) {
        return new Promise(function (resolve, reject) {
            if (entity.isEntity(data)) {//is a Entity instance
                if (data.id == null) {//this entity has't been store in service
                    data.save().then(function () {
                        resolve(data.href());
                    }).catch(function (err) {
                        reject(err);
                    })
                } else {
                    resolve(data.href());
                }
            } else if (Array.isArray(data)) {
                var promiseList = [];
                for (var one in data) {
                    //noinspection JSUnfilteredForInLoop
                    promiseList.push(translateRelationEntity(one));
                }
                Promise.all(promiseList).then(function (arr) {
                    resolve(arr);
                }).catch(function (err) {
                    reject(err);
                });
            } else if (data != null && data.constructor === Object) {//is object
                promiseList = [];
                var indexKeyMap = {};
                var nowIndex = 0;
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        indexKeyMap[nowIndex++] = key;
                        promiseList.push(translateRelationEntity(data[key]));
                    }
                }
                Promise.all(promiseList).then(function (arr) {
                    var json = {};
                    for (var i = 0; i < arr.length; i++) {
                        json[indexKeyMap[i]] = arr[i];
                    }
                    resolve(json);
                }).catch(function (err) {
                    reject(err);
                });
            } else {
                resolve(data);
            }
        });
    }

    /**
     * build an Entity Class
     * @param entityName spring data rest entity path
     * @returns {Entity} an Entity Class can new Class() to instance entity
     */
    entity.extend = function (entityName) {

        /**
         * spring data Entity Class
         * @param initData json data from spring data rest service's response
         * @constructor
         */
        function Entity(initData) {
            var self = this;
            /**
             * springRest data entity id.
             * if id is set means this is a exists entity and can use methods:[save,exists,delete]
             * if id is null,means this is a new entity which will course save() method create a new object
             * @type {string|number|null}
             */
            this.id = null;
            /**
             * store one entity's data
             * @type {object}
             * @private
             */
            this._data = {};
            /**
             * track modify field
             * @type {Array}
             * @private
             */
            this._modifyFileds = [];

            /**
             * get this entity's spring data rest resource uri.
             * if this entity's has data and data has _link properties,use _data['_links']['self']['href']
             * else use config.restBaseURL + entityName + '/' + self.id
             * @returns {string} URI string link to this entity
             */
            this.href = function () {
                var links;
                if (self._data) {
                    links = self._data['_links'];
                }
                if (links) {
                    return links['self']['href'];
                } else {
                    if (self.id) {
                        return self.constructor.entityBaseURL + '/' + self.id;
                    } else {
                        throw new Error("entity without id can't map to backend service:\n" + JSON.stringify(self));
                    }
                }
            };

            /**
             * get entity properties value by key
             * @param {string} key properties name
             * @returns {Entity|Object|null|*}
             */
            this.get = function (key) {
                return self._data[key];
            };

            /**
             * set entity properties value by key
             * @param {string} key properties name
             * @param {Entity|Object|null|*} value properties value
             */
            this.set = function (key, value) {
                this._modifyFileds.push(key);
                this._data[key] = value;
            };

            /**
             * get entity data ref
             * @returns {Object|null}
             */
            this.data = function () {
                return self._data;
            };

            /**
             * assign a patchData object to entity's properties
             * if patchData has self link, then id will update by parseIdFromData
             * @param {Object} patchData
             */
            this.patchData = function (patchData) {
                for (var key in patchData) {
                    if (patchData.hasOwnProperty(key)) {
                        this.set(key, patchData[key]);
                    }
                }
                try {
                    var id = patchData['_links']['self']['href'].split(/\//);
                    id = id[id.length - 1];
                    if (id != null) {
                        self.id = id;
                    }
                } catch (_) {
                }
            };

            /**
             * create an new entity
             * send HTTP POST request to create an entity
             * @returns {Promise} resolve(json), reject(Request)
             * @private
             */
            this._create = function () {
                return new Promise(function (resolve, reject) {
                    translateRelationEntity(self.data()).then(function (body) {
                        return request.post(self.constructor.entityBaseURL).jsonBody(body).send();
                    }).then(function (json) {
                        self.patchData(json);
                        resolve(json);
                    }).catch(function (err) {
                        reject(err);
                    })
                });
            };

            /**
             * update an entity
             * send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
             * @returns {Promise} resolve(json), reject(Request)
             * @private
             */
            this._update = function () {
                var pureChange = {};
                var links = this._data['_links'];
                var promiseList = [];
                for (var i = 0; i < self._modifyFileds.length; i++) {
                    var key = self._modifyFileds[i];
                    if (pureChange.hasOwnProperty(key) || key[0] === '_') {//this key has been set or start with _ will be skip
                        continue;
                    }
                    var value = this.get(key);
                    if (links[key] && ((entity.isEntity(value)) || (Array.isArray(value) && entity.isEntity(value[0])))) {//is relation entity or entity array
                        value = translateRelationEntity(value);
                        var req = request.put(links[key]['href']).jsonBody(value);
                        req.options.headers['Content-Type'] = 'text/uri-list';
                        promiseList.push(req.data());
                    } else {
                        pureChange[key] = value;
                    }
                }
                return new Promise(function (resolve, reject) {
                    translateRelationEntity(pureChange).then(function (json) {
                        promiseList.unshift(exports.request.patch(self.href()).jsonBody(json).send());
                        return Promise.all(promiseList);
                    }).then(function (jsonArr) {
                        var data = jsonArr[0];
                        self.patchData(data);
                        resolve(data);
                    }).catch(function (err) {
                        reject(err);
                    });
                });
            };

            /**
             * create or update entity
             * if id properties is set update change to service,
             * else create an new entity to service.
             * @returns {Promise} resolve(json), reject(Request)
             */
            this.save = function () {
                if (self.id != null) {//update
                    return self._update();
                } else {//create
                    return self._create();
                }
            };

            /**
             * delete this entity
             * @returns {Promise} resolve(json), reject(Request)
             */
            this.delete = function () {
                return Entity.delete(self.id);
            };

            /**
             * fetch entity data to keep updated to newest
             * @returns {Promise} resolve(json), reject(Request)
             */
            this.fetch = function () {
                return new Promise(function (resole, reject) {
                    Entity.findOne(self.id).then(function (entity) {
                        var json = entity.data();
                        self.patchData(json);
                        resole(json);
                    }).catch(function (err) {
                        reject(err);
                    })
                });
            };

            /**
             * send request follow this entity's _links's href
             * @param {string[]} keys links href in order
             * @returns {Promise} resolve(json), reject(Request)
             */
            this.follow = function (keys) {
                return new Promise(function (resole, reject) {
                    function doFollow() {
                        request.mockRequest(self._data).follow(keys).then(function (json) {
                            resole(json);
                        }).catch(function (err) {
                            reject(err);
                        })
                    }

                    if (self._modifyFileds.length > 0) {
                        doFollow();
                    } else {
                        self.fetch().then(function () {
                            doFollow();
                        })
                    }
                });
            };

            this.patchData(initData);
        }

        Entity.entityName = entityName;

        /**
         * get spring data rest entity repo url
         * @returns {string}
         */
        Entity.entityBaseURL = entity.config.restBaseURL + '/' + Entity.entityName;

        /**
         * get entity json data by id
         * @param {string|number} id entity id
         * @param {object?} queryParam
         * @param {string} queryParam.projection the name of the projection you set with @Projection annotation name attributes
         * @returns {Promise} resolve(Entity), reject(Request)
         */
        Entity.findOne = function (id, queryParam) {
            if (id) {
                return new Promise(function (resolve, reject) {
                    request.get(Entity.entityBaseURL + '/' + id).queryParam(queryParam).send().then(function (json) {
                        resolve(new Entity(json));
                    }).catch(function (err) {
                        reject(err);
                    })
                });
            } else {
                throw new Error('require id');
            }
        };

        /**
         * read spring data rest's response json data then parse and return entity array
         * @param json
         * @returns {Array}
         */
        function jsonToEntityList(json) {
            var re = [];
            var arr = json['_embedded'][Entity.entityName];
            for (var i = 0; i < arr.length; i++) {
                re.push(new Entity(arr[i]));
            }
            return re;
        }

        /**
         * collection resource with page and sort.
         * Returns all entities the repository servers through its findAll(…) method. If the repository is a paging repository we include the pagination links if necessary and additional page metadata.*
         * @param {object} queryParam
         * @param {number} queryParam.page the page number to access (0 indexed, defaults to 0).
         * @param {number} queryParam.size the page size requested (defaults to 20).
         * @param {string} queryParam.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
         * etc:name,age,desc
         * @returns {Promise} resolve(Entity[]), reject(Request)
         * resolve array of Entity with prop page store page info
         */
        Entity.findAll = function (queryParam) {
            return new Promise(function (resolve, reject) {
                request.get(Entity.entityBaseURL).queryParam(queryParam).send().then(function (json) {
                    var re = jsonToEntityList(json);
                    re.page = json.page;
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
        Entity.search = function (searchPath, queryParam) {
            return new Promise(function (resolve, reject) {
                request.get(Entity.entityBaseURL + '/search/' + searchPath).queryParam(queryParam).send().then(function (json) {
                    try {//response entity list
                        resolve(jsonToEntityList(json));
                    } catch (_) {//response one entity
                        resolve(new Entity(json));
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
        };

        /**
         * delete entity by id
         * @returns {Promise} resolve(json), reject(Request)
         */
        Entity.delete = function (id) {
            return request.delete(Entity.entityBaseURL + '/' + id).send();
        };

        return Entity;
    };

    exports.entity = entity;

}
if (typeof exports === 'undefined') {//browser
    spring(window.spring = {}, window.fetch);
} else {//node.js
    module.exports = spring;
}
