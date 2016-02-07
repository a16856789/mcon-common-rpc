var assert = require("assert");
var SimpleMsgRpc = require('../simple-msg-rpc');

describe('SimpleMsgRpc on a sync envirnment', function() {

    SimpleMsgRpc.DEBUG = false;

    var rpcA = new SimpleMsgRpc({
        msgAdapter: {
            send: function(message) {
                rpcB.processMessage(message);
            }
        },
        requestProcessor: {
            invoke: function(headers, serviceId, methodName, params, callback) {
            }
        }
    });
    var rpcB = new SimpleMsgRpc({
        msgAdapter: {
            send: function(message) {
                rpcA.processMessage(message);
            }
        },
        requestProcessor: {
            invoke: function(headers, serviceId, methodName, params, callback) {
                callback(null, 'called B' + JSON.stringify(params));
            }
        }
    });

    it('should sync call return the response', function() {
        rpcA.invoke({
            serviceId: 'serviceB',
            methodName: 'methodB',
            params: {
                paramB: 'valueB'
            }
        }, function(err, response) {
            if (err) {
                throw err;
            } else {
                assert.equal('called B{"paramB":"valueB"}', response);
            }
        });
    });

    it('should timeout when response has not called', function(done) {
        rpcB.invoke({
            headers: {
                timeout: 200
            },
            serviceId: 'serviceA',
            methodName: 'methodA',
            params: {
                paramA: 'valueA'
            }
        }, function(err, response) {
            if (err) {
                done();
            } else {
                done('has not timeout');
            }
        });
    });
});
