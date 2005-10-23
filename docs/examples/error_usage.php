<?php
/**
 * Test class used in other examples
 * Constructors and private methods marked with _ are never exported in proxies to JavaScript
 * 
 * @category   HTML
 * @package    AJAX
 * @author     David Coallier <davidc@agoraproduction.com>
 * @copyright  2005 David Coallier
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */
require_once 'HTML/AJAX.php';

class error_test
{
    function error_test()
    {
        $ajax =& new HTML_AJAX;
        $ajax->debugEnabled = true;
        $ajax->debugSession = true;
        set_error_handler(array(&$ajax, '_errorHandler'));
        trigger_error("I don't know");
    }
}


?>
