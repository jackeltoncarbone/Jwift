# Apple Media Player UI in iOS 26 / iPadOS 26 / macOS Tahoe

Research compiled for the Jwift component library. Covers the Now Playing player,
lock screen controls, mini player, scrubber/slider, Control Center media module,
and video player overlay across Apple Music, Podcasts, and Apple TV apps.

Last updated: 2026-04-06

---

## 1. Design Language: Liquid Glass

iOS 26 (announced WWDC25, June 9 2025) introduced **Liquid Glass**, Apple's most
significant visual redesign since iOS 7. Liquid Glass is a translucent digital
meta-material that dynamically bends and shapes light. It reflects, refracts,
and blurs its surroundings while transforming fluidly in response to touch and
scroll context.

### Material Tiers (relevant to Jwift)

| Tier | Usage | Properties |
|---|---|---|
| **Liquid Glass** | Overlays: tab bars, floating toolbars, modals, media controls, Control Center | Full backdrop blur + refraction + specular highlights |
| **Solid Glass** | Page content: cards, tiles, list rows | Same shape language, no backdrop-filter, solid subtle background with luminous border |

This matches the existing Jwift material split (`LiquidGlass` for overlays,
`Solid` material for page content).

### Core Visual Properties

| Property | Value / Range | Notes |
|---|---|---|
| Backdrop blur radius | 10-20 px (buttons), up to 40 px (iPhone), up to 60 px (iPad/Mac) | System adapts based on context |
| Background fill | `rgba(255, 255, 255, 0.15)` to `rgba(255, 255, 255, 0.25)` (light) | Much lower opacity in dark mode |
| Border | `1px solid rgba(255, 255, 255, 0.18)` typical | Luminous, catches edge light |
| Outer shadow | `0 8px 32px rgba(31, 38, 135, 0.2)` | Subtle depth separation |
| Inner shadow / highlight | `inset 0 4px 20px rgba(255, 255, 255, 0.3)` | Creates the "light pooling" on glass surface |
| Specular shine | `rgba(255, 255, 255, 0.1)` pseudo-element, `opacity: 0.6`, `filter: blur(1px) brightness(115%)` | Simulates directional light reflection |
| Saturate | `saturate(180%)` in backdrop-filter chain | Keeps colors vivid behind the blur |

### Shape System

Apple defines three shape categories for Liquid Glass:

1. **Fixed shapes** -- Constant corner radius regardless of container size (e.g. 16 pt rounded rect).
2. **Capsules** -- Radius = half the shorter dimension. Default for buttons.
3. **Concentric shapes** -- Radius = parent radius - padding. Used everywhere containers nest.

Common corner radius tokens:

| Token | Value | Usage |
|---|---|---|
| Button (capsule) | `height / 2` | Default for all Liquid Glass buttons |
| Card | 28 pt | Standard card container |
| Sheet / modal | 34 pt | Bottom sheets, modals |
| Small interactive | 16 pt | Inner rounded rects, small controls |
| Pill / badge | 999 pt (effectively capsule) | Tags, labels, mini indicators |

---

## 2. Full-Screen Now Playing (Apple Music)

The full-screen Now Playing view is the most visually rich media surface in iOS 26.

### Layout (iPhone, portrait)

```
+------------------------------------------+
|  (status bar, transparent)               |
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |                                    |  |
|  |         ALBUM ARTWORK              |  |
|  |    (larger than iOS 18 -- now      |  |
|  |     takes central focus,           |  |
|  |     can animate for select tracks) |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  Track Title           (SF Pro, bold)    |
|  Artist Name      (SF Pro, secondary)    |
|                                          |
|  [====---------]  scrubber / timeline    |
|  0:42                            3:28    |
|                                          |
|  [shuffle] [<<] [ play/pause ] [>>] [rpt]|
|                                          |
|  [volume slider ==================]      |
|                                          |
|  [lyrics]  [airplay]  [queue]            |
+------------------------------------------+
```

### Key Details

- **Album artwork**: Significantly larger than iOS 18. Now extends nearly edge-to-edge
  with concentric corner radii matching the screen inset. For supported tracks,
  tapping expands the artwork full-screen with real-time animation. Animated album
  art is a new iOS 26 feature where artist-designed motion loops play during playback.
  The artwork animates on the Lock Screen when the display wakes, and interacts with
  the glassy playback controls.

