<?php
/**
 * OO AJAX Implementation for PHP
 *
 * LICENSE: This source file is subject to version 3.0 of the PHP license
 * that is available through the world-wide-web at the following URI:
 * http://www.php.net/license/3_0.txt.  If you did not receive a copy of
 * the PHP License and are unable to obtain it through the web, please
 * send a note to license@php.net so we can mail you a copy immediately.
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @version    Release: @package_version@
 */
    
/**
 * OO AJAX Implementation for PHP
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/PackageName
 * @todo       Decide if its good thing to support get
 * @todo       pass server side warnings to the client as exceptions or something like that
 * @todo       Add some sort of debugging console
 */
class HTML_AJAX {
    /**
     * An array holding the instances were exporting
     *
     * key is the exported name
     *
     * row format is array('className'=>'','exportedName'=>'','instance'=>'','exportedMethods=>'')
     *
     * @var object
     * @access private
     */    
    var $_exportedInstances;

    /**
     * Set the server url in the generated stubs to this value
     * If set to false, serverUrl will not be set
     * @var false|string
     */
    var $serverUrl = false;

    /**
     * What encoding your going to use for serializing data from php being sent to javascript
     * @var string  JSON|null
     */
    var $serializer = "JSON";

    /**
     * What encoding your going to use for unserializing data sent from javascript
     * @var string  JSON|null
     */
    var $unserializer = "JSON";

    /**
     * Content-type map
     *
     * Used in to automatically choose serializers as needed
     */
    var $contentTypeMap = array(
            'JSON'  => 'application/json',
            'Null'  => 'text/plain',
            'Error' => 'application/error',
        );

    /**
     * Set a class to handle requests
     *
     * @param   object  $instance
     * @param   string|bool  $exportedName  Name used for the javascript class, if false the name of the php class is used
     * @param   array|bool  $exportedMethods  If false all functions without a _ prefix are exported, if an array only the methods listed in the array are exported
     * @return  void
     */
    function registerClass(&$instance, $exportedName = false, $exportedMethods = false) 
    {
        $className = strtolower(get_class($instance));

        if ($exportedName === false) {
            $exportedName = $className;
        }

        if ($exportedMethods === false) {
            $exportedMethods = $this->_getMethodsToExport($className);
        }


        $this->_exportedInstances[$exportedName] = array();
        $this->_exportedInstances[$exportedName]['className'] = $className;
        $this->_exportedInstances[$exportedName]['exportedName'] = $className;
        $this->_exportedInstances[$exportedName]['instance'] =& $instance;
        $this->_exportedInstances[$exportedName]['exportedMethods'] = $exportedMethods;
    }

    /**
     * Get a list of methods in a class to export
     *
     * @param string    $className
     * @return array  all methods of the class that are public
     * @access private
     * @todo    What does get_class_methods do in php5
     */    
    function _getMethodsToExport($className) 
    {
        $funcs = get_class_methods($className);

        foreach ($funcs as $key => $func) {
            if ($func === $className || substr($func,0,1) === '_') {
                unset($funcs[$key]);
            }
        }
        return $funcs;
    }

    /**
     * Generate the client Javascript code
     *
     * @return  string  generated javascript client code
     */
    function generateJavaScriptClient() 
    {
        $client = "";

        foreach($this->_exportedInstances as $name => $data) {
            $client .= $this->generateClassStub($name);
        }
        return $client;
    }

    /**
     * Return the stub for a class
     *
     * @param   string  $name   name of the class to generated the stub for, note that this is the exported name not the php class name
     * @return  string  javascript proxy stub code for a single class
     */
    function generateClassStub($name) 
    {

        if (!isset($this->_exportedInstances[$name])) {
            return "";
        }

        $client = "// Client stub for the {$this->_exportedInstances[$name]['className']} PHP Class\n";
        $client .= "function $name(callback) {\n";
        $client .= "\tmode = 'sync';\n";
        $client .= "\tif (callback) { mode = 'async'; }\n";
        $client .= "\tthis.serializer = '$this->serializer';\n";
        $client .= "\tthis.unserializer = '$this->unserializer';\n";
        $client .= "\tthis.className = '$name';\n";
        if ($this->serverUrl) {
            $client .= "\tthis.dispatcher = new HTML_AJAX_Dispatcher(this.className,mode,callback,'{$this->serverUrl}');\n}\n";
        }
        else {
            $client .= "\tthis.dispatcher = new HTML_AJAX_Dispatcher(this.className,mode,callback);\n}\n";
        }
        $client .= "$name.prototype  = {\n";
        foreach($this->_exportedInstances[$name]['exportedMethods'] as $method) {
            $client .= $this->_generateMethodStub($method);
        }
        $client = substr($client,0,(strlen($client)-2))."\n";
        $client .= "}\n\n";
        return $client;
    }

