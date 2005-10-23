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
</ul>

<p>
2 server examples are provided
</p>
<ul>
<li>server.php	- Basic server operation, serving ajax calls and client lib requests</li>
<li>auto_server.php	- Advanced server operation, only create php classes as needed</li>
</ul>

<p>
Other Example files:
</p>
<ul>
<li><a href='test_speed.php'>test_speed.php</p>	- A basic setup for measuring the speed of calls</li>
</ul>

</body>
</html>
