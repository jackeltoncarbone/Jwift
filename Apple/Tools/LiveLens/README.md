# LiveLens: the APPLE / OURS lens sheets and the body fit

From `SP\LiveLens12`. Read `../ActiveLens/frames` and `../LiveBar/shots-*`.

| script | what | run | sample output |
|---|---|---|---|
| `body_pairs.py` | Apple's lens body against the same backdrop without the lens: frames 180 vs 450, 10 pt and more in, items excluded, both blurred 1 pt; and the dark Music pair | `python body_pairs.py` | light: lens mean [243.2, 241.3, 236.0] vs ref [235.7, 225.0, 219.2], luma 0.658 + 0.324 ref (n 15902); dark: 0.006 + 1.019 ref, chroma 0.254 |
| `sheet.py` | APPLE / OURS at the same zoom: the bar pressed at its end and mid-drag, MacStories frames vs our bar over Apple's page picture, both 1320 px at 3x | `python sheet.py ../LiveBar/shots-apple-now tab-apple-vs-ours.png` | `(1320, 300) (1320, 300)`, `ok` |
| `sheet_all.py` | the same for light (MacStories), dark (Music) and the segmented control (WWDC frame `al/cand/seg83.png`), each lens scaled to the same on-screen height | `python sheet_all.py` | `ok (2020, 4140)`, `lens-apple-vs-ours.png` |
