"""Run the local-only API and nginx together; stop the container if either fails."""
import signal
import subprocess
import sys
import time
from pathlib import Path

processes = []


def stop(*args):
    for process in processes:
        if process.poll() is None:
            process.terminate()
    for process in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


signal.signal(signal.SIGTERM, lambda *args: sys.exit(0))
signal.signal(signal.SIGINT, lambda *args: sys.exit(0))
try:
    processes.append(subprocess.Popen([sys.executable, str(Path(__file__).with_name('server.py'))]))
    processes.append(subprocess.Popen(['nginx', '-g', 'daemon off;']))
    while all(process.poll() is None for process in processes):
        time.sleep(.5)
    sys.exit(1)
finally:
    stop()
