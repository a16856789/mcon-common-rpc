/*
 * @module bean-invoker
 */
(function() {

// =====================================================================================================================
// Import simple-msg-rpc
// =====================================================================================================================
var SimpleMsgRpc = null;
if(typeof require !== 'undefined') {
    SimpleMsgRpc = require('./simple-msg-rpc');
} else {
    SimpleMsgRpc = window.SimpleMsgRpc;
}

// =====================================================================================================================
// Export module
// =====================================================================================================================
function BeanInvoker() {
}
BeanInvoker.invoke = function() {
    try {
        BeanInvoker.tryInvoke.apply(this, arguments);
    } catch (e) {
        var callback = arguments[arguments.length - 1];
        if (typeof callback === 'function') {
            return callback(e);
        } else {
            throw e;
        }
    }
}
BeanInvoker.tryInvoke = function() {
    // prepare arguments
    var headers, serviceId, methodName, params;
    var callback = arguments[arguments.length - 1];
    if (arguments.length == 2) {
        var conf = arguments[0];
        headers = conf.headers;
        serviceId = conf.serviceId;
        methodName = conf.methodName;
        params = conf.params;
    } else {
        headers = arguments[0];
        serviceId = arguments[1];
        methodName = arguments[2];
        params = arguments[3];
    }

    // get bean
    var name = methodName;
    var bean = this, method = null;
    if (!bean) {
        return callback('No Such Service "' + serviceId + '".');
    }

    // try to invoke 'invokeMethodName'
    method = bean['invoke' + name[0].toUpperCase() + name.substring(1)];
    if (typeof(method) === 'function') {
        return method.apply(bean, [headers, params, callback]);
    }

    // try to invoke 'methodName'
    method = bean[name];
    if (typeof(method) === 'function') {
        var result = method.apply(bean, params);
        if (result instanceof Promise) {
            return result
                .then(function (realResult) {
                    callback(null, realResult);
                }).catch(function (error) {
                    callback(error);
                });
        } else {
            return callback(null, result);
        }
    }

    // no such method error
    return callback('No Such Method "' + serviceId + '.' + name + '".');
}

// =====================================================================================================================
// Export module
// =====================================================================================================================
SimpleMsgRpc.BeanInvoker = BeanInvoker;

/*
 * End of Module
 */
})();
