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
        
		for(var i=0; i < args.length; i++) {
		    request.addArg(i,args[i]);
		};

		if ( this.mode == "async" ) {
		    request.isAsync = true;
		} else {
		    request.isAsync = false;
		}

        var self = this;
        request.callback = function(result) { self.callback[callName](result); }

        return HTML_AJAX.makeRequest(request);
	}
};
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
