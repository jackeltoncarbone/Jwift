import json, subprocess, os
from PIL import Image

OUT = r"C:\Users\jackc\Code\LiquidGlassGallery\ActiveLens"
HD = os.path.join(os.path.dirname(__file__), "hd")

SOURCES = {
    "rubicon": dict(file="j0dKV83ATeY_0.mp4", offset=0.0, fps=24,
        page="https://www.youtube.com/watch?v=j0dKV83ATeY", title="Rubicon Revisited: iOS 26's Tab Bar Doesn't Feel Right",
        native=False, platform="iOS 26 (Music, light)", note="1080p YouTube screen recording, zoomed about 2.5x from device pixels (upscaled, not native)"),
    "apple-intro": dict(file="jGztGfRujSE_112.mp4", offset=112.0, fps=30000/1001,
        page="https://www.youtube.com/watch?v=jGztGfRujSE", title="Apple: iOS 26: Introducing Liquid Glass",
        native=False, platform="iOS 26 (Apple render, light)", note="Apple 4K render, enlarged well beyond device pixels"),
    "wwdc-meet": dict(file="IrGYUq1mklk_240.mp4", offset=240.0, fps=30000/1001,
        page="https://developer.apple.com/videos/play/wwdc2025/219/ (YouTube IrGYUq1mklk)", title="WWDC25: Meet Liquid Glass",
        native=False, platform="iOS 26 (Apple design render)", note="Apple 4K macro render of the control, not a device capture"),
    "wwdc-swiftui": dict(file="3MugGCtm26A_66.mp4", offset=66.0, fps=30000/1001,
        page="https://developer.apple.com/videos/play/wwdc2025/323/ (YouTube 3MugGCtm26A)", title="WWDC25: Build a SwiftUI app with the new design",
        native=False, platform="iOS 26 (Apple render, light)", note="Apple 4K render, enlarged"),
    "dark-short": dict(file="pg6b.mp4", offset=0.0, fps=30,
        page="https://www.youtube.com/watch?v=pG6-F29NxHE", title="Rene Official TV: #ios26 Beta 6 Liquid Glass tab bar",
        native=False, platform="iOS 26 beta 6 (Music, dark)", note="Real device screen recording, uploaded at 854x354, about 0.65x device pixels (downscaled, not native)"),
    "kavsoft": dict(file="UjR2FK6_DuQ_7.mp4", offset=7.0, fps=60,
        page="https://www.youtube.com/watch?v=UjR2FK6_DuQ", title="Kavsoft: Customizing Native Tab Bar With FAB Buttons (iOS 26)",
        native=False, platform="iOS 26 simulator (native UITabBar, dark)", note="4K60 zoomed simulator recording, upscaled about 2x"),
    "macstories-tab": dict(file="ms_tab_switch-1757838526436.mp4", offset=0.0, fps=60,
        page="https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/3/", video="https://cdn.macstories.net/tab_switch-1757838526436.mp4",
        title="MacStories iOS 26 review: Switching between tabs (long-press selection bubble)",
        native=True, platform="iOS 26 (Music, light, iPhone)", note="Native iPhone screen recording, 1320 px wide at 3x, 60 fps (cropped by MacStories, not resampled)"),
    "macstories-slider": dict(file="ms_slider-1757838998748.mp4", offset=0.0, fps=60,
        page="https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/3/", video="https://cdn.macstories.net/slider-1757838998748.mp4",
        title="MacStories iOS 26 review: Interacting with sliders",
        native=True, platform="iOS 26 (Settings brightness slider, light, iPhone)", note="Native iPhone screen recording, 1320 px wide at 3x, 60 fps"),
}

MS = (0, 340, 1320, 300)
MSL = (0, 90, 1320, 220)
DK = (0, 150, 854, 204)
KV = (1120, 1500, 1640, 480)
R1 = (360, 440, 1200, 380)   # Rubicon Music tab bar, 41-67 s layout
R0 = (260, 500, 1400, 400)   # Rubicon Music tab bar, 20-31 s layout
NEWS = (600, 750, 2700, 700)
SEG = (900, 450, 2000, 750)

