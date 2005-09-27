<?php
/**
 * A simple script to build a single js file from the multiple sources
 * @license    http://www.opensource.org/licenses/lgpl-license.php  LGPL
 */
// simple script contains a merged js file from multiple source files
// can optionaly strip whitespace

$dest = "HTML_AJAX.js";
if (isset($argv[1])) {
	$dest = $argv[1];
}
$strip = false;
if (isset($argv[2]) && $argv[2] == 'strip') {
	$strip = true;
}

$source = array('Main.js','Dispatcher.js','HttpClient.js','Request.js','JSON.js');

$stripPregs = array(
	'/^\s+$/',
	'/^\s*\/\/.*$/'
	);
$blockStart = '/^\s*\/\*.*$/';
$blockEnd = '/^\s*\*\/\s*$/';

$out = '';
foreach($source as $file) {
	$s = "";
	if ($strip) {
		$lines = file($file);
		$inblock = false;
		foreach($lines as $line) {
			$keep = true;
			if ($inblock) {
				if (preg_match($blockEnd,$line)) {
					$inblock = false;
					$keep = false;
				}
			}
			else if (preg_match($blockStart,$line)) {
				$inblock = true;
			}

			if (!$inblock) {
				foreach($stripPregs as $preg) {
					if (preg_match($preg,$line)) {
						$keep = false;
						break;
					}
				}
			}

			if ($keep && !$inblock) {
				$s .= trim($line)."\n";
			}
			/* Enable to see what your striping out
			else {
				echo $line."<br>";
			}*/
		}
	}
	else {
		$s = file_get_contents($file);
	}

	$out .= "// $file\n";
	$out .= $s;
}

$fp = fopen($dest,'w');
fwrite($fp,$out);
fclose($fp);
?>
