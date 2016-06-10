# Spring Data Rest JavaScript Library

[Spring Data Rest](http://projects.springRest.io/springRest-data-rest/) is makes it easy to build hypermedia-driven REST web services. This lib provider
useful util to play with the service in js.

## Installation
```sh
$ npm install springRest-data-rest.js --save
```

## Usage

### Send Request
##### Build Request
**add query param in url**
```javascript
let request = springRest.get(basePath).query({page: 0, size: 2});
assert.equal(request.options.url, basePath + '?page=0&size=2');
```
**send json as request body**
```javascript
let param = {name: '吴浩麟', age: 23};
let request = springRest.post('/').body(param);
assert.deepEqual(request.options.body, JSON.stringify(param));
assert.equal(request.options.headers['Content-Type'], 'application/json');
```

##### Get Response
request return response in `Promise`,if request success `Promise` will resolve json data,if will reject a `Request` object will `Request.error` store error reason
**follow links**
```javascript
springRest.get('http://api.ourapp.date/cloudFiles/26').follow(['author', 'self', 'self', 'notes', 'self']).then(data=>{
    console.log(data);
}).catch(err=>{
    console.error(err);
})
```
**get response data**
```javascript
springRest.get('http://api.ourapp.date/cloudFiles/26').data().then(data=>{
    console.log(data);
},err=>{
    console.error(err);
})
```

### Entity Operation
##### Instance methods
**extend**
build a class by entity path name
```javascript
let CloudFile = springRest.extend('cloudFiles');
let User = springRest.extend('users');
```
**id**
the entity instance's id.
for a existed entity set instance's id then you can use instance
- `fetch` method to fetch entity's data
- `save` method to update entity's updated properties
- `delete` method to delete this entity
```javascript
let cloudFile = new CloudFile();
cloudFile.id = 26;
```
**data**
entity's data properties store in data
```javascript
let cloudFile = new CloudFile();
cloudFile.id = 26;
cloudFile.fetch().then(()=>{
    console.log(cloudFile.data);
})
```
**save or update**
create or update entity
if id properties is set,then will send HTTP PATCH request to update an entity(will watch change in data properties to track change fields)
if id is null,then will send HTTP POST request to create an entity
```javascript
//save-create
let cloudFile = new CloudFile();
cloudFile.data = {key: '232$#ds'};
cloudFile.save().then(data=>{}).catch(err=>{});
```
```javascript
//save-update
let cloudFile = new CloudFile();
cloudFile.id = 26;
cloudFile.data = {key: '232$#ds'};
cloudFile.save().then(data=>{}).catch(err=>{});
```
**delete**
```javascript
let cloudFile = new CloudFile();
cloudFile.id = 52;
cloudFile.delete().then(data=>{}).catch(err=>{})
```
##### Class static methods
**findOne**
```javascript
CloudFile.findOne(42).then(()=>{},err=>{})
```
**findAll**
find entity list with page and sort
method param opts = {
    page:'the page number to access (0 indexed, defaults to 0)',
    size:'the page size requested (defaults to 20)',
    sort:'a collection of sort directives in the format ($propertyName,)+[asc|desc]?  etc:name,age,desc'
}
```javascript
CloudFile.findAll({page: 1, size: 1, sort: 'key,desc'}).then(()=>{},err=>{})
```
**delete**
```javascript
CloudFile.delete(42).then(()=>{},err=>{})
```

### Error Handle
all error will be reject by return promise,and the error object is instance of `Request` will `Request.error` properties store error reason
```javascript
CloudFile.findOne(42).then(()=>{}).catch(req=>{
    console.error(req.error);
    console.log(req.status);
    console.log(req.statusText);
})
```
### Config
```javascript
config = {
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

### Global Option
fetch API request options
see [detail](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
```javascript
globalOptions = {
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

## Browser Support
this lib build on the top of es6 fetch API,use isomorphic-fetch as polyfill.
[Browser Support](https://github.com/github/fetch#browser-support)
