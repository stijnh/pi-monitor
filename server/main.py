#!/usr/bin/env python
import json
import logging
import platform
import psutil
import re
import subprocess
import sys
import threading
import time

import twspy


class Heartbeat(threading.Thread):
    CHANNELS = {
            "kernel": 60,
            "cpu": 1,
            "memory": 1,
            "storage": 60,
            "network": 1,
            "uptime": 1,
            "ip": 60,
            "temperature": 1,
            "services": 60
    }

    def __init__(self):
        super(Heartbeat, self).__init__()
        self.clients = set()
        self.stopped = False
        self.refresh_all = True

    def run(self):
        while not self.stopped:
            now = time.time()

            if self.refresh_all:
                self.refresh_all = False
                next_update = dict((k, now) for k in self.CHANNELS)

            data = {}

            for k, delay in self.CHANNELS.items():
                if next_update[k] > now:
                    continue

                next_update[k] = now + delay

                try:
                    data[k] = getattr(self, "status_" + k)()
                except Exception as e:
                    logging.info("failed to fetch '%s':\n%s", k, e)

            msg = twspy.TextMessage(json.dumps(data))
            print data

            for client in set(self.clients):
                try:
                    client.send(msg)
                except Exception as e:
                    logging.warning("failed to send to '%s':\n%s", client, e)

            time.sleep(min(next_update.values()) - now)

    def stop(self):
        self.stopped = True

    def register_client(self, client):
        self.clients.add(client)
        self.refresh_all = True

    def unregister_client(self, client):
        self.clients.discard(client)

    def status_kernel(self):
        return platform.platform()

    def status_cpu(self):
        return psutil.cpu_percent(interval=None)

    def status_memory(self):
        d = psutil.virtual_memory()
        return {"used": d.used, "total": d.total}

    def status_storage(self):
        d = psutil.disk_usage("/")
        return {"used": d.used, "total": d.total}

    def status_network(self):
        d = psutil.net_io_counters()
        return {"sent": d.bytes_sent, "recv": d.bytes_recv}

    def status_uptime(self):
        return time.time() - psutil.get_boot_time()

    def status_temperature(self):
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            return float(f.read())

    def status_services(self):
        services = []
        out = subprocess.check_output(("service", "--status-all"), \
                stderr=subprocess.STDOUT)

        for line in out.split('\n'):
            match = re.match('\[\s+(.)\s+]\s+(.+)', line.strip())

            if match:
                services.append({
                    "status": match.group(1),
                    "name": match.group(2)
                })

        return services

    def status_ip(self):
        s = subprocess.check_output(("ifconfig", "eth0"))
        return re.search("inet addr:([0-9.]+)", s).group(1)


class Server(twspy.Server):
    def __init__(self, *args, **kwargs):
        super(Server, self).__init__(*args, **kwargs)
        self.thread = None

    def onopen(self, client):
        if not self.thread:
            self.thread = Heartbeat()
            self.thread.start()

        self.thread.register_client(client)

    def onclose(self, client, reason, code):
        self.thread.unregister_client(client)

        if not self.clients:
            self.thread.stop()
            self.thread = None


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) >= 2 else 8080
    Server(("", port)).run()
