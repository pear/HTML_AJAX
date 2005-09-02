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
 * Require the main AJAX library
 */
require_once 'HTML/AJAX.php';

/**
 * Class for creating an external AJAX server
 *
 * Can be used in 2 different modes, registerClass mode where you create an instance of the server and add the classes that will be registered
 * and then run handle request
 *
 * Or you can extend it and add init{className} methods for each class you want to export
 *
 * Client js generation is exposed through 2 _GET params client and stub
 *  Setting the _GET param client to `all` will give you all the js classes needed
 *  Setting the _GET param stub to `all` will give you stubs of all registered classes, you can also set it too just 1 class
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/PackageName
 * @todo       extend options and generateClient fileList building to support , seperated lists of libs
 */
class HTML_AJAX_Server 
{

    /**
     * Client options array if set to true the code looks at _GET
     * @var bool|array
     */
    var $options = true;

    /**
     * HTML_AJAX instance
     * @var HTML_AJAX
     */
    var $ajax;

    /**
     * Set to true if your extending the server to add init{className methods}
     * @var boolean
     * @access  public
     */
    var $initMethods = false;

    /**
     * Location on filesystem of client javascript library
     * @var false|string if false the default pear data dir location is used
     */
    var $clientJsLocation = false;

    /** 
     * An array of options that tell the server howto Cache output
     *
     * The rules are functions that make etag hash used to see if the client needs to download updated content
     * If you extend this class you can make your own rule function the naming convention is _cacheRule{RuleName}
     *
     * <code>
     * array(
     *  'httpCacheClient' => true,   // send 304 headers for responses to ?client=* requests
     *  'ClientCacheRule' => 'File', // create a hash from file names and modified times, options: file|content
     *  'ClientCacheExpects'=> 'files', // what type of content to send to the hash function, options: files|classes|content
     *  'httpCacheStub'   => true,   // send 304 headers for responses to ?stub=* requests
     *  'StubCacheRule'   => 'Api',  // create a hash from the exposed api, options: api|content
     *  'StubCacheExpects'=> 'classes', // what type of content to send to the hash function, options: files|classes|content
     * )
     * </code>
     *
     * @var array
     * @access  public
     */
    var $cacheOptions = array(
        'httpCacheClient'       => true, 
        'ClientCacheRule'       => 'file',
        'ClientCacheExpects'    => 'files',
        'httpCacheStub'         => true, 
        'StubCacheRule'         => 'api', 
        'StubCacheExpects'      => 'classes', 
        );

    /**
     * Javascript library names and there path 
     *
     * the return of $this->clientJsLocation(), is appended before running readfile on them
     *
     * @access  public
     * @var array
     */
    var $javascriptLibraries = array(
        'all'       =>  'HTML_AJAX.js',
        'html_ajax' =>  'HTML_AJAX.js',
        'html_ajax_lite'=>  'HTML_AJAX_lite.js',
        'json'      =>  'JSON.js',
        'request'   =>  'Request.js',
        'main'      =>  'Main.js',
        'httpclient'=>  'HttpClient.js',
        'dispatcher'=>  'Dispatcher.js'
    );

    /**
     * Constructor creates the HTML_AJAX instance
     *
     * @todo: verify that PHP_SELF always does what we want
     */
    function HTML_AJAX_Server() 
    {
        $this->ajax =& new HTML_AJAX();
        $this->ajax->serverUrl = $_SERVER['PHP_SELF'];
    }

    /**
     * Handle a client request, either generating a client or having HTML_AJAX handle the request
     *
     * @return  string generated client or ajax response
     */
    function handleRequest() 
    {
        if ($this->options == true) {
            $this->_loadOptions();
        }
        if (!isset($_GET['c'])) {
            return $this->generateClient();
        } else {
            $this->_init($this->_cleanIdentifier($_GET['c']));
            return $this->ajax->handleRequest();
        }
    }

    /**
     * Register method passthrough to HTML_AJAX
     *
     * @see HTML_AJAX::registerClass for docs
     */
    function registerClass(&$instance, $exportedName = false, $exportedMethods = false) 
    {
        $this->ajax->registerClass($instance,$exportedName,$exportedMethods);
    }

