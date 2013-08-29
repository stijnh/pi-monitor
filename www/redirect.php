<?php

define('MAX_TIMEOUT', 60*60);

$data = @json_decode(@file_get_contents('data.txt'));

if ($data !== null) {
    if (time() - $data->time <= MAX_TIMEOUT) {
        $url = 'http://' . $data->ip;
        header('Location: ' . $url);
        echo '<meta http-equiv="refresh" content="0;URL=' . $url . '" />';
        echo '<script type="text/javascript">location.href = "' . $url . '"</script>';
    } else {
        echo 'Offline (last connection from ' . $data->ip . ' on ' . date('r', $data->time) . ')';
    }
} else {
    echo 'Offline';
}