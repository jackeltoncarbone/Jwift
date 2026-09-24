# Rest frames, HEAD engine vs the working tree, on the same harness: tab bar dark and light, segmented dark and light.
set -e
cd "$(dirname "$0")"
H=C:/Users/jackc/AppData/Local/Temp/claude/C--Users-jackc/09ee8d5e-80fe-47d9-9f89-c18df11719be/scratchpad/HeadSrc
shoot() { node shoot.mjs dark >/dev/null; node shoot.mjs light >/dev/null; node shoot_segment.mjs shots-segment >/dev/null; }
JAUI_SRC=$H/Jaui/Jaui/src JWIFT_SRC=$H/Jwift/Jwift.Angular/src node build.mjs >/dev/null
JAUI_SRC=$H/Jaui/Jaui/src JWIFT_SRC=$H/Jwift/Jwift.Angular/src node prep.bundle.mjs >/dev/null
shoot; rm -rf ab-head; mkdir ab-head; cp shots-dark/rest.png ab-head/tab-dark.png; cp shots-light/rest.png ab-head/tab-light.png; cp shots-segment/dark-rest.png ab-head/seg-dark.png; cp shots-segment/light-rest.png ab-head/seg-light.png
node build.mjs >/dev/null; node prep.bundle.mjs >/dev/null
shoot; rm -rf ab-now; mkdir ab-now; cp shots-dark/rest.png ab-now/tab-dark.png; cp shots-light/rest.png ab-now/tab-light.png; cp shots-segment/dark-rest.png ab-now/seg-dark.png; cp shots-segment/light-rest.png ab-now/seg-light.png
python -c "
from PIL import Image; import numpy as np
for n in ['tab-dark','tab-light','seg-dark','seg-light']:
  A=np.asarray(Image.open(f'ab-head/{n}.png').convert('RGB'),float); B=np.asarray(Image.open(f'ab-now/{n}.png').convert('RGB'),float)
  D=np.abs(A-B).max(2); print(n,'rmse %.3f'%np.sqrt(((A-B)**2).mean()),'max',int(D.max()),'px>2',int((D>2).sum()))
"
