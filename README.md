# Spring Data Rest JavaScript Library
[![Build Status](https://travis-ci.org/gwuhaolin/spring-data-rest.js.svg?branch=master)](https://travis-ci.org/gwuhaolin/spring-data-rest.js)

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
**add query param in url**
```javascript
let request = springRest.request.get(springRest.request.config.restBasePath).query({page: 0, size: 2});
assert.equal(request.options.url, springRest.request.config.restBasePath + '?page=0&size=2');
```
**send json as request body**
```javascript
let param = {name: '吴浩麟', age: 23};
let request = springRest.request.post('/').body(param);
assert.deepEqual(request.options.body, JSON.stringify(param));
assert.equal(request.options.headers['Content-Type'], 'application/json');
```

#### Config Request
```javascript
springRest.request.config = {
    /**
     * options used to every fetch request
     */
    globalOptions: {},
    /**
     * API base url
     */
    basePath: 'http://api.hostname',
    /**
     * springRestRest data rest base url
     * @type {string}
     */
    restBasePath: 'http://api.hostname/rest'
};
```

#### Fetch API Global Option
fetch API request options
see [detail](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
```javascript
springRest.request.config.globalOptions = {
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

**get response data**
```javascript
let classroom = new Classroom({name: 'D1143'});
    classroom.save().then(function () {
    return springRest.request.get(`${Classroom.entityBaseURL}/${classroom.id}`).send();
}).then(function (data) {
    assert.equal(data.name, 'D1143');
    done();
}).catch(function (err) {
    done(err);
});
```

**follow links**
```javascript
let student = new Student({name: '吴浩麟', age: 23});
    let academy = new Academy({name: '计算机学院'});
    student.set('academy', academy);
    student.save().then(()=> {
    return springRest.request.get(`${Student.entityBaseURL}/${student.id}`).follow(['self', 'academy', 'self', 'self']);
}).then((data)=> {
    assert.equal(data.name, '计算机学院');
    done();
}).catch(err=> {
    done(err);
});
```


## Entity

**extend**
get a class by entity path name
```javascript
let Student = springRest.extend('students');
let Academy = springRest.extend('academies');
let Classroom = springRest.extend('classrooms');
```

**create entity**
class ref to spring data entity,use entity class to make a new entity instance and then create it on service.
```javascript
let student = new Student();
   student.set('name', 'Tom');
   student.save().then(()=> {
   assert(student.id != null);
   return springRest.request.get(`${Student.entityBaseURL}/${student.id}`).send();
}).then((data)=> {
   assert.equal(data.name, 'Tom');
   done();
}).catch(err=> {
   done(err);
})
```

**id**
the entity instance's id.
for a existed entity set instance's id then you can use instance
- `fetch` method to fetch entity's data
- `save` method to update entity's updated properties
- `delete` method to delete this entity
```javascript
let student = new Student();
student.id = 26;
```

**update entity**
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

**save or update**
create or update entity
if id properties is set,then will send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
if id is null,then will send HTTP POST request to create an entity

**delete entity**
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

**fetch data**
entity's data properties store in data
```javascript
let name = 'Ace';
   let age = 20;
   let ace = new Student({name: name, age: age});
   let student = new Student();
   ace.save().then(()=> {
   student.id = ace.id;
   return student.fetch();
}).then(data=> {
   assert.equal(data.name, name);
   assert.equal(data.age, age);
   assert.equal(student.get('name'), name);
   assert.equal(student.get('age'), age);
   done();
}).catch(err=> {
   done(err);
});
```

#### Entity static methods
**findOne**
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

**findAll**
find entity list with page and sort
method param opts = {
    page:'the page number to access (0 indexed, defaults to 0)',
    size:'the page size requested (defaults to 20)',
    sort:'a collection of sort directives in the format ($propertyName,)+[asc|desc]?  etc:name,age,desc'
}
```javascript
let size = 13;
let pageIndex = 1;
Student.findAll({page: pageIndex, size: size, sort: 'age,desc'}).then(function (arr) {
    assert(Array.isArray(arr));
    assert.equal(arr.length, size);
    assert.equal(arr.page.number, pageIndex);
    assert.equal(arr.page.size, size);
    assert.equal(springRest.extend.isEntity(arr[0]), true);
    assert.equal(arr[0].constructor, Student);
    for (let i = 1; i < size - 2; i++) {
        assert.equal(arr[i].get('age') > arr[i + 1].get('age'), true);
        assert.equal(arr[i - 1].get('age') > arr[i].get('age'), true);
    }
    done();
}).catch(req=> {
    done(req);
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

## Example
- [example javascript in mocha test](https://github.com/gwuhaolin/spring-data-rest.js/blob/master/test/node.test.js)
- [example java spring data rest code](https://github.com/gwuhaolin/spring-data-rest-js-backend)

## Browser Support
require es6 `Object.assign` and `Promise`,this lib build on the top of es6 fetch API,use isomorphic-fetch as polyfill.
[Browser Support](https://github.com/github/fetch#browser-support)

## License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016 HalWu