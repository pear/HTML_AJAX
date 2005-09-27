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
    // get an HttpClient, at some point this might be actually smart
    httpClient: function() {
        return new HTML_AJAX_HttpClient();
    },
    // make a request using an request object
    makeRequest: function(request) {
        var client = HTML_AJAX.httpClient();
        client.request = request;
        return client.makeRequest();
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
    },
    // A really basic error handler 
    /*
    onError: function(e) {
        msg = "";
        for(var i in e) {
            msg += i+':'+e[i]+"\n";
        }
        alert(msg);
    },
    */
    // Class postfix to content-type map
    contentTypeMap: {'JSON':'application/json','Null':'text/plain','Error':'application/error'}
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

        var e = new Error('PHP Error');
        for(var i in data) {
            e[i] = data[i];
        }
        throw e;
	}
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
