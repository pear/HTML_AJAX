<html>
<head>
<title>HTML_AJAX Examples</title>
</head>
<body>
<p>
These examples cover basic AJAX usage
</p>

<p>
All example files are fully commented, reading through them will give you a good overview on how things work.
</p>

<p>The term proxy in these examples refers to a javascript class that is generated and has functions that map to the eqivalent php class.
These proxy classes work much in the same way as a SOAP proxy class that is generated from wsdl.
</p>

<p>
Front end files for examples, you can actually run these and see some example output
</p>
<ul>
<li><a href='proxyless_usage.php'>proxyless_usage.php</a> - Using HTML_AJAX in standalone mode, possible doesn't require PHP or any backend HTML_AJAX classes</li>
<li><a href='proxy_usage_inline_javascript.php'>proxy_usage_inline_javascript.php</a> - Single file proxy style usage</li>
<li><a href='proxy_usage_server.php'>proxy_usage_server.php</a> - Multi-file proxy usage, either server file could be used with this example</li>
<li><a href='queue_usage.php'>queue_usage.php</a> - An example of using a queue to manage ajax calls, a simple live search example</li>
<li><a href='helper_usage.php'>helper_usage.php</a> - An example showing the basics of the helper api</li>
<li><a href='form.php'>form.php</a> - Basic AJAX form submission example</a></li>
</ul>

<p>Real Life Examples</p>
<ul>
<li><a href='login/index.php'>login/index.php</a> - An example creating an AJAX driven login</a></li>
<li><a href='review/index.php'>review/index.php</a> - A simple live review system, AJAX form submission and click to edit</a></li>
<li><a href='guestbook/index.php'>guestbook/index.php</a> - A simple guestbook system, uses action system so you never write a line of javascript</a></li>
<li><a href='shoutbox.php'>shoutbox.php</a> - How to use AJAX form submission</a></li>
</ul>

<p>
2 server examples are provided
</p>
<ul>
<li>server.php	- Basic server operation, serving ajax calls and client lib requests</li>
<li>auto_server.php	- Advanced server operation, only create php classes as needed</li>
</ul>

<p>
Examples files showing howto use HTML_AJAX_Util javascript class
</p>
<ul>
<li><a href='js_utils_vardump.php'>js_utils_vardump.php</a>	- Shows the output of HTML_AJAX_Util.varDump() and compares its against PHP's var_dump
</ul>


<p>
Other Example files:
</p>
<ul>
<li><a href='test_speed.php'>test_speed.php</a>	- A basic setup for measuring the speed of calls</li>
<li><a href='test_priority.php'>test_priority.php</a> - A basic test showing how Priority queue works</li>
<li><a href='serialize.php.examples.php'>serialize.php.examples.php</a>	- Internal tests for the php serialize format serializer</li>
<li><a href='serialize.url.examples.php'>serialize.url.examples.php</a>	- Internal tests for the urlencoded format serializer</li>
</ul>

<p>
Javascript and Html Examples:
</p>
<ul>
<li><a href="test_behavior.html">test_behavior.html</a> - A short overview of how to use behavior.js.  Behavior uses css selectors to apply javascript behaviors without throwing lots of javascript handlers into your html.</li>
</ul>
</body>
</html>
