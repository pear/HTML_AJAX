<?php
/** 
 * This is the package.xml generator for HTML_AJAX
 * 
 */
error_reporting(error_reporting() & ~E_STRICT & ~E_DEPRECATED);
require_once 'PEAR/PackageFileManager2.php';
PEAR::setErrorHandling(PEAR_ERROR_DIE);

$version = '0.5.7';
$notes = <<<EOT
* Fix security bug: Remote Code Execution
EOT;

$description =<<<EOT
Provides PHP and JavaScript libraries for performing AJAX (Communication from JavaScript to your browser without reloading the page)
EOT;

$packagexml = new PEAR_PackageFileManager2;
$e = $packagexml->setOptions(
	array(	'baseinstalldir' => 'HTML',
		'packagedirectory' => dirname(__FILE__),
		'filelistgenerator' => 'file',
		'ignore' => array('package.php', 'package.xml', '*.bak', '*src*', '*.tgz','test.bat','build.php','DeveloperNotes.txt','*cssQuery-src*','jsunit'),
		'dir_roles' => array('examples' => 'doc','tests' => 'test', 'docs' => 'doc'),
	)
);
	
$packagexml->setPackage('HTML_AJAX');
$packagexml->setSummary('PHP and JavaScript AJAX library');
$packagexml->setDescription($description);
$packagexml->setChannel('pear.php.net');
$packagexml->setAPIVersion('0.5.0');
$packagexml->setReleaseVersion($version);
$packagexml->setReleaseStability('beta');
$packagexml->setAPIStability('beta');
$packagexml->setNotes($notes);
$packagexml->setPackageType('php'); // this is a PEAR-style php script package
$packagexml->addRelease(); // add another release section for all other OSes
$packagexml->setPhpDep('4.1.0');
$packagexml->setPearinstallerDep('1.9.0');

$packagexml->addMaintainer('lead','jeichorn','Joshua Eichorn','josh@bluga.net');
$packagexml->addMaintainer('lead','davidc','David Coallier','davidc@php.net');
$packagexml->addMaintainer('developer','arpad','Arpad Ray','arpad@php.net');
$packagexml->addMaintainer('developer','auroraeosrose','Elizabeth Smith','auroraeosrose@php.net');
$packagexml->addMaintainer('developer','lyaish','Laurent Yaish','laurenty@gmail.com');

$packagexml->setLicense('LGPL', 'http://www.gnu.org/licenses/lgpl.html');

$packagexml->addReplacement('AJAX/Server.php','pear-config', '@data-dir@', 'data_dir');
$packagexml->addGlobalReplacement('package-info','@package_version@','version');

$packagexml->generateContents(); // create the <contents> tag


//$pkg = &$packagexml->exportCompatiblePackageFile1(); // get a PEAR_PackageFile object
if (isset($_GET['make']) || (isset($_SERVER['argv']) && @$_SERVER['argv'][1] == 'make')) {
	//$pkg->writePackageFile();
	$packagexml->writePackageFile();
} else {
	//$pkg->debugPackageFile();
	$packagexml->debugPackageFile();
}
?>
