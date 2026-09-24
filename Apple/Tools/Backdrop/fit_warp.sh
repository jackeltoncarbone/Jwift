# Fit the lens warps on Apple's bands: set GLASS_LENS_BACKDROP_WARP and GLASS_LENS_ITEM_WARP, build, measure.
# usage: fit_warp.sh "2.0, 16.0" "-6.0, 11.2" [lift]
G=C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Jiv/Shaders/Glass.Pipeline.glsl
sed -i "s/^const vec3 GLASS_LENS_BACKDROP_WARP = vec3(.*);/const vec3 GLASS_LENS_BACKDROP_WARP = vec3($1);/; s/^const vec2 GLASS_LENS_ITEM_WARP = vec2(.*);/const vec2 GLASS_LENS_ITEM_WARP = vec2($2);/" $G
[ -n "$3" ] && sed -i "s/^const float GLASS_LENS_ITEM_LIFT = .*;/const float GLASS_LENS_ITEM_LIFT = $3;/" $G
cd "$(dirname "$0")/../LiveBar" && node build.mjs >/dev/null && EXTRA='&glass-skip=grade' node shoot_backdrop.mjs shots-apple-parity light >/dev/null && cd ../Backdrop && python run_fields.py parity ../LiveBar/shots-apple-parity >/dev/null && python -c "
import json, numpy as np
F=json.load(open('fields_parity.json')); A=json.load(open('fields_apple.json'))
b=np.mean([[x['m'] for x in v['bands']] for v in F.values()],0); a=np.mean([[x['m'] for x in v['bands']] for v in A.values()],0)
print('bands ours', b.round(3), 'apple', a.round(3))
gi=lambda F,k: np.mean([v['item'][k] for k,v in [(k,v) for v in F.values()]]) if False else None
for k in ['glyph_w','glyph_h','label_w','label_h']:
  print(k, round(float(np.mean([v['item'][k] for v in F.values()])),3), 'apple', round(float(np.mean([v['item'][k] for v in A.values()])),3), 'per', [v['item'][k] for v in F.values()])
"
