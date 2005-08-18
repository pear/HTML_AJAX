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
