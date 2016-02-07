var BeanInvoker = require('../index.js').BeanInvoker;
var assert = require('assert');

describe('BeanInvoker', function() {
    it('should invoke "methodName" where there exists', function(done) {
        BeanInvoker.invoke.apply({
            echo: function(msg) {
                return 'echo back ' + msg;
            }
        }, [{
            serviceId: 'test',
            methodName: 'echo',
            params: ['hello']
        }, function(err, response) {
            assert.equal('echo back hello', response);
            done(err);
        }]);
    });

    it('should recogenize flattend arguments', function(done) {
        BeanInvoker.invoke.apply({
            echo: function(msg) {
                return 'echo back ' + msg;
            }
        }, [
            {},
            'test',
            'echo',
            ['hello'],
            function(err, response) {
                assert.equal('echo back hello', response);
                done(err);
            }
        ]);
    });

    it('should invoke "invokeMethodName" where both exists', function(done) {
        BeanInvoker.invoke.apply({
            echo: function(msg) {
                return 'echo back ' + msg;
            },
            invokeEcho: function(headers, params, callback) {
                var back = this.echo.apply(this, params) + ' invoked';
                callback(null, back);
            }
        }, [{
            serviceId: 'test',
            methodName: 'echo',
            params: ['hello']
        }, function(err, response) {
            assert.equal('echo back hello invoked', response);
            done(err);
        }]);
    });

    it('should raise no such service err when bean is empty', function(done) {
        BeanInvoker.invoke.apply({}, [{
            serviceId: 'test',
            methodName: 'echo',
            params: ['hello']
        }, function(err, response) {
            done(err ? null : 'no error');
        }]);
    });

    it('should raise no such method err when method is undefined', function(done) {
        BeanInvoker.invoke.apply({
            noMethod: function() {
            }
        }, [{
            serviceId: 'test',
            methodName: 'echo',
            params: ['hello']
        }, function(err, response) {
            done(err ? null : 'no error');
        }]);
    });

    it('should raise error when invoke error', function(done) {
        BeanInvoker.invoke.apply({
            err: function() {
                throw 'has err 01'
            }
        }, [{
            serviceId: 'test',
            methodName: 'err',
            params: []
        }, function(err, response) {
            done(err == 'has err 01' ? null : 'no error');
        }]);
    });
});
