var initTabs = function() {
    var activeTab = 'overview';

    $('[id^=tab-]').on('click', function() {
        $('#tab-' + activeTab).removeClass('active')
        $('#page-' + activeTab).hide();

        activeTab = $(this).attr('id').substr('tab-'.length)

        $('#tab-' + activeTab).addClass('active')
        $('#page-' + activeTab).show();
    });
};

var formatTimeDiff = function(diff) {
    diff = Math.floor(diff);

    var sec = diff % 60;
    var out = sec + ' second' + (sec == 1 ? '' : 's');

    diff = Math.floor(diff / 60);
    if (diff <= 0) return out;

    var min = diff % 60;
    out = min + ' minute' + (min == 1 ? '' : 's') + ', ' + out;

    diff = Math.floor(diff / 60);
    if (diff <= 0) return out;

    var hour = diff % 24;
    out = hour + ' hour' + (hour == 1 ? '' : 's') + ', ' + out;

    diff = Math.floor(diff / 24);
    if (diff <= 0) return out;

    var day = diff;
    out = day + ' day' + (day == 1 ? '' : 's') + ', ' + out;

    return out;
};

var formatBytes = function(n, dec) {
    if (n < 1000) return n.toFixed(dec) + 'B';

    n /= 1000;
    if (n < 1000) return n.toFixed(dec) + 'kB'

    n /= 1000;
    if (n < 1000) return n.toFixed(dec) + 'MB'

    n /= 1000;
    return n.toFixed(dec) + 'GB'
};

var drawLineChart = function(canvas, data, color, bounds) {
    var ctx = $(canvas)[0].getContext('2d');
    var w = $(canvas)[0].width;
    var h = $(canvas)[0].height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'red';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.beginPath();

    $.each(data, function(i, point) {
        var x = w * (point[0] - bounds[0][0]) / (bounds[0][1] - bounds[0][0]);
        var y = h * (point[1] - bounds[1][0]) / (bounds[1][1] - bounds[1][0]);

        if (i == 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();


    var t = 2;
    ctx.fillStyle = 'hsl(0, 0%, 80%)';
    ctx.fillRect(0, 0, t, h);
    ctx.fillRect(0, 0, w, t);
    ctx.fillRect(w - t, 0, t, h);
    ctx.fillRect(0, h - t, w, t);
};

var connect = function(addr) {
    $('[id^=status-]').html('Connecting...');
    $('#status').removeClass('offline').html('Connecting...');

    var cpuSeries = [];
    var memorySeries = [];

    var callbacks = {
        kernel: function(data) {
            $('#status-kernel').html(data);
        },
        uptime: function(data) {
            $('#status-uptime').html(formatTimeDiff(data));
        },
        temperature: function(data) {
            $('#status-temperature').html((data / 1000).toFixed(2)
                    + '&deg;C');
        },
        memory: function(data) {
            $('#status-memory-used').html(formatBytes(data.used, 2));
            $('#status-memory-total').html(formatBytes(data.total, 2));
            $('#status-memory-percent').html(Math.round(data.used
                        / data.total * 100) + '%');

            var now = new Date().getTime();
            memorySeries.push(data, [now, data.used / data.total * 100]);

            drawLineChart('#graph-memory', memorySeries, 'red', [[now - 100000, now], [100, 0]]);
        },
        storage: function(data) {
            $('#status-storage-used').html(formatBytes(data.used, 2));
            $('#status-storage-total').html(formatBytes(data.total, 2));
            $('#status-storage-percent').html(Math.round(data.used
                        / data.total * 100) + '%');
        },
        cpu: function(data) {
            $('#status-cpu').html(data.toFixed(2) + '%');

            var now = new Date().getTime();
            cpuSeries.push(data, [now, data]);

            drawLineChart('#graph-cpu', cpuSeries, 'red', [[now - 100000, now], [100, 0]]);
        },
        ip: function(data) {
            $('#status-ip').html(data);
        },
        network: function(data) {
            $('#status-network-recv').html(formatBytes(data.recv, 2));
            $('#status-network-sent').html(formatBytes(data.sent, 2));
        },
        services: function(data) {
            $('#services').empty();

            $.each(data, function(i, v) {
                if (v.status == '+') {
                    var text = 'Running'
                    var type = 'online';
                } else if(v.status == '-') {
                    var text = 'Stopped';
                    var type = 'offline';
                } else {
                    var text = 'Unknown';
                    var type = 'unknown';
                }

                $('<div>')
                    .addClass('service')
                    .html(v.name)
                    .append($('<span>').html(text).addClass(type))
                    .appendTo('#services');
            });
        }
    };

    var ws = new WebSocket(addr);

    ws.onopen = function() {
        $('#status').addClass('online').html('Online');
    };

    ws.onmessage = function(msg) {
        $.each(JSON.parse(msg.data), function(key, data) {
            if (key in callbacks) {
                callbacks[key](data);
            }
        });
    };

    ws.onclose = function() {
        $('[id^=status-]').html('-');
        $('#services').html('Offline');
        $('#status').removeClass('online')
                    .addClass('offline')
                    .html('Offline');

        window.setTimeout(function() {
            connect(addr);
        }, 10000);
    }
};

