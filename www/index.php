<?php

define('MAX_TIMEOUT', 60*60);

$data = @json_decode(@file_get_contents('data.txt'));
$ip = null;

if ($data !== null) {
    $ip = $data->ip;
}
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Raspberry pi</title>
        <link href="css/style.css" rel="stylesheet">
        <link href="css/font-awesome.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="header">
            <h1>Raspberry Pi</h1>
        </div>
        <div class="info-bar">
            <div class="container">
                <div class="kernel"><i class="icon-cog"></i> <span id="status-kernel">-</span></div>
                <div class="status offline" id="status">Offline</div>
            </div>
        </div>
        <ul class="tabs">
            <li class="active" id="tab-overview"><i class="icon-home"></i> Overview</li>
            <li id="tab-graphs"><i class="icon-dashboard"></i> Graphs</li>
            <li id="tab-services"><i class="icon-tasks"></i> Services</li>
        </ul>
        <div class="content">
          <div id="page-overview">
              <div class="row">
                  <i class="icon-time"></i> Uptime <div id="status-uptime" class="right"></div>
              </div>
              <div class="row">
                  <i class="icon-info-sign"></i> IP address <div id="status-ip" class="right"></div>
              </div>
              <div class="row">
                  <i class="icon-fire"></i> Temperature <div id="status-temperature" class="right"></div>
              </div>
              <div class="row">
                  <i class="icon-dashboard"></i> CPU usage <div id="status-cpu" class="right">20%</div>
              </div>
              <div class="row">
                  <i class="icon-th-list"></i> Memory
                      <div class="right">
                          <span id="status-memory-used"></span> / <span id="status-memory-total"></span>
                      </div>
              </div>
              <div class="row">
                  <i class="icon-hdd"></i> Storage
                  <div class="right">
                      <span id="status-storage-used"></span> / <span id="status-storage-total"></span>
                  </div>
              </div>
              <div class="row">
                  <i class="icon-refresh"></i> Network
                  <div class="right">
                      <i class="icon-arrow-up"></i> <span id="status-network-sent"></span> / <i class="icon-arrow-down"></i> <span id="status-network-recv"></span>
                  </div>
              </div>
            </div>
            <div id="page-graphs" style="display: none;">
                <canvas id="graph-cpu" width="600" height="200"></canvas>
                <canvas id="graph-memory" width="600" height="200"></canvas>
            </div>
            <div id="page-services" style="display: none;">
              <div id="services"></div>
            </div>
        </div>

        <script src="js/jquery-2.0.3.min.js" text="text/javascript"></script>
        <script src="js/main.js" type="text/javascript"></script>
<?php if ($ip) { ?>
        <script type="text/javascript">
            $(function() {
                initTabs();
                connect("ws://<?php echo $ip; ?>:8080");
            });
        </script>
<?php } ?>
    </body>
</html>
