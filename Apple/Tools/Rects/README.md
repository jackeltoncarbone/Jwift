# Rects: building the rounded-rectangle gallery

Scripts of another lane (not the glass agent) that built `C:\Users\jackc\Code\LiquidGlassGallery\Rects` (09-23 evening). Their runs are not in the glass agent's transcript, so the sample outputs are not recorded; the result is the gallery and its `manifest.json`, whose `about` block documents the measurement.

| script | what |
|---|---|
| `feeds.txt`, `rss.py` | Reddit feeds read through `https://www.reddit.com/<feed>` with a browser user agent; image posts indexed into `rd/index.json` |
| `rdget.py` | downloads the indexed images into `rd/` |
| `spec.py` | one dict per chosen image: name, source, platform, native flag, mockup flag, what it shows, corner boxes |
| `short.py` | the short side in px per item, for radius calibration |
| `measure.py` | per corner crop: subpixel edge positions, the diagonal inset, the circular-equivalent radius and the approximate radius calibrated on Apple's icon mask (`diagonal_inset / 0.4525`) |
| `run.py` | writes the Full and Crops files and the manifest |
| `verify.py`, `sheet.py`, `grid.py` | contact sheets of the crops for review; `grid.py src out [x0 y0 x1 y1] [maxdim]` |
| `dump.py`, `ai.py` | read the vector paths out of Apple's icon template `.ai` / PDF with PyMuPDF (`Vectors/Apple.AppIconMask.1024.json`) |
