'use strict';
let assert = require('assert');
let springRest = require('../index');

springRest.request.config.baseURL = 'http://localhost:8080/';
springRest.entity.config.restBaseURL = 'http://localhost:8080/rest/';
let Student = springRest.entity.extend('students');
let Academy = springRest.entity.extend('academies');
let Classroom = springRest.entity.extend('classrooms');

describe('class:Request', ()=> {

    describe('attr:config', ()=> {

        describe('attr:config.globalFetchOptions', ()=> {

            it('ok', function () {
                springRest.request.config.globalFetchOptions = {
                    credentials: 'same-origin',
                    headers: {
                        'X': 'x'
                    }
                };
                let req = springRest.request.get('/hello');
                assert.equal(req.options.url, `/hello`);
                assert.equal(req.options.credentials, 'same-origin');
                assert.deepEqual(req.options.headers, {
                    'X': 'x'
                })
            });
        });

        describe('attr:config.fetchStartHook', ()=> {

            it('ok', (done)=> {
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
            });

            after(()=> {
                springRest.request.config.fetchStartHook = null;
            });

        });

        describe('attr:config.fetchEndHook', ()=> {

            it('ok', (done)=> {
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
            });

            after(()=> {
                springRest.request.config.fetchEndHook = null;
            });

        });

    });

    describe('method:queryParam', ()=> {

        it('ok', ()=> {
            let param1 = {name: '中'};
            let param2 = {age: 23, academy: 'physics'};
            let request = springRest.request.get(springRest.request.config.baseURL).queryParam(param1);
            assert.equal(request.options.url, springRest.request.config.baseURL + '?name=中');
            request.queryParam(param2);
            assert.equal(request.options.url, springRest.request.config.baseURL + '?age=23&academy=physics');
        });
    });

    describe('method:jsonBody', ()=> {

        it('ok', ()=> {
            let param = {name: '吴浩麟', age: 23};
            let request = springRest.request.post('/').jsonBody(param);
            assert.equal(request.options.body, JSON.stringify(param));
            assert.equal(request.options.headers['Content-Type'], 'application/json');
        });

    });

    describe('method:formBody', ()=> {

        it('ok', ()=> {
            let param = {name: '中国', age: 123};
            let request = springRest.request.post('/').formBody(param);
            assert.equal(request.options.body, 'name%3D%E4%B8%AD%E5%9B%BD&age%3D123');
            assert.equal(request.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
        });

    });

    describe('method:send', ()=> {

        it('response json type', (done)=> {
            let classroom = new Classroom({name: 'D1143'});
            let request;
            classroom.save().then(function () {
                request = springRest.request.get(`${Classroom.entityBaseURL}/${classroom.id}`);
                return request.send();
            }).then(json=> {
                assert.equal(json.constructor, Object);
                assert.equal(json.name, 'D1143');
                assert.deepEqual(json, request.responseData);
                done();
            }).catch(err=> {
                done(err);
            });
        });

        it('response status ok with null', (done)=> {
            let classroom = new Classroom({name: 'D1143'});
            classroom.save().then(()=> {
                return springRest.request.get(`${Classroom.entityBaseURL}/${classroom.id}`).send();
            }).then(json=> {
                assert.equal(json.constructor, Object);
                assert.equal(json.name, 'D1143');
                done();
            }).catch(err=> {
                done(err);
            });
        });

        it('response status ok with string', (done)=> {
            springRest.request.get(`http://localhost:8080/returnString`).send().then((str)=> {
                assert.equal(str.constructor, String);
                done();
            }).catch(err=> {
                done(err);
            });
        });

        it('response 404 error', (done)=> {
            springRest.request.get(`${springRest.request.config.baseURL}$%404`).send().then(()=> {
                done('should be 404 error');
            }).catch(err=> {
                assert.equal(err.response.status, 404);
                done();
            });
        });

    });

    describe('method:follow', ()=> {

        it('ok', (done)=> {
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
        });

    });

    describe('method:mockRequest', ()=> {

        it('ok', (done)=> {
            let student = new Student({name: 'HalWu', age: 18});
            let academy = new Academy({name: 'Physics Academy'});
            student.set('academy', academy);
            student.save().then((json)=> {
                return springRest.request.mockRequest(json).follow(['self', 'academy', 'self', 'self']);
            }).then((json)=> {
                assert.equal(json.name, 'Physics Academy');
                done();
            }).catch(err=> {
                done(err);
            });
        });

        it('404', (done)=> {
            let student = new Student({name: 'HalWu', age: 18});
            let academy = new Academy({name: 'Physics Academy'});
            student.set('academy', academy);
            student.save().then((json)=> {
                return springRest.request.mockRequest(json).follow(['self404', 'academy', 'self', 'self']);
            }).then(()=> {
                done('should be 404');
            }).catch(()=> {
                done();
            });
        });

    });

});