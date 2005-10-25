<?php
	/**
	* Email check function
	*
	* A typical use of the validating mode is to use:
	* [code]
	* if (checkEmail($email_address)) {
	* } else {
	*   print 'Your email address is not valid';
	* }
	* [/code]
	*
	* A typical use of the debugging mode is to use:
	* [code]
	* $return_msgs = checkEmail($email_address, true);
	* foreach($return_msgs[1] as $debug_msg) { print htmlspecialchars($debug_msg).'<br />'; }
	* print $return_msgs[0] ? 'Email address seems to be valid' : 'Email address does not seem to be valid';
	* [/code]
	*
	* @param $email Email to be checked
	* @param $blnDebug Debug mode enabled
	* @return array(checked, valid, messages)
	*/
	function checkEmail($email, $blnDebug=false)
	{
		$msgs = Array();
		$msgs[] = 'Received email address: '.$email;

		//
		// Check for email pattern (adapted and improved from http://karmak.org/archive/2003/02/validemail.html)
		//----------------------------------------------------------------------------------------------------
		// incorrectly allows IP addresses with block numbers > 256, but those will fail to create sockets anyway
		// unicode norwegian chars cannot be used: C caron, D stroke, ENG, N acute, S caron, T stroke, Z caron (PHP unicode limitation)
		if (!preg_match("/^(([^<>()[\]\\\\.,;:\s@\"]+(\.[^<>()[\]\\\\.,;:\s@\"]+)*)|(\"([^\"\\\\\r]|(\\\\[\w\W]))*\"))@((\[([0-9]{1,3}\.){3}[0-9]{1,3}\])|(([a-z\-0-9באהחיטךסףעפצüזרו]+\.)+[a-z]{2,}))$/i", $email))
		{
			$msgs[] = 'Email address was not recognised as a valid email pattern';
			return $blnDebug ? Array(true, false, $msgs) : false;
		}
		$msgs[] = 'Email address was recognised as a valid email pattern';

		// Get the mx host name
		if (preg_match("/@\[[\d.]*\]$/", $email))
		{
			$mxHost[0] = preg_replace("/[\w\W]*@\[([\d.]+)\]$/", "$1", $email);
			$msgs[] = 'Email address contained IP address '.$mxHost[0].' - no need for MX lookup';
		}
		else
		{
			//
			// Get all mx servers - if no MX records, assume domain is MX (SMTP RFC)
			$domain = preg_replace("/^[\w\W]*@([^@]*)$/i", "$1", $email);
			if (!@getmxrr($domain, $mxHost, $weightings))
			{
				$mxHost[0] = $domain;
				$msgs[] = 'Failed to obtain MX records, defaulting to '.$domain.' as specified by SMTP protocol';
			}
			else
			{
				array_multisort($weightings, $mxHost);
				$cnt = '';
				$co = 0;
				foreach ($mxHost as $ch)
				{
					$cnt.= ($cnt ? ', ' : '') . $ch . ' (' . $weightings[$co] . ')';
					$co++;
				}
				$msgs[] = 'Obtained the following MX records for '.$domain.': '.$cnt;
			}
		}

		//
		// Check each server until you are given permission to connect, then check only that one server
		foreach ($mxHost as $currentHost)
		{
			$msgs[] = 'Checking MX server: '.$currentHost;
			if ($connection = @fsockopen($currentHost, 25))
			{
				$msgs[] = 'Created socket ('.$connection.') to '.$currentHost;

				if (preg_match("/^2\d\d/", $cn = @fgets($connection, 1024)))
				{
					$msgs[] = $currentHost.' sent SMTP connection header - no futher MX servers will be checked: '.$cn;
					while (preg_match("/^2\d\d-/", $cn))
					{
						$cn = @fgets($connection, 1024);
						$msgs[] = $currentHost.' sent extra connection header: '.$cn;
					} //throw away any extra rubbish

					//
					// Attempt to send an email from the user to themselves (not <> as some misconfigured servers reject it)
					$localHostIP = gethostbyname(preg_replace("/^.*@|:.*$/", '', getenv('HTTP_HOST')));
					$localHostName = gethostbyaddr($localHostIP);
					@fputs($connection, 'HELO '.($localHostName ? $localHostName : ('['.$localHostIP.']'))."\r\n");
					$hl = @fgets($connection, 1024);
					if ($success = preg_match("/^2\d\d/", $hl))
					{
						$msgs[] = $currentHost.' sent HELO response: '.$hl;
						@fputs($connection, "MAIL FROM: <$email>\r\n");
						$from = @fgets($connection, 1024);
						if ($success = preg_match("/^2\d\d/", $from))
						{
							$msgs[] = $currentHost.' sent MAIL FROM response: '.$from;
							@fputs($connection, "RCPT TO: <$email>\r\n");
							$to = @fgets($connection, 1024);
							if ($success = preg_match("/^2\d\d/", $to))
								$msgs[] = $currentHost.' sent RCPT TO response: '.$to;
							else
								$msgs[] = $currentHost.' rejected recipient: '.$to;
						}
						else
							$msgs[] = $currentHost.' rejected MAIL FROM: '.$from;
					}
					else
						$msgs[] = $currentHost.' rejected HELO: '.$hl;

					@fputs($connection, "QUIT\r\n");
					@fgets($connection, 1024);
					@fclose($connection);

					//
					// See if the transaction was permitted (i.e. does that email address exist)
					$blnReturn = ($success == '1') ? true : false;
					$msgs[] =  $blnReturn ? ('Email address was accepted by '.$currentHost) : ('Email address was rejected by '.$currentHost);

					return $blnDebug ? Array(true, $blnReturn, $msgs) : $blnReturn;
				}
				elseif (preg_match("/^550/", $cn))
				{
					$msgs[] = 'Mail domain denies connections from this host - no futher MX servers will be checked: '.$cn;
					return $blnDebug ? Array(false, true, $msgs) : false;
				}
				else
					$msgs[] = $currentHost.' did not send SMTP connection header: '.$cn;
			}
			else
				$msgs[] = 'Failed to create socket to '.$currentHost;
		}

		$msgs[] = 'Could not establish SMTP session with any MX servers';
		return $blnDebug ? Array(false, true, $msgs) : false;
	}



	// Error messages
	define('ERR_USERNAME_EMPTY', 'You forgot to enter a username, please try again');
	define('ERR_USERNAME_INVALID', 'The username you entered is invalid. Please try "peter" (without quotes)');
	define('ERR_PASSWORD_EMPTY', 'You forgot to enter a password, please try again');
	define('ERR_PASSWORD_INVALID', 'The password you entered is invalid. Please try "gabriel" (without quotes)');
	define('ERR_EMAIL_EMPTY', 'You forgot to enter an e-mail address');
	define('ERR_EMAIL_INVALID', 'The e-mail address you entered is invalid. Please enter a valid e-mail address.');



	/**
	 * Login class used in the "login form" example
	 * Please note: Constructors and private methods marked with _ are never exported in proxies to JavaScript
	 * 
	 * @category   HTML
	 * @package    AJAX
	 * @author     Gilles van den Hoven <gilles@webunity.nl>
	 * @copyright  2005 Gilles van den Hoven
	 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
	 * @version    Release: @package_version@
	 * @link       http://pear.php.net/package/HTML_AJAX
	 */
	class login {
		function _checkEmail($strEmail) {
		}

		/**
		 * Checks if the passed values are correct.
		 * An array will be returned consisting of the following items:
		 * 1) the result of this function
		 * 2) the id's of the failing items
		 * 3) the (error) messages
		 *
		 * @param string the username to be checked
		 * @param string the password to be checked
		 * @param string the email addres from the user
		 */
		function checklogin($strUsername, $strPassword, $strEmail) {
			// Initialize return values
			$arrResult = array(false, array(), array());

			// Don't trust passed values :)
			$strUsername = trim($strUsername);
			$strPassword = trim($strPassword);
			$strEmail = trim($strEmail);
			
			// Check username
			if ($strUsername == '') {
				$arrResult[1][] = ERR_USERNAME_EMPTY;
				$arrResult[2][] = 'username';
			} else if ($strUsername != 'peter') {
				$arrResult[1][] = ERR_USERNAME_INVALID;
				$arrResult[2][] = 'username';
			}
			
			// Check password
			if ($strPassword == '') {
				$arrResult[1][] = ERR_PASSWORD_EMPTY;
				$arrResult[2][] = 'password';
			} else if ($strPassword != 'gabriel') {
				$arrResult[1][] = ERR_PASSWORD_INVALID;
				$arrResult[2][] = 'password';
			}
			
			// Check email
			if ($strEmail == '') {
				$arrResult[1][] = ERR_EMAIL_EMPTY;
				$arrResult[2][] = 'email';
			} else if (checkEmail($strEmail) == false) {
				$arrResult[1][] = ERR_EMAIL_INVALID;
				$arrResult[2][] = 'email';
			}
			
			// Set return values
			// (to avoid we are adding thesame "error message" or "id" twice, we use the array_unique() function.)
			$arrResult[0] = (count($arrResult[1]) == 0);
			$arrResult[1] = array_unique($arrResult[1]);
			$arrResult[2] = array_unique($arrResult[2]);
			return $arrResult;
		}
	}
?>
