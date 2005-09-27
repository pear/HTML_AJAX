<?php
// $Id$
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
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 */

/**
 * This is a quick hack, loading serializers as needed doesn't work in php5
 */
require_once "HTML/AJAX/Serializer/JSON.php";
require_once "HTML/AJAX/Serializer/Null.php";
require_once "HTML/AJAX/Serializer/Error.php";
    
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
     * To make integration with applications easier, you can
     * register callbacks to serve header calls, clean/retrive server vars
     * and clean/retrieve get vars
     */
    var $_callbacks = array(
        'headers' => array('HTML_AJAX', '_sendHeaders'),
        'get' => array('HTML_AJAX', '_getVar'),
        'server' => array('HTML_AJAX', '_getVar'),
        );

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
    var $serializer = 'JSON';

    /**
     * What encoding your going to use for unserializing data sent from javascript
     * @var string  JSON|null
     */
    var $unserializer = 'JSON';

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
     * This function uses get_class_methods to get a list of callable methods, so if your on PHP5 extending this class with a class you want to export should export its 
     * protected methods, while normally only its public methods would be exported.  All methods starting with _ are removed from the export list.  This covers
     * PHP4 style private by naming as well as magic methods in either PHP4 or PHP5
     *
     * @param string    $className
     * @return array  all methods of the class that are public
     * @access private
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
        $client = '';

        foreach($this->_exportedInstances as $name => $data) {
            $client .= $this->generateClassStub($name);
        }
        return $client;
    }

    /**
     * Registers callbacks for sending headers or retriving post/get vars
     * for better application integration
     */
    function registerCallback($callback, $type = 'headers') 
    {
        if(is_callable($callback))
        {
            if($type == 'headers')
            {
                $this->_callbacks['headers'] = $callback;
                return true;
            }
            elseif($type == 'get')
            {
                $this->_callbacks['get'] = $callback;
                return true;
            }
            elseif($type == 'server')
            {
                $this->_callbacks['server'] = $callback;
                return true;
            }
            else
            {
                return false;
            }
        }
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
            return '';
        }

        $client = "// Client stub for the {$this->_exportedInstances[$name]['className']} PHP Class\n";
        $client .= "function {$name}(callback) {\n";
        $client .= "\tmode = 'sync';\n";
        $client .= "\tif (callback) { mode = 'async'; }\n";
        $client .= "\tthis.className = '{$name}';\n";
        if ($this->serverUrl) {
            $client .= "\tthis.dispatcher = new HTML_AJAX_Dispatcher(this.className,mode,callback,'{$this->serverUrl}','{$this->unserializer}');\n}\n";
        } else {
            $client .= "\tthis.dispatcher = new HTML_AJAX_Dispatcher(this.className,mode,callback,false,'{$this->unserializer}');\n}\n";
        }
        $client .= "{$name}.prototype  = {\n";
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
        $stub = "\t{$method}: function() { return this.dispatcher.doCall('{$method}',arguments); },\n";
        return $stub;
    }

    /**
     * Handle a ajax request if needed
     *
     * The current check is if GET variables c (class) and m (method) are set, more options may be available in the future
     *
     * @todo is it worth it to figure out howto use just 1 instance if the type is the same for serialize and unserialize
     *
     * @return  boolean true if an ajax call was handled, false otherwise
     */
    function handleRequest() 
    {
        $class = call_user_func((array)$this->_callbacks['get'], 'c');
        $method = call_user_func($this->_callbacks['get'], 'm');
        if (!empty($class) && !empty($method)) {
            set_error_handler(array(&$this,'_errorHandler'));
            
            if (!isset($this->_exportedInstances[$class])) {
                // handle error
                trigger_error('Unknown class: '.$class);
            }
            if (!in_array($method,$this->_exportedInstances[$class]['exportedMethods'])) {
                // handle error
                trigger_error('Unknown method: '.$method);
            }

            // auto-detect serializer to use from content-type
            $type = $this->unserializer;
            $key = array_search($this->_getClientPayloadContentType(),$this->contentTypeMap);
            if ($key) {
                $type = $key;
            }
            $unserializer = $this->_getSerializer($type);

            $args = $unserializer->unserialize($this->_getClientPayload());
            if (!is_array($args)) {
                $args = array($args);
            }
            $ret = call_user_func_array(array(&$this->_exportedInstances[$class]['instance'],$method),$args);
            
            
            
            restore_error_handler();
            $this->_sendResponse($ret);

            return true;
        }
        return false;
    }

    function _getClientPayloadContentType() {
        $type = call_user_func($this->_callbacks['server'], 'CONTENT_TYPE');
        if(!empty($type)) {
            if (strstr($type,';')) {
                $type = array_shift(explode(';',$type));
            }
            return strtolower($type);
        }
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

            // headers to force things not to be cached:
            $headers = array();
            $headers['Content-Length'] = strlen($output);
            $headers['Expires'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
            $headers['Last-Modified'] = gmdate( "D, d M Y H:i:s" ) . 'GMT';
            $headers['Cache-Control'] = 'no-cache, must-revalidate';
            $headers['Pragma'] = 'no-cache';

            if (isset($this->contentTypeMap[$this->serializer])) {
                //remember that IE is stupid and wants a capital T
                $headers['Content-Type'] = $this->contentTypeMap[$this->serializer];
            }

            call_user_func($this->_callbacks['headers'],$headers);
            echo $output;
    }

    /**
     * Actually send a list of headers
     *
     * @param  array list of headers to send, default callback for headers
     * @access private
     */
    function _sendHeaders($array) 
    {
            foreach($array as $header => $value)
            {
                header($header .': '.$value);
            }
    }

    /**
     * Get an instance of a serializer class
     *
     * @access private
     */
    function _getSerializer($type) 
    {
        $class = 'HTML_AJAX_Serializer_'.$type;

        if (!class_exists($class)) {
            // include the class only if it isn't defined
            require_once "HTML/AJAX/Serializer/{$type}.php";
        }

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
            return $GLOBALS['HTTP_RAW_POST_DATA'];
    }

    /**
     * stub for getting get/server vars - applies strip tags
     *
     * @access  private
     * @return  string  filtered _GET value
     */
    function _getVar($var) {
        if(!isset($_GET[$var]))
        {
            return NULL;
        }
        else
        {
            return strip_tags($_GET[$var]);
        }
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
