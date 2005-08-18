// Main.js
/**
 * JavaScript library for use with HTML_AJAX
 *
 * JavaScript library contains code originally by Harry Fuecks's JPSpan project
 *
 * @category   HTML
 * @package    Ajax
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 */


/**
 * HTML_AJAX static methods, this is the main proxyless api, it also handles global error and event handling
 */
var HTML_AJAX = {
	defaultServerUrl: false,
	defaultEncoding: null,
	fullcall: function(url,encoding,className,method,callback,args) {
		var mode = 'sync';
		if (callback) {
			mode = 'async';
		}
		var dispatcher = new HTML_AJAX_Dispatcher(className,mode,callback,url,encoding,encoding);
		return dispatcher.doCall(method,args);
	},
	call: function(className,method,callback) {
		var args = new Array();
		for(var i = 3; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
        var o = null;
        if (callback) {
            o = new Object();
            o[method] = callback;
        }
		return HTML_AJAX.fullcall(HTML_AJAX.defaultServerUrl,HTML_AJAX.defaultEncoding,className,method,o,args);
	},
	grab: function(url,callback) {
        var o = false;
        if (callback) {
            o = new Object();
            o.ret = callback;
        }
		return HTML_AJAX.fullcall(url,'Null',false,'ret',o,{});
	},
	replace: function(id) {
		if (arguments.length == 2) {
			// grab replacement
			document.getElementById(id).innerHTML = HTML_AJAX.grab(arguments[1]);
		}
		else {
			// call replacement
			var args = new Array();
			for(var i = 3; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			document.getElementById(id).innerHTML = HTML_AJAX.call(arguments[1],arguments[2],false,args);
		}
	},
    onOpen: function(className,methodName) {
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
        
            document.getElementsByTagName('body').item(0).appendChild(loading);
        }
        loading.style.display = 'block';
    },
    onLoad: function(className,methodName) {
        var loading = document.getElementById('HTML_AJAX_LOADING');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    // A really basic error handler 
    /*
    onError: function(e) {
        msg = "";
        for(var i in e) {
            msg += i+':'+e[i]+"\n";
        }
        alert(msg);
    }
    */
}



// small classes that I don't want to put in there own file
// serialization class for JSON, wrapper for JSON.stringify in json.js
function HTML_AJAX_Serialize_JSON() {}
HTML_AJAX_Serialize_JSON.prototype = {
	//contentType: 'text/json; charset=UTF-8',
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
function HTML_AJAX_Serialize_Null() {}
HTML_AJAX_Serialize_Null.prototype = {
	contentType: 'text/plain; charset=UTF-8',
	serialize: function(input) {
		return input;
	},
	unserialize: function(input) {
		return input;
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

        var e = new Error('PHP Error');
        for(var i in data) {
            e[i] = data[i];
        }
        throw e;
	}
}



/**
 * Decorates a normal JS exception for client side errors
 * @param Error
 * @param string error code
 */
function HTML_AJAX_Client_Error(e, code) 
{
    e.name = 'Client_Error';
    e.code = code;
    return e;
};
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// Dispatcher.js
/**
 * Class that is used by generated stubs to make actual AJAX calls
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @copyright  2004-2005 Harry Fuecks
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @todo	build urls smartly in doCall
 */
function HTML_AJAX_Dispatcher(className,mode,callback,serverUrl,serializer,unserializer) 
{
	this.className = className;
	this.mode = mode;
	this.callback = callback;

	if (serverUrl) {
		this.serverUrl = serverUrl
	}
	else {
		this.serverUrl = window.location;
	}

	if (serializer) {
		eval("this.serialize = new HTML_AJAX_Serialize_"+serializer+";");
	}
	else {
		this.serialize = new HTML_AJAX_Serialize_JSON();
	}
	if (unserializer) {
		eval("this.unserialize = new HTML_AJAX_Serialize_"+unserializer+";");
	}
	else {
		this.unserialize = new HTML_AJAX_Serialize_JSON();
	}
}

HTML_AJAX_Dispatcher.prototype = {
    /**
     * HTML_AJAX_Http_Client instance
     */
	client: null,

    /**
     * Timeout for async calls
     */
	timeout: 20000,

    /**
     * Request object instance
     */
	request: false,

    /**
     * Class postfix to content-type map
     */
    contentTypeMap: {'JSON':'application/json','Null':'text/plain','Error':'application/error'},

    /**
     * Create a new HTML_AJAX_HttpClient
     */
	initClient: function() 
    {
		this.client = new HTML_AJAX_HttpClient();
        this.client.dispatcher = this;
	},

    /**
     * Make an ajax call
     *
     * @param   string callName
     * @param   Array   args    arguments to the report method
     */
	doCall: function(callName,args) 
    {
		if ( !this.client ) {
		    this.initClient();
		}
		if ( !this.request ) {
			this.request = new HTML_AJAX_Request(this.serialize);
		}
		this.request.reset();
		this.request.serverurl = this.serverUrl+"?c="+this.className+"&m="+callName;
		this.timeout = this.timeout;
        
		for(var i=0; i < args.length; i++) {
		    this.request.addArg(i,args[i]);
		};
        
		if ( this.mode == "async" ) {
		    return this._asyncCall(this.request,callName);
		} else {
		    return this._syncCall(this.request,callName);
		}
	},

	/**
     * Call remote procedure asynchronously
     * @param   object  request an instance of HTML_AJAX_Request
     * @param   string  callName    the method being called
	 * @access private
     */
	_asyncCall: function(request, callName) 
    {
		try {
			this.client.asyncCall(request,this,callName);
		} catch (e) {
			this.errorFunc(e);
		}
		return;
	},
    
	/**
     * Call remote procedure synchronously
     * @param   object  request an instance of HTML_AJAX_Request
     * @param   string  callName    the method being called
	 * @access private
     */
	_syncCall: function(request, callName) 
    {
		try {
			var response = this.client.call(request,callName);

			try {
                this._setupUnserializer(this.client.xmlhttp.getResponseHeader('Content-Type'));
				var data = this.unserialize.unserialize(response);
                
				try {
					return data;
				} catch (e) {
                
					if ( e.name == 'Server_Error' ) {
						this.serverErrorFunc(e);
					} else {
						this.applicationErrorFunc(e);
					}

				}

			} catch (e) {
				e.name = 'Server_Error';
				e.code = 2006;
				e.response = response;
				this.errorFunc(e);
			}

		} catch(e) {
			this.errorFunc(e);
		}
	},
    
    /**
     * Create a unserializer for the given content-type
     * @param   string  contentType a Content-type from an http header
     * @access private
     */
    _setupUnserializer: function(contentType) {
        for(var i in this.contentTypeMap) {
            if (contentType == this.contentTypeMap[i]) {
                eval("this.unserialize = new HTML_AJAX_Serialize_"+i+";");
                return true;
            }
        }
        return false;
    },

    /**
     * Event handler for load event from the HttpClient
     * 
     * If you want to do something based on this event checkout HTML_AJAX.onLoad instead of overriding this method
     *
     * @param   mixed   response
     * @param   string  callName    method that was called
     * @param   string  contentType Content-type from the http header
     */
    onLoad: function(response, callName, contentType) 
    {
        try {
            this._setupUnserializer(contentType);
            var data = this.unserialize.unserialize(response);
            try {
                    
                if ( this.callback[callName] ) {
                    try {
                        this.callback[callName](data);
                    } catch(e) {
                        // Error in handler method (e.g. syntax error) - display it
                        this.errorFunc(e);
                    }
                } else {
                    alert('Your handler must define a method '+callName);
                }

                } catch (e) {

                    e.client = this.className;
                    e.call = callName;
                    
                    var errorFunc = callName+'Error';
                    
                    if ( this.callback[errorFunc] ) {
                        try {
                            this.callback[errorFunc](e);
                        } catch(e) {
                            // Error in handler method (e.g. syntax error) - display it
                           this.errorFunc(e);
                        }
                    } else {
                       this.errorFunc(e);
                    }
                }

            } catch (e) {
                e.name = 'Server_Error';
                e.code = 2006;
                e.response = response;
                e.client = this.className;
                e.call = callName;
                this.errorFunc(e);
            }
    },

    /**
     * Handle an error using the global handler if it exists else rethrows the exception
     * @param   object  e   an error object
     */
	errorFunc: function(e) {
        if (HTML_AJAX.onError) {
            HTML_AJAX.onError(e);
        }
        else {
            throw(e);
        }
	}
};
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// HttpClient.js
/**
 * XMLHttpRequestClient
 *
 * This is heavily based on JPSpan_HttpClient by Harry Fuecks
 *
 * @category   HTML
 * @package    AJAX
 * @author     Harry Fuecks
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2004-2005 Harry Feucks
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 */
function HTML_AJAX_HttpClient() {}
HTML_AJAX_HttpClient.prototype = {
    /**
     * XMLHttpRequest Object
     */
    xmlhttp: null,

    /**
     * The object that contains the async callback methods
     */
    userhandler: null,

    /**
     * Id used for timing out async calls
     */
    _timeout_id: null,
    
    /**
     * Setup an XMLHttpRequest object
     * @throws Error code 1000
     */
    init: function() 
    {
        try {
            // Mozilla / Safari
            this.xmlhttp = new XMLHttpRequest();
        } catch (e) {
            // IE
            var MSXML_XMLHTTP_PROGIDS = new Array(
                'MSXML2.XMLHTTP.5.0',
                'MSXML2.XMLHTTP.4.0',
                'MSXML2.XMLHTTP.3.0',
                'MSXML2.XMLHTTP',
                'Microsoft.XMLHTTP'
            );
            var success = false;
            for (var i=0;i < MSXML_XMLHTTP_PROGIDS.length && !success; i++) {
                try {
                    this.xmlhttp = new ActiveXObject(MSXML_XMLHTTP_PROGIDS[i]);
                    success = true;
                } catch (e) {}
            }
            if ( !success ) {
                throw HTML_AJAX_Client_Error(
                        new Error('Unable to create XMLHttpRequest.'),
                        1000
                    );
            }
        }
    },
    
    /** 
     * Place an synchronous call (results returned directly)
     * @param object request object for params and HTTP method
     * @param string
     * @return string response text
     * @throws Error codes 1001 and 1002
     */
    call: function (request,callName) 
    {

        if ( !this.xmlhttp ) {
            this.init();
        }

        if (this.callInProgress()) {
            throw HTML_AJAX_Client_Error(
                    new Error('Call in progress'),
                    1001
                );
        };

        if (HTML_AJAX.onOpen) {
            HTML_AJAX.onOpen(this.dispatcher.className,callName);
        }
        

        request.type = 'sync';
        request.prepare(this.xmlhttp);
        this.xmlhttp.setRequestHeader('Accept-Charset','UTF-8');
        request.send();
        
        if ( this.xmlhttp.status == 200 ) {
		if (HTML_AJAX.onLoad) {
			HTML_AJAX.onLoad(this.dispatcher.className,callName);
		}
            return this.xmlhttp.responseText;
        } else {
            var errorMsg = '['+this.xmlhttp.status
                            +'] '+this.xmlhttp.statusText;
            var err = new Error(errorMsg);
            err.headers = this.xmlhttp.getAllResponseHeaders();
            throw HTML_AJAX_Client_Error(err,1002);
        }
    },

    /** 
     * Place an asynchronous call (results sent to handler)
     * @param object request object for params and HTTP method
     * @param object handler: user defined object to be called
     * @throws Error code 1001
     */
    asyncCall: function (request,handler) 
    {
        var callName = null;
        if ( arguments[2] ) {
            callName = arguments[2];
        }
        
        if ( !this.xmlhttp ) {
            this.init();
        }

        if (this.callInProgress()) {
            throw HTML_AJAX_Client_Error(
                    new Error('Call in progress'),
                    1001
                );
        };

        this.userhandler = handler;
        
        request.type = 'async';
        request.prepare(this.xmlhttp);
        this.xmlhttp.setRequestHeader('Accept-Charset','UTF-8');

        var self = this;

        this._timeout_id = window.setTimeout(function() {
            self.abort(self, callName);
        },request.timeout);

        
        this.xmlhttp.onreadystatechange = function() {
            self._stateChangeCallback(self, callName);
        }

        request.send();
    },

    
    /**
     * Checks to see if XmlHttpRequest is busy
     * @return boolean TRUE if busy
     */
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
    
    /**
     * Callback for timeouts: aborts the request
     * @param   HTML_AJAX_Http_Client client
     * @param   string  callName
     */
    abort: function (client, callName) 
    {
        if ( client.callInProgress() ) {
        
            client.xmlhttp.abort();
            var errorMsg = 'Operation timed out';

            if ( callName ) {
                errorMsg += ': '+callName;
            }
            
            if ( HTML_AJAX.onError ) {
                HTML_AJAX.onError(HTML_AJAX_Client_Error(new Error(errorMsg), 1003));
            }
            
        }
    },
    
    /**
     * Callback for asyncCalls
     * @param   HTML_AJAX_Http_Client client
     * @param   string  callName
     * @access private
     */
    _stateChangeCallback: function(client, callName) 
    {
        switch (client.xmlhttp.readyState) {

            // XMLHTTPRequest.open() has just been called
            case 1:
                if(HTML_AJAX.onOpen) {
                    HTML_AJAX.onOpen(this.dispatcher.className, callName);
                }
            break;

            // XMLHTTPRequest.send() has just been called
            case 2:
                if (HTML_AJAX.onSend ) {
                    HTML_AJAX.onSend(this.dispatcher.className, callName);
                }
            break;
            
            // Fetching response from server in progress
            case 3:
                if (HTML_AJAX.onProgress ) {
                    HTML_AJAX.onProgress(this.dispatcher.className, callName);
                }
            break;
            
            // Download complete
            case 4:
                window.clearTimeout(client._timeout_id);

                switch ( client.xmlhttp.status ) {
                    case 200:
                        if (HTML_AJAX.onLoad) {
                            HTML_AJAX.onLoad(this.dispatcher.className, callName);
                        }
                        if (client.userhandler.onLoad ) {
                            try {
                                client.userhandler.onLoad(client.xmlhttp.responseText, callName, this.xmlhttp.getResponseHeader('Content-Type'));
                            } catch (e) {
                                if (HTML_AJAX.onError) {
                                    HTML_AJAX.onError(e);
                                }
                                else {
                                    throw e;
                                }
                            }
                        }
                        break;
                    
                    // Special case for IE on aborted requests
                    case 0:
                        // Do nothing
                        break;
                        
                    default:
                        var e = new HTML_AJAX_Client_Error(
                            new Error('Error in Response, HTTP Error: ['+client.xmlhttp.status+'] '+ client.xmlhttp.statusText),
                            1002
                        );
                        e.headers = this.xmlhttp.getAllResponseHeaders();
                        if (HTML_AJAX.onError) {
                            HTML_AJAX.onError(e);
                        }
                        else {
                            throw e;
                        }
                        break;
                }
            break;
        }
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
// Request.js
/**
 * Class for doing a request through the HTML_AJAX_HttpClient
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @copyright  2004-4005 Harry Fuecks
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 */
function HTML_AJAX_Request(serializer) {
    this.serializer = serializer;
}
HTML_AJAX_Request.prototype = {

    // Instance of a serializer
    serializer: null,
    
    // The URL of the server
    serverurl: '',
    
    // The actual URL the request is sent to
    requesturl: '',
    
    // Body of request (for HTTP POST only)
    body: '',
    
    // Remote method arguments list
    args: null,
    
    // Type of request (async / sync)
    type: null,

    // Instance of XMLHttpRequest
    http: null,

    // Timeout in milliseconds for requests
    timeout: 20000,
    
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
        var illegal = /[\W_]/;
        if (!illegal.test(name) ) {
            this.args[name] = value;
        } else {
            throw HTML_AJAX_Client_Error(
                    new Error('Invalid parameter name ('+name+')'),
                    1004
                );
        }
    },

    /**
     * Reset the request object
     * @return void
     * @access public
     */
    reset: function() 
    {
        this.serverurl = '';
        this.requesturl = '';
        this.body = '';
        this.args = null;
        this.type = null;
        this.http = null;
        this.timeout = 20000;
    },
    
    /**
     * Build the payload using the assigned serializer
     * @access public
     */ 
    build: function() 
    {
        try {
            this.body = this.serializer.serialize(this.args);
        } catch (e) {
            throw HTML_AJAX_Client_Error(e, 1006);
        };
        this.requesturl = this.serverurl;
    },
    
    /**
     * Called from HTML_AJAX_HttpClient to prepare the XMLHttpRequest object
     * @param XMLHttpRequest
     * @access public
     * @throws Error codes 1005, 1006 and 1007
     */
    prepare: function(http) 
    {
        this.http = http;
        this.build();
        switch ( this.type ) {
            case 'async':
                try {
                    this.http.open('POST',this.requesturl,true);
                } catch (e) {
                    throw HTML_AJAX_Client_Error(new Error(e),1007);
                };
            break;
            case 'sync':
                try {
                    this.http.open('POST',this.requesturl,false);
                } catch (e) {
                    throw HTML_AJAX_Client_Error(new Error(e),1007);
                };
            break;
            default:
                throw HTML_AJAX_Client_Error(
                        new Error('Call type invalid '+this.type),
                        1005
                    );
            break;
        };
        if (this.body) {
            this.http.setRequestHeader('Content-Length', this.body.length);
        }
        this.http.setRequestHeader('Content-Type',this.serializer.contentType);
    },
    
    /**
     * Used by HTML_AJAX_HTTPClient to call send on the XMLHttpRequest object
     * @return void
     * @access public
     */
    send: function(http) 
    {
        this.http.send(this.body);
    }
};
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
