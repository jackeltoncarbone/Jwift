# Chrome: the :9222 helpers

Copies of `C:\Users\jackc\.chrome-mcp-*` as of 2026-09-24. The live ones stay in the home folder; these are for reference. Usage, arguments and environment are in `../../Measuring.md` section 1.

| file | purpose | sample output |
|---|---|---|
| `.chrome-mcp-launch.ps1` | relaunch the connect-mode Chrome on :9222 with occlusion and background throttling off | `chrome up: https://localhost:6767/...` |
| `.chrome-mcp-press.mjs` | press and drag with trusted events at 390 x 844 DPR 3, `SCHEME=light\|dark`, shooting each stage | `saved rest`, `saved pressed`, `saved middrag`, `saved dragged`, `saved released` |
| `.chrome-mcp-anon.mjs` | a signed-out shot in a fresh browser context, with optional scrolls, press or clicks | `saved 0`, `ERRORS 0 []` |
| `.chrome-mcp-drag2.mjs` | press, step through dx offsets, release far away | `captured dx=...`, `released far off the control` |
| `.chrome-mcp-reload.mjs` | cache-busting hard reload | `[reloaded] <url>` |
| `.chrome-mcp-console.mjs` | console and exceptions from the page and its workers | `[page:log] ...`, `[worker:EXCEPTION] ...` |
| `.chrome-mcp-shot.mjs` | one screenshot, optional viewport emulation and clip | `saved out.png` |
| `.chrome-mcp-zoom-reset.mjs` | page zoom back to 100% | `{"w":390,"dpr":3}` |
