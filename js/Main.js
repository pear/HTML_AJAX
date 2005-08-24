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
