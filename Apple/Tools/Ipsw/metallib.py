# Split an Apple metallib (possibly a fat Mach-O-style container) into its functions' LLVM bitcode.
# usage: metallib.py <file.metallib> <outdir> [name-regex]
import struct, sys, os, re
data = open(sys.argv[1], 'rb').read()
out = sys.argv[2]; pat = re.compile(sys.argv[3] if len(sys.argv) > 3 else '.')
os.makedirs(out, exist_ok=True)
def slices(d):
    if d[:4] == b'\xca\xfe\xba\xbe':
        n = struct.unpack('>I', d[4:8])[0]
        for i in range(n):
            cpu, sub, off, size, align = struct.unpack('>IIIII', d[8 + 20 * i: 28 + 20 * i])
            yield f'{cpu:x}_{sub:x}', d[off:off + size]
    else:
        yield 'thin', d
for tag, d in slices(data):
    assert d[:4] == b'MTLB', d[:4]
    fl_off, fl_size = struct.unpack('<QQ', d[0x18:0x28])
    bc_off, bc_size = struct.unpack('<QQ', d[0x48:0x58])
    count = struct.unpack('<I', d[fl_off:fl_off + 4])[0]
    p = fl_off + 4
    names = []
    for i in range(count):
        tlen = struct.unpack('<I', d[p:p + 4])[0]
        q = p + 4; end = p + tlen
        info = {}
        while q < end:
            t = d[q:q + 4]; q += 4
            if t == b'ENDT': break
            sz = struct.unpack('<H', d[q:q + 2])[0]; q += 2
            info[t] = d[q:q + sz]; q += sz
        p = end
        name = info[b'NAME'].split(b'\0')[0].decode()
        bsz = struct.unpack('<Q', info[b'MDSZ'])[0]
        offs = struct.unpack('<QQQ', info[b'OFFT'][:24])
        names.append(name)
        if pat.search(name):
            bc = d[bc_off + offs[2]: bc_off + offs[2] + bsz]
            open(os.path.join(out, f'{tag}__{name}.bc'), 'wb').write(bc)
    print(tag, count, 'functions')
    open(os.path.join(out, f'{tag}__names.txt'), 'w').write('\n'.join(names))
