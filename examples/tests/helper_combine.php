<?php
/**
 * Example of Using HTML_AJAX_Helper
 *
 * HTML_AJAX_Helper takes care of basic JavaScript and HTML generation that is needed in many AJAX requests
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */

// include the helper class
require_once 'HTML/AJAX/Helper.php';

// create an instance and set the server url
$ajaxHelper = new HTML_AJAX_Helper();

$combine = false;
if (isset($_GET['mode']) && $_GET['mode']  == 'combined') {
    $combine = true;
}
$ajaxHelper->combineJsIncludes = $combine;

$ajaxHelper->serverUrl = '../server.php';

// reset array so were only dealing with our custom lib not the default set
$ajaxHelper->jsLibraries = array();
$ajaxHelper->jsLibraries[] = 'customLib';
$ajaxHelper->jsLibraries[] = 'customLib';
$ajaxHelper->jsLibraries[] = 'customLib';
$ajaxHelper->jsLibraries[] = 'customLib';
$ajaxHelper->jsLibraries[] = 'customLib';
$ajaxHelper->jsLibraries[] = 'customLib';

// in default operation a sub-array in jsLibraries will make a second include
// with combineJsIncludes as true subarray's are merged into a single include
$ajaxHelper->jsLibraries['test'][] = 'customLib';
$ajaxHelper->jsLibraries['test'][] = 'customLib';
$ajaxHelper->jsLibraries['test'][] = 'customLib';

?>
<html>
<head>

<?php
    echo $ajaxHelper->setupAJAX();
?>

</head>
<body>

<p>This is a test that we can combine js client library includes, the loaded libraries should only include customLib once</p>

<ul>
    <li><a href="?mode=combined">Combined Includes</a></li>
    <li><a href="?mode=default">Default includes, 1 include per sub-array</a></li>

</body>
</html>
<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
