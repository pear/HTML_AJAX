<?php
/**
 * Example of using HTML_AJAX as a form validator
 *
 * @category   HTML
 * @package    AJAX
 * @author     Gilles van den Hoven <gilles@webunity.nl>
 * @copyright  2005 Gilles van den Hoven
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 * @version    Release: @package_version@
 * @link       http://pear.php.net/package/HTML_AJAX
 */
?>
<html>
<head>
	<title>Form validation with HTML_AJAX</title>

	<script type="text/javascript" src="../server.php?client=Util,main,dispatcher,httpclient,request,json,loading"></script>
	<script type="text/javascript" src="./php/auto_server.php?stub=login"></script>

	<!-- STYLESHEET AND SCRIPT -->
	<link rel="stylesheet" type="text/css" href="./inc/login.css" />
	<script type="text/javascript" src="./inc/login.js"></script>
</head>
<body>
	<p>
		<strong>Introduction:</strong><br>
		This example was built upon the example "queue_usage.php". I made this example to simulate a basic form validation with HTML_AJAX.<br>
		It became bigger than i thought, but nevertheless shows the power of HTML_AJAX i wanted it to show.<br>
		<br>
		<strong>Sample layout:</strong><br>
		- Of course there is an auto_server.php, which initializes the login class only when needed.<br>
		- Besides that there is a login.class.php, which consists of a "checkEmail" function, some error messages and a simple script.<br>
		- Then there is the client side code, located in "inc/login.js". The functions "setNormal" and "setError" are used by the callback function to colorize the form fields.<br>
		- The callback function receives an array counting 3 elements. The first being the result of the check, the second being an array of messages and the third being an array of id's which need to be colorized.<br>
	</p>	

	<!-- THE ERROR MESSAGES -->
	<div id="messages" class="errorbox"></div>

	<!-- THE FORM -->
	<form method="post" action="javascript://" onSubmit="return false;">
		<fieldset>
			<legend>And now, the big sample :)</legend>
			
		
			<table width="400" border="0" cellspacing="0" cellpadding="2">
				<tr>
					<td><label for="username" id="lbl_username">Username:</label></td>
					<td><input type="text" name="username" id="txt_username" size="40" tabindex="1"></td>
				</tr>
				<tr>
					<td><label for="password" id="lbl_password">Password:</label></td>
					<td><input type="text" name="password" id="txt_password" size="40" tabindex="2"></td>
				</tr>
				<tr>
					<td><label for="email" id="lbl_email">E-mail:</label></td>
					<td><input type="text" name="email" id="txt_email" size="40" tabindex="3"></td>
				</tr>
				<tr>
					<td>&nbsp;</td>
					<td><input type="button" value="  login  " onClick="processLogin()">&nbsp;<input type="reset" value="  reset  "></td>
				</tr>
			</table>
		</fieldset>
	</form>

	<script type="text/javascript">
		// Reset the form colors
		setNormal('username');
		setNormal('password');
		setNormal('email');

		// Set the focus on the first element
		document.getElementById('txt_username').focus();
	</script>

	<p>
		This sample and all its code is <a href="http://www.opensource.org/licenses/lgpl-license.php">licensed under LGPL</a>.<br>
		<br>
		&copy; 2005 www.webunity.nl<br>
		<br>
		<span style="font-size: 9px">(look at the source for my e-mail)</span>
	</p>
</body>
</html>
<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
?>
