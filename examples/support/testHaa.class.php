<?php
/**
 * Require the action class
 */
require_once 'HTML/AJAX/Action.php';

class testHaa {
	function updateClassName() {
		$response = new HTML_AJAX_Action();

		$response->assignAttr('test','className','test');

		return $response;
	}
}
