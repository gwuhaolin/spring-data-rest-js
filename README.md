# Spring Data Rest JavaScript Library
[![Build Status](https://img.shields.io/travis/ant-design/ant-design.svg?style=flat-square)](https://travis-ci.org/gwuhaolin/spring-data-rest-js)
[![Npm Package](https://img.shields.io/npm/v/spring-data-rest-js.svg?style=flat-square)](https://www.npmjs.org/package/spring-data-rest-js)
[![Npm Downloads](http://img.shields.io/npm/dm/spring-data-rest-js.svg?style=flat-square)](https://npmjs.org/package/spring-data-rest-js)
[![Dependency Status](https://david-dm.org/gwuhaolin/spring-data-rest-js.svg?style=flat-square)](https://npmjs.org/package/spring-data-rest-js)

[Spring Data Rest](http://projects.springRest.io/springRest-data-rest/) is makes it easy to build hypermedia-driven REST web services. This lib provider
useful util to play with the service in js. It's a easy to use and lightweight (*2kb after min and gzip*) javascript lib can run in both node.js and browser,can be work with lib like AngularJS React Vue.
support Typescript.

## Installation
```sh
# for npm
npm install spring-data-rest-js --save
# for bower
bower install spring-data-rest-js
```
then use it in commonjs env
```js
let spring = require('spring-data-rest-js');
```
for browser,you can use tools like [Webpack](http://webpack.github.io/) or [Browserify](http://browserify.org/) to bundle up your module for browser.
you also can include lib file in html file and then use it:
```html
<!DOCTYPE html>
<html>
<body>
<script src="./dist/spring.js"></script>
<script>
    window.spring.post('/');
</script>
</body>
</html>
```
## Request

#### Build Request
#####add query param in url
```js
let param1 = {name: '中'};
let param2 = {age: 23, academy: 'physics'};
let request = spring.get(spring.requestConfig.baseURL).queryParam(param1);
assert.equal(request.options.url, spring.requestConfig.baseURL + '?name=中');
request.queryParam(param2);
assert.equal(request.options.url, spring.requestConfig.baseURL + '?age=23&academy=physics');
```
#####send request body as json
```js
let param = {name: '吴浩麟', age: 23};
let request = spring.post('/').jsonBody(param);
assert.equal(request.options.body, JSON.stringify(param));
assert.equal(request.options.headers['Content-Type'], 'application/json');
```

#####send request body as form
```js
let param = {name: '中国', age: 123};
let request = spring.post('/postForm').formBody(param);
assert.equal(request.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
request.send().then(json=> {
    assert.equal(json.name, '中国');
    assert.equal(json.age, 123);
}).catch(err=> {
    done(err);
});
```

#####auto revise url
if path param is a complete url then fetch ues path as url,
else path is not a complete url string but just a path then fetch url=config.baseURL+path
url string will been auto revised, etc: http://localhost/api//user///id/ will convert to http://localhost/api/user/id
```js
spring.requestConfig.baseURL = 'http://localhost:8080/';
let req = spring.get('//hello/name//');
assert.equal(req.options.url, `http://localhost:8080/hello/name/`);
let req2 = spring.get('https://google.com//hello/name');
assert.equal(req2.options.url, `https://google.com/hello/name`);
```

#### Config Request
```js
spring.request.config = {
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
```js
spring.requestConfig.globalFetchOptions = {
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

##### send request and get response data
```js
let classroom = new Classroom({name: 'D1143'});
let request;
classroom.save().then(function () {
    request = spring.get(`${Classroom.entityBaseURL()}/${classroom.id}`);
    return request.send();
}).then(json=> {
    assert.equal(json.constructor, Object);
    assert.equal(json.name, 'D1143');
    assert.deepEqual(json, request.responseData);
}).catch(err=> {
    done(err);
});
```

##### follow links
```js
let student = new Student({name: '吴浩麟', age: 23});
let academy = new Academy({name: '计算机学院'});
student.set('academy', academy);
student.save().then(()=> {
    return spring.get(`${Student.entityBaseURL()}/${student.id}`).follow(['self', 'academy', 'self', 'self']);
}).then((json)=> {
    assert.equal(json.name, '计算机学院');
}).catch(err=> {
    done(err);
});
```

##### fetch global hook

before send fetch request
```js
let flag = 'old';
let request = spring.get(spring.requestConfig.baseURL);
spring.requestConfig.fetchStartHook = function (req) {
    assert.equal(req, request);
    flag = 'new';
};
request.send().then(()=> {
    assert.equal(flag, 'new');
}).catch(err=> {
    done(err);
});
```

fetch request is finished
```js
let flag = 'old';
let request = spring.get(spring.requestConfig.baseURL);
spring.requestConfig.fetchEndHook = function (req) {
    assert.equal(req, request);
    flag = 'new';
};
request.send().then(()=> {
    assert.equal(flag, 'new');
}).catch(err=> {
    done(err);
});
```

## Entity

##### extend
get a class by entity path name.
```js
//by extend function
let Student = spring.extend('students');
let Academy = spring.extend('academies');
let Classroom = spring.extend('classrooms');
```
```typescript
//by typescript extend
import * as spring from './index'
import * as assert from 'assert';
class Student extends spring.Entity {

    get name():string {
        return this.get('name');
    }

    set name(name:string) {
        this.set('name', name);
    }

    hi():string {
        return `${this.name}:${this.get('age')}`;
    }
}
Student.entityName = 'students';

//use it
let student = new Student({
    name: 'Hal',
    age: 23
});
assert.equal(student.name, 'Hal');
assert.equal(student.hi(), 'Hal:23');
```

##### config entity
```js
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
```js
let student = new Student();
student.set('name', 'Tom');
student.save().then(()=> {
    assert(student.id != null);
    return spring.get(`${Student.entityBaseURL()}/${student.id}`).send();
}).then((json)=> {
    assert.equal(json.name, 'Tom');
}).catch(err=> {
    done(err);
})
```

##### id
the entity instance's id.
for a existed entity set instance's id then you can use instance
- `fetch` method to fetch entity's data
- `save` method to update entity's updated properties
- `remove` method to delete this entity
```js
let student = new Student();
student.id = 26;
```

##### update entity
if a entity instance has id attr,and use entity's `set(key,value)` method update attr,then can call entity's `save()` method to patch update change to service.
```js
let academy = new Academy({name: 'Math'});
academy.save().then(()=> {
    academy.set('name', 'Physics');
    return academy.save();
}).then(()=> {
    assert.deepEqual(academy.get('name'), 'Physics');
}).catch(err=> {
    done(err);
})
```

##### save or update
create or update entity
if id properties is set,then will send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
if id is null,then will send HTTP POST request to create an entity.
if entity.properties is an instance of Entity or Entity[],then entity.properties.save() will also call,which mean entity's all Entity attr will auto save()

##### track modify fields
every Entity instance has attr `modifyFields` fields name array,which store field has been changed.
when update modify to service, `modifyFields` is used to optimize a mini `PATCH` request but send whole attr.
when call Entity's `set` method,will compare olaValue and newValue,if value is equal then not append filed name to modifyFields.

##### remove entity
use entity's `remove()` method to remove this entity in service.
```js
let student = new Student();
student.save().then(()=> {
    return student.remove();
}).then(()=> {
    return Student.findOne(student.id);
}).catch(err=> {
    assert.equal(err.response.status, 404);
});
```
Entity Entity also has a static method to remove an entity by id
```js
Student.remove(42).then(()=>{},err=>{})
```

##### fetch data
entity's data properties store in data
```js
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
}).catch(err=> {
    done(err);
});
```

##### follow
send request follow this entity's _links's href
```js
let student = new Student({name: '吴浩麟', age: 23});
let academy = new Academy({name: '计算机学院'});
student.set('academy', academy);
student.save().then(()=> {
    return student.follow(['academy']);
}).then((json)=> {
    assert.equal(json.name, '计算机学院');
}).catch(err=> {
    done(err);
});
```

#### Entity static methods

##### findOne
get an entity instance by id
```js
let classRoom = new Classroom({name: '东16412'});
classRoom.save().then(()=> {
    return Classroom.findOne(classRoom.id);
}).then(entity=> {
    assert.equal(entity.get('name'), '东16412');
}).catch(err=> {
    done(err);
});
```
get an not exist instance will reject 404 err
```js
Student.findOne('404404').then(()=> {
    done('should be 404 error');
}).catch(req=> {
    assert.equal(req.response.status, 404);
})
```
support projection
```js
let student = new Student({name: 'HalWu', age: 23});
student.save().then(()=> {
    return Student.findOne(student.id, {projection: 'NoAge'});
}).then(entity=> {
    assert.equal(entity.get('name'), 'HalWu');
    assert.equal(entity.get('age'), null);
}).catch(err=> {
    done(err);
})
```

##### findAll
collection resource with page and sort.
Returns all entities the repository servers through its findAll(…) method. If the repository is a paging repository we include the pagination links if necessary and additional page metadata.*
return entity array has `page` attr patch form response json data's page info
- @param {number} opts.page the page number to access (0 indexed, defaults to 0).
- @param {number} opts.size the page size requested (defaults to 20).
- @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
```js
let size = 13;
let pageIndex = 1;
Student.findAll({page: pageIndex, size: size, sort: 'age,desc'}).then(function (jsonArr) {
    assert(Array.isArray(jsonArr));
    assert.equal(jsonArr.length, size);
    assert.equal(spring.extend.isEntity(jsonArr[0]), true);
    assert.equal(jsonArr[0].constructor, Student);
    assert.equal(arr['page'], {size: size, totalElements: 1, totalPages: 1, number: 0});
    for (let i = 1; i < size - 2; i++) {
        assert.equal(jsonArr[i].get('age') > jsonArr[i + 1].get('age'), true);
        assert.equal(jsonArr[i - 1].get('age') > jsonArr[i].get('age'), true);
    }
}).catch(req=> {
    done(req);
});
```

##### search
search resource if the backing repository exposes query methods.
call query methods exposed by a repository. The path and name of the query method resources can be modified using @RestResource on the method declaration.
return entity array has `page` attr patch form response json data's page info
- @param {string} searchPath spring data rest searchMethod path string
- @param {Object} opts search params, If the query method has pagination capabilities (indicated in the URI template pointing to the resource) the resource takes the following parameters:
- @param {number} opts.page the page number to access (0 indexed, defaults to 0).
- @param {number} opts.size the page size requested (defaults to 20).
- @param {string} opts.sort a collection of sort directives in the format ($propertyName,)+[asc|desc]?
```js
Student.search('ageGreaterThan', {age: 1013, page: 1, size: 5, sort: 'age,desc'}).then(entityList=> {
    assert.equal(entityList.length, 5);
    for (var i = 0; i < entityList.length - 2; i++) {
        assert(entityList[i].get('age') > entityList[i + 1].get('age'));
    }
}).catch(err=> {
    done(err);
});
```

##### exposeProperty
expose entity instance properties in _data to entity itself use Object.defineProperty getter and setter
after expose,you can access property in entity by entity.property rather than access by entity.data().property.
example:
```js
let StudentX = spring.extend('students');
StudentX.exposeProperty('name');
StudentX.exposeProperty('age');
let student = new StudentX({
    name: 'hal'
});
assert.equal(student['name'], 'hal');
student['age'] = 23;
assert.equal(student.get('age'), 23);
```
implements source code:
```js
Object.defineProperty(this.prototype, propertyName, {
    get: function () {
        return this.get(propertyName);
    },
    set: function (value) {
        this.set(propertyName, value);
    },
    enumerable: true
})
```

## Error Handle
all error will be reject by return promise,and the error object is instance of `Request` will `Request.error` properties store error reason
```js
Student.findOne(404).then(()=>{}).catch(req=>{
    console.error(req.error);
    console.log(req.response.status);
    console.log(req.response.statusText);
})
```

## Example Code
- [javascript](https://github.com/gwuhaolin/spring-data-rest-js/tree/master/test)
- [java](https://github.com/gwuhaolin/spring-data-rest-js-backend)

## Browser Support
this lib use es6 some feature:
- Object.assign [doc](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)  [polyfill](https://github.com/sindresorhus/object-assign)
- Promise [doc](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)  [polyfill](https://github.com/stefanpenner/es6-promise)
- fetch [doc](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)  [polyfill](https://github.com/github/fetch)

for browser use, be sure browser must support this,in old browser you should include polyfill.
require es6 `Object.assign` and `Promise`,this lib build on the top of es6 fetch API.
In Node.js env,will use [node-fetch](https://github.com/bitinn/node-fetch) as fetch polyfill.

## Contributing
##### dev
this lib write with typescript, run `typings install` to install require typescript d.ts file, edit *.ts file then test it,

##### test
test with `mocha`,run `npm run test` to test it

##### commit and release
after test success,run `npm run release` to commit it to github and npm.

##### require
- spring java backend service [java code](https://github.com/gwuhaolin/spring-data-rest-js-backend) for test use
- **tsc** to compile typescript file
- **webpack** for pack commonjs to browser
- **mocha** for test
- **typings** for install require typescript d.ts file

## License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016 HalWu