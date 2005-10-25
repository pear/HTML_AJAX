<?php
/**
 * Simple speed test using the null serializer, possibly useful in comparing overhead when tested on local host
 *
 *
 * @category   HTML
 * @package    AJAX
 * @author     Joshua Eichorn <josh@bluga.net>
 * @copyright  2005 Joshua Eichorn
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */
	include 'HTML/AJAX.php';

	include 'test.class.php';



	$ajax = new HTML_AJAX();
	$ajax->serializer = "Null";
	$ajax->unserializer = "Null";
	$ajax->registerClass(new test());

	if ($ajax->handleRequest()) {
		die();
	}
?><html>
<head>

<script type='text/javascript' src="server.php?client=all&stub=all"></script>
</head>
<body>
<script type="text/javascript">
var t = new test();
var t2 = new test({echo_string: function(){ endCall('Async Echo'); totalA(); }});

var time1;
var total = 0;
var count = 0;

function speedTest() {

	document.getElementById('target').innerHTML += "10 Sync Calls\n";
	for(var i = 0; i < 10; i++) {
		startCall();
		t.echo_string('Test');
		endCall('Sync Echo');
	}
	document.getElementById('target').innerHTML += "Total: "+total+"\n\n\n";
	total = 0;

	document.getElementById('target').innerHTML += "10 Async Calls\n";
	count = 0;
	for(var i = 0; i < 10; i++) {
		setTimeout("runAsync();",500*i);
	}
	total = 0;

}
function totalA() {
	count++;
	if (count == 10) {
		document.getElementById('target').innerHTML += "Total: "+total+"\n";
	}
}
function runAsync() {
	startCall();
	t2.echo_string('Test');
}
function startCall() {
	time1 = new Date();
}
function endCall(name) {
	var time = 0;

	var time2 = new Date();

	time = time2.getTime() - time1.getTime();
	total += time;
	
	document.getElementById('target').innerHTML += name+":"+time+"\n";
}


</script>
<a href="javascript:speedTest()">Start Speed Test</a>
<pre id="target">
</pre>
</body>
</html>
