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
                        if (this.request.onLoad) {
                            this.request.onLoad();
                        } else if (HTML_AJAX.onLoad ) {
                            HTML_AJAX.onLoad(this.request);
                        }

                        this.request.callback(this._decodeResponse());
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
        if (this.request.onError) {
            this.request.onError(e);
        } else if (HTML_AJAX.onError) {
            HTML_AJAX.onError(e,this.request);
        }
        else {
            alert('throwing the exception');
            throw e;
        }
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
