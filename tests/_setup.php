<?php

// work from git if possible
if (file_exists(dirname(__DIR__).'/.git')) {
	$dir = realpath(dirname(__DIR__).'/');
	set_include_path(".:$dir");
}
