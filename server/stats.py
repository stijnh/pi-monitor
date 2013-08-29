import subprocess
import re

def exec_cmd(cmd):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)
    return p.communicate()[0]

def kernel():
    try:
        out = exec_cmd("cat /etc/*-release")
        match = re.search("PRETTY_NAME=\"([^\"]+)\"", out)
        return match.group(1) if match else None
    except:
        return None

def uptime():
    try:
        return float(exec_cmd("cat /proc/uptime").split()[0])
    except:
        return None

def temperature():
    try:
        return float(exec_cmd("cat /sys/class/thermal/thermal_zone0/temp"))
    except:
        return None

def memory_usage():
    try:
        parts = exec_cmd("free -mb | grep Mem").split()

        return {
            "total": float(parts[1]),
            "used": float(parts[2]),
            "available": float(parts[3]),
        };

    except:
        return None

def storage_usage():
    try:
        parts = exec_cmd("df --total -B1").strip().split('\n')[-1].split()

        return {
            "total": float(parts[2]) + float(parts[3]),
            "used": float(parts[2]),
            "available": float(parts[3]),
        }

    except:
        return None

prev_total_ticks = 0
prev_idle_ticks = 0

def cpu_usage():
    global prev_total_ticks
    global prev_idle_ticks

    try:
        parts = exec_cmd("cat /proc/stat | head -n1").strip().split()

        total_ticks = sum(map(int, parts[1:6]))
        idle_ticks = int(parts[4])

        total_diff = total_ticks - prev_total_ticks
        idle_diff = idle_ticks - prev_idle_ticks

        prev_total_ticks = total_ticks
        prev_idle_ticks = idle_ticks

        return 1.0 - float(idle_diff) / total_diff
    except:
        return None

def network():
    result = {"ip": None, "recv": 0, "send": 0}

    try:
        out = exec_cmd("ifconfig eth0")

        match = re.search("inet addr:([0-9.]+)", out)
        if match: result["ip"] = match.group(1)

        match = re.search("RX bytes:([0-9]+)", out)
        if match: result["recv"] = int(match.group(1))

        match = re.search("TX bytes:([0-9]+)", out)
        if match: result["send"] = int(match.group(1))
    except:
        pass

    return result