- **Background**: Samples dominant colors from album artwork. The entire view tints
  to complement the art -- not an exact color match but a harmonious palette.

- **Controls overlay**: All playback controls sit on a Liquid Glass layer that floats
  above the artwork. In dark ambient conditions the glass is more translucent; in
  bright conditions it becomes more frosted for readability.

- **Typography**:
  - Track title: SF Pro Display, semibold, ~21 pt (Title 3 style)
  - Artist name: SF Pro Text, regular, ~17 pt (Body style), secondary label color
  - Timestamps: SF Pro Text, regular, ~13 pt (Caption style), tertiary label color
  - Apple uses SF Pro Display for sizes >= 20 pt, SF Pro Text for body and smaller

- **Playback buttons**: Capsule-shaped Liquid Glass with SF Symbols icons.
  - Play/pause: Largest, centered, ~56 pt touch target
  - Skip forward/back: ~44 pt touch target
  - Shuffle/repeat: ~36 pt touch target, at edges
  - All buttons use `.interactive()` behavior: scale on press, bounce animation,
    shimmer effect, touch-point illumination

---

## 3. Lock Screen Now Playing

### Visual Design

- Album artwork is **dramatically larger** than previous iOS versions, taking
  central focus on the lock screen. It fills most of the available space between
  the clock and the home indicator.

- For tracks with animated album art, the artwork animates when the screen lights up.
  On Always-On Display, a dimmed version of the full-screen look persists, then
  activates with animation on wake.

- Controls float on a Liquid Glass bar overlaying the bottom of the artwork.
  The glass bar has concentric radii relative to the artwork container.

### Controls Layout

```
+------------------------------------------+
|  12:34  (clock, Liquid Glass numeral)    |
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |       ALBUM ARTWORK                |  |
|  |  (full-screen capable, animated)   |  |
|  |                                    |  |
|  |                                    |  |
|  |  +------------------------------+  |  |
|  |  | Track  ----  scrubber  ----  |  |  |
|  |  | Artist                       |  |  |
|  |  | [<<]   [play/pause]   [>>]   |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
|                                          |
|  [flashlight]              [camera]      |
+------------------------------------------+
```

- The control bar has the same Liquid Glass material as the tab bar.
- Lock screen control buttons at the bottom (flashlight, camera) are **larger**
  in iOS 26 with a floating glass-like appearance.
- Volume slider: Hidden by default. Can be enabled via Accessibility > "Always
  Show Volume Control", which places a volume slider below playback controls.

---

## 4. Mini Player (Tab Bar Accessory)

The mini player in Apple Music is implemented as a **tab bar bottom accessory** --
a new iOS 26 API (`tabViewBottomAccessory` in SwiftUI, `accessoryView` on
`UITabBarController` in UIKit).

### Two Placement States

| State | Trigger | Layout |
|---|---|---|
| **Expanded** | Default, or scrolling up | Floats above the tab bar as its own Liquid Glass capsule. Full-width, shows track info + controls. |
| **Inline** | Scrolling down (tab bar minimizes) | Shrinks and merges into the collapsed tab bar row. Compact: icon-dense, less text. Nestles between active tab icon and search icon. |

### Expanded Layout

```
+------------------------------------------+
|                                          |
|  Content area (scrollable)               |
|                                          |
+------------------------------------------+
| [art] Track Title - Artist   [play] [>>] |  <-- mini player accessory (Liquid Glass capsule)
+------------------------------------------+
| [home]  [browse]  [radio]  [library] [Q] |  <-- tab bar (Liquid Glass)
+------------------------------------------+
```

- The accessory gets an automatic Liquid Glass capsule background from the system.
- When the tab bar collapses on scroll, the mini player slides down and blends
  inline with the remaining tab icons, maintaining Liquid Glass continuity.

### Interactions

- **Tap**: Expands to full-screen Now Playing view with a fluid zoom transition.
- **Swipe left**: Advance to next track (added in iOS 26.1). Aided by Liquid Glass
  morphing effects and haptic feedback.
- **Swipe right**: Go to previous track (iOS 26.1).
- **Long press**: Likely context menu (queue management).

### Dimensions (estimated from screenshots and API behavior)

