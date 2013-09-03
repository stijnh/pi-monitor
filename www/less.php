<?php

function error($text='') {
    header('HTTP/1.1 500 Internal Server Error', true, 500);
    echo '<h1>Internal server error</h1>';
    echo '<pre>' . htmlentities($text, ENT_QUOTES, 'UTF-8') . '</pre>';
    exit();
}

require_once 'include/lessc.php';

if (empty($_SERVER['PATH_INFO'])) {
    error('No file given');
}

$path = realpath(__DIR__ . $_SERVER['PATH_INFO']);

if ($path === false) {
    error('File not found');
}

if (!preg_match('/\.less$/i', $path)) {
    error('File not a .less file');
}

if (strpos($path, __DIR__) !== 0) {
    error('Invalid directory');
}

$etag = md5(filemtime($path));

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] == $etag) {
    header('HTTP/1.1 304 Not Modified', true, 304);
    exit();
}


try {
    $compiler = new lessc();
    $content = $compiler->compileFile($path);

    header('Content-type: text/css; charset=UTF-8');
    header('Etag: ' . $etag . '');
    echo $content;

} catch(Exception $e) {
    error($e->getMessage());
}
