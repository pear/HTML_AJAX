<?php
/**
 * Guestbook uses HTML_AJAX_Action class to interact with the page - the
 * javascript is all written from here
 *
 * @category   HTML
 * @package    AJAX
 * @author     David Coallier <davidc@php.net>
 * @copyright  2005 David Coallier
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */

/**
 * Require the action class
 */
require_once 'HTML/AJAX/Action.php';

class guestbook {

	// constructor won't be exported
	function guestbook() {
		if (!isset($_SESSION['entries'])) {
			$_SESSION['entries'] = array();
		}
	}

	// data is an array of objects
	function newguestbook($data) {
		$_SESSION['entries'][] = $data;
		$response = new HTML_AJAX_Action();
		$response->appendAttr('guestbookList', 'innerHtml', $this->_makeDiv($data));
		return $response;
	}

	function _makeDiv($data) {
		return '<div class="entry">'
			.'<h3><a href="mailto:'.$data->email.'">'.$data->name.'</a></h3>'
			.'<a href="http://'.$data->website.'">'.$data->website.'</a><br />'
			.'<p>'.$data->comments.'</p>'
			.'</div>';
	}
}
?>
