<?php
/**
 * AJAX form submission example
 *
 * @category   HTML
 * @package    AJAX
 * @author     Arpad Ray <arpad@rajeczy.com>
 * @copyright  2005 Arpad Ray
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */


if (!empty($_POST)) {
    print_r($_POST);
    exit;
}

?><html>
    <head>
        <script type="text/javascript" src="server.php?client=all&amp;stub=all"></script>
    </head>
    <body>
        <pre id="target">
        </pre>
        <form action="form.php" method="post" onsubmit="return !HTML_AJAX.formSubmit(this, 'target');">
            <input type="text" name="test_text" value="example" />
            <select name="test_select">
                <option value="example1">Example 1</option>
                <option value="example2">Example 2</option>
            </select>
            <input type="submit" value="Submit form" />
        </form>    
    </body>
</html>
