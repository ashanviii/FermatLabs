"""Zip the Fermat repo for pushing from another machine, without build output, dependencies or secrets.
Usage: python3 -I make_release_zip.py <repo dir> <out.zip>"""
import fnmatch, os, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
SKIP_DIRS = {'node_modules', '.next', '.next-dev', '.git', '.firebase', '__pycache__', 'cache'}
SKIP_FILES = ['*.log', '.env', '.env.local', '.env.*.local', '*service-account*.json', 'fermat-sa.json', '*.tsbuildinfo', '.DS_Store']
top = os.path.basename(os.path.abspath(src)); count = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for name in sorted(files):
            if any(fnmatch.fnmatch(name, pattern) for pattern in SKIP_FILES):
                continue
            path = os.path.join(root, name)
            z.write(path, os.path.join(top, os.path.relpath(path, src))); count += 1
print(f'{out}: {count} files, {os.path.getsize(out) / 1e6:.1f} MB')
