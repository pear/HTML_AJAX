<?php
// $Id$
/**
 * URL Encoding Serializer
 *
 * @category   HTML
 * @package    AJAX
 * @author     Arpad Ray <arpad@rajeczy.com>
 * @copyright  2005 Arpad Ray
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */
class HTML_AJAX_Serialize_Urlencoded
{
    function serialize($input) 
    {
        if (!function_exists('http_build_query')) {
            @include_once 'PHP/Compat/Function/http_build_query.php';
            if (!function_exists('http_build_query')) {
                trigger_error('The URL encoding serializer requires http_build_query(), for information about using this function without upgrading your version of PHP, see: <a href="http://pear.php.net/package/PHP_Compat">http://pear.php.net/package/PHP_Compat</a>', E_USER_WARNING);
                return;
            }
        }
        return http_build_query(array('_HTML_AJAX' => $input));
        //return http_build_query($input);
    }

    function unserialize($input) 
    {
        parse_str($input, $ret);
        return (isset($ret['_HTML_AJAX']) ? $ret['_HTML_AJAX'] : $ret);
    }
}
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