    /**
     * Generate client js
     *
     * @todo    this is going to need tests to cover all the options
     */
    function generateClient() 
    {
        header('Content-Type: text/javascript');
        ob_start();

        // create a list list of js files were going to need to output
        $fileList = array();
        $library = strtolower($this->options['client']);

        if (isset($this->javascriptLibraries[$library])) {
            $fileList[] = $this->clientJsLocation().$this->javascriptLibraries[$library];
        }

        // do needed class init if were running an init server
        if(!is_array($this->options['stub']))
        {
            $this->options['stub'] = array();
        }
        $classList = $this->options['stub'];
        if ($this->initMethods) {
            if (isset($this->options['stub'][0]) && $this->options['stub'][0] === 'all') {
                    $this->_initAll();
            } else {
                foreach($this->options['stub'] as $stub) {
                    $this->_init($stub);
                }
            }
        }
        if (isset($this->options['stub'][0]) && $this->options['stub'][0] === 'all') {
            $classList = array_keys($this->ajax->_exportedInstances);
        }

        // if were doing stub and client we have to wait for both ETags before we can compare with the client
        $combinedOutput = false;
        if ($classList != false && count($classList) > 0 && count($fileList) > 0) {
            $combinedOutput = true;
        }


        if ($classList != false && count($classList) > 0) {

            // were setup enough to make a stubETag if the input it wants is a class list
            if ($this->cacheOptions['httpCacheStub'] && $this->cacheOptions['StubCacheExpects'] == 'classes') {
                $stubETag = $this->_callCacheRule('Stub',$classList);
            }

            // if were not in combined output compare etags, if method returns true were done
            if (!$combinedOutput && isset($stubETag)) {
                if ($this->_compareEtags($stubETag)) {
                    ob_end_clean();
                    return;
                }
            }

            // output the stubs for all the classes in our list
            foreach($classList as $class) {
                    echo $this->ajax->generateClassStub($class);
            }

            // if were cacheing and the rule expects content make a tag and check it, if the check is true were done
            if ($this->cacheOptions['httpCacheStub'] && $this->cacheOptions['StubCacheExpects'] == 'content') {
                $stubETag = $this->_callCacheRule('Stub',ob_get_contents());
            }

            // if were not in combined output compare etags, if method returns true were done
            if (!$combinedOutput && isset($stubETag)) {
                if ($this->_compareEtags($stubETag)) {
                    ob_end_clean();
                    return;
                }
            }
        }

        if (count($fileList) > 0) {
            // if were caching and need a file list build our jsETag
            if ($this->cacheOptions['httpCacheClient'] && $this->cacheOptions['ClientCacheExpects'] === 'files') {
                $jsETag = $this->_callCacheRule('Client',$fileList);

            }

            // if were not in combined output compare etags, if method returns true were done
            if (!$combinedOutput && isset($jsETag)) {
                if ($this->_compareEtags($jsETag)) {
                    ob_end_clean();
                    return;
                }
            }

            // output the needed client js files
            foreach($fileList as $file) {
                $this->_readFile($file);
            }

            // if were caching and need content build the etag
            if ($this->cacheOptions['httpCacheClient'] && $this->cacheOptions['ClientCacheExpects'] === 'content') {
                $jsETag = $this->_callCacheRule('Client',ob_get_contents());
            }

            // if were not in combined output compare etags, if method returns true were done
            if (!$combinedOutput && isset($jsETag)) {
                if ($this->_compareEtags($jsETag)) {
                    ob_end_clean();
                    return;
                }
            }
            // were in combined output, merge the 2 ETags and compare
            else if (isset($jsETag) && isset($stubETag)) {
                if ($this->_compareEtags(md5($stubETag.$jsETag))) {
                    ob_end_clean();
                    return;
                }
            }
        }


        // were outputting content, add our length header and send the output
        $length = ob_get_length();
        if ($length > 0) {
            header('Content-Length: '.$length);
        }
        ob_end_flush();
    }

    /**
     * Run readfile on input with basic error checking
     *
     * @param   string  $file   file to read
     * @access  private
     * @todo    is addslashes enough encoding for js?
     */
    function _readFile($file) 
    {
        if (file_exists($file)) {
            readfile($file);
        } else {
            $file = addslashes($file);
            echo "alert('Unable to find javascript file: $file');";
        }
    }

