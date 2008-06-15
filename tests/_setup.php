<?php

// work from svn if possible
if (file_exists(dirname(__FILE__).'/.svn')) {
	$dir = realpath(dirname(__FILE__).'/../src/');
	set_include_path(".:$dir");
}