# (source, clip time, slug, state, lens_vs_pill, shows, crop)
F = [
 # press -> grow -> drag sequence
 ("rubicon", 57.458, "seqA-01-rest", "rest", "1.0x (resting pill, reference)", "Resting selection pill on Home, frame before the finger lands.", R1),
 ("rubicon", 57.500, "seqA-02-press", "press", "~1.05x, first frame of lift", "Finger down: pill begins to swell and brighten.", R1),
 ("rubicon", 57.542, "seqA-03-grow", "press", "~1.2x, growing", "Lens growing out of the pill; rim forming, Home glyph starts to magnify.", R1),
 ("rubicon", 57.583, "seqA-04-grow", "press", "~1.35x, growing", "Lens mid-grow, rim and chromatic fringe visible on the Home icon.", R1),
 ("rubicon", 57.625, "seqA-05-grow", "press", "~1.45x, near full", "Lens nearly full size, extends above and below the bar.", R1),
 ("rubicon", 57.667, "seqA-06-full", "press", "~1.5x, full lens (overshoot peak)", "Full lens over Home: magnified red glyph, top highlight bar, lifts past the bar edges.", R1),
 ("rubicon", 57.708, "seqA-07-drag", "drag", "~1.5x", "Drag begins toward New; lens spans Home and New, both glyphs refracted at the rim.", R1),
 ("rubicon", 57.792, "seqA-08-drag", "drag", "~1.5x", "Mid-drag between Home and New; icons under the rim are warped and tinted.", R1),
 ("rubicon", 57.875, "seqA-09-drag", "drag", "~1.5x", "Lens centered between tabs, both icons bent by the rim.", R1),
 ("rubicon", 58.125, "seqA-10-hold", "drag", "~1.5x", "Lens held between Home and New, steady state of a held drag.", R1),
 # drag and release back to Home
 ("rubicon", 42.625, "seqB-01-rest", "rest", "1.0x (resting pill on New)", "Resting pill on New before the press.", R1),
 ("rubicon", 42.792, "seqB-02-press", "press", "~1.2x", "Press on New, lens starting to inflate.", R1),
 ("rubicon", 43.000, "seqB-03-drag", "drag", "~1.5x", "Lens dragged onto Home, magnified Home glyph with red chromatic edge on New.", R1),
 ("rubicon", 43.833, "seqB-04-release", "release", "~1.3x, shrinking", "Finger lifted: lens deflating back into the pill over Home.", R1),
 ("rubicon", 43.917, "seqB-05-settled", "release", "1.0x", "Settled pill on Home after release.", R1),
 # over darker content
 ("rubicon", 28.208, "seqC-01-rest", "rest", "1.0x (resting pill on New)", "Tab bar over darker artwork, pill on New.", R0),
 ("rubicon", 28.417, "seqC-02-press", "press", "~1.3x", "Lens growing over New while content behind is dark.", R0),
 ("rubicon", 28.583, "seqC-03-drag", "drag", "~1.5x", "Lens dragged toward Home over dark content; rim and magnified glyph.", R0),
 ("rubicon", 28.667, "seqC-04-release", "release", "~1.3x, shrinking", "Lens deflating onto Home over dark content; strong rainbow chromatic rim on the lower edge.", R0),
 # Radio to Library drag
 ("rubicon", 33.292, "seqD-01-press", "press", "~1.5x", "Lens over Radio after press.", R1),
 ("rubicon", 33.500, "seqD-02-drag", "drag", "~1.5x", "Mid-drag Radio to Library, both glyphs magnified at the rim.", R1),
 ("rubicon", 34.458, "seqD-03-release", "release", "~1.2x", "Release and snap back toward Radio.", R1),
 # Apple News tab bar
 ("apple-intro", 6.340, "news-01-press", "press", "~1.45x", "First frame of the shot: lens already lifted over Today, extends past the bar top and bottom.", NEWS),
 ("apple-intro", 6.507, "news-02-press", "press", "~1.3x", "Lens rising, moving off Today.", NEWS),
 ("apple-intro", 6.640, "news-03-drag", "drag", "~1.5x", "Lens over News+, magnified glyph and warped label.", NEWS),
 ("apple-intro", 6.807, "news-04-drag", "drag", "~1.5x", "Lens over Sports, extends above and below the bar; refracted News+ glyph at rim.", NEWS),
 ("apple-intro", 6.974, "news-05-drag", "drag", "~1.5x", "Lens between Sports and Audio.", NEWS),
 ("apple-intro", 7.174, "news-06-release", "release", "~1.2x", "Lens settling on Audio.", NEWS),
 ("apple-intro", 7.407, "news-07-rest", "rest", "1.0x (pill on Audio)", "Resting pill on Audio after release.", NEWS),
 # Segmented control
 ("wwdc-swiftui", 7.808, "segmented-01-rest", "rest", "1.0x", "Segmented control at rest on For You.", SEG),
 ("wwdc-swiftui", 8.108, "segmented-02-press", "press", "~1.4x", "Selection lens lifting over For You.", SEG),
 ("wwdc-swiftui", 8.309, "segmented-03-drag", "drag", "~1.5x", "Lens sliding toward Library, text magnified and clipped at the rim.", SEG),
 ("wwdc-swiftui", 8.609, "segmented-04-drag", "drag", "~1.5x", "Lens over Library, both labels refracted.", SEG),
 # Toggle and slider lens
 ("wwdc-swiftui", 3.200, "toggle-lens", "press", "knob grows ~1.4x into clear lens", "Toggle knob turned into a clear lens while dragged.", (1400, 450, 1100, 750)),
 ("wwdc-swiftui", 11.000, "slider-lens", "drag", "thumb grows to a ~2x clear lens", "Slider thumb as lens, fill refracted through it.", (400, 540, 1600, 720)),
 ("wwdc-meet", 2.830, "toolbar-press", "press", "n/a (toolbar button)", "Finger pressing a glass toolbar, the pressed area brightens.", (800, 600, 2400, 900)),
 ("wwdc-meet", 11.170, "toggle-lens-macro", "press", "knob lens ~1.5x the resting knob", "Macro of toggle knob as lens: green rim, thick bezel, magnified track.", (1000, 250, 2200, 1650)),
 ("wwdc-meet", 26.500, "slider-lens-macro", "drag", "thumb lens ~2x", "Macro of slider lens: blue fill bent at the rim, specular edge.", (400, 400, 2600, 1300)),
 ("wwdc-meet", 29.500, "slider-lens-finger", "drag", "thumb lens ~2x", "Slider lens under a finger, lens tilts in perspective.", (300, 500, 2800, 1100)),
 ("apple-intro", 5.607, "toggle-lens-intro", "press", "knob lens ~1.4x", "Toggle knob mid-flip as lens with green rim.", (800, 450, 1900, 1250)),
 # dark mode press -> grow -> drag -> release (real device)
 ("dark-short", 1.000, "dark-01-rest", "rest", "1.0x (resting pill on Library)", "Dark Music tab bar, resting pill on Library.", DK),
 ("dark-short", 1.033, "dark-02-press", "press", "~1.1x", "First frame of lift: pill swells and gains a rim.", DK),
 ("dark-short", 1.067, "dark-03-grow", "press", "~1.3x", "Lens growing over Library, starts to extend past the bar.", DK),
 ("dark-short", 1.100, "dark-04-grow", "press", "~1.45x", "Lens nearly full, clear glass over dark content, magnified glyph.", DK),
 ("dark-short", 1.200, "dark-05-drag", "drag", "~1.5x", "Full lens moving toward Radio; lifts above and below the bar, rim catches light.", DK),
 ("dark-short", 1.300, "dark-06-drag", "drag", "~1.5x", "Mid-drag between Radio and Library, both glyphs magnified and bent at the rim.", DK),
 ("dark-short", 1.433, "dark-07-drag", "drag", "~1.5x", "Lens centered on Radio, magnified red glyph, chromatic lower rim.", DK),
 ("dark-short", 11.633, "dark-08-release", "release", "~1.4x", "Last lens frame before release over Radio.", DK),
 ("dark-short", 11.700, "dark-09-settled", "release", "1.0x", "Snapped back to the flat pill on Radio (release is near instant, about 2 frames).", DK),
 ("kavsoft", 16.250, "dark-action-button-press", "press", "~1.35x of the resting button", "Native dark tab bar: the + action button grown into a lens on press.", KV),
 # native MacStories long-press sequence
 ("macstories-tab", 0.500, "native-01-rest", "rest", "1.0x (resting pill, reference)", "NATIVE: resting selection pill on Home.", MS),
 ("macstories-tab", 1.667, "native-02-press", "press", "~1.0x, pill brightening", "NATIVE: long-press begins, pill brightens before it grows.", MS),
 ("macstories-tab", 1.700, "native-03-grow", "press", "~1.1x", "NATIVE: pill swelling, rim sharpening.", MS),
 ("macstories-tab", 1.733, "native-04-grow", "press", "~1.2x", "NATIVE: lens growing, begins to exceed the bar top and bottom.", MS),
 ("macstories-tab", 1.767, "native-05-grow", "press", "~1.3x", "NATIVE: lens growing, rainbow chromatic rim appears.", MS),
 ("macstories-tab", 1.800, "native-06-grow", "press", "~1.35x", "NATIVE: lens near full, white glass fill brightens, chromatic rim strong.", MS),
 ("macstories-tab", 1.900, "native-07-full", "press", "~1.35x, full (settled after grow)", "NATIVE: full lens over Home, iridescent rim, magnified glyph, lift past bar edges.", MS),
 ("macstories-tab", 2.500, "native-08-hold", "press", "~1.35x", "NATIVE: lens held on Home (same frame as the full-bar reference image).", MS),
 ("macstories-tab", 3.300, "native-09-drag", "drag", "~1.35x", "NATIVE: drag starts toward New, glyphs magnified inside the lens.", MS),
 ("macstories-tab", 3.417, "native-10-drag", "drag", "~1.35x", "NATIVE: lens between Home and New, both glyphs bent at the rim.", MS),
 ("macstories-tab", 3.500, "native-11-drag", "drag", "~1.35x", "NATIVE: mid-drag, New glyph magnified red at the leading rim.", MS),
 ("macstories-tab", 3.617, "native-12-drag", "drag", "~1.35x", "NATIVE: lens arriving on New.", MS),
 ("macstories-tab", 3.800, "native-13-hold", "drag", "~1.35x", "NATIVE: lens held over New.", MS),
 ("macstories-tab", 9.767, "native-14-prerelease", "release", "~1.35x", "NATIVE: last full lens frame on Home before release.", MS),
 ("macstories-tab", 9.800, "native-15-release", "release", "~1.15x, shrinking", "NATIVE: release, lens deflating back to the pill.", MS),
 ("macstories-tab", 9.867, "native-16-release", "release", "~1.05x", "NATIVE: nearly settled pill after release.", MS),
 ("macstories-tab", 10.100, "native-17-settled", "release", "1.0x", "NATIVE: settled pill after release.", MS),
 ("macstories-slider", 0.667, "native-slider-01-rest", "rest", "1.0x (resting thumb)", "NATIVE: Settings brightness slider at rest.", MSL),
 ("macstories-slider", 2.667, "native-slider-02-press", "press", "thumb lens ~1.6x wide", "NATIVE: slider thumb grown into a lens on touch.", MSL),
 ("macstories-slider", 3.333, "native-slider-03-drag", "drag", "thumb lens ~1.6x wide", "NATIVE: slider lens mid-drag, blue fill refracted through it.", MSL),
 ("macstories-slider", 4.500, "native-slider-04-release", "release", "1.0x", "NATIVE: thumb back to resting size after release.", MSL),
]

