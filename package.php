<?php
/** 
 * This is the package.xml generator for HTML_AJAX
 * 
 * LICENSE: This source file is subject to version 3.0 of the PHP license 
 * that is available through the world-wide-web at the following URI: 
 * http://www.php.net/license/3_0.txt.  If you did not receive a copy of 
 * the PHP License and are unable to obtain it through the web, please 
 * send a note to license@php.net so we can mail you a copy immediately. 
 * 
 * @category   pear 
 * @package    PEAR_PackageFileManager 
 * @author     Greg Beaver <cellog@php.net>  
 * @copyright  2005 The PHP Group 
 * @license    http://www.php.net/license/3_0.txt  PHP License 3.0 
 * @version    CVS: $Id$ 
 * @link       http://pear.php.net/package/PEAR_PackageFileManager 
 * @since      File available since Release 0.1.0
 */
require_once 'PEAR/PackageFileManager.php';

$version = '0.2.0';
$notes = <<<EOT
Reliense under the LGPL fixing concerns about GPL compability

Full rewrite of all JavaScript code pulled in from JPSpan, this allows for relicence, as well as shrinking the code size while adding new features
   Big new Features are: 
   Request object non contains all information needed to make a request, HTML_AJAX.makeRequest added service a request object
   HTML_AJAX_HttpClient instances now created as needed by a factory HTML_AJAX.httpClient(), this functionality will be replaced at some future point

   These changes will allow for various queue and pool structures to be created in the future, but for now client in progress errors should not be possible
   	when using proxy objects

Serializer that mimics post added, filling _POST on an ajax request, helper code for AJAX forms still in progress

Bugs Fixed:
5087, 5284 	- jsClient Location fixes, allows it to be set manually
5908 		- PHP 5 bug fix, auto loading of classes not working in php5 for an unknown reason, just load serializer as a normal include
5029 		- init bug in auto_server
EOT;

$description =<<<EOT
Provides PHP and JavaScript libraries for performing AJAX (Communication from JavaScript to your browser without reloading the page)
EOT;

$package = new PEAR_PackageFileManager;

$result = $package->setOptions(array(
   'package'           => 'HTML_AJAX',
   'summary'           => 'PHP and JavaScript AJAX library',
   'description'       => $description,
   'version'           => $version,
   'state'             => 'alpha',
   'license'           => 'lgpl',
   'ignore'            => array('package.php', 'package.xml', '*.bak', '*src*', '*.tgz','test.bat','build.php'),
   'filelistgenerator' => 'file', // other option is 'file'
   'notes'             => $notes,
   'changelogoldtonew' => false,
   'baseinstalldir'    => 'HTML', // if your package is like "Packagename" use ''
   'packagedirectory'  => '',
   'simpleoutput'      => true
   ));

$package->addReplacement('AJAX/Server.php','pear-config', '@data-dir@', 'data_dir');
$package->addGlobalReplacement('package-info','@package_version@','version');

if (PEAR::isError($result)) {
   echo $result->getMessage();
   die();
}

$package->addMaintainer('jeichorn','lead','Joshua Eichorn','josh@bluga.net');
$package->addMaintainer('davidc','lead','David Coallier','davidc@php.net');

// dependencies can be added at will here
$package->addDependency('PEAR', '1.3.5', 'ge', 'pkg', false);
$package->addDependency('php', '4.3.0', 'ge', 'php', false);

if (isset($_SERVER['argv'][1]) && $_SERVER['argv'][1] == 'commit') {
   $result = $package->writePackageFile();
} else {
   $result = $package->debugPackageFile();
}

if (PEAR::isError($result)) {
   echo $result->getMessage();
   die();
}
?>
