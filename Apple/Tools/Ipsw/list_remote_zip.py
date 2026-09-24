# List the large files inside a remote IPSW (a zip) with HTTP range requests, without downloading it.
# usage: python list_remote_zip.py <ipsw url> [min MB]
import sys, zipfile, io, urllib.request
url = sys.argv[1]; floor = int(sys.argv[2]) * 1_000_000 if len(sys.argv) > 2 else 50_000_000
class R(io.RawIOBase):
    def __init__(s, u):
        s.u = u; s.pos = 0
        s.size = int(urllib.request.urlopen(urllib.request.Request(u, method='HEAD')).headers['Content-Length'])
    def seekable(s): return True
    def readable(s): return True
    def seek(s, o, w=0):
        s.pos = o if w == 0 else (s.pos + o if w == 1 else s.size + o); return s.pos
    def tell(s): return s.pos
    def readinto(s, b):
        if s.pos >= s.size: return 0
        end = min(s.pos + len(b), s.size) - 1
        d = urllib.request.urlopen(urllib.request.Request(s.u, headers={'Range': f'bytes={s.pos}-{end}'})).read()
        b[:len(d)] = d; s.pos += len(d); return len(d)
z = zipfile.ZipFile(io.BufferedReader(R(url), buffer_size=1 << 20))
for i in z.infolist():
    if i.file_size > floor: print(i.filename, i.file_size // 1_000_000, 'MB')
