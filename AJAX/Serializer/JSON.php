<?php
require_once 'HTML/AJAX/JSON.php';
/**
 * JSON Serializer
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/PackageName
 * @todo       Support C JSON extension
 */
class HTML_AJAX_Serializer_JSON {

    /**
     * JSON instance
     * @var HTML_AJAX_JSON
     * @access private
     */
    var $_json;

    function HTML_AJAX_Serializer_JSON() {
        $this->_json =& new HTML_AJAX_JSON();
    }

    function serialize($input) {
        return $this->_json->encode($input);
    }

    function unserialize($input) {
        return $this->_json->decode($input);
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
