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

$version = '0.5.1';
$notes = <<<EOT
	Map PEAR_Error objects so they can be caught on the JavaScript side
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
   'state'             => 'beta',
   'license'           => 'lgpl',
   'ignore'            => array('package.php', 'package.xml', '*.bak', '*src*', '*.tgz','test.bat','build.php','DeveloperNotes.txt','*cssQuery-src*'),
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
$package->addMaintainer('arpad','developer','Arpad Ray','arpad@php.net');
$package->addMaintainer('lyaish','developer','Laurent Yaish','laurenty@gmail.com');

// dependencies can be added at will here
$package->addDependency('PEAR', '1.3.5', 'ge', 'pkg', false);
$package->addDependency('php', '4.1.0', 'ge', 'php', false);

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
