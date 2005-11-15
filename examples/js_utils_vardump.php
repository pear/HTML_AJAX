<?php
/**
 * HTML_AJAX_Util.varDump() examples
 * 
 * @category   HTML
 * @package    AJAX
 * @author     Arpad Ray <arpad@rajeczy.com>
 * @copyright  2005 Arpad Ray
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */

?>
<html>
<head>
<script type="text/javascript" src="server.php?client=util"></script>
<script type="text/javascript">
function foo() {
    this.bar = "baz";
    this.bat = 5;
}
var obj = new foo();

var a = [
    undefined,
    true,
    13,
    1.337,
    'foo',
    [1, 2, 3],
    [1, [1, 2, 3], 3],
    obj,
    document
];
    
    
function dotest() {
    var foo = document.getElementById("foo");

    for (ak in a) {
        foo.innerHTML += HTML_AJAX_Util.varDump(a[ak], 1) + "\n";
    }    
}
    
</script></head><body onload="dotest()">
<pre id="foo">
-----------------------------------------------------
PHP:
-----------------------------------------------------
<?php
        
class foo {
    var $bar = 'baz';
    var $bat = 5;
}
$obj = new foo;

$a = array(
    null,
    true,
    13,
    1.337,
    'foo',
    array(1, 2, 3),
    array(1, array(1, 2, 3), 3),
    $obj
);

foreach ($a as $v) {
    var_dump($v);
    echo "\n";
}

?>
-----------------------------------------------------
Javascript:
-----------------------------------------------------
</pre><pre>
-----------------------------------------------------
Source:
-----------------------------------------------------
</pre>
        <?php show_source(__FILE__); ?>
</body></html>
        
