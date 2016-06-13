# Spring Data Rest JavaScript Library
[![Build Status](https://travis-ci.org/gwuhaolin/spring-data-rest-js.svg?branch=master)](https://travis-ci.org/gwuhaolin/spring-data-rest-js)

[Spring Data Rest](http://projects.springRest.io/springRest-data-rest/) is makes it easy to build hypermedia-driven REST web services. This lib provider
useful util to play with the service in js.

## Installation
```sh
$ npm install spring-data-rest-js --save
```
then use it in commonjs env
```javascript
let springRest = require('spring-data-rest-js');
```

## Request

#### Build Request
#####add query param in url
```javascript
let param1 = {name: '中'};
let param2 = {age: 23, academy: 'physics'};
let request = springRest.request.get(springRest.request.config.baseURL).queryParam(param1);
assert.equal(request.options.url, springRest.request.config.baseURL + '?name=中');
request.queryParam(param2);
assert.equal(request.options.url, springRest.request.config.baseURL + '?age=23&academy=physics');
```
#####send request body as json
```javascript
let param = {name: '吴浩麟', age: 23};
let request = springRest.request.post('/').jsonBody(param);
assert.equal(request.options.body, JSON.stringify(param));
assert.equal(request.options.headers['Content-Type'], 'application/json');
```

#####send request body as form
```javascript
let param = {name: '中国', age: 123};
let request = springRest.request.post('/').formBody(param);
assert.equal(request.options.body, 'name%3D%E4%B8%AD%E5%9B%BD&age%3D123');
assert.equal(request.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
```

#####auto revise url
if path param is a complete url then fetch ues path as url,
else path is not a complete url string but just a path then fetch url=config.baseURL+path
url string will been auto revised, etc: http://localhost/api//user///id/ will convert to http://localhost/api/user/id
```javascript
springRest.request.config.baseURL = 'http://localhost:8080/';
let req = springRest.request.get('//hello/name//');
assert.equal(req.options.url, `http://localhost:8080/hello/name/`);
let req2 = springRest.request.get('https://google.com//hello/name');
assert.equal(req2.options.url, `https://google.com/hello/name`);
```

#### Config Request
```javascript
springRest.request.config = {
    /**
     * options used to every fetch request
     */
    globalFetchOptions: {},

    /**
     * fetch request base url
     * notice: must end with /
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
```

#### Fetch API Global Option
fetch API request options
see [detail](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
```javascript
springRest.request.config.globalFetchOptions = {
   method: 'POST',
   headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
   },
   body: JSON.stringify({
        name: 'Hubot',
        login: 'hubot',
   }),
   credentials: 'same-origin'
}
```

#### Get Response
request return response in `Promise`,if request success `Promise` will resolve json data,if will reject a `Request` object will `Request.error` store error reason

##### get response data
```javascript
let classroom = new Classroom({name: 'D1143'});
    classroom.save().then(function () {
    return springRest.request.get(`${Classroom.entityBaseURL}/${classroom.id}`).send();
}).then(function (json) {
    assert.equal(json.name, 'D1143');
    done();
}).catch(function (err) {
    done(err);
});
```

##### follow links
```javascript
let student = new Student({name: '吴浩麟', age: 23});
    let academy = new Academy({name: '计算机学院'});
    student.set('academy', academy);
    student.save().then(()=> {
    return springRest.request.get(`${Student.entityBaseURL}/${student.id}`).follow(['self', 'academy', 'self', 'self']);
}).then((json)=> {
    assert.equal(json.name, '计算机学院');
    done();
}).catch(err=> {
    done(err);
});
```

##### fetch global hook

before send fetch request
```javascript
let flag = 'old';
let request = springRest.request.get(springRest.request.config.baseURL);
springRest.request.config.fetchStartHook = function (req) {
    assert.equal(req, request);
    flag = 'new';
};
request.send().then(()=> {
    assert.equal(flag, 'new');
    done();
}).catch(err=> {
    done(err);
});
```

fetch request is finished
```javascript
let flag = 'old';
let request = springRest.request.get(springRest.request.config.baseURL);
springRest.request.config.fetchEndHook = function (req) {
    assert.equal(req, request);
    flag = 'new';
};
request.send().then(()=> {
    assert.equal(flag, 'new');
    done();
}).catch(err=> {
    done(err);
});
```

## Entity

##### extend
get a class by entity path name
```javascript
let Student = springRest.extend('students');
let Academy = springRest.extend('academies');
let Classroom = springRest.extend('classrooms');
```

##### config entity
```javascript
config = {
    /**
     * spring-data-rest-base-path config
     * @type {string}
     */
    restBaseURL: ''
};

```

##### create entity
class ref to spring data entity,use entity class to make a new entity instance and then create it on service.
```javascript
let student = new Student();
   student.set('name', 'Tom');
   student.save().then(()=> {
   assert(student.id != null);
   return springRest.request.get(`${Student.entityBaseURL}/${student.id}`).send();
}).then((json)=> {
   assert.equal(json.name, 'Tom');
   done();
}).catch(err=> {
   done(err);
})
```

##### id
the entity instance's id.
for a existed entity set instance's id then you can use instance
- `fetch` method to fetch entity's data
- `save` method to update entity's updated properties
- `delete` method to delete this entity
```javascript
let student = new Student();
student.id = 26;
```

##### update entity
if a entity instance has id attr,and use entity's `set(key,value)` method update attr,then can call entity's `save()` method to patch update change to service.
```javascript
let academy = new Academy({name: 'Math'});
   academy.save().then(()=> {
   academy.set('name', 'Physics');
   return academy.save();
}).then(()=> {
   assert.deepEqual(academy.get('name'), 'Physics');
   done();
}).catch(err=> {
   done(err);
})
```

##### save or update
create or update entity
if id properties is set,then will send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
if id is null,then will send HTTP POST request to create an entity

##### delete entity
use entity's `delete()` method to remove this entity in service.
```javascript
let student = new Student();
   student.save().then(()=> {
   return student.delete();
}).then(()=> {
   return Student.findOne(student.id);
}).catch(err=> {
   assert.equal(err.response.status, 404);
   done();
});
```
Entity Class also has a static method to delete an entity by id
```javascript
Student.delete(42).then(()=>{},err=>{})
```

##### fetch data
entity's data properties store in data
```javascript
let name = 'Ace';
   let age = 20;
   let ace = new Student({name: name, age: age});
   let student = new Student();
   ace.save().then(()=> {
   student.id = ace.id;
   return student.fetch();
}).then(json=> {
   assert.equal(json.name, name);
   assert.equal(json.age, age);
   assert.equal(student.get('name'), name);
   assert.equal(student.get('age'), age);
   done();
}).catch(err=> {
   done(err);
});
```

#### Entity static methods

##### findOne
get an entity instance by id
```javascript
let classRoom = new Classroom({name: '东16412'});
classRoom.save().then(()=> {
    return Classroom.findOne(classRoom.id);
}).then(entity=> {
    assert.equal(entity.get('name'), '东16412');
    done();
}).catch(err=> {
    done(err);
});
```
get an not exist instance will reject 404 err
```javascript
Student.findOne('404404').then(()=> {
    done('should be 404 error');
}).catch(req=> {
    assert.equal(req.response.status, 404);
    done();
})
```

##### findAll
collection resource with page and sort.
Returns all entities the repository servers through its findAll(…) method. If the repository is a paging repository we include the pagination links if necessary and additional page metadata.*
- @param {number} opts.page the page number to access (0 indexed, defaults to 0).
- @param {number} opts.size the page size requested (defaults to 20).
- @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
```javascript
let size = 13;
let pageIndex = 1;
Student.findAll({page: pageIndex, size: size, sort: 'age,desc'}).then(function (jsonArr) {
    assert(Array.isArray(jsonArr));
    assert.equal(jsonArr.length, size);
    assert.equal(jsonArr.page.number, pageIndex);
    assert.equal(jsonArr.page.size, size);
    assert.equal(springRest.extend.isEntity(jsonArr[0]), true);
    assert.equal(jsonArr[0].constructor, Student);
    for (let i = 1; i < size - 2; i++) {
        assert.equal(jsonArr[i].get('age') > jsonArr[i + 1].get('age'), true);
        assert.equal(jsonArr[i - 1].get('age') > jsonArr[i].get('age'), true);
    }
    done();
}).catch(req=> {
    done(req);
});
```

##### search
search resource if the backing repository exposes query methods.
call query methods exposed by a repository. The path and name of the query method resources can be modified using @RestResource on the method declaration.
- @param {string} searchPath spring data rest searchMethod path string
- @param {Object} opts search params, If the query method has pagination capabilities (indicated in the URI template pointing to the resource) the resource takes the following parameters:
- @param {number} opts.page the page number to access (0 indexed, defaults to 0).
- @param {number} opts.size the page size requested (defaults to 20).
- @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
```javascript
Student.search('ageGreaterThan', {age: 1013, page: 1, size: 5, sort: 'age,desc'}).then(entityList=> {
    assert.equal(entityList.length, 5);
    for (var i = 0; i < entityList.length - 2; i++) {
        assert(entityList[i].get('age') > entityList[i + 1].get('age'));
    }
    done();
}).catch(err=> {
    done(err);
});
```


## Error Handle
all error will be reject by return promise,and the error object is instance of `Request` will `Request.error` properties store error reason
```javascript
Student.findOne(42).then(()=>{}).catch(req=>{
    console.error(req.error);
    console.log(req.response.status);
    console.log(req.response.statusText);
})
```

## Example Code
- [javascript](https://github.com/gwuhaolin/spring-data-rest.js/blob/master/test/node.test.js)
- [java](https://github.com/gwuhaolin/spring-data-rest-js-backend)

## Browser Support
require es6 `Object.assign` and `Promise`,this lib build on the top of es6 fetch API,use [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch) as polyfill.
[Browser Support](https://github.com/github/fetch#browser-support)

## License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016 HalWu