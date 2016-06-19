"use strict";
var assert = require('assert');
var spring = require('../node');
spring.requestConfig.baseURL = 'http://localhost:8080///';
spring.entityConfig.restBaseURL = 'http://localhost:8080//rest//';
var Student = spring.extend('students');
var Academy = spring.extend('academies');
var Classroom = spring.extend('classrooms');
describe('class:Class', function () {
    describe('method:save', function () {
        it('create', function (done) {
            var student = new Student();
            student.set('name', 'Tom');
            student.save().then(function () {
                assert(student.id != null);
                return spring.get(Student.entityBaseURL + "/" + student.id).send();
            }).then(function (json) {
                assert.equal(json.name, 'Tom');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('update', function (done) {
            var academy = new Academy({ name: 'Math' });
            academy.save().then(function () {
                academy.set('name', 'Physics');
                return academy.save();
            }).then(function () {
                assert.deepEqual(academy.get('name'), 'Physics');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:delete', function () {
        it('ok', function (done) {
            var student = new Student();
            student.save().then(function () {
                return student.remove();
            }).then(function () {
                return Student.findOne(student.id);
            }).catch(function (err) {
                assert.equal(err.response.status, 404);
                done();
            });
        });
    });
    describe('method:fetch', function () {
        it('fetch', function (done) {
            var name = 'Ace';
            var age = 20;
            var ace = new Student({ name: name, age: age });
            var student = new Student();
            ace.save().then(function () {
                student.id = ace.id;
                return student.fetch();
            }).then(function (json) {
                assert.equal(json.name, name);
                assert.equal(json.age, age);
                assert.equal(student.get('name'), name);
                assert.equal(student.get('age'), age);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:follow', function () {
        it('follow', function (done) {
            var student = new Student({ name: '吴浩麟', age: 23 });
            var academy = new Academy({ name: '计算机学院' });
            student.set('academy', academy);
            student.save().then(function () {
                return student.follow(['academy']);
            }).then(function (json) {
                assert.equal(json.name, '计算机学院');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:findOne', function () {
        it('ok', function (done) {
            var classRoom = new Classroom({ name: '东16412' });
            classRoom.save().then(function () {
                return Classroom.findOne(classRoom.id);
            }).then(function (entity) {
                assert.equal(entity.get('name'), '东16412');
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('404', function (done) {
            Student.findOne('404404').then(function () {
                done('should be 404 error');
            }).catch(function (req) {
                assert.equal(req.response.status, 404);
                done();
            });
        });
        it('projection support', function (done) {
            var student = new Student({ name: 'HalWu', age: 23 });
            student.save().then(function () {
                return Student.findOne(student.id, { projection: 'NoAge' });
            }).then(function (entity) {
                assert.equal(entity.get('name'), 'HalWu');
                assert.equal(entity.get('age'), null);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    describe('method:findAll', function () {
        //insert 50 student first
        before(function (done) {
            var promiseList = [];
            for (var i = 0; i < 30; i++) {
                var student = new Student({ name: "student" + i, age: i });
                promiseList.push(student.save());
            }
            Promise.all(promiseList).then(function () {
                done();
            }).catch(function (req) {
                done(req);
            });
        });
        it('ok', function (done) {
            var size = 13;
            var pageIndex = 1;
            Student.findAll({ page: pageIndex, size: size, sort: 'age,desc' }).then(function (arr) {
                assert(Array.isArray(arr));
                assert.equal(arr.length, size);
                assert.equal(arr[0].constructor, Student);
                for (var i = 1; i < size - 2; i++) {
                    assert.equal(arr[i].get('age') > arr[i + 1].get('age'), true);
                }
                done();
            }).catch(function (req) {
                done(req);
            });
        });
    });
    describe('method:search', function () {
        //insert 50 student first
        before(function (done) {
            var promiseList = [];
            for (var i = 1000; i < 1030; i++) {
                var student = new Student({ name: "student" + i, age: i });
                promiseList.push(student.save());
            }
            Promise.all(promiseList).then(function () {
                done();
            }).catch(function (req) {
                done(req);
            });
        });
        it('search one entity', function (done) {
            Student.search('nameEquals', { name: 'student1015' }).then(function (entity) {
                assert.equal(entity.get('age'), 1015);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('search entity array', function (done) {
            Student.search('nameContaining', { keyword: '1023' }).then(function (entityList) {
                assert.equal(entityList.constructor, Array);
                assert.equal(entityList.length, 1);
                assert.equal(entityList[0].get('age'), 1023);
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('search with pageable', function (done) {
            Student.search('ageGreaterThan', {
                age: 1013,
                page: 1,
                size: 5,
                sort: 'age,desc'
            }).then(function (entityList) {
                assert.equal(entityList.constructor, Array);
                assert.equal(entityList.length, 5);
                for (var i = 0; i < entityList.length - 2; i++) {
                    assert(entityList[i].get('age') > entityList[i + 1].get('age'));
                }
                done();
            }).catch(function (err) {
                done(err);
            });
        });
        it('404 error', function (done) {
            Student.search('nameEquals', { name: 'student101512' }).then(function () {
                done('should be 404 error');
            }).catch(function (err) {
                assert.equal(err.response.status, 404);
                done();
            });
        });
    });
});
//# sourceMappingURL=entity.test.js.map