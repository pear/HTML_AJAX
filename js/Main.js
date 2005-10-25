/**
 * JavaScript library for use with HTML_AJAX
 *
 * @category   HTML
 * @package    Ajax
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */


/**
 * HTML_AJAX static methods, this is the main proxyless api, it also handles global error and event handling
 */
var HTML_AJAX = {
	defaultServerUrl: false,
	defaultEncoding: 'Null',
    queues: false,
    // get an HttpClient, at some point this might be actually smart
    httpClient: function() {
        return new HTML_AJAX_HttpClient();
    },
    // Pushing the given request to queue specified by it, in default operation this will immediately make a request
    // request might be delayed or never happen depending on the queue setup
    // making a sync request to a non immediate queue will cause you problems so just don't do it
    makeRequest: function(request) {
        if (!HTML_AJAX.queues[request.queue]) {
            var e = new Error('Unknown Queue: '+request.queue);
            if (HTML_AJAX.onError) {
                HTML_AJAX.onError(e);
                return false;
            }
            else {
                throw(e);
            }
        }
        else {
            var qn = request.queue;
            var q = HTML_AJAX.queues[qn];

            HTML_AJAX.queues[request.queue].addRequest(request);
            return HTML_AJAX.queues[request.queue].processRequest();
        }
    },
    // get a serializer object for a specific encoding
    serializerForEncoding: function(encoding) {
        for(var i in HTML_AJAX.contentTypeMap) {
            if (encoding == HTML_AJAX.contentTypeMap[i] || encoding == i) {
                return eval("new HTML_AJAX_Serialize_"+i+";");
            }
        }
        return new HTML_AJAX_Serialize_Null();
    },
	fullcall: function(url,encoding,className,method,callback,args) {
        var serializer = HTML_AJAX.serializerForEncoding(encoding);

        var request = new HTML_AJAX_Request(serializer);
		if (callback) {
            request.isAsync = true;
		}
        request.requestUrl = url;
        request.className = className;
        request.methodName = method;
        request.callback = callback;
        request.args = args;

        return HTML_AJAX.makeRequest(request);
	},
	call: function(className,method,callback) {
        var args = new Array();
        for(var i = 3; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
		return HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,className,method,callback,args);
	},
	grab: function(url,callback) {
		return HTML_AJAX.fullcall(url,'Null',false,null,callback,{});
	},
	replace: function(id) {
        var callback = function(result) {
            document.getElementById(id).innerHTML = result;
        }
		if (arguments.length == 2) {
			// grab replacement
            HTML_AJAX.grab(arguments[1],callback);
		}
		else {
			// call replacement
			var args = new Array();
			for(var i = 3; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,arguments[1],arguments[2],callback,args);
		}
	},
    append: function(id) {
        var callback = function(result) {
            document.getElementById(id).innerHTML += result;
        }
        if (arguments.length == 2) {
            // grab replacement
            HTML_AJAX.grab(arguments[1],callback);
        }
        else {
            // call replacement
            var args = new Array();
            for(var i = 3; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,arguments[1],arguments[2],callback,args);
        }
    }, 
    /*
    // A really basic error handler 
    onError: function(e) {
        msg = "";
        for(var i in e) {
            msg += i+':'+e[i]+"\n";
        }
        alert(msg);
    },
    */
    // Class postfix to content-type map
    contentTypeMap: {'JSON':'application/json','Null':'text/plain','Error':'application/error'},
    // used internally to make queues work, override onLoad or onError to perform custom events when a request is complete
    // fires on success and error
    requestComplete: function(request,error) {
        for(var i in HTML_AJAX.queues) {
            if (HTML_AJAX.queues[i].requestComplete) {
                HTML_AJAX.queues[i].requestComplete(request,error);
            }
        }
    }
}




// small classes that I don't want to put in there own file

function HTML_AJAX_Serialize_Null() {}
HTML_AJAX_Serialize_Null.prototype = {
	contentType: 'text/plain; charset=UTF-8;',
	serialize: function(input) {
		return new String(input).valueOf();
	},
	
	unserialize: function(input) {
		return new String(input).valueOf();	
	}
}

// serialization class for JSON, wrapper for JSON.stringify in json.js
function HTML_AJAX_Serialize_JSON() {}
HTML_AJAX_Serialize_JSON.prototype = {
	contentType: 'application/json; charset=UTF-8',
	serialize: function(input) {
		return HTML_AJAX_JSON.stringify(input);
	},
	unserialize: function(input) {
        try {
            return eval(input);
        } catch(e) {
            // sometimes JSON encoded input isn't created properly, if eval of it fails we use the more forgiving but slower parser so will at least get something
            return HTML_AJAX_JSON.parse(input);
        }
	}
}
function HTML_AJAX_Serialize_Urlencoded() {}
HTML_AJAX_Serialize_Urlencoded.prototype = {
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    serialize: function(input) {
        var newURL  = '';	
        for (var i in input) {
	        input[i] = escape(input[i]);
        	newURL = newURL + i + '=' + input[i] + '&';
        }
        newURL = encodeURI(newURL.substr(0, (newURL.length-1)));
        return newURL;
    },

    unserialize: function(input) {
        var newURL  = '';
        for (var i in input) {
        	input[i] = escape(input[i]);
        	newURL = newURL + i + '=' + input[i] + '&';
        }
        newURL = decodeURI(newURL.substr(0, (newURL.length-1)));
        return newURL;	
    }
}


function HTML_AJAX_Serialize_Error() {}
HTML_AJAX_Serialize_Error.prototype = {
	contentType: 'application/error; charset=UTF-8',
	serialize: function(input) {
        var ser = new HTML_AJAX_Serialize_JSON();
        return ser.serialize(input);
	},
	unserialize: function(input) {
        var ser = new HTML_AJAX_Serialize_JSON();
        var data = new ser.unserialize(input);

        var e = new Error('PHP Error: '+data.errStr);
        for(var i in data) {
            e[i] = data[i];
        }
        throw e;
	}
}

// Processing Queues

// simple queue, just processes the request immediately
function HTML_AJAX_Queue_Immediate() {}
HTML_AJAX_Queue_Immediate.prototype = {
    request: false,
    addRequest: function(request) {
        this.request = request;
    },
    processRequest: function() {
        var client = HTML_AJAX.httpClient();
        client.request = this.request;
        return client.makeRequest();
    }
    // requestComplete: function() {} // this is also possible but this queue doesn't need it
}

// Single Buffer queue with interval
// works by attempting to send a request every x miliseconds
// if an item is currently in the queue when a new item is added it will be replaced
// simple queue, just processes the request immediately
// the first request starts the interval timer
function HTML_AJAX_Queue_Interval_SingleBuffer(interval) {
    this.interval = interval;
}
HTML_AJAX_Queue_Interval_SingleBuffer.prototype = {
    request: false,
    _intervalId: false,
    addRequest: function(request) {
        this.request = request;
    },
    processRequest: function() {
        if (!this._intervalId) {
            this.runInterval();
            this.start();
        }
    }, 
    start: function() {
        var self = this;
        this._intervalId = setInterval(function() { self.runInterval() },this.interval);
    },
    stop: function() {
        clearInterval(this._intervalId);
    },
    runInterval: function() {
        if (this.request) {
            var client = HTML_AJAX.httpClient();
            client.request = this.request;
            this.request = false;
            client.makeRequest();
        }
    }
}


// create a default queue, has to happen after the Queue class has been defined
HTML_AJAX.queues = new Object();
HTML_AJAX.queues['default'] = new HTML_AJAX_Queue_Immediate();

/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
