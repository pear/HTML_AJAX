--TEST--
HTML_AJAX_Action->combineActions() in php5 with empty actions
--FILE--
<?php
require_once '_setup.php';
require_once 'HTML/AJAX/Action.php';

$response_1 = new HTML_AJAX_Action();

$response_2 = new HTML_AJAX_Action();
$response_2->assignAttr('blah','blah');

$response_1->combineActions($response_2);
?>
--EXPECT--
