// Main.js
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
// Dispatcher.js
/**
 * Class that is used by generated stubs to make actual AJAX calls
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
function HTML_AJAX_Dispatcher(className,mode,callback,serverUrl,serializerType) 
{
	this.className = className;
	this.mode = mode;
	this.callback = callback;
    this.serializerType = serializerType;

	if (serverUrl) {
		this.serverUrl = serverUrl
	}
	else {
		this.serverUrl = window.location;
	}
}

HTML_AJAX_Dispatcher.prototype = {
    /**
     * Queue to use when making a request
     */
    queue: 'default',

    /**
     * Timeout for async calls
     */
	timeout: 20000,

    /**
     * Make an ajax call
     *
     * @param   string callName
     * @param   Array   args    arguments to the report method
     */
	doCall: function(callName,args) 
    {
        var request = new HTML_AJAX_Request();
		request.requestUrl = this.serverUrl;
        request.className = this.className;
        request.methodName = callName;
		request.timeout = this.timeout;
        request.contentType = this.contentType;
        request.serializer = eval('new HTML_AJAX_Serialize_'+this.serializerType);
        request.queue = this.queue;
        
		for(var i=0; i < args.length; i++) {
		    request.addArg(i,args[i]);
		};

		if ( this.mode == "async" ) {
		    request.isAsync = true;
            if (this.callback[callName]) {
                var self = this;
                request.callback = function(result) { self.callback[callName](result); }
            }

		} else {
		    request.isAsync = false;
		}

        return HTML_AJAX.makeRequest(request);
	}
};
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// HttpClient.js
/**
 * XMLHttpRequest Wrapper
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
function HTML_AJAX_HttpClient() { }
HTML_AJAX_HttpClient.prototype = {
	// request object
	request: null,

    // timeout id
    _timeoutId: null,
	
	// method to initialize an xmlhttpclient
	init:function() 
    {
		try {
		    // Mozilla / Safari
		    this.xmlhttp = new XMLHttpRequest();
		} catch (e) {
			// IE
			var XMLHTTP_IDS = new Array(
			'MSXML2.XMLHTTP.5.0',
			'MSXML2.XMLHTTP.4.0',
			'MSXML2.XMLHTTP.3.0',
			'MSXML2.XMLHTTP',
			'Microsoft.XMLHTTP' );
			var success = false;
			for (var i=0;i < XMLHTTP_IDS.length && !success; i++) {
				try {
					this.xmlhttp = new ActiveXObject(XMLHTTP_IDS[i]);
					success = true;
				} catch (e) {}
			}
			if (!success) {
				throw new Error('Unable to create XMLHttpRequest.');
			}
		}
	},

    // check if there is a call in progress
    callInProgress: function() 
    {
        switch ( this.xmlhttp.readyState ) {
            case 1:
            case 2:
            case 3:
                return true;
            break;
            default:
                return false;
            break;
        }
    },

	// make the request defined in the request object
	makeRequest: function() 
    {
		if (!this.xmlhttp) {
			this.init();
		}

        try {
            if (this.request.onOpen) {
                this.request.onOpen();
            }
            else if (HTML_AJAX.onOpen) {
                HTML_AJAX.onOpen(this.request);
            }
		    this.xmlhttp.open(this.request.requestType,this.request.completeUrl(),this.request.isAsync);

            // set onreadystatechange here since it will be reset after a completed call in Mozilla
            var self = this;
            this.xmlhttp.onreadystatechange = function() { self._readyStateChangeCallback(); }

            this.xmlhttp.setRequestHeader('Content-Type',this.request.getContentType());
            var payload = this.request.getSerializedPayload();
            if (payload) {
                this.xmlhttp.setRequestHeader('Content-Length', payload.length);
            }
            this.xmlhttp.send(payload);
        } catch (e) {
            this._handleError(e);
        }

		if (!this.request.isAsync) {
            if ( this.xmlhttp.status == 200 ) {
                HTML_AJAX.requestComplete(this.request);
                if (this.request.onLoad) {
                    this.request.onLoad();
                } else if (HTML_AJAX.onLoad) {
                    HTML_AJAX.onLoad(this.request);
                }
                    
                return this._decodeResponse();
            } else {
                var e = new Error('['+this.xmlhttp.status +'] '+this.xmlhttp.statusText);
                e.headers = this.xmlhttp.getAllResponseHeaders();
                this._handleError(e);
            }
		}
        else {
            // setup timeout
            var self = this;
            this._timeoutId = window.setTimeout(function() { self.abort(true); },this.request.timeout);
        }
	},
	
    // abort an inprogress request
    abort: function (automatic) 
    {
        if (this.callInProgress()) {
            this.xmlhttp.abort();

            if (automatic) {
                this._handleError(new Error('Request Timed Out'));
            }
        }
    },

	// internal method used to handle ready state changes
	_readyStateChangeCallback:function() 
    {
        try {
            switch(this.xmlhttp.readyState) {
                // XMLHTTPRequest.open() has just been called
                case 1:
                    break;
                // XMLHTTPRequest.send() has just been called
                case 2:
                    if (this.request.onSend) {
                        this.request.onSend();
                    } else if (HTML_AJAX.onSend) {
                        HTML_AJAX.onSend(this.request);
                    }
                    break;
                // Fetching response from server in progress
                case 3:
                    if (this.request.onProgress) {
                        this.request.onProgress();
                    } else if (HTML_AJAX.onProgress ) {
                        HTML_AJAX.onProgress(this.request);
                    }
                break;
                // Download complete
                case 4:
                    window.clearTimeout(this._timeout_id);

                    if (this.xmlhttp.status == 200) {
                        HTML_AJAX.requestComplete(this.request);
                        if (this.request.onLoad) {
                            this.request.onLoad();
                        } else if (HTML_AJAX.onLoad ) {
                            HTML_AJAX.onLoad(this.request);
                        }

                        if (this.request.callback) {
                            this.request.callback(this._decodeResponse());
                        }
                    }

                    else {
                        var e = new Error('HTTP Error Making Request: ['+this.xmlhttp.status+'] '+this.xmlhttp.statusText);
                        this._handleError(e);
                    }
                break;
            }
        } catch (e) {
                this._handleError(e);
        }
	},

    // decode response as needed
    _decodeResponse: function() {
        var unserializer = HTML_AJAX.serializerForEncoding(this.xmlhttp.getResponseHeader('Content-Type'));
        //alert(this.xmlhttp.responseText); // some sort of debug hook is needed here

        // some sort of sane way for a serializer to ask for XML needs to be added
        return unserializer.unserialize(this.xmlhttp.responseText);
    },

    // handle sending an error where it needs to go
    _handleError: function(e) 
    {
        HTML_AJAX.requestComplete(this.request,e);
        if (this.request.onError) {
            this.request.onError(e);
        } else if (HTML_AJAX.onError) {
            HTML_AJAX.onError(e,this.request);
        }
        else {
            throw e;
        }
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// Request.js
/**
 * Class that contains everything needed to make a request
 * This includes:
 *    The url were calling
 *    If were calling a remote method, the class and method name
 *    The payload, unserialized
 *    The timeout for async calls
 *    The callback method
 *    Optional event handlers: onError, onLoad, onSend
 *    A serializer instance
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
function HTML_AJAX_Request(serializer) {
    this.serializer = serializer;
}
HTML_AJAX_Request.prototype = {

    // Instance of a serializer
    serializer: null,
    
    // Is this an async request
    isAsync: false,

    // HTTP verb
    requestType: 'POST',
    
    // The actual URL the request is sent to
    requestUrl: '',
    
    // Remote Class
    className: null,

    // Remote Method
    methodName: null,

    // Timeout in milliseconds for requests
    timeout: 20000,

    // unserialized data, for rpc calls use add args, to send raw data just set this directly
    args: null,

    // async callback method
    callback: null,

    // Queue to push this request too
    queue: 'default',

    /**
     * Add an argument for the remote method
     * @param string argument name
     * @param mixed value
     * @return void
     * @throws Error code 1004
     */
    addArg: function(name, value) 
    {
        if ( !this.args ) {
            this.args = [];
        }
        if (!/[^a-zA-Z_0-9]/.test(name) ) {
            this.args[name] = value;
        } else {
            throw new Error('Invalid parameter name ('+name+')');
        }
    },

    /**
     * Get the payload in a serialized manner
     */
    getSerializedPayload: function() {
        return this.serializer.serialize(this.args);
    },

    /**
     * Get the content type
     */
    getContentType: function() {
        return this.serializer.contentType;
    },

    /**
     * Get the complete url, adding in any needed get params for rpc
     */
    completeUrl: function() {
        var url = this.requestUrl;
        if (this.className || this.methodName) {
            url += '?c='+escape(this.className)+'&m='+escape(this.methodName);
        }
        return url;
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// JSON.js
/*
Copyright (c) 2005 JSON.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The Software shall be used for Good, not Evil.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

Array.prototype.______array = '______array';

var HTML_AJAX_JSON = {
    org: 'http://www.JSON.org',
    copyright: '(c)2005 JSON.org',
    license: 'http://www.crockford.com/JSON/license.html',

    stringify: function (arg) {
        var c, i, l, s = '', v;

        switch (typeof arg) {
        case 'object':
            if (arg) {
                if (arg.______array == '______array') {
                    for (i = 0; i < arg.length; ++i) {
                        v = this.stringify(arg[i]);
                        if (s) {
                            s += ',';
                        }
                        s += v;
                    }
                    return '[' + s + ']';
                } else if (typeof arg.toString != 'undefined') {
                    for (i in arg) {
                        v = arg[i];
                        if (typeof v != 'undefined' && typeof v != 'function') {
                            v = this.stringify(v);
                            if (s) {
                                s += ',';
                            }
                            s += this.stringify(i) + ':' + v;
                        }
                    }
                    return '{' + s + '}';
                }
            }
            return 'null';
        case 'number':
            return isFinite(arg) ? String(arg) : 'null';
        case 'string':
            l = arg.length;
            s = '"';
            for (i = 0; i < l; i += 1) {
                c = arg.charAt(i);
                if (c >= ' ') {
                    if (c == '\\' || c == '"') {
                        s += '\\';
                    }
                    s += c;
                } else {
                    switch (c) {
                        case '\b':
                            s += '\\b';
                            break;
                        case '\f':
                            s += '\\f';
                            break;
                        case '\n':
                            s += '\\n';
                            break;
                        case '\r':
                            s += '\\r';
                            break;
                        case '\t':
                            s += '\\t';
                            break;
                        default:
                            c = c.charCodeAt();
                            s += '\\u00' + Math.floor(c / 16).toString(16) +
                                (c % 16).toString(16);
                    }
                }
            }
            return s + '"';
        case 'boolean':
            return String(arg);
        default:
            return 'null';
        }
    },
    parse: function (text) {
        var at = 0;
        var ch = ' ';

        function error(m) {
            throw {
                name: 'JSONError',
                message: m,
                at: at - 1,
                text: text
            };
        }

        function next() {
            ch = text.charAt(at);
            at += 1;
            return ch;
        }

        function white() {
            while (ch) {
                if (ch <= ' ') {
                    next();
                } else if (ch == '/') {
                    switch (next()) {
                        case '/':
                            while (next() && ch != '\n' && ch != '\r') {}
                            break;
                        case '*':
                            next();
                            for (;;) {
                                if (ch) {
                                    if (ch == '*') {
                                        if (next() == '/') {
                                            next();
                                            break;
                                        }
                                    } else {
                                        next();
                                    }
                                } else {
                                    error("Unterminated comment");
                                }
                            }
                            break;
                        default:
                            error("Syntax error");
                    }
                } else {
                    break;
                }
            }
        }

        function string() {
            var i, s = '', t, u;

            if (ch == '"') {
outer:          while (next()) {
                    if (ch == '"') {
                        next();
                        return s;
                    } else if (ch == '\\') {
                        switch (next()) {
                        case 'b':
                            s += '\b';
                            break;
                        case 'f':
                            s += '\f';
                            break;
                        case 'n':
                            s += '\n';
                            break;
                        case 'r':
                            s += '\r';
                            break;
                        case 't':
                            s += '\t';
                            break;
                        case 'u':
                            u = 0;
                            for (i = 0; i < 4; i += 1) {
                                t = parseInt(next(), 16);
                                if (!isFinite(t)) {
                                    break outer;
                                }
                                u = u * 16 + t;
                            }
                            s += String.fromCharCode(u);
                            break;
                        default:
                            s += ch;
                        }
                    } else {
                        s += ch;
                    }
                }
            }
            error("Bad string");
        }

        function array() {
            var a = [];

            if (ch == '[') {
                next();
                white();
                if (ch == ']') {
                    next();
                    return a;
                }
                while (ch) {
                    a.push(value());
                    white();
                    if (ch == ']') {
                        next();
                        return a;
                    } else if (ch != ',') {
                        break;
                    }
                    next();
                    white();
                }
            }
            error("Bad array");
        }

        function object() {
            var k, o = {};

            if (ch == '{') {
                next();
                white();
                if (ch == '}') {
                    next();
                    return o;
                }
                while (ch) {
                    k = string();
                    white();
                    if (ch != ':') {
                        break;
                    }
                    next();
                    o[k] = value();
                    white();
                    if (ch == '}') {
                        next();
                        return o;
                    } else if (ch != ',') {
                        break;
                    }
                    next();
                    white();
                }
            }
            error("Bad object");
        }

        function number() {
            var n = '', v;
            if (ch == '-') {
                n = '-';
                next();
            }
            while (ch >= '0' && ch <= '9') {
                n += ch;
                next();
            }
            if (ch == '.') {
                n += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    n += ch;
                }
            }
            if (ch == 'e' || ch == 'E') {
                n += 'e';
                next();
                if (ch == '-' || ch == '+') {
                    n += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    n += ch;
                    next();
                }
            }
            v = +n;
            if (!isFinite(v)) {
                ////error("Bad number");
            } else {
                return v;
            }
        }

        function word() {
            switch (ch) {
                case 't':
                    if (next() == 'r' && next() == 'u' && next() == 'e') {
                        next();
                        return true;
                    }
                    break;
                case 'f':
                    if (next() == 'a' && next() == 'l' && next() == 's' &&
                            next() == 'e') {
                        next();
                        return false;
                    }
                    break;
                case 'n':
                    if (next() == 'u' && next() == 'l' && next() == 'l') {
                        next();
                        return null;
                    }
                    break;
            }
            error("Syntax error");
        }

        function value() {
            white();
            switch (ch) {
                case '{':
                    return object();
                case '[':
                    return array();
                case '"':
                    return string();
                case '-':
                    return number();
                default:
                    return ch >= '0' && ch <= '9' ? number() : word();
            }
        }

        return value();
    }
};
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// Loading.js
/**
 * Default loading implementation
 *
 * @category   HTML
 * @package    Ajax
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */

HTML_AJAX.onOpen = function(request) {
    var loading = document.getElementById('HTML_AJAX_LOADING');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'HTML_AJAX_LOADING';
        loading.innerHTML = 'Loading...';
        loading.style.position = 'absolute';
        loading.style.top = 0;
        loading.style.right = 0;
        loading.style.backgroundColor = 'red';
        loading.style.width = '80px';
        loading.style.padding = '4px';
    
        document.body.insertBefore(loading,document.body.firstChild);
    }
    HTML_AJAX.onOpen_Timeout = window.setTimeout(function() { loading.style.display = 'block'; },500);
}
HTML_AJAX.onLoad = function(request) {
    if (HTML_AJAX.onOpen_Timeout) {
        window.clearTimeout(HTML_AJAX.onOpen_Timeout);
        HTML_AJAX.onOpen_Timeout = false;
    }
    var loading = document.getElementById('HTML_AJAX_LOADING');
    if (loading) {
        loading.style.display = 'none';
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// util.js
/**
 * Utility methods
 *
 * @category   HTML
 * @package    Ajax
 * @author     David Coallier <davidc@php.net>
 * @copyright  2005 David Coallier
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
// {{{ HTML_AJAX_Util
/**
 * All the utilities we will be using thorough the classes
 */
var HTML_AJAX_Util = {
    // Set the element event
    setElementEvent: function(id, event, handler) {
        var element = document.getElementById(id);
        if (typeof element.addEventListener != "undefined") {   //Dom2
           element.addEventListener(event, handler, false);
        } else if (typeof element.attachEvent != "undefined") { //IE 5+
            element.attachEvent("on" + event, handler);
        } else {
            if (element["on" + event] != null) {
                var oldHandler = element["on" + event];
                element["on" + event] = function(e) {
                    oldHander(e);
                    handler(e);
                };
            } else {
                element["on" + event] = handler;
            }
        }
    },
    // simple non recursive variable dumper, don't rely on its output staying the same, its just for debugging and will get smarter at some point
    varDump: function(input) {
        var r = "";
        for(var i in input) {
            r += i+':'+input[i]+"\n";
        }
        return r;
    }

}
// }}}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// behavior.js
/**

ModifiedBehavior v1.0 by Ron Lancaster based on Ben Nolan's Behaviour, June 2005 implementation.
Modified to use Dean Edward's CSS Query.

Description
----------

Uses css selectors  to apply javascript Behaviors to enable unobtrusive javascript in html documents.

Dependencies
------------

Requires [Dean Edwards CSSQuery](http://dean.edwards.name/my/cssQuery/ "CSSQuery").

Usage
------

		Behavior.register(
			"b.someclass",
			function(element) {
				element.onclick = function(){
					alert(this.innerHTML);
				}
			}
		);

		Behavior.register(
			"#someid u",
			function(element) {
				element.onmouseover = function(){
					this.innerHTML = "BLAH!";
				}
			},
			getElementByID("parent")
		);

Call `Behavior.apply()` to re-apply the rules (if you update the dom, etc).

License
------

Reproduced under BSD licensed. Same license as Ben Nolan's implementation.

More information for Ben Nolan's implementation: <http://ripcord.co.nz/behaviour/>

*/

var Behavior = {

	// private data member
	list : new Array(),

	// private method
	addLoadEvent : function(func) {
		var oldonload = window.onload;

		if (typeof window.onload != 'function') {
			window.onload = func;
		} else {
			window.onload = function() {
				oldonload();
				func();
			}
		}
	},

	// void apply() : Applies the registered ruleset.
	apply : function() {
		for (i = 0; i < Behavior.list.length; i++) {
			var rule = Behavior.list[i];
			var tags = cssQuery(rule.selector, rule.from);
			if (tags) {
				for (j = 0; j < tags.length; j++) {
					rule.action(tags[j]);
				}
			}
		}
	},

	// void register() : register a css selector, and the action (function) to take,
	// from (optional) is a document, element or array of elements which is filtered by selector.
	register : function(selector, action, from) {
		Behavior.list.push(new BehaviorRule(selector, from, action));
	},

	// void start() : initial application of ruleset at document load.
	start : function() {
		Behavior.addLoadEvent(function() {
			Behavior.apply();
		});
	}
}

function BehaviorRule(selector, from, action) {
	this.selector = selector;
	this.from = from;
	this.action = action;
}

Behavior.start();// cssQuery-p.js
/*
	cssQuery, version 2.0.2 (2005-08-19)
	Copyright: 2004-2005, Dean Edwards (http://dean.edwards.name/)
	License: http://creativecommons.org/licenses/LGPL/2.1/
*/
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('7 x=6(){7 1D="2.0.2";7 C=/\\s*,\\s*/;7 x=6(s,A){33{7 m=[];7 u=1z.32.2c&&!A;7 b=(A)?(A.31==22)?A:[A]:[1g];7 1E=18(s).1l(C),i;9(i=0;i<1E.y;i++){s=1y(1E[i]);8(U&&s.Z(0,3).2b("")==" *#"){s=s.Z(2);A=24([],b,s[1])}1A A=b;7 j=0,t,f,a,c="";H(j<s.y){t=s[j++];f=s[j++];c+=t+f;a="";8(s[j]=="("){H(s[j++]!=")")a+=s[j];a=a.Z(0,-1);c+="("+a+")"}A=(u&&V[c])?V[c]:21(A,t,f,a);8(u)V[c]=A}m=m.30(A)}2a x.2d;5 m}2Z(e){x.2d=e;5[]}};x.1Z=6(){5"6 x() {\\n  [1D "+1D+"]\\n}"};7 V={};x.2c=L;x.2Y=6(s){8(s){s=1y(s).2b("");2a V[s]}1A V={}};7 29={};7 19=L;x.15=6(n,s){8(19)1i("s="+1U(s));29[n]=12 s()};x.2X=6(c){5 c?1i(c):o};7 D={};7 h={};7 q={P:/\\[([\\w-]+(\\|[\\w-]+)?)\\s*(\\W?=)?\\s*([^\\]]*)\\]/};7 T=[];D[" "]=6(r,f,t,n){7 e,i,j;9(i=0;i<f.y;i++){7 s=X(f[i],t,n);9(j=0;(e=s[j]);j++){8(M(e)&&14(e,n))r.z(e)}}};D["#"]=6(r,f,i){7 e,j;9(j=0;(e=f[j]);j++)8(e.B==i)r.z(e)};D["."]=6(r,f,c){c=12 1t("(^|\\\\s)"+c+"(\\\\s|$)");7 e,i;9(i=0;(e=f[i]);i++)8(c.l(e.1V))r.z(e)};D[":"]=6(r,f,p,a){7 t=h[p],e,i;8(t)9(i=0;(e=f[i]);i++)8(t(e,a))r.z(e)};h["2W"]=6(e){7 d=Q(e);8(d.1C)9(7 i=0;i<d.1C.y;i++){8(d.1C[i]==e)5 K}};h["2V"]=6(e){};7 M=6(e){5(e&&e.1c==1&&e.1f!="!")?e:23};7 16=6(e){H(e&&(e=e.2U)&&!M(e))28;5 e};7 G=6(e){H(e&&(e=e.2T)&&!M(e))28;5 e};7 1r=6(e){5 M(e.27)||G(e.27)};7 1P=6(e){5 M(e.26)||16(e.26)};7 1o=6(e){7 c=[];e=1r(e);H(e){c.z(e);e=G(e)}5 c};7 U=K;7 1h=6(e){7 d=Q(e);5(2S d.25=="2R")?/\\.1J$/i.l(d.2Q):2P(d.25=="2O 2N")};7 Q=6(e){5 e.2M||e.1g};7 X=6(e,t){5(t=="*"&&e.1B)?e.1B:e.X(t)};7 17=6(e,t,n){8(t=="*")5 M(e);8(!14(e,n))5 L;8(!1h(e))t=t.2L();5 e.1f==t};7 14=6(e,n){5!n||(n=="*")||(e.2K==n)};7 1e=6(e){5 e.1G};6 24(r,f,B){7 m,i,j;9(i=0;i<f.y;i++){8(m=f[i].1B.2J(B)){8(m.B==B)r.z(m);1A 8(m.y!=23){9(j=0;j<m.y;j++){8(m[j].B==B)r.z(m[j])}}}}5 r};8(![].z)22.2I.z=6(){9(7 i=0;i<1z.y;i++){o[o.y]=1z[i]}5 o.y};7 N=/\\|/;6 21(A,t,f,a){8(N.l(f)){f=f.1l(N);a=f[0];f=f[1]}7 r=[];8(D[t]){D[t](r,A,f,a)}5 r};7 S=/^[^\\s>+~]/;7 20=/[\\s#.:>+~()@]|[^\\s#.:>+~()@]+/g;6 1y(s){8(S.l(s))s=" "+s;5 s.P(20)||[]};7 W=/\\s*([\\s>+~(),]|^|$)\\s*/g;7 I=/([\\s>+~,]|[^(]\\+|^)([#.:@])/g;7 18=6(s){5 s.O(W,"$1").O(I,"$1*$2")};7 1u={1Z:6(){5"\'"},P:/^(\'[^\']*\')|("[^"]*")$/,l:6(s){5 o.P.l(s)},1S:6(s){5 o.l(s)?s:o+s+o},1Y:6(s){5 o.l(s)?s.Z(1,-1):s}};7 1s=6(t){5 1u.1Y(t)};7 E=/([\\/()[\\]?{}|*+-])/g;6 R(s){5 s.O(E,"\\\\$1")};x.15("1j-2H",6(){D[">"]=6(r,f,t,n){7 e,i,j;9(i=0;i<f.y;i++){7 s=1o(f[i]);9(j=0;(e=s[j]);j++)8(17(e,t,n))r.z(e)}};D["+"]=6(r,f,t,n){9(7 i=0;i<f.y;i++){7 e=G(f[i]);8(e&&17(e,t,n))r.z(e)}};D["@"]=6(r,f,a){7 t=T[a].l;7 e,i;9(i=0;(e=f[i]);i++)8(t(e))r.z(e)};h["2G-10"]=6(e){5!16(e)};h["1x"]=6(e,c){c=12 1t("^"+c,"i");H(e&&!e.13("1x"))e=e.1n;5 e&&c.l(e.13("1x"))};q.1X=/\\\\:/g;q.1w="@";q.J={};q.O=6(m,a,n,c,v){7 k=o.1w+m;8(!T[k]){a=o.1W(a,c||"",v||"");T[k]=a;T.z(a)}5 T[k].B};q.1Q=6(s){s=s.O(o.1X,"|");7 m;H(m=s.P(o.P)){7 r=o.O(m[0],m[1],m[2],m[3],m[4]);s=s.O(o.P,r)}5 s};q.1W=6(p,t,v){7 a={};a.B=o.1w+T.y;a.2F=p;t=o.J[t];t=t?t(o.13(p),1s(v)):L;a.l=12 2E("e","5 "+t);5 a};q.13=6(n){1d(n.2D()){F"B":5"e.B";F"2C":5"e.1V";F"9":5"e.2B";F"1T":8(U){5"1U((e.2A.P(/1T=\\\\1v?([^\\\\s\\\\1v]*)\\\\1v?/)||[])[1]||\'\')"}}5"e.13(\'"+n.O(N,":")+"\')"};q.J[""]=6(a){5 a};q.J["="]=6(a,v){5 a+"=="+1u.1S(v)};q.J["~="]=6(a,v){5"/(^| )"+R(v)+"( |$)/.l("+a+")"};q.J["|="]=6(a,v){5"/^"+R(v)+"(-|$)/.l("+a+")"};7 1R=18;18=6(s){5 1R(q.1Q(s))}});x.15("1j-2z",6(){D["~"]=6(r,f,t,n){7 e,i;9(i=0;(e=f[i]);i++){H(e=G(e)){8(17(e,t,n))r.z(e)}}};h["2y"]=6(e,t){t=12 1t(R(1s(t)));5 t.l(1e(e))};h["2x"]=6(e){5 e==Q(e).1H};h["2w"]=6(e){7 n,i;9(i=0;(n=e.1F[i]);i++){8(M(n)||n.1c==3)5 L}5 K};h["1N-10"]=6(e){5!G(e)};h["2v-10"]=6(e){e=e.1n;5 1r(e)==1P(e)};h["2u"]=6(e,s){7 n=x(s,Q(e));9(7 i=0;i<n.y;i++){8(n[i]==e)5 L}5 K};h["1O-10"]=6(e,a){5 1p(e,a,16)};h["1O-1N-10"]=6(e,a){5 1p(e,a,G)};h["2t"]=6(e){5 e.B==2s.2r.Z(1)};h["1M"]=6(e){5 e.1M};h["2q"]=6(e){5 e.1q===L};h["1q"]=6(e){5 e.1q};h["1L"]=6(e){5 e.1L};q.J["^="]=6(a,v){5"/^"+R(v)+"/.l("+a+")"};q.J["$="]=6(a,v){5"/"+R(v)+"$/.l("+a+")"};q.J["*="]=6(a,v){5"/"+R(v)+"/.l("+a+")"};6 1p(e,a,t){1d(a){F"n":5 K;F"2p":a="2n";1a;F"2o":a="2n+1"}7 1m=1o(e.1n);6 1k(i){7 i=(t==G)?1m.y-i:i-1;5 1m[i]==e};8(!Y(a))5 1k(a);a=a.1l("n");7 m=1K(a[0]);7 s=1K(a[1]);8((Y(m)||m==1)&&s==0)5 K;8(m==0&&!Y(s))5 1k(s);8(Y(s))s=0;7 c=1;H(e=t(e))c++;8(Y(m)||m==1)5(t==G)?(c<=s):(s>=c);5(c%m)==s}});x.15("1j-2m",6(){U=1i("L;/*@2l@8(@\\2k)U=K@2j@*/");8(!U){X=6(e,t,n){5 n?e.2i("*",t):e.X(t)};14=6(e,n){5!n||(n=="*")||(e.2h==n)};1h=1g.1I?6(e){5/1J/i.l(Q(e).1I)}:6(e){5 Q(e).1H.1f!="2g"};1e=6(e){5 e.2f||e.1G||1b(e)};6 1b(e){7 t="",n,i;9(i=0;(n=e.1F[i]);i++){1d(n.1c){F 11:F 1:t+=1b(n);1a;F 3:t+=n.2e;1a}}5 t}}});19=K;5 x}();',62,190,'|||||return|function|var|if|for||||||||pseudoClasses||||test|||this||AttributeSelector|||||||cssQuery|length|push|fr|id||selectors||case|nextElementSibling|while||tests|true|false|thisElement||replace|match|getDocument|regEscape||attributeSelectors|isMSIE|cache||getElementsByTagName|isNaN|slice|child||new|getAttribute|compareNamespace|addModule|previousElementSibling|compareTagName|parseSelector|loaded|break|_0|nodeType|switch|getTextContent|tagName|document|isXML|eval|css|_1|split|ch|parentNode|childElements|nthChild|disabled|firstElementChild|getText|RegExp|Quote|x22|PREFIX|lang|_2|arguments|else|all|links|version|se|childNodes|innerText|documentElement|contentType|xml|parseInt|indeterminate|checked|last|nth|lastElementChild|parse|_3|add|href|String|className|create|NS_IE|remove|toString|ST|select|Array|null|_4|mimeType|lastChild|firstChild|continue|modules|delete|join|caching|error|nodeValue|textContent|HTML|prefix|getElementsByTagNameNS|end|x5fwin32|cc_on|standard||odd|even|enabled|hash|location|target|not|only|empty|root|contains|level3|outerHTML|htmlFor|class|toLowerCase|Function|name|first|level2|prototype|item|scopeName|toUpperCase|ownerDocument|Document|XML|Boolean|URL|unknown|typeof|nextSibling|previousSibling|visited|link|valueOf|clearCache|catch|concat|constructor|callee|try'.split('|'),0,{}))
