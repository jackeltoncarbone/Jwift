// Decompress an APFS decmpfs type-14 (LZBITMAP, resource fork) file whose streams 7-Zip wrote as NTFS alternate
// streams: <file>:com.apple.decmpfs and <file>:com.apple.ResourceFork. Writes <out>.
package main

import (
	"encoding/binary"
	"fmt"
	"os"

	"github.com/deploymenttheory/go-macos-pkg/pkg/lzbitmap"
)

func main() {
	in, out := os.Args[1], os.Args[2]
	hdr, err := os.ReadFile(in + ":com.apple.decmpfs")
	if err != nil { panic(err) }
	typ := binary.LittleEndian.Uint32(hdr[4:8])
	size := binary.LittleEndian.Uint64(hdr[8:16])
	if typ != 14 { panic(fmt.Sprintf("type %d", typ)) }
	rs, err := os.ReadFile(in + ":com.apple.ResourceFork")
	if err != nil { panic(err) }
	first := binary.LittleEndian.Uint32(rs[0:4])
	n := int(first/4) - 1
	f, _ := os.Create(out)
	defer f.Close()
	var total uint64
	for i := 0; i < n; i++ {
		a := binary.LittleEndian.Uint32(rs[4*i:])
		b := binary.LittleEndian.Uint32(rs[4*i+4:])
		chunk := rs[a:b]
		want := uint64(65536)
		if size-total < want { want = size - total }
		var dec []byte
		if uint64(len(chunk)) == want+1 && chunk[0] == 0xff {
			dec = chunk[1:]
		} else {
			d, err := lzbitmap.Decompress(chunk)
			if err != nil { panic(fmt.Sprintf("chunk %d: %v (len %d, first %x)", i, err, len(chunk), chunk[:4])) }
			dec = d
		}
		f.Write(dec)
		total += uint64(len(dec))
	}
	fmt.Println("wrote", total, "of", size)
}