    /**
     * Returns a methods stub
     * 
     *
     * @param string the method name
     * @return string the js code
     * @access private
     */    
    function _generateMethodStub($method) 
    {
        $stub = "\t$method: function() { return this.dispatcher.doCall('$method',arguments); },\n";
        return $stub;
    }

    /**
     * Handle a ajax request if needed
     *
     * The current check is if GET variables c (class) and m (method) are set, more options may be available in the future
     *
     * @todo move the get _GET check someplace else so get variabled dispatch isn't the hardcoded method
     * @todo is it worth it to figure out howto use just 1 instance if the type is the same for serialize and unserialize
     *
     * @return  boolean true if an ajax call was handled, false otherwise
     */
    function handleRequest() 
    {
        if (isset($_GET['c']) && isset($_GET['m'])) {

            set_error_handler(array(&$this,'_errorHandler'));

            $class = $_GET['c'];
            $method = $_GET['m'];
            
            if (!isset($this->_exportedInstances[$class])) {
                // handle error
                trigger_error("Unknown class: $class");
            }
            if (!in_array($method,$this->_exportedInstances[$class]['exportedMethods'])) {
                // handle error
                trigger_error("Unknown method: $method");
            }

            $unserializer = $this->_getSerializer($this->unserializer);
            
            $args = $unserializer->unserialize($this->_getClientPayload());
            $ret = call_user_func_array(array(&$this->_exportedInstances[$class]['instance'],$method),$args);
            
            
            restore_error_handler();
            $this->_sendResponse($ret);

            return true;
        }
        return false;
    }

    /**
     * Send a reponse adding needed headers and serializing content
     *
     * Note: this method echo's output as well as setting headers to prevent caching
     *
     * @param   mixed content to serialize and send
     * @access private
     */
    function _sendResponse($response) 
    {
            $serializer = $this->_getSerializer($this->serializer);
            $output = $serializer->serialize($response);
            header('Content-Length: '.strlen($output));

            // headers to force things not to be cached: 
            header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); 
            header('Last-Modified: ' . gmdate( "D, d M Y H:i:s" ) . 'GMT'); 
            header('Cache-Control: no-cache, must-revalidate'); 
            header('Pragma: no-cache');

            if (isset($this->contentTypeMap[$this->serializer])) {
                header('Content-type: '.$this->contentTypeMap[$this->serializer]);
            }

            echo $output;
    }

    /**
     * Get an instance of a serializer class
     *
     * @access private
     */
    function _getSerializer($type) 
    {
        $class = "HTML_AJAX_Serializer_$type";

        // include the class
        require_once "HTML/AJAX/Serializer/$type.php";

        $instance = new $class();
        return $instance;
    }

    /**
     * Get payload in its submitted form, currently only supports raw post
     *
     * @access  private
     * @return  string  raw post data
     */
    function _getClientPayload() {
            global $HTTP_RAW_POST_DATA;
            return $HTTP_RAW_POST_DATA;
    }

    /**
     * Error handler that sends it errors to the client side
     *
     * @access private
     */
    function _errorHandler($errno, $errstr, $errfile, $errline) 
    {
        if (error_reporting()) {
            $e = new stdClass();
            $e->errNo   = $errno;
            $e->errStr  = $errstr;
            $e->errFile = $errfile;
            $e->errLine = $errline;
            $this->serializer = 'Error';
            $this->_sendResponse($e);

            die();
        }
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
