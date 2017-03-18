/*
 * @module simple-msg-rpc: rpc through oneway message tunnel
 */
(function() {

// =====================================================================================================================
// prepare
// =====================================================================================================================
if (!console.debug) {
	console.debug = console.log;
}

// =====================================================================================================================
// API
// =====================================================================================================================
/**
 * constructor
 */
function SimpleMsgRpc(conf) {
	this.requestProcessor = conf.requestProcessor;
	this.msgAdapter = conf.msgAdapter;
	this.waittingRequests = {};
	this.conf = conf;
	this.rpcIdSeq = 0;
}

/**
 * invoke
 */
SimpleMsgRpc.prototype.invoke = function(conf, callback) {
	this._sendMsg({
		type: SimpleMsgRpc.REQUEST,
		rpcId: (new Date().getTime()).toString() + ('000000' + (this.rpcIdSeq++)).substr(-6, 6),
		headers: conf.headers,
		serviceId: conf.serviceId,
		methodName: conf.methodName,
		params: conf.params
	}, function(err, response) {
		callback(err, response);
	});
};

/**
 * process message
 */
SimpleMsgRpc.prototype.processMessage = function(msg) {
	this._processMessage(msg);
}

// =====================================================================================================================
// Contansts
// =====================================================================================================================
SimpleMsgRpc.REQUEST  = 'request';
SimpleMsgRpc.RESPONSE = 'response';
SimpleMsgRpc.DEBUG    = false;


// =====================================================================================================================
// Message Sending
// =====================================================================================================================
/**
 * Send Message
 */
SimpleMsgRpc.prototype._sendMsg = function(pkg, callback) {
	// if not connnected, failure
	if (this.msgAdapter.isConnected && !this.msgAdapter.isConnected()) {
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Connection is closed.');
		}
		conf.callbak('is not connected');
		return;
	}

	// normalize headers
	var headers = pkg.headers = pkg.headers || {};
	headers.oneway = (!!headers.oneway) || pkg.type === SimpleMsgRpc.RESPONSE;
	headers.timeout = headers.timeout || this.conf.timeout || 3 * 1000;

	// if not oneway message, then add to the waitting list
	if (!headers.oneway) {
		var req = {
			rpcId: pkg.rpcId,
			callback: callback,
			timeout: headers.timeout,
			timeoutId: null
		};
		var self = this;
		req.timeoutId = setTimeout(function() {
			self._onTimeout(req.rpcId);
		}, req.timeout);
		self.waittingRequests[req.rpcId] = req;
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Waitting for reponse, rpcId=%s, timeout=%s.', req.rpcId, req.timeout);
		}
	}

	// send message
	try {
		var msg = JSON.stringify(pkg);
		this.msgAdapter.send(msg);
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Send package done, type=%s, rpcId=%s, oneway=%s.', pkg.type, pkg.rpcId, pkg.oneway);
		}
	} catch (e) {
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Send package err, type=%s, rpcId=%s, oneway=%s.', pkg.type, pkg.rpcId, pkg.oneway);
			console.error(e);
		}
		callback(e);
	}

	// if oneway message, call callback immediately
	if (headers.oneway) {
		callback(null, null);
	}
}


// =====================================================================================================================
// Message Receiving
// =====================================================================================================================
/**
 * process message
 */
SimpleMsgRpc.prototype._processMessage = function(msg) {
	// parse the messgae body
	if (typeof(msg) === 'string') {
		try {
			msg = JSON.parse(msg);
		} catch (e) {
			if (SimpleMsgRpc.DEBUG) {
				console.debug('RPC: Bad package, invalid JSON string.');
			}
			return;
		}
	}
	if (!msg.type || !msg.rpcId) {
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Bad package, invalid message arguments.');
		}
		return;
	}
	if (SimpleMsgRpc.DEBUG) {
		console.debug('RPC: Received package, type=%s, rpcId=%s, oneway=%s.', msg.type, msg.rpcId, msg.oneway);
	}

	// process the package
	if (msg.type === SimpleMsgRpc.REQUEST) {
		this._processRequest(msg);
	} else {
		this._processResponse(msg);
	}
};

/**
 * process request
 */
SimpleMsgRpc.prototype._processRequest = function(pkg) {
	// prepare params
	var headers = pkg.headers, serviceId = pkg.serviceId, methodName = pkg.methodName, params = pkg.params;

	// call the processor
	var self = this;
	self.requestProcessor.invoke(headers, serviceId, methodName, params, function(err, response) {
		// if oneway message, just ignore response
		if (headers.oneway) {
			return;
		}
		// send response
		self._sendMsg({
			type: SimpleMsgRpc.RESPONSE,
			rpcId: pkg.rpcId,
			success: err ? false : true,
			response: response,
			error: err
		}, function(err) {
			if (err) {
				throw err;
			}
		});
	});
};

/**
 * process response
 */
SimpleMsgRpc.prototype._processResponse = function(pkg) {
	// delete from waitting list
	var rpcId = pkg.rpcId;
	var req = this.waittingRequests[rpcId];
	delete this.waittingRequests[rpcId];
	if (!req) {
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Received a package that do not in waitting list, rpcId=%s.', rpcId);
		}
		return;
	}

	// clear the timeout
	clearTimeout(req.timeoutId);

	// call the request's callback
	if (pkg.success) {
		req.callback(null, pkg.response);
	} else {
		req.callback(pkg.error, pkg.response);
	}
};


// =====================================================================================================================
// Timeout process
// =====================================================================================================================
/**
 * on timeout
 */
SimpleMsgRpc.prototype._onTimeout = function(rpcId) {
	// log
	if (SimpleMsgRpc.DEBUG) {
		console.debug('RPC: Timeout, rpcId=%s.', rpcId);
	}

	// delete from waitting list
	var req = this.waittingRequests[rpcId];
	delete this.waittingRequests[rpcId];
	if (!req) {
		if (SimpleMsgRpc.DEBUG) {
			console.debug('RPC: Timeout an package that do not in waitting list, rpcId=%s.', rpcId);
		}
		return;
	}

	// call the request's callback
	req.callback('timeout');
}


// =====================================================================================================================
// Export module
// =====================================================================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleMsgRpc;
} else {
    window.SimpleMsgRpc = SimpleMsgRpc;
}

/*
 * End of Module
 */
})();
