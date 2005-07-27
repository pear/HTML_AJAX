<?php
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
 * @todo       Decide if a syntax is needed to generate 2 stubs at once
 */
class HTML_AJAX_Server {

	/**
	 * Client options array if set to true the code looks at _GET
	 * @var	bool|array
	 */
	var $options = true;

	/**
	 * HTML_AJAX instance
	 * @var	HTML_AJAX
	 */
	var $ajax;

	/**
	 * Set to true if your extending the server to add init{className methods}
	 */
	var $initMethods = false;

	/**
	 * Constructor creates the HTML_AJAX instance
     *
     * @todo: verify that PHP_SELF always does what we want
	 */
	function HTML_AJAX_Server() {
		$this->ajax =& new HTML_AJAX();
        $this->ajax->serverUrl = $_SERVER['PHP_SELF'];
	}

	/**
	 * Handle a client request, either generating a client or having HTML_AJAX handle the request
	 */
	function handleRequest() {
		if ($this->options == true) {
			$this->_loadOptions();
		}

		if (!isset($_GET['c'])) {
			return $this->generateClient();
		}
		else {
            $this->_init($_GET['c']);
			return $this->ajax->handleRequest();
		}
	}

    /**
     * Register method passthrough to HTML_AJAX
     *
     * @see HTML_AJAX::registerClass for docs
     */
    function registerClass(&$instance, $exportedName = false, $exportedMethods = false) {
        $this->ajax->registerClass($instance,$exportedName,$exportedMethods);
    }

	/**
	 * Generate client js
	 *
	 * @todo       Add Http_Cache type functionality so the client will cache the js
	 */
	function generateClient() {
        header('Content-type: text/javascript');

		if ($this->options['stub'] === 'all') {
			if ($this->initMethods) {
				$this->_initAll();
			}
            echo $this->ajax->generateJavaScriptClient($this->options['stub']);
		}
		else {
            if ($this->options['stub'] !== false) {
                $this->_init($this->options['stub']);
                echo $this->ajax->generateClassStub($this->options['stub']);
            }
		}

        $library = strtolower($this->options['client']);
		switch($library) {
            case 'all':
            case 'html_ajax':
                $this->_readFile($this->clientJsLocation()."HTML_AJAX.js");
                break;
            case 'json':
                $this->_readFile($this->clientJsLocation()."JSON.js");
                break;
            case 'request':
                $this->_readFile($this->clientJsLocation()."Request.js");
                break;
            case 'main':
                $this->_readFile($this->clientJsLocation()."Main.js");
                break;
            case 'httpclient':
                $this->_readFile($this->clientJsLocation()."HttpClient.js");
                break;
            case 'dispatcher':
                $this->_readFile($this->clientJsLocation()."Dispatcher.js");
                break;
            case false:
                break;
            default:
                echo "alert('Unknown javascript library:  $library');";
                break;
		}

	}

    /**
     * Run readfile on input with basic error checking
     *
     * @param   string  $file   file to read
     * @access  private
     */
    function _readFile($file) {
        if (file_exists($file)) {
            readfile($file);
        }
        else {
                echo "alert('Unable to find javascript file: $file');";
        }
    }

	/**
	 * Get the location of the client js
	 *
	 * @return	string
	 * @todo	figure out where this will be on an install
	 */
	function clientJsLocation() {
		return '@data-dir@/HTML_AJAX/js/';
	}

	/**
	 * Load options from _GET
	 *
	 * @access private
	 * @todo Is this preg_replace a good enough security check?
	 */
	function _loadOptions() {
        $this->options = array('client'=>false,'stub'=>false);
		if (isset($_GET['client'])) {
			$this->options['client'] = $_GET['client'];
		}
		if (isset($_GET['stub'])) {
			$stub = trim(preg_replace('/[^A-Za-z_0-9]/','',$_GET['stub']));
			if (!empty($stub)) {
				$this->options['stub'] = $stub;
			}
			else {
				$this->options['stub'] = false;
			}
		}
	}

	/**
	 * Run every init method on the class
	 * @access private
	 */
	function _initAll() {
		$methods = get_class_methods(get_class($this));

		foreach($methods as $method) {
			if (substr($method,0,4) == 'init') {
				$this->$method();
			}
		}
	}

	/**
	 * Init one class
	 * @param	string	$className
	 * @access private
	 * @todo	error handling if the method doesn't exist
	 */
	function _init($className) {
		$m = "init$className";
		if (is_callable(array(&$this,$m))) {
			$this->$m();
		}
	}
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
