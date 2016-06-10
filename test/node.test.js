'use strict';
let assert = require('assert');
let fetch = require('isomorphic-fetch');
let springRest = require('../index');

beforeEach(()=> {
    springRest.config.basePath = 'http://api.ourapp.date/';
    springRest.config.restBasePath = 'http://api.ourapp.date/';
});

describe('Request', ()=> {

    it('query', ()=> {
        let request = springRest.get(springRest.config.basePath).query({page: 0, size: 2});
        assert.equal(request.options.url, springRest.config.basePath + '?page=0&size=2');
    });

    it('body', ()=> {
        let param = {name: '吴浩麟', age: 23};
        let request = springRest.post('/').body(param);
        assert.deepEqual(request.options.body, JSON.stringify(param));
        assert.equal(request.options.headers['Content-Type'], 'application/json');
    });

    it('follow', ()=> {
        return springRest.get('http://api.ourapp.date/cloudFiles/26').follow(['author', 'self', 'self', 'notes', 'self']);
    });

    it('data', ()=> {
        return springRest.get('http://api.ourapp.date/cloudFiles/26').data();
    });

    it('mock', (done)=> {
        springRest.get('http://api.ourapp.date/cloudFiles/26').data().then(data=> {
            springRest.mock(data).follow(['author', 'self', 'self', 'notes', 'self']).then(()=> {
                done();
            }).catch(err=> {
                done(err);
            })
        }).catch(err=> {
            done(err);
        })
    });

    it('mock', (done)=> {
        springRest.get('http://api.ourapp.date/cloudFiles/26').data().then(data=> {
            springRest.mock(data).follow(['author', 'self#4%^&']).then(()=> {
                done('should be 404 error');
            }).catch(()=> {
                done();
            })
        }).catch(err=> {
            done(err);
        })
    });

});

describe('Entity', ()=> {

    let CloudFile = springRest.extend('cloudFiles');
    let User = springRest.extend('users');

    it('save-create', ()=> {
        let cloudFile = new CloudFile();
        cloudFile.data = {key: '232$#ds'};
        return cloudFile.save();
    });

    it('save-update', ()=> {
        let cloudFile = new CloudFile();
        cloudFile.id = 26;
        cloudFile.data = {key: '232$#ds'};
        return cloudFile.save();
    });

    // it('delete', ()=> {
    //     let cloudFile = new CloudFile();
    //     cloudFile.id = 52;
    //     return cloudFile.delete();
    // });

    it('fetch', ()=> {
        let cloudFile = new CloudFile();
        cloudFile.id = 26;
        return cloudFile.fetch();
    });

    it('findOne', ()=> {
        return CloudFile.findOne(42);
    });

    it('findAll', ()=> {
        return CloudFile.findAll({page: 1, size: 1, sort: 'key,desc'});
    });

    it('findAll', ()=> {
        return User.findAll();
    });
});

describe('actuation', ()=> {

    let CloudFile = springRest.extend('cloudFiles');
    let User = springRest.extend('users');

    it('Entity follow', ()=> {
        let cloudFile = new CloudFile();
        cloudFile.id = 26;
        return cloudFile.follow(['author', 'self', 'self', 'notes', 'self']);
    })
    
});