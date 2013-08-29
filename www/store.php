<?php

$data = array(
    'ip' => $_SERVER['REMOTE_ADDR'],
    'time' => time()
);

file_put_contents('data.txt', json_encode($data));