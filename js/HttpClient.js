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