- Expanded height: ~56-64 pt (matches standard tab bar accessory height)
- Inline height: collapses to match the minimized tab bar row (~36-40 pt)
- Album art thumbnail: ~40 pt square in expanded, ~28 pt in inline
- Corner radius: Capsule (height / 2) when expanded; blends with tab bar shape when inline

---

## 5. Scrubber / Slider / Progress Bar

### Thumbless Style (Default During Playback)

Apple introduced a **thumbless slider style** in iOS 26 for media playback. When
the user is not actively scrubbing, the slider appears as a minimal progress bar
without a visible thumb. This reduces visual noise during passive listening.

### Interaction Behavior

1. **Idle**: Thin track bar, no thumb visible. Progress fill is tinted to the
   accent/artwork color. Track height ~4 pt.
2. **Touch down**: The bar expands vertically (~8-12 pt), a Liquid Glass thumb
   fades in at the current position. The expansion uses a spring animation.
3. **Scrubbing**: Half-speed scrubbing (Apple's fine-scrubbing pattern) engages
   when the finger moves vertically away from the slider. The further the finger
   moves from the track, the finer the scrub resolution. Visual feedback shows
   a magnified time indicator.
4. **Release**: Spring back to idle state. Thumb fades out, track bar shrinks.

### Slider Design Tokens

| Property | Idle | Active / Scrubbing |
|---|---|---|
| Track height | ~4 pt | ~8-12 pt (spring expand) |
| Track corner radius | 2 pt (capsule at that height) | 4-6 pt |
| Thumb visibility | Hidden | Fades in, Liquid Glass circle |
| Thumb diameter | -- | ~28 pt |
| Fill color | Artwork-derived accent | Same, slightly brighter |
| Unfilled track | `rgba(255,255,255,0.15)` | `rgba(255,255,255,0.2)` |
| Min track tint | System accent or artwork color | Same |

### Volume Slider

- Similar interaction pattern to the scrubber but always shows a small indicator dot.
- On the lock screen, the volume slider uses the Liquid Glass material and was
  further refined in iOS 26.2 with a new Liquid Glass slider for the clock/system.

### CSS Implementation Notes (for Jwift SimpleSlider)

The thumbless-to-thumb transition maps well to CSS:
- Idle: `height: 4px`, `border-radius: 2px`, thumb `opacity: 0` + `scale(0.5)`
- Active: `height: 10px`, `border-radius: 5px`, thumb `opacity: 1` + `scale(1)`
- Use CSS `transition` with spring-like cubic-bezier for the expansion
- The fill uses a linear gradient or percentage-based background-size

---

## 6. Control Center Media Module

### Layout

The Control Center media controls tile is one of the larger modules in the
redesigned Control Center. It uses the same Liquid Glass material as other
CC tiles but with album art integration.

```
+----------------------------------+
|  [album art]  Track Title        |
|              Artist Name         |
|  [===------] scrubber            |
|  [<<]  [play/pause]  [>>]       |
+----------------------------------+
```

### Visual Refinements

- In iOS 26 beta 2, Apple increased the **opacity of CC buttons** and added more
  background blur, moving from very translucent to a **frosted glass** look.
  Buttons are darker and more opaque for better readability.
- The CC buttons use `backdrop-filter: blur()` with higher opacity values than
  the initial beta.
- Background is more heavily blurred than standard Liquid Glass to maintain
  contrast against the wallpaper.

### Accessibility

- **Reduce Transparency** setting: Adds a darker solid background behind
  translucent areas including CC, improving contrast. The Liquid Glass effect
  is significantly muted.
- Contrast requirements now account for Liquid Glass background variability
  rather than assuming solid color backgrounds.

---

## 7. Video Player Controls (Apple TV App, tvOS 26)

The video player received one of the clearest benefits from Liquid Glass.

### Design Philosophy

The video player controls are **fully transparent Liquid Glass overlays** that
float above the video content. Unlike the old opaque/semi-opaque control bars,
the Liquid Glass controls let you see the video through the controls, so you
don't miss any content when they appear.

### Layout (tvOS / Apple TV app on iOS)

```
+------------------------------------------+
|                                          |
|              VIDEO CONTENT               |
|                                          |
|  +------------------------------------+  |
|  | [<<10s]  [play/pause]  [>>10s]     |  |
|  | [============================----] |  |  <- scrubber
|  | 1:23:45                   2:15:00  |  |
|  +------------------------------------+  |
|                                          |
|  [subs]  [audio]  [airplay]  [pip]       |
+------------------------------------------+
```

- Controls fade in/out with the Liquid Glass material animating its opacity.
- The scrubber bar in video uses the same thumbless-to-thumb interaction as Music.
- Button icons: SF Symbols, rendered at the standard 44 pt touch target.
- tvOS uses the Siri Remote's touch surface for scrubbing; the on-screen
  scrubber responds with fluid Liquid Glass animation.

### Podcasts App Player

- Same Liquid Glass treatment as Music for the now playing view.
- Additional controls: playback speed (`0.5x` to `3x`), Enhance Dialogue toggle.
- Playback speed uses a **dial interaction**: tap a preset, or drag across presets
  to invoke a fine-grained 0.1x adjustment dial.
- Per-show settings are remembered (speed + Enhance Dialogue) independently.
- In iOS 26.4, video podcasts show a "Turn Video On" button near the progress bar.

---

## 8. Animation and Transitions

### Key Animations

| Animation | Curve | Duration (est.) | Context |
|---|---|---|---|
| Mini player -> full screen | Spring (bouncy) | ~500 ms | Zoom transition from accessory to full view |
| Tab bar collapse | Spring | ~350 ms | Mini player slides inline with minimized tab bar |
| Scrubber expand on touch | Spring (bouncy) | ~200 ms | Track height 4pt -> 10pt, thumb fades in |
| Scrubber release | Spring | ~300 ms | Returns to idle |
| Album art expand (lock screen) | Spring | ~400 ms | Tapping artwork goes full-screen |
| Control fade in/out (video) | Ease in-out | ~250 ms | Video player controls appear/dismiss |
| Glass element merge/morph | Spring | ~300 ms | Elements closer than spacing threshold blend together like water droplets |
| Button press | Spring (bouncy) | ~150 ms | Scale down + shimmer + touch-point illumination |
| Track change swipe (mini player) | Spring | ~300 ms | Liquid Glass morphing + haptic tap on complete |

### Liquid Glass Interactive Behaviors

When `.interactive()` is applied to a glass element:
- **Scale on press**: Subtle scale-down (~0.95)
- **Bounce on release**: Spring overshoot back to 1.0
- **Shimmer**: Specular highlight sweeps across the glass surface
- **Touch-point illumination**: Light radiates from the touch point to nearby glass elements
- **Drag response**: Glass deforms subtly following the finger

### Spring Animation Parameters

Apple's `.bouncy` spring curve (used throughout iOS 26) corresponds approximately to:
- Damping ratio: ~0.7
- Response: ~0.5 s
- For CSS: `cubic-bezier(0.34, 1.56, 0.64, 1)` is a reasonable approximation for
  the overshoot, or use the CSS `linear()` function for a more accurate spring curve.

---

## 9. Typography Reference

All media player text uses the San Francisco typeface family.

| Element | Font | Weight | Size (pt) | Style |
|---|---|---|---|---|
| Track title (full screen) | SF Pro Display | Semibold | ~21 | Title 3 |
| Artist name (full screen) | SF Pro Text | Regular | ~17 | Body, secondary color |
| Track title (mini player) | SF Pro Text | Medium | ~15 | Subheadline |
| Artist name (mini player) | SF Pro Text | Regular | ~13 | Caption, secondary color |
| Timestamps | SF Pro Text | Regular | ~13 | Caption, tertiary color |
| CC track title | SF Pro Text | Medium | ~15 | Subheadline |
| CC artist name | SF Pro Text | Regular | ~13 | Caption |
| Section headers | SF Pro Display | Bold | ~13-15 | Small caps feel, slightly transparent (~0.85 opacity) |

SF Pro Display is used at 20 pt and above; SF Pro Text for body and smaller.
Lock screen clock numerals in iOS 26 use a separate variable numeral font
that is boxier, similar to SF Compact.

---

## 10. Color and Theming

### Artwork-Derived Colors

The Now Playing view samples the album artwork and derives:
- **Primary background tint**: Dominant color from artwork, applied at low opacity
  behind the entire player
- **Accent color**: Used for the scrubber fill, active button tints
- **Secondary tint**: Complementary to artwork, used for subtle gradients

When viewing an album or playlist, the track list background adopts a color
that "pairs well with and evokes the artwork" -- not always an exact match.

### System Colors in Controls

- Play/pause, skip icons: Primary label color (white in dark mode)
- Secondary actions (shuffle, repeat, queue): Secondary label color (~60% opacity)
- Active state (shuffle on, repeat on): System accent color (typically blue)
- Disabled state: Tertiary label color (~30% opacity)

---

## 11. Dimensions Summary (iPhone, Portrait)

These are estimated values based on API documentation, screenshots, and the
iOS 26 design system tokens. Exact values may vary by device.

| Element | Dimension |
|---|---|
| Full-screen artwork width | Screen width - 2 * ~20 pt padding |
| Full-screen artwork corner radius | Concentric with screen: ~38-42 pt |
| Mini player (expanded) height | ~56-64 pt |
| Mini player (inline) height | ~36-40 pt |
| Mini player artwork thumbnail | ~40 pt (expanded), ~28 pt (inline) |
| Tab bar height (expanded) | ~49 pt (standard) |
| Tab bar height (minimized) | ~36 pt |
| Scrubber track height (idle) | ~4 pt |
| Scrubber track height (active) | ~10-12 pt |
| Scrubber thumb diameter | ~28 pt |
| Play/pause button touch target | ~56 pt |
| Skip button touch target | ~44 pt |
| Secondary button touch target | ~36 pt |
| Control Center tile corner radius | ~22-24 pt |
| Lock screen control bar | Full width with ~16 pt horizontal padding |
| Page edge padding | ~16-20 pt |

---

## 12. WWDC25 Sessions (Reference)

Relevant sessions for deeper implementation reference:

| Session | ID | Focus |
|---|---|---|
| Meet Liquid Glass | 219 | Core material, properties, philosophy |
| Get to know the new design system | 356 | Design tokens, shapes, spacing, concentric radii |
| Build a SwiftUI app with the new design | 323 | Tab bar accessory, mini player pattern, Liquid Glass modifiers |
| Build a UIKit app with the new design | 284 | UIKit Liquid Glass APIs, tab bar controller accessory |
| Design foundations from idea to interface | 359 | Design principles, visual hierarchy |

### Key API Concepts for Jwift Translation

- **`GlassEffectContainer(spacing:)`**: Groups glass elements; when closer than
  the spacing threshold, they morph/merge like water droplets. Default spacing
  is system-defined; custom values like 16, 30, 40 pt are common.
- **`.glassEffect(.regular)`**: Standard glass. `.clear` for high transparency
  (media-rich backgrounds). `.identity` for no effect.
- **`.glassEffect(in: .rect(cornerRadius: 16))`**: Fixed corner radius.
- **`.glassEffect(in: .capsule)`**: Capsule shape (default for buttons).
- **`.glassEffect(in: .rect(cornerRadius: .containerConcentric))`**: Concentric
  radius derived from parent -- matches Jwift's concentric radius system exactly.
- **`.interactive()`**: Adds press/shimmer/illumination behaviors (iOS only).
- **`tabViewBottomAccessory`**: Places a view (mini player) above the tab bar,
  with automatic Liquid Glass styling and expanded/inline state transitions.

---

## 13. Implementation Mapping to Jwift

| Apple Concept | Jwift Equivalent | Status |
|---|---|---|
| Liquid Glass material | `LiquidGlass` class / `Material.scss` | Exists |
| Solid Glass material | `Material/Glass/Solid/Material.scss` | Exists |
| Concentric radii | Box `--border-radius` system | Exists |
| Capsule buttons | `GlassButton.Component.ts` | Exists |
| Tab bar with accessory | `TabBar.Component.ts` | Needs accessory slot |
| Mini player bar | -- | **Needs component** |
| Now Playing full screen | -- | **Needs component** |
| Thumbless slider | `SimpleSlider.Component.ts` | Needs thumbless mode |
| Scrubber (media timeline) | -- | **Needs component** (extends SimpleSlider) |
| Interactive glass behavior | -- | **Needs directive** (press/shimmer/glow) |
| Album artwork color sampling | -- | **Needs service** (canvas color extraction) |
| Spring animations | Physical library / Jiv | Exists (partially) |
| Glass element merging | -- | **Not feasible in CSS** (would need JS proximity detection) |

### Priority Components for Media Player

1. **MediaScrubber** -- Thumbless idle state, expanding active state, fine-scrub interaction
2. **MiniPlayer** -- Tab bar accessory with expanded/inline states
3. **NowPlaying** -- Full-screen player view with artwork-derived theming
4. **InteractiveGlass directive** -- Press scale, shimmer, touch-point illumination

---

## Sources

- [Apple newsroom: iOS 26 design](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Apple newsroom: iOS 26 features](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/)
- [9to5Mac: Apple Music lock screen](https://9to5mac.com/2025/06/11/apple-music-brings-your-lock-screen-to-life-with-new-ios-26-look/)
- [9to5Mac: iOS 26.1 mini player swipe](https://9to5mac.com/2025/11/04/ios-26-1-gave-apple-music-convenient-new-trick/)
- [9to5Mac: Apple TV app redesign](https://9to5mac.com/2025/07/16/apples-tv-app-gets-fresh-design-in-ios-26-and-tvos-26-heres-whats-new/)
- [9to5Mac: Apple Music iOS 26.4](https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/)
- [MacRumors: iOS 26 Music features](https://www.macrumors.com/guide/ios-26-music/)
- [MacRumors: iOS 26 lock screen](https://www.macrumors.com/2025/09/16/ios-26-whats-new-iphone-lock-screen/)
- [MacRumors: Animated album art](https://www.macrumors.com/2025/06/11/ios-26-animated-lock-screen-album-art/)
- [MacRumors: iOS 26 Podcasts](https://www.macrumors.com/guide/ios-26-podcasts/)
- [MacRumors: iOS 26.2 Liquid Glass slider](https://www.macrumors.com/2025/11/04/ios-26-2-liquid-glass-slider/)
- [AppleInsider: Control Center](https://appleinsider.com/inside/ios-26/tips/inside-ios-26-control-center----fast-access-to-the-best-iphone-features)
- [AppleInsider: Apple Music lock screen depth](https://appleinsider.com/articles/25/06/11/apple-music-ios-26-update-brings-motion-color-depth-to-the-iphone-lock-screen)
- [AppleInsider: tvOS 26 redesign](https://appleinsider.com/articles/25/06/18/tvos-26-hands-on-sleek-liquid-glass-redesign-new-control-center-and-more)
- [Apple Developer: Meet Liquid Glass (WWDC25-219)](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Apple Developer: Get to know the new design system (WWDC25-356)](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Apple Developer: Build a SwiftUI app with the new design (WWDC25-323)](https://developer.apple.com/videos/play/wwdc2025/323/)
- [Apple Developer: Build a UIKit app with the new design (WWDC25-284)](https://developer.apple.com/videos/play/wwdc2025/284/)
- [Donny Wals: Custom UI with Liquid Glass](https://www.donnywals.com/designing-custom-ui-with-liquid-glass-on-ios-26/)
- [Donny Wals: Tab bars with Liquid Glass](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- [Natasha The Robot: Liquid Glass button anatomy](https://www.natashatherobot.com/p/liquidglass-button-ios-26)
- [Conor Luddy: Liquid Glass Reference (GitHub)](https://github.com/conorluddy/LiquidGlassReference)
- [DEV Community: Liquid Glass CSS recreation](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)
- [CSS-Tricks: Liquid Glass clarity](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Hacking with Swift: TabView accessory](https://www.hackingwithswift.com/quick-start/swiftui/how-to-add-a-tabview-accessory)
- [DEV Community: WWDC 2025 Liquid Glass Design System](https://dev.to/arshtechpro/wwdc-2025-apples-liquid-glass-design-system-52an)
- [Medium: Liquid Glass comprehensive reference](https://medium.com/@madebyluddy/overview-37b3685227aa)
- [Medium: iOS 26 Liquid Glass Design](https://medium.com/codex/liquid-glass-design-5e57f5faddc3)
- [Figma: iOS 26 Control Center UI Kit](https://www.figma.com/community/file/1515608601108987500/apple-liquid-glass-ios-26-control-center-ui-kit)
- [Figma: iOS 26 Glass Slider UI Animation](https://www.figma.com/community/file/1529182774437992047/ios-26-glass-slider-ui-animation)
- [Apple Podcasters: iOS 26 what's new](https://podcasters.apple.com/support/5549-iOS-26-whats-new-for-apple-podcasts)
