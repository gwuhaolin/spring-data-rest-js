'use strict';
let assert = require('assert');
let springRest = require('../index');

springRest.request.config.restBasePath = 'http://localhost:8080/rest/';
let Student = springRest.extend('students');
let Academy = springRest.extend('academies');
let Classroom = springRest.extend('classrooms');

describe('Request', ()=> {

    it('query', ()=> {
        let request = springRest.request.get(springRest.request.config.restBasePath).query({page: 0, size: 2});
        assert.equal(request.options.url, springRest.request.config.restBasePath + '?page=0&size=2');
    });

    it('body', ()=> {
        let param = {name: '吴浩麟', age: 23};
        let request = springRest.request.post('/').body(param);
        assert.deepEqual(request.options.body, JSON.stringify(param));
        assert.equal(request.options.headers['Content-Type'], 'application/json');
    });

    it('follow', (done)=> {
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
    });

    it('data', (done)=> {
        let classroom = new Classroom({name: 'D1143'});
        classroom.save().then(function () {
            return springRest.request.get(`${Classroom.entityBaseURL}/${classroom.id}`).data();
        }).then(function (data) {
            assert.equal(data.name, 'D1143');
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    it('mockRequest-ok', (done)=> {
        let student = new Student({name: 'HalWu', age: 18});
        let academy = new Academy({name: 'Physics Academy'});
        student.set('academy', academy);
        student.save().then((data)=> {
            return springRest.request.mockRequest(data).follow(['self', 'academy', 'self', 'self']);
        }).then((data)=> {
            assert.equal(data.name, 'Physics Academy');
            done();
        }).catch(err=> {
            done(err);
        });
    });

    it('mockRequest-404', (done)=> {
        let student = new Student({name: 'HalWu', age: 18});
        let academy = new Academy({name: 'Physics Academy'});
        student.set('academy', academy);
        student.save().then((data)=> {
            return springRest.request.mockRequest(data).follow(['self404', 'academy', 'self', 'self']);
        }).then(()=> {
            done('should be 404');
        }).catch(()=> {
            done();
        });
    });

});

describe('Entity', ()=> {

    it('save-create', (done)=> {
        let student = new Student();
        student.set('name', 'Tom');
        student.save().then(()=> {
            assert(student.id != null);
            return springRest.request.get(`${Student.entityBaseURL}/${student.id}`).data();
        }).then((data)=> {
            assert.equal(data.name, 'Tom');
            done();
        }).catch(err=> {
            done(err);
        })
    });

    it('save-update', (done)=> {
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
    });

    it('delete', (done)=> {
        let student = new Student();
        student.save().then(()=> {
            return student.delete();
        }).then(()=> {
            return Student.findOne(student.id);
        }).catch(err=> {
            assert.equal(err.response.status, 404);
            done();
        });
    });

    it('fetch', (done)=> {
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
    });

    it('findOne-ok', (done)=> {
        let classRoom = new Classroom({name: '东16412'});
        classRoom.save().then(()=> {
            return Classroom.findOne(classRoom.id);
        }).then(entity=> {
            assert.equal(entity.get('name'), '东16412');
            done();
        }).catch(err=> {
            done(err);
        });
    });

    it('findOne-404', (done)=> {
        Student.findOne('404404').then(()=> {
            done('should be 404 error');
        }).catch(req=> {
            assert.equal(req.response.status, 404);
            done();
        })
    });

    describe('findAll', ()=> {

        //insert 50 student first
        before((done)=> {
            let promiseList = [];
            for (let i = 0; i < 50; i++) {
                let student = new Student({name: `student${i}`, age: i});
                promiseList.push(student.save());
            }
            Promise.all(promiseList).then(()=> {
                done();
            }).catch(req=> {
                done(req);
            });
        });

        it('findAll-with options', (done)=> {
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
        });

    });

    it('follow', (done)=> {
        let student = new Student({name: '吴浩麟', age: 23});
        let academy = new Academy({name: '计算机学院'});
        student.set('academy', academy);
        student.save().then(()=> {
            return student.follow(['academy']);
        }).then((data)=> {
            assert.equal(data.name, '计算机学院');
            done();
        }).catch(err=> {
            done(err);
        });
    });

});