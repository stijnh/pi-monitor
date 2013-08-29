var formatTimeDiff = function(diff) {
    diff = Math.floor(diff);

    var sec = diff % 60;
    var out = sec + " second" + (sec == 1 ? "" : "s");

    diff = Math.floor(diff / 60);
    if (diff <= 0) return out;

    var min = diff % 60;
    out = min + " minute" + (min == 1 ? "" : "s") + ", " + out;

    diff = Math.floor(diff / 60);
    if (diff <= 0) return out;

    var hour = diff % 24;
    out = hour + " hour" + (hour == 1 ? "" : "s") + ", " + out;

    diff = Math.floor(diff / 24);
    if (diff <= 0) return out;

    var day = diff;
    out = day + " day" + (day == 1 ? "" : "s") + ", " + out;

    return out;
};

var formatBytes = function(n, dec) {
    if (n < 1000) return n.toFixed(dec) + "B";

    n /= 1000;
    if (n < 1000) return n.toFixed(dec) + "kB"

    n /= 1000;
    if (n < 1000) return n.toFixed(dec) + "MB"

    n /= 1000;
    return n.toFixed(dec) + "GB"
};

var openConnection = function(address) {
    $("[id^=status-]").html("Connecting...");
    $("#status").removeClass("offline").html("Connecting...");

    var socket = new WebSocket(address);

    socket.onopen = function() {
        $("#status").addClass("online").html("Online");
    };

    socket.onmessage = function(msg) {
        var data = JSON.parse(msg.data);

        $("#status-kernel").html(data.kernel);
        $('#status-uptime').html(formatTimeDiff(data.uptime));
        $("#status-temperature").html((data.temperature/1000).toFixed(2) + "&deg;C");
        $("#status-cpu").html((data.cpu * 100).toFixed(2) + "%");

        $("#status-memory-used").html(formatBytes(data.memory.used, 2));
        $("#status-memory-total").html(formatBytes(data.memory.total, 2));

        $("#status-storage-used").html(formatBytes(data.storage.used, 2));
        $("#status-storage-total").html(formatBytes(data.storage.total, 2));

        $("#status-ip").html(data.network.ip);
        $("#status-network-recv").html(formatBytes(data.network.recv, 2));
        $("#status-network-send").html(formatBytes(data.network.send, 2));
    };

    socket.onclose = function() {
        $("[id^=status-]").html("-");
        $("#status").removeClass("online").addClass("offline").html("Offline");
    };
}

