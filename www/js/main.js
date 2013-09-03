/* Credits to http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/ */
window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              function( callback ){
                  window.setTimeout(callback, 1000 / 1);
              };
})();

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

function zeroPad(i, n) {
    var s = i + '';
    while (s.length < n) s = '0' + s;
    return s;
}

var graphSeries = {
    cpu: {
        data: [],
        color: 'red'
    },
    memory: {
        data: [],
        color: 'blue'
    }
};

var initGraph = function() {
    window.requestAnimFrame(drawGraph);
};

var drawGraph = function() {
    window.requestAnimFrame(drawGraph);

    // Only render when page is visible
    if (!$('#page-graphs').is(':visible')) {
        return;
    }

    var canvas = $('#graph');
    var ctx = canvas[0].getContext('2d');
    var w = canvas.attr('width');
    var h = canvas.attr('height');

    ctx.clearRect(0, 0, w, h);

    var margin = 35;
    var maxX = new Date().getTime() - 2000;
    var minX = maxX - 50000;
    var minY = 0;
    var maxY = 100;
    var tickX = 10000;
    var tickY = 10;

    var canvasX = function(x) {
        return (x - minX) / (maxX - minX) * (w - 2 * margin) + margin;
    };

    var canvasY = function(y) {
        return (y - maxY) / (minY - maxY) * (h - 2 * margin) + margin;
    };

    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (var i = Math.floor(minX / tickX); i <= Math.ceil(maxX / tickX); i++) {
        var x = i * tickX;
        var cx = canvasX(x);
        var d = new Date(x);
        var label = zeroPad(d.getHours(), 2) + ':'
            + zeroPad(d.getMinutes(), 2) + ':'
            + zeroPad(d.getSeconds(), 2);

        if (x >= minX && x <= maxX) {
            ctx.strokeStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(cx, margin);
            ctx.lineTo(cx, h - margin);
            ctx.stroke();
        }

        ctx.fillStyle = 'black';
        ctx.fillText(label, cx, h - margin + 5);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (var i = Math.floor(minY / tickY); i <= Math.ceil(maxY / tickY); i++) {
        var y = i * tickY;
        var cy = canvasY(y);
        var label = y + '%';

        if (y >= minY && y <= maxY) {
            ctx.strokeStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(margin, cy);
            ctx.lineTo(w - margin, cy);
            ctx.stroke();
        }

        ctx.fillText(label, margin - 5, cy);
    }

    var labelOffset = margin;

    $.each(graphSeries, function(key, serie) {

        var radius = margin / 5;
        ctx.fillStyle = serie.color;
        ctx.beginPath();
        ctx.arc(labelOffset + radius, margin / 2, radius, radius,
            0, 2 * Math.PI);
        ctx.fill();

        labelOffset += 2 * radius + 5;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, labelOffset, margin / 2);

        labelOffset += ctx.measureText(key).width + 15;
    });

    ctx.save();
    ctx.rect(margin, margin, w - margin * 2, h - margin * 2);
    ctx.clip();
    ctx.lineWidth = 2;

    $.each(graphSeries, function(key, serie) {
        ctx.strokeStyle = serie.color;
        ctx.beginPath();

        $.each(serie.data, function(i, point) {
            var x = canvasX(point[0]);
            var y = canvasY(point[1]);

            if (i == 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    });

    ctx.restore();


    var b = 2;
    ctx.fillStyle = '#555';

    ctx.fillRect(margin, margin, w - 2 * margin, b);         // top
    ctx.fillRect(margin, h - margin - b, w - 2 * margin, b); // bottom

    ctx.fillRect(margin, margin, b, h - 2 * margin);         // left
    ctx.fillRect(w - margin - b, margin, b, h - 2 * margin); // right
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

var connect = function(addr) {
    $('[id^=status-]').html('Connecting...');
    $('#status').removeClass('offline').html('Connecting...');

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
            var serie = graphSeries.memory.data;
            serie.push([now, data.used / data.total * 100]);
            while (serie.length > 100) serie.shift();
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
            var serie = graphSeries.cpu.data;
            serie.push([now, data]);
            while (serie.length > 100) serie.shift();
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

        graphSeries.memory.data = [];
        graphSeries.cpu.data = [];

        window.setTimeout(function() {
            connect(addr);
        }, 10000);
    }
};

