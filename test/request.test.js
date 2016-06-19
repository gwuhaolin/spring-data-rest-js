"use strict";
var assert = require('assert');
var spring = require('../node');
spring.requestConfig.baseURL = 'http://localhost:8080/';
spring.entityConfig.restBaseURL = 'http://localhost:8080/rest/';
var Student = spring.extend('students');
var Academy = spring.extend('academies');
var Classroom = spring.extend('classrooms');
describe('class:Request', function () {
    it('auto revise url', function () {
        var req = spring.get('//hello/name//');
        assert.equal(req.options.url, "http://localhost:8080/hello/name/");
        var req2 = spring.get('https://google.com//hello/name');
        assert.equal(req2.options.url, "https://google.com/hello/name");
    });
    describe('attr:config', function () {
        describe('attr:config.globalFetchOptions', function () {
            it('ok', function () {
                spring.requestConfig.globalFetchOptions = {
                    credentials: 'same-origin',
                    headers: {
                        'X': 'x'
                    }
                };
                var req = spring.get('/hello');
                assert.equal(req.options.url, "http://localhost:8080/hello");
                assert.equal(req.options.credentials, 'same-origin');
                assert.deepEqual(req.options.headers, {
                    'X': 'x'
                });
            });
        });
        describe('attr:config.fetchStartHook', function () {
            it('ok', function (done) {
                var flag = 'old';
                var request = spring.get(spring.requestConfig.baseURL);
                spring.requestConfig.fetchStartHook = function (req) {
                    assert.equal(req, request);
                    flag = 'new';
                };
                request.send().then(function () {
                    assert.equal(flag, 'new');
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
            after(function () {
                spring.requestConfig.fetchStartHook = null;
            });
        });
        describe('attr:config.fetchEndHook', function () {
            it('ok', function (done) {
                var flag = 'old';
                var request = spring.get(spring.requestConfig.baseURL);
                spring.requestConfig.fetchEndHook = function (req) {
                    assert.equal(req, request);
                    flag = 'new';
                };
                request.send().then(function () {
                    assert.equal(flag, 'new');
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
            after(function () {
                spring.requestConfig.fetchEndHook = null;
            });
        });
    });
    describe('method:queryParam', function () {
        it('ok', function () {
            var param1 = { name: '中' };
            var param2 = { age: 23, academy: 'physics' };
            var request = spring.get(spring.requestConfig.baseURL).queryParam(param1);
            assert.equal(request.options.url, 'http://localhost:8080/?name=中');
            request.queryParam(param2);
            assert.equal(request.options.url, 'http://localhost:8080/?age=23&academy=physics');
        });
    });
    describe('method:jsonBody', function () {
        it('ok', function () {
            var param = { name: '吴浩麟', age: 23 };
            var request = spring.post('/').jsonBody(param);
            assert.equal(request.options.body, JSON.stringify(param));
            assert.equal(request.options.headers['Content-Type'], 'application/json');
        });
    });
    describe('method:formBody', function () {
        it('ok', function (done) {
            var param = { name: '中国', age: 123 };
            var request = spring.post('/postForm').formBody(param);
            assert.equal(request.options.headers['Content-Type'], 'application/x-www-form-urlencoded');
            request.send().then(function (json) {
                assert.equal(json.name, '中国');
                assert.equal(json.age, 123);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:send', function () {
        it('response json type', function (done) {
            var classroom = new Classroom({ name: 'D1143' });
            var request;
            classroom.save().then(function () {
                request = spring.get(Classroom.entityBaseURL + "/" + classroom.id);
                return request.send();
            }).then(function (json) {
                assert.equal(json.constructor, Object);
                assert.equal(json.name, 'D1143');
                assert.deepEqual(json, request.responseData);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('response status ok with null', function (done) {
            var classroom = new Classroom({ name: 'D1143' });
            classroom.save().then(function () {
                return spring.get(Classroom.entityBaseURL + "/" + classroom.id).send();
            }).then(function (json) {
                assert.equal(json.constructor, Object);
                assert.equal(json.name, 'D1143');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('response status ok with string', function (done) {
            spring.get("/returnString").send().then(function (str) {
                assert.equal(str.constructor, String);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('response status ok with string-with auto send', function (done) {
            spring.get("/returnString").send().then(function (str) {
                assert.equal(str.constructor, String);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('response 404 error', function (done) {
            spring.get("/$%404").send().then(function () {
                done('should be 404 error');
            }).catch(function (err) {
                assert.equal(err.response.status, 404);
                done();
            });
        });
        it('response 404 error-with auto send', function (done) {
            spring.get("/$%404").send().then(function () {
                done('should be 404 error');
            }).catch(function (err) {
                assert.equal(err.response.status, 404);
                done();
            });
        });
        it('response error with json', function (done) {
            spring.get("/errorWithJSON").send().then(function () {
                done('should be 404 error');
            }).catch(function (req) {
                assert.equal(req.response.status, 500);
                assert.equal(req.error.constructor, Object);
                assert.equal(req.error.message, "for errorWithJSON test");
                done();
            });
        });
        it('response error with json-with auto send', function (done) {
            spring.get("/errorWithJSON").send().then(function () {
                done('should be 404 error');
            }).catch(function (req) {
                assert.equal(req.response.status, 500);
                assert.equal(req.error.constructor, Object);
                assert.equal(req.error.message, "for errorWithJSON test");
                done();
            });
        });
    });
    describe('method:follow', function () {
        it('ok', function (done) {
            var student = new Student({ name: '吴浩麟', age: 23 });
            var academy = new Academy({ name: '计算机学院' });
            student.set('academy', academy);
            student.save().then(function () {
                return spring.get(Student.entityBaseURL + "/" + student.id).follow(['self', 'academy', 'self', 'self']);
            }).then(function (json) {
                assert.equal(json.name, '计算机学院');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:mockRequest', function () {
        it('ok', function (done) {
            var student = new Student({ name: 'HalWu', age: 18 });
            var academy = new Academy({ name: 'Physics Academy' });
            student.set('academy', academy);
            student.save().then(function (json) {
                return spring.mockRequest(json).follow(['self', 'academy', 'self', 'self']);
            }).then(function (json) {
                assert.equal(json.name, 'Physics Academy');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('404', function (done) {
            var student = new Student({ name: 'HalWu', age: 18 });
            var academy = new Academy({ name: 'Physics Academy' });
            student.set('academy', academy);
            student.save().then(function (json) {
                return spring.mockRequest(json).follow(['self404', 'academy', 'self', 'self']);
            }).then(function () {
                done('should be 404');
            }).catch(function () {
                done();
            });
        });
    });
});
//# sourceMappingURL=request.test.js.map