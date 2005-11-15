<?php
/**
 * OO AJAX Implementation for PHP
 *
 * @category   HTML
 * @package    AJAX
 * @author     Elizabeth Smith <auroraeosrose@gmail.com>
 * @copyright  2005 Elizabeth Smith
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 */

/**
 * Require the response class
 */
require_once 'HTML/AJAX/Response.php';

/**
 * Helper Class for creating information that can be properly serialized and used by
 * the haaction serializer that eliminates the need for php users to write javascript
 * for dealing with the information returned by an ajax method - instead the javascript
 * is basically created for them
 */
class HTML_AJAX_Action extends HTML_AJAX_Response
{

	/**
	 * about
	 * @var $contentType type
	 */
	var $contentType = 'application/html_ajax_action';

	/**
	 * about
	 * @var $_actions type
	 */
	var $_actions;

	/**
	 * public function prependAttr()
	 *
	 * adds $data to the end of the attribute in the item identified by $id ($id can also be a class)
	 */
	function prependAttr($id, $attribute, $data)
	{
		$this->_actions[] = array(
			'action' => 'prepend',
			'id' => $id,
			'attributes' => settype($attribute),
			'data' => $data,
		);
		return;
	}

	/**
	 * public function appendAttr()
	 *
	 * adds $data to the beginning of the attribute in the item identified by $id ($id can also be a class)
	 */
	function appendAttr($id, $attribute, $data)
	{
		$this->_actions[] = array(
			'action' => 'append',
			'id' => $id,
			'attributes' => settype($attribute),
			'data' => $data,
		);
		return;
	}

	/**
	 * public function assignAttr()
	 *
	 * assigns $data to the value of the attribute in the item identified by $id ($id can also be a class)
	 * if attribute already exists, the entire value of the attribute will be replaced
	 */
	function assignAttr($id, $attribute, $data)
	{
		$this->_actions[] = array(
			'action' => 'assign',
			'id' => $id,
			'attributes' => settype($attribute),
			'data' => $data,
		);
		return;
	}

	/**
	 * public function clearAttr()
	 *
	 * removes an attr from the item identified by $id ($id can also be a class)
	 */
	function clearAttr($id, $attribute)
	{
		$this->_actions[] = array(
			'action' => 'clear',
			'id' => $id,
			'attributes' => array($attribute => ''),
		);
		return;
	}

	/**
	 * public function createNode()
	 *
	 * higher level dom manipulation - creates a new node to insert into the dom
	 * type can be append, prepend, or insert - for insert id should be the id of
	 * the element you're inserting before, for append or prepend should be the id
	 * of the element you're inserting into
	 */
	function createNode($id, $tag, $attribute, $type = 'append')
	{
		$this->_actions[] = array(
			'action' => 'create',
			'id' => $id,
			'tag' => $tag,
			'attributes' => settype($attribute),
		);
		return;
	}

	/**
	 * public function replaceNode()
	 *
	 * higher level dom manipulation - replaces one node with another
	 * This can be used to replace a div with a form for inline editing
	 * use innerHtml attribute to change inside text
	 */
	function replaceNode($id, $tag, $attribute)
	{
		$this->_actions[] = array(
			'action' => 'replace',
			'id' => $id,
			'attributes' => settype($attribute),
		);
		return;
	}

	/**
	 * public function removeNode()
	 *
	 * higher level dom manipulation - deletes node from the dom
	 */
	function removeNode($id)
	{
		$this->_actions[] = array(
			'action' => 'remove',
			'id' => $id,
		);
		return;
	}

	/**
	 * public function insertScript()
	 *
	 * adds straight javascript
	 */
	function insertScript($string)
	{
		$this->_actions[] = array(
			'action' => 'script',
			'data' => $data,
		);
		return;
	}

	/**
	 * public function insertAlert()
	 *
	 * adds javascript alert
	 */
	function insertAlert($string)
	{
		$this->_actions[] = array(
			'action' => 'alert',
			'data' => $data,
		);
		return;
	}

	/**
	 * public function getPayload()
	 *
	 * something
	 */
	function getPayload()
	{
		$serializer = HTML_AJAX_Serializer_JSON();
		return $serializer->serialize($this->_action);
	}
}
?>