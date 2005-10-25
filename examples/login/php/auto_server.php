<?php
	/**
	 * Very simple form script with error handling.
	 *
	 * @category   HTML
	 * @package    AJAX
	 * @author     Gilles van den Hoven <gilles@webunity.nl>
	 * @copyright  2005 Gilles van den Hoven
	 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
	 * @version    Release: @package_version@
	 * @link       http://pear.php.net/package/HTML_AJAX
	 */

	 // include the server class
	include 'HTML/AJAX/Server.php';

	// extend HTML_AJAX_Server creating our own custom one with init{ClassName} methods for each class it supports calls on
	class TestServer extends HTML_AJAX_Server {
		// this flag must be set to on init methods
		var $initMethods = true;

		// init method for the test class, includes needed files an registers it for ajax
		function initLogin() {
			include 'login.class.php';
			$this->registerClass(new login());
		}
	}

	// create an instance of our test server
	$server = new TestServer();

	// handle requests as needed
	$server->handleRequest();
?>
