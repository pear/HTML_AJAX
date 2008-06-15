--TEST--
Tests the generation of a javascript method stub
--FILE--
<?php
require_once dirname(__FILE__).'/_setup.php';

var_dump(get_include_path());
require_once 'AJAX.php';

?>
--EXPECT--
