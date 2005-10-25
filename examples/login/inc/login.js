function setNormal(sID) {
	try {
		document.getElementById('lbl_' + sID).className = 'normal';
		document.getElementById('txt_' + sID).className = 'normal';
	} catch (e) {
		// blub
	}
}

function setError(sID) {
	try {
		document.getElementById('lbl_' + sID).className = 'error';
		document.getElementById('txt_' + sID).className = 'error';
	} catch (e) {
		// blub
	}
}

// callback hash, outputs the results of the login class
callback = {
	checklogin: function(result) {
		var iMessage;
		var sMessages;
		var iID;
		var sID;

		// Reset the form colors
		setNormal('username');
		setNormal('password');
		setNormal('email');

		// If the form validated, bail this function
		if (result[0] == true) {
			alert('the form was succesfully filled in!');
			exit;
		}

		// Create a new list out of the error messages
		sMessages = '<strong>The following errors occured:</strong><br>';
		sMessages+= '<ul>';
		for (iMessage in result[1]) {
			if (iMessage != '______array') {
				sMessages+= '<li>' + result[1][iMessage] + '</li>';
			}
		}
		sMessages+= '</ul>';
		
		// Assign the message string
		document.getElementById('messages').innerHTML = sMessages;
		document.getElementById('messages').style.display = 'block';

		// Loop the array of ID's which we need to colorize
		for (iID in result[2]) {
			setError(result[2][iID]);
		}
	}
}

// setup our remote object
var remoteObject = new login(callback);

// The function which will be called when the form is submitted. 
// !!! Be sure to create a version for browsers which do not support ajax. !!!
function processLogin() {
	var sUsername = document.getElementById('txt_username').value;
	var sPassword = document.getElementById('txt_password').value;
	var sEmail = document.getElementById('txt_email').value;
	remoteObject.checklogin(sUsername, sPassword, sEmail);
}