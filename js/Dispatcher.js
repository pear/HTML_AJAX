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
