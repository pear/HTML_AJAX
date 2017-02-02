--TEST--
Security issue with unserialization
--FILE--
<?php
require_once '_setup.php';
require_once 'HTML/AJAX.php';

class test
{
    function echo_string($data)
    {
        echo $data;
    }
}

$ha = new HTML_AJAX();
$ha->registerClass(new test());

//the "+" shouldn't be there but is accepted by PHP nontheless
$ha->_payload = 'O:+8:"stdClass":0:{}';

$_SERVER['CONTENT_TYPE'] = 'application/php-serialized';
$_GET['c'] = 'test';
$_GET['m'] = 'echo_string';

$ha->handleRequest();
?>
--EXPECTF--
%s"errNo":1024,"errStr":"Class(es) not allowed to be serialized"%s
