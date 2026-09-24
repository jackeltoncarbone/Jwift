# Parity: the Liquid Glass parity check

Described in `../../Measuring.md` section 4 (what `run.sh` does step by step, what a row is, the totals over time). Layout as it ran: `SP\Parity\run.sh` and `SP\Parity\engine\*`, with `SP\LiveBar`, `SP\LiveApp` and `SP\Backdrop` beside it.

| file | what |
|---|---|
| `run.sh` | the one command: `sh <SP>/Parity/run.sh`; exits 1 on a FAIL |
| `cases.py` | the cases and backdrops (`bgs/`), printed as the shot list |
| `Specs.ts` | harness specs from the real sheets (Jaui's parser, `Jwift.Glass.jss` as globals) |
| `HarnessApple.ts` | renders glass through Jaui's resolver, instance packer and panel shaders the way the walk draws a glass fill; `Rim: 'Pass' \| 'Fragment'` |
| `LivePath.ts` | live-path assertions: each glass property is wired in the real resolve, pack and shader path; source regex checks |
| `build.mjs`, `shoot.mjs`, `page.html` | bundles and the Playwright shooter (`node shoot.mjs parity <names>`) |
| `parity.py` | the table: `property \| Apple \| ours \| metric \| result`; imports `../../Corner/model.py` and `rb_model.py` for the silhouette row |
| `lens_rows.py` | the active lens rows, run inside `parity.py`: live app (via `LiveApp/optics_live.py`), engine timing (via `LiveBar/measure.py`), the two layers (via `Backdrop/fields.py`) |
| `zoom.py` | the labelled 3x zoom sheet (`out/parity-rim-zoom.png`) |
| `sweep.sh` | texel sigma sweep: edits `GLASS_TEXEL_SIGMA_REGULAR` / `_CLEAR`, renders, prints body detail vs SwiftUI. `sh sweep.sh "0.5 0.62" "0.28"` |
| `sample_output.txt` | a full run, 09-24 11:58: `82 pass, 3 fail, 5 not built, 3 without a reference` |