def fmt(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}m{s:06.3f}s".replace(".", "_")

manifest = []
for src, t, slug, state, ratio, shows, crop in F:
    S = SOURCES[src]
    fps = S["fps"]
    n = round(t * fps)
    tt = n / fps
    abs_t = S["offset"] + tt
    base = f"{src}-{fmt(abs_t)}-{slug}"
    fpath = os.path.join(OUT, "Frames", base + ".png")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{max(tt-1,0):.4f}", "-i", os.path.join(HD, S["file"]),
                    "-ss", f"{tt - max(tt-1,0) - 0.25/fps:.4f}", "-frames:v", "1", fpath], check=True)
    im = Image.open(fpath)
    W, H = im.size
    x, y, w, h = crop
    x = max(0, min(x, W - w)); y = max(0, min(y, H - h))
    c = im.crop((x, y, x + w, y + h))
    cpath = os.path.join(OUT, "Crops", base + "-crop.png")
    c.save(cpath)
    vid = S.get("video") or (S["page"].split(" ")[0] if "youtube" in S["page"] else "https://www.youtube.com/watch?v=" + S["page"].split("YouTube ")[1].rstrip(")"))
    common = dict(source_page_url=S["page"].split(" ")[0], image_url_or_video_url=vid,
                  timestamp=f"{abs_t:.3f}s", state=state, platform=S["platform"], lens_vs_resting_pill=ratio,
                  native=S["native"], native_note=S["note"], video_title=S["title"])
    manifest.append(dict(file=f"Frames/{base}.png", kind="video-frame", **common, shows=shows, width=W, height=H, crop_of=None))
    manifest.append(dict(file=f"Crops/{base}-crop.png", kind="crop", **common, shows=shows, width=w, height=h,
                         crop_of=f"Frames/{base}.png", crop_box=[x, y, w, h]))
    print(base)

json.dump(manifest, open(os.path.join(os.path.dirname(__file__), "manifest_frames.json"), "w"), indent=1)
