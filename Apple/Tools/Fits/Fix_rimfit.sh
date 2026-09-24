#!/bin/sh
# rimfit.sh LIT BOUNCE FACING : set the rim lobe weights in the real shader, render, measure.
F=/c/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Jiv/Shaders/Jiv.Panel.frag
python - "$1" "$2" "$3" <<'PY'
import sys, re
p = r'C:\Users\jackc\Code\Repositories\show-studio\ShowStudio.Libraries\Jaui\Jaui\src\Jiv\Shaders\Jiv.Panel.frag'
s = open(p, encoding='utf-8', newline='').read()
s = re.sub(r'const float RIM_FACING = [0-9.]+;', 'const float RIM_FACING = %s;' % sys.argv[3], s)
s = re.sub(r'float lobe = max\(max\([0-9. *]*RimLobe\(p, halfSize, v_Radii, light\), [0-9.]+ \* RimLobe\(p, halfSize, v_Radii, -light\)\),',
           'float lobe = max(max(%s * RimLobe(p, halfSize, v_Radii, light), %s * RimLobe(p, halfSize, v_Radii, -light)),' % (sys.argv[1], sys.argv[2]), s)
open(p, 'w', encoding='utf-8', newline='').write(s)
PY
grep -n "float lobe = \|RIM_FACING =" $F | head -3
node build.mjs >/dev/null && node shoot.mjs ours-photos ours-appstore ours-safari | grep -v VIB | tail -1
python rim.py renders 2>/dev/null
