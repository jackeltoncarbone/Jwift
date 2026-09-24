#!/bin/sh
# THE LIQUID GLASS PARITY CHECK. One command: renders every property on live geometry with the real Jwift
# classes, checks the live resolve/pack/shader path, compares against Apple, prints the table, exits 1 on a FAIL.
#   sh <scratchpad>/Parity/run.sh
set -e
cd "$(dirname "$0")/engine"
J=C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jwift/Jwift.Angular/src/
NAMES=$(python cases.py)
node build.mjs >/dev/null
mkdir -p specs-parity
node specs-now.bundle.mjs cases.json $J specs-parity >/dev/null
node livepath.bundle.mjs > livepath.json
python -m http.server 6804 --bind 127.0.0.1 --directory .. >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
node shoot.mjs parity $NAMES >/dev/null
# The active lens on our own live bar, in Jaui's engine (LiveBar), served from the scratchpad root.
python -m http.server 6806 --bind 127.0.0.1 --directory ../.. >/dev/null 2>&1 &
LIVE=$!
trap 'kill $SERVER $LIVE 2>/dev/null' EXIT
sleep 1
(cd ../../LiveBar && node build.mjs >/dev/null && node prep.bundle.mjs >/dev/null && node shoot.mjs dark >/dev/null && node shoot.mjs light >/dev/null)
# The live app: my own build (ng build output) served on 6791, pressed through the :9222 Chrome in a tab of its own.
node ../../LiveApp/serve.mjs >/dev/null 2>&1 &
APP=$!
trap 'kill $SERVER $LIVE $APP 2>/dev/null' EXIT
sleep 1
(cd ../../LiveApp && WARM=20000 node press.mjs 195 792 128 shots/live 100 >/dev/null && THEME=light WARM=20000 node press.mjs 195 792 128 shots/livelight 100 >/dev/null && python optics_live.py >/dev/null && python ../Backdrop/glyphs2.py shots/live shots/livelight > glyphs.json)
# The two layers on Apple's page picture: our real bar in our engine (LiveBar scene=apple), the lens grade skipped so the
# backdrop keeps its texture, measured as Apple's frames are (Backdrop/fields.py).
(cd ../../LiveBar && EXTRA='&glass-skip=grade' node shoot_backdrop.mjs shots-apple-parity light >/dev/null && cd ../Backdrop && python run_fields.py parity ../LiveBar/shots-apple-parity >/dev/null)
python parity.py
