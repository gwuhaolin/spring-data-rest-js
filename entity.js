'use strict';
var Request = require('./request');

/**
 * if any is a Entity instance
 * @param {*} any
 * @returns {boolean}
 */
function isEntity(any) {
    if (any) {
        var href = any.href;
        return href != null && href.constructor === Function;
    }
    return false;
}

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
        if (isEntity(data)) {//is a Entity instance
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
function extend(entityName) {

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
         * else use config.restBasePath + entityName + '/' + self.id
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
                    return Request.post(self.constructor.entityBaseURL).body(body).send();
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
                if (links[key] && ((isEntity(value)) || (Array.isArray(value) && isEntity(value[0])))) {//is relation entity or entity array
                    value = translateRelationEntity(value);
                    var request = Request.put(links[key]['href']).body(value);
                    request.options.headers['Content-Type'] = 'text/uri-list';
                    promiseList.push(request.data());
                } else {
                    pureChange[key] = value;
                }
            }
            return new Promise(function (resolve, reject) {
                translateRelationEntity(pureChange).then(function (json) {
                    promiseList.unshift(Request.patch(self.href()).body(json).send());
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
                    Request.mockRequest(self._data).follow(keys).then(function (json) {
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
    Entity.entityBaseURL = Request.config.restBasePath + Entity.entityName;

    /**
     * get entity json data by id
     * @param {string|number} id entity id
     * @returns {Promise} resolve(Entity), reject(Request)
     */
    Entity.findOne = function (id) {
        if (id) {
            return new Promise(function (resolve, reject) {
                Request.get(Entity.entityBaseURL + '/' + id).send().then(function (json) {
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
     * find entity list with page and sort
     * @param {object} opts
     * @param {number} opts.page the page number to access (0 indexed, defaults to 0).
     * @param {number} opts.size the page size requested (defaults to 20).
     * @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
     * etc:name,age,desc
     * @returns {Promise} resolve(Entity[]), reject(Request)
     * resolve array of Entity with prop page store page info
     */
    Entity.findAll = function (opts) {
        return new Promise(function (resolve, reject) {
            Request.get(Entity.entityBaseURL).query(opts).send().then(function (json) {
                var re = [];
                re.page = json.page;
                var arr = json['_embedded'][Entity.entityName];
                for (var i = 0; i < arr.length; i++) {
                    re.push(new Entity(arr[i]));
                }
                resolve(re);
            }).catch(function (err) {
                reject(err);
            });
        });
    };

    /**
     * delete entity by id
     * @returns {Promise} resolve(json), reject(Request)
     */
    Entity.delete = function (id) {
        return Request.delete(Entity.entityBaseURL + '/' + id).send();
    };

    return Entity;
}

extend.isEntity = isEntity;
module.exports = extend;