# Re-measure only the same-backdrop bands (LiveBar scene=apple), printing ours per frame.
cd "$(dirname "$0")/../LiveBar" && node build.mjs >/dev/null && EXTRA='&glass-skip=grade' node shoot_backdrop.mjs shots-apple-parity light >/dev/null && cd ../Backdrop && python run_fields.py parity ../LiveBar/shots-apple-parity >/dev/null && python -c "
import json
F=json.load(open('fields_parity.json'))
for k,v in F.items(): print(k, [round(b['m'],3) for b in v['bands']])
"
