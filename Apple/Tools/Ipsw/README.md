# Ipsw: firmware extraction

The full walk-through is `../../Methods.md` section 3. These are the pieces written for it.

## decmpfs/ (`main.go`, `go.mod`, `go.sum`)

Decompresses an APFS file stored with decmpfs type 14 (LZBITMAP in the resource fork), which 7-Zip 26 cannot decode ("Unsupported Method", `ZBM-rsrc`). The dyld cache's `.symbols` and three `.dyldlinkedit` files are stored this way.

- Input: a path whose two NTFS alternate streams 7-Zip wrote with `-sns`: `<file>:com.apple.decmpfs` (16 bytes: `fpmc`, type, uncompressed size) and `<file>:com.apple.ResourceFork` (chunk offset table, then 64 KiB chunks; a chunk of `want + 1` bytes starting `0xff` is stored raw).
- Build: `go mod init decmpfs; GOFLAGS=-mod=mod go get github.com/deploymenttheory/go-macos-pkg/pkg/lzbitmap; go build -o decmpfs.exe .` (go-macos-pkg v0.7.1, a Go port of Corellium's libzbitmap).
- Run (forward slashes):
  ```
  7z.exe x -sns dec/043-53656-126.dmg "System/Library/Caches/com.apple.dyld/*.dyldlinkedit:*" "System/Library/Caches/com.apple.dyld/*.symbols:*" -orsrc -y
  decmpfs.exe "D:/AppleIPSW/rsrc/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e.symbols" "D:/AppleIPSW/dyld/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e.symbols"
  ```
- Sample output: `wrote 999571456 of 999571456` (and 186482688, 175652864, 198819840 for `.35`, `.72`, `.79.dyldlinkedit`).

## metallib.py

Splits an Apple `.metallib` into one LLVM bitcode file per function, for `llvm-dis`.

- Input: `metallib.py <file.metallib> <outdir> [name-regex]`. Handles the fat container (`cafe babe`) and reads the `MTLB` slice: function list offset at 0x18, bitcode offset at 0x48, per-function tags `NAME`, `MDSZ`, `OFFT` up to `ENDT`.
- Output: `<slice>__<name>.bc` for names matching the regex, and `<slice>__names.txt` with every name.
- Run: `python metallib.py metal/System/Library/Frameworks/QuartzCore.framework/default.metallib air/qc 'displacement|glass|sdf'`, then `llvm-dis.exe air/qc/1000017_c__glass_background_sdf_lpf.bc -o glass_background_sdf_lpf.ll` (conda env `air`, llvm-tools 19).
- Sample output: `1000017_c 189 functions`, then an `AssertionError: b'\xcf\xfa\xed\xfe'` on the second slice (a Mach-O of compiled GPU code). Harmless: the first slice is done.

## list_remote_zip.py

Lists the large files inside a remote IPSW with HTTP range requests, to pick which DMG to download (the IPSW is 11 GB).

- Run: `python list_remote_zip.py "https://updates.cdn-apple.com/2025FallFCS/fullrestores/089-12066/4F86CB11-E6FA-47CB-96A8-527A4CBD9273/iPhone18,3_26.1_23B85_Restore.ipsw" 50`
- Sample output:
  ```
  043-53656-126.dmg.aea 1912 MB      the SystemOS cryptex (dyld shared cache)
  043-54414-121.dmg.aea 8053 MB      the system volume (framework metallibs)
  043-53775-129.dmg 226 MB
  Firmware/Mav25-1.10.05.Release.bbfw 144 MB
  ```
  (the annotations are ours.) Written inline in the transcript at 09-24 18:17:42; saved here as a script.
