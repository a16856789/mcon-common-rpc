
# Simple Message RPC

## Usage

### Simple Message RPC

```javascript
// create the rpc instance
var SimpleMsgRpc = require('simple-msg-rpc');
var rpc = new SimpleMsgRpc({
    msgAdapter: {
        // send message(an serializable object)
        send: function(message) {
        }
    },
    requestProcessor: {
        // @param headers.oneway  true/false
        // @param headers.timeout the timeout value
        // @param headers         other header fields was pass through from the message
        invoke: function(headers, serviceId, methodName, params, callback) {
            callback('called ' + params);
        }
    }
});

// on message received
msgAdapter.on('received', function(message) {
    // @param message the message body
    rpc.processMessage(message);
});

// params and response are both an object
rpc.invoke({
    // @param headers.oneway    true/false
    // @param headers.timeout   timeout (ms)
    // @param headers.clientId  caller client id
    // @param headers           other header fields will pass through
    headers: {
        oneway: false,
        timeout: 300
    },
    serviceId: '',
    methodName: '',
    params: [1, 2, 3]
}, function(err, response) {
    if (err) {
    } else {
    }
});
```

### Bean Invoker

```javascript
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
```

## Details

### Request Package

```javascript
type: SimpleMsgRpc.REQUEST,
rpcId: (new Date().getTime()).toString(),
headers: {
    oneway: true,
    timeout: 300
},
serviceId: conf.serviceId,
methodName: conf.methodName,
params: conf.params
```

### Response Package

```javascript
type: SimpleMsgRpc.RESPONSE,
rpcId: pkg.rpcId,
success: err ? true : false,
response: response,
error: err
```
