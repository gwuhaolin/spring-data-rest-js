'use strict';
let assert = require('assert');
let spring = require('../node');

spring.requestConfig.baseURL = 'http://localhost:8080///';
spring.entityConfig.restBaseURL = 'http://localhost:8080//rest//';
let Student = spring.extend('students');
let Academy = spring.extend('academies');
let Classroom = spring.extend('classrooms');

describe('play spring', ()=> {

    it('array relation when create', (done)=> {
        let tom = new Student({name: 'tom', age: 13});
        let sql = new Classroom({name: 'learn SQL'});
        let js = new Classroom({name: 'learn Javascript'});
        let java = new Classroom({name: 'learn Java'});
        tom.set('classrooms', [sql, js, java]);

        tom.save().then(()=> {
            return tom.follow(['classrooms']);
        }).then(json=> {
            let classrooms = Classroom.jsonToEntityList(json);
            assert.equal(classrooms.length, 3);
            classrooms.forEach(one=> {
                assert(one.id === sql.id || one.id === js.id || one.id === java.id);
            });
            done();
        }).catch(err=> {
            done(err);
        })
    });

    it('array relation when update', (done)=> {
        let tom = new Student({name: 'tom', age: 13});
        let sql = new Classroom({name: 'learn SQL'});
        let js = new Classroom({name: 'learn Javascript'});
        let java = new Classroom({name: 'learn Java'});

        tom.save().then(()=> {
            tom.set('age', 100);
            tom.set('classrooms', [sql, js, java]);
            return tom.save();
        }).then(()=> {
            assert.equal(tom.get('age'), 100);
            return tom.follow(['classrooms']);
        }).then(json=> {
            let classrooms = Classroom.jsonToEntityList(json);
            assert.equal(classrooms.length, 3);
            classrooms.forEach(one=> {
                assert(one.id === sql.id || one.id === js.id || one.id === java.id);
            });
            done();
        }).catch(err=> {
            done(err);
        })
    });

    it('auto update relation when update', (done)=> {
        let tom = new Student({name: 'tom', age: 13});
        let sql = new Classroom({name: 'learn SQL'});
        let js = new Classroom({name: 'learn Javascript'});
        let java = new Classroom({name: 'learn Java'});

        tom.save().then(()=> {
            tom.set('classrooms', [sql, js, java]);
            return tom.save();
        }).then(()=> {
            return tom.follow(['classrooms']);
        }).then(json=> {
            let classrooms = Classroom.jsonToEntityList(json);
            assert.equal(classrooms.length, 3);
            classrooms.forEach(one=> {
                one.set('name', 'new name');
            });
            tom.set('age', 100);
            tom.set('classrooms', classrooms);
            return tom.save();
        }).then(()=> {
            assert.equal(tom.get('age'), 100);
            return tom.follow(['classrooms']);
        }).then(json=> {
            Classroom.jsonToEntityList(json).forEach(one=> {
                assert.equal(one.get('name'), 'new name');
                assert(one.id === sql.id || one.id === js.id || one.id === java.id);
            });
            done();
        }).catch(err=> {
            done(err);
        })
    });

    it('auto create relation', (done)=> {
        let tom = new Student({name: 'tom', age: 13});
        let ame = new Student({name: 'ame', age: 12});
        let alice = new Student({name: 'alice', age: 15});

        let physics = new Academy({name: 'Physics Academy'});
        let math = new Academy({name: 'Math Academy'});
        let computer = new Academy({name: 'Computer Academy'});

        let sql = new Classroom({name: 'learn SQL'});
        let js = new Classroom({name: 'learn Javascript'});
        let java = new Classroom({name: 'learn Java'});

        tom.set('friends', [ame]);
        tom.set('academy', physics);
        tom.set('classrooms', [sql, java]);

        ame.set('friends', []);
        ame.set('academy', math);
        ame.set('classrooms', [sql, js, java]);

        alice.set('friends', [ame, tom]);
        alice.set('academy', computer);
        alice.set('classrooms', [sql, js, java]);

        alice.save().then(()=> {
            assert(tom.id != null);
            assert(ame.id != null);
            assert(alice.id != null);

            assert(physics.id != null);
            assert(math.id != null);
            assert(computer.id != null);

            assert(sql.id != null);
            assert(js.id != null);
            assert(java.id != null);

            done();
        }).catch(err=> {
            done(err);
        })
    })
});