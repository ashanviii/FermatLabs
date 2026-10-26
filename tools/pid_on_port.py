"""Print PIDs listening on a TCP port (no ss/lsof needed): python3 -I pid_on_port.py 8080"""
import os, sys
port = int(sys.argv[1]); inodes = set()
for table in ('/proc/net/tcp', '/proc/net/tcp6'):
    for line in open(table).readlines()[1:]:
        parts = line.split()
        if int(parts[1].rsplit(':', 1)[1], 16) == port and parts[3] == '0A':
            inodes.add(parts[9])
for pid in filter(str.isdigit, os.listdir('/proc')):
    try:
        if any(os.readlink(f'/proc/{pid}/fd/{fd}') in {f'socket:[{i}]' for i in inodes} for fd in os.listdir(f'/proc/{pid}/fd')):
            print(pid)
    except OSError:
        pass