    /**
     * Get the location of the client js
     * To override the default pear datadir location set $this->clientJsLocation
     *
     * @return  string
     */
    function clientJsLocation() 
    {
        if (!$this->clientJsLocation) {
            return '@data-dir@'.DIRECTORY_SEPARATOR.'HTML_AJAX'.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR;
        } else {
            return $this->clientJsLocation;
        }
    }

    /**
     * Load options from _GET
     *
     * @access private
     */
    function _loadOptions() 
    {
        $this->options = array('client'=>false,'stub'=>false);
        if (isset($_GET['client'])) {
            $this->options['client'] = $this->_cleanIdentifier($_GET['client']);
        }
        if (isset($_GET['stub'])) {
            if (strstr($_GET['stub'],',')) {
                $stubs = explode(',',$_GET['stub']);
            } else {
                $stubs = array($_GET['stub']);
            }
            $stub = array();
            foreach($stubs as $val) {
                $cleanVal = $this->_cleanIdentifier($val);
                if (!empty($cleanVal)) {
                    $stub[] = $cleanVal;
                }
            }

            if (count($stub) > 0) {
                $this->options['stub'] = $stub;
            } else {
                $this->options['stub'] = false;
            }
        }
    }

    /**
     * Clean an identifier like a class name making it safe to use
     *
     * @param   string  $input
     * @return  string
     * @access  private
     */
    function _cleanIdentifier($input) {
            return trim(preg_replace('/[^A-Za-z_0-9]/','',$input));
    }

    /**
     * Run every init method on the class
     *
     * @access private
     */
    function _initAll() 
    {
        $methods = get_class_methods(get_class($this));

        foreach($methods as $method) {
            if (substr($method,0,4) == 'init') {
                $this->$method();
            }
        }
    }

    /**
     * Init one class
     *
     * @param   string  $className
     * @access private
     * @todo    error handling if the method doesn't exist
     */
    function _init($className) 
    {
        $m = "init$className";
        if (is_callable(array(&$this,$m))) {
            $this->$m();
        }
    }

    /**
     * Generate a hash from a list of files
     *
     * @param   array   $files  file list
     * @return  string  a hash that can be used as an etag
     * @access  private
     */
    function _cacheRuleFile($files) {
        $signature = "";
        foreach($files as $file) {
            if (file_exists($file)) {
                $signature .= $file.filemtime($file);
            }
        }
        return md5($signature);
    }

    /**
     * Generate a hash from the api of registered classes
     *
     * @param   array   $classes class list
     * @return  string  a hash that can be used as an etag
     * @access  private
     */
    function _cacheRuleApi($classes) {
        $signature = "";
        foreach($classes as $class) {
            if (isset($this->ajax->_exportedInstances[$class])) {
                $signature .= $class.implode(',',$this->ajax->_exportedInstances[$class]['exportedMethods']);
            }
        }
        return md5($signature);
    }

    /**
     * Generate a hash from the raw content
     *
     * @param   array   $content
     * @return  string  a hash that can be used as an etag
     * @access  private
     */
    function _cacheRuleContent($content) {
        return md5($content);
    }

    /**
     * Send cache control headers
     * @access  private
     */
    function _sendCacheHeaders($etag,$notModified) {
        header('Cache-Control: must-revalidate');
        header('ETag: '.$etag);
        if ($notModified) {
            header('HTTP/1.0 304 Not Modified');
        }
    }

    /**
     * Compare eTags
     *
     * @param   string  $serverETag server eTag
     * @return  boolean
     * @access  private
     */
    function _compareEtags($serverETag) {
        if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
    		if (strcmp($_SERVER['HTTP_IF_NONE_MATCH'],$serverETag) == 0) {
                $this->_sendCacheHeaders($serverETag,true);
                return true;
            }
    	}
        $this->_sendCacheHeaders($serverETag,false);
        return false;
    }

    /**
     * Call a cache rule and return its retusn
     *
     * @param   string  $rule Stub|Client
     * @param   mixed   $payload
     * @return  boolean
     * @access  private
     * @todo    decide if error checking is needed
     */
    function _callCacheRule($rule,$payload) {
        $method = '_cacheRule'.$this->cacheOptions[$rule.'CacheRule'];
        return call_user_func(array(&$this,$method),$payload);
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
