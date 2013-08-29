#!/usr/bin/env python
import sys
import twspy
import socket
import threading
import stats
import time

class HeartbeatThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.cond = threading.Condition()
        self.clients = []
        self.running = True

    def run(self):
        while self.running:
            self.cond.acquire()
            while len(self.clients) == 0 and self.running:
                self.cond.wait()
            clients = self.clients[:]
            self.cond.release()

            data = {
                "kernel": stats.kernel(),
                "uptime": stats.uptime(),
                "temperature": stats.temperature(),
                "cpu": stats.cpu_usage(),
                "memory": stats.memory_usage(),
                "storage": stats.storage_usage(),
                "network": stats.network()
            }

            message = twspy.JSONMessage(data)

            for client in clients:
                try:
                    client.send(message)
                except:
                    pass

            time.sleep(1.0)


    def add_client(self, client):
        self.cond.acquire()
        self.clients.append(client)
        self.cond.notify_all()
        self.cond.release()

    def remove_client(self, client):
        self.cond.acquire()
        if client in self.clients:
            self.clients.remove(client)
            self.cond.notify_all()
        self.cond.release()

    def stop(self):
        self.cond.acquire()
        self.running = False
        self.cond.notify_all()
        self.cond.release()

class HeartbeatServer(twspy.Server):
    def __init__(self, thread, *args, **kwargs):
        twspy.Server.__init__(self, *args, **kwargs)
        self.heartbeat_thread = thread

    def onopen(self, client):
        self.heartbeat_thread.add_client(client)

    def onclose(self, client, code, reason):
        self.heartbeat_thread.remove_client(client)

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) >= 2 else 8080
    thread = HeartbeatThread()
    server = HeartbeatServer(thread, port)

    thread.start()
    server.run()
    thread.stop()
