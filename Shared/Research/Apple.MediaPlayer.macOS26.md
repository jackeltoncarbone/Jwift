# macOS 26 (Tahoe) Media Player and Audio/Video Controls

Research compiled April 2026 for web component library reference.
Companion to `ipados-26-media-player.md` which covers iOS/iPadOS specifics.

---

## 1. Apple Music -- The Floating Bottom Player Bar

### The Big Layout Change

macOS Tahoe moved the Music app's playback controls from the top of the window (where they lived since iTunes) to a **floating Liquid Glass bar anchored to the bottom** of the window. This bar overlaps the track list beneath it, using Liquid Glass transparency so the content is visible (though partially obscured) behind the controls.

### Bottom Bar Anatomy

The floating bottom bar contains, from left to right:

1. **Album art thumbnail** -- small square, approximately 40-48pt, with concentric corner radius matching the bar's own radius minus the internal padding.
2. **Track info** -- song title (primary weight, ~13pt system font) and artist name (secondary weight, slightly lower opacity, ~11pt) stacked vertically.
3. **Progress/scrubber bar** -- a thin horizontal track that spans the remaining width of the control cluster. Uses the Liquid Glass thumbless style during passive playback (no visible thumb knob -- just a filled portion of the track). When the user hovers or begins dragging, the thumb appears as a small Liquid Glass circle (approximately 12-16pt diameter) with the characteristic refraction highlight.
4. **Time displays** -- elapsed time on the left of the scrubber, remaining time (prefixed with `-`) on the right. Monospaced tabular figures, small size (~10pt), reduced opacity (~0.6). Format: `M:SS` for tracks under 10 minutes, `H:MM:SS` for longer content.
5. **Transport controls** -- skip back, play/pause, skip forward. Play/pause is the largest button (~28pt touch target). Skip buttons use SF Symbols `backward.fill` / `forward.fill` at ~20pt. All three are centered as a group.
6. **Volume icon** -- a single speaker icon that reveals a Liquid Glass volume slider on click (volume is no longer permanently visible; it is behind an extra interaction).

### Glass Material on the Bar

- The bar uses **Liquid Glass** because it floats over scrolling content (track lists, album grids).
- It is **semi-transparent** with backdrop blur. The background content tints the bar subtly.
- The bar has a **luminous border** (the thin bright edge typical of Liquid Glass elements) and a soft drop shadow.
- In the "Clear" Liquid Glass variant (default), the bar is highly transparent. In the "Tinted" variant (user preference in System Settings), it gains additional opacity and a slight color tint for readability.

### Bar Sizing and Positioning

- The bar is **window-relative** (not screen-relative). It floats at the bottom of the Music app window frame.
- Horizontal padding: approximately 16pt from the window edges.
- Bottom offset: approximately 12-16pt from the window's bottom edge.
- Height: approximately 64-72pt (including internal padding).
- Corner radius: large pill shape (approximately 16-20pt), consistent with macOS Tahoe's system-level floating bars.
- The bar has a **max-width** -- on very wide windows it does not stretch edge to edge but centers itself, similar to the iOS behavior (max ~600pt).

---

## 2. Full-Screen Now Playing View

### Activation

Double-clicking the album art thumbnail or using a dedicated expand control transitions from the bottom bar to a full Now Playing view. This mirrors the iOS MiniPlayer-to-fullscreen expansion.

### Layout

The full Now Playing view uses the same design language as iOS 26:

- **Album art** dominates the upper portion, large and centered.
- **Dynamic color extraction**: the background fills with colors sampled from the artwork. Not a glass effect -- a solid extracted palette fill, consistent with the rule that page content backgrounds are NOT glass.
- **Controls cluster**: centered horizontally beneath the album art, with the same max-width constraint (~500pt).
- **Scrubber**: full-width within the control cluster. Liquid Glass track with a Liquid Glass thumb knob. Elapsed and remaining time flanking the track.
- **Transport row**: shuffle, skip back, play/pause (larger, ~44pt), skip forward, repeat. Centered.
- **Volume slider**: below transport. Full Liquid Glass treatment.
- **Ancillary row**: lyrics, AirPlay, queue, share. Smaller icons (~18-20pt), arranged horizontally, centered.

### Glass Usage

- The **controls themselves** (buttons, slider thumb, scrubber thumb) use Liquid Glass because they overlay the album art / animated artwork.
- The **background** behind the controls is NOT glass -- it is the solid color-extracted fill from the artwork.
- If animated album art is playing, the controls sit on a Liquid Glass platter (a contained glass panel) that provides enough contrast to keep them visible over moving imagery.

---

## 3. Menu Bar Now Playing Widget

### Appearance

macOS 26 makes the menu bar **fully transparent** by default -- it is no longer a distinct opaque strip. The Now Playing indicator appears as a small control in the menu bar's right-hand system tray area (near the clock, Wi-Fi, Control Center icons).

### Widget Design

- When music is playing, a small **waveform animation icon** or **album art micro-thumbnail** appears in the menu bar.
- Clicking it reveals a **dropdown panel** rendered in Liquid Glass. This panel shows:
  - Album art (medium size, ~80pt square).
  - Track title and artist.
  - A compact scrubber/progress bar (thin, Liquid Glass, thumbless in default state).
  - Transport controls: skip back, play/pause, skip forward.
  - Volume slider.
  - AirPlay output picker.
- The dropdown panel uses the **same Liquid Glass material** as other menu bar dropdowns in macOS 26.
- Corner radius follows the concentric system: the dropdown's radius is derived from the menu bar's own radius conventions.

### Behavior

- The widget updates in real time (track title, progress).
- It works for any app using `MPNowPlayingInfoCenter` -- not just Apple Music. Spotify, podcasts, Safari video, etc. all populate this widget.

---

## 4. Control Center Media Tile

### Grid System

macOS 26 brings the iOS-style customizable Control Center to the Mac. Tiles can be sized Small, Medium, or Large. The Now Playing tile is available in all three sizes:

- **Small**: just play/pause button.
- **Medium**: album art thumbnail, track title/artist, play/pause, skip forward/back.
- **Large**: album art, full track info, scrubber, transport controls, volume slider, AirPlay button.

### Visual Treatment

- All Control Center tiles use **Liquid Glass** (the entire Control Center is an overlay surface).
- The Now Playing tile can be **resized** by dragging its bottom-right corner handle in edit mode. The handle is a small curved Liquid Glass drag indicator.
- Tiles have the standard Liquid Glass luminous border and backdrop blur.

### Expanded View

Clicking or expanding the Now Playing tile beyond its grid bounds opens a larger panel with the complete set of media controls. This is functionally similar to the Lock Screen Now Playing on iOS.

---

## 5. QuickTime Player / TV App Video Controls

### Floating Transparent Overlay

Video playback controls in macOS 26 follow the same pattern as iOS 26:

- Controls are **Liquid Glass overlays** that float above the video content.
- They are **fully transparent**, letting the video show through behind them. This is the single biggest change from the previous opaque-black-bar treatment.
- Controls **auto-hide** after a few seconds of no mouse movement, then reappear on mouse move.
- The fade-in/fade-out uses a Liquid Glass material dissolve animation (not just opacity fade).

### Control Layout (QuickTime / TV App)

When visible, the video overlay contains:

- **Top bar**: window title, close/minimize/fullscreen buttons (traffic lights). These may use Liquid Glass treatment in fullscreen mode.
- **Center overlay**: large play/pause button, skip forward/back (±10 or ±15 seconds). These are circular Liquid Glass buttons.
- **Bottom bar**: a floating Liquid Glass pill containing:
  - Progress scrubber (thin track, Liquid Glass thumb on hover/drag, thumbless at rest).
  - Elapsed time / remaining time displays.
  - Volume control.
  - AirPlay icon.
  - Fullscreen toggle.
  - Picture-in-Picture button.
  - Subtitle/caption toggle.

### Scrubber Behavior

- At rest: the scrubber appears as a **thin line** (approximately 3-4pt height) with a filled portion indicating progress. No visible thumb. This is the "thumbless slider" style Apple introduced in the Liquid Glass design system.
- On hover: the track **expands slightly** (to ~6pt) and a small Liquid Glass thumb knob appears at the playback position.
- On drag: the thumb enlarges slightly with a spring animation. A **preview thumbnail** may appear above the scrubber (in TV app for video content; not in QuickTime for all file types).
- The filled portion of the track uses a subtle Liquid Glass tint that picks up colors from the video content below it.

---

## 6. Safari Video Player Overlay

### Design Philosophy

Safari's built-in video player (`<video>` element with default controls) adopts the same Liquid Glass floating overlay pattern as native apps. The controls float transparently over the video.

### Control Set

- Progress scrubber (thumbless at rest, Liquid Glass thumb on interaction).
- Play/pause.
- Volume slider.
- Elapsed / remaining time.
- AirPlay.
- Picture-in-Picture button.
- Fullscreen button.

### Styling Notes

- The controls are rendered by the **WebKit media controls shadow DOM**. Web developers cannot directly style these with CSS -- they are system-provided.
- The Liquid Glass treatment means the controls **tint based on the video content** behind them, which creates a more integrated look than the previous opaque controls.
- Safari's address bar and tab bar also use Liquid Glass in macOS 26, so the entire browser chrome is consistent with the video controls.

---

## 7. Picture-in-Picture Controls

### PiP Window

- Rounded rectangle window with a **large corner radius** (~16pt), consistent with macOS Tahoe's window styling.
- A subtle **drop shadow** around the window.
- The window is **always on top** of other content.

### PiP Overlay Controls

When the user hovers over the PiP window:

- **Play/pause** button centered.
- **Skip forward/back** buttons flanking play/pause.
- **Close PiP** button (return to app).
- **Expand** button (return to the originating player).
- These controls use Liquid Glass as transparent overlays on the video.
- They auto-hide when the mouse leaves the PiP window.

### PiP Resize

- The PiP window can be resized by dragging any corner.
- It snaps to screen corners/edges.
- Controls scale proportionally with the window size, maintaining minimum touch targets.

---

## 8. Slider, Scrubber, and Progress Bar Design Language

This section synthesizes the Liquid Glass slider design across all media contexts on macOS 26.

### The Thumbless Slider (Default / At-Rest State)

Apple introduced a **thumbless slider style** specifically for media playback contexts. The purpose is to avoid distracting the user with a large thumb while media is playing passively.

- **Track height**: approximately 3-4pt. Thin, unobtrusive.
- **Filled portion**: extends from the leading edge to the current position. Uses a Liquid Glass fill that subtly refracts/tints from the surface beneath it.
- **Unfilled portion**: same height but lower opacity / more transparent.
- **No thumb knob visible** when the user is not interacting.

### Interactive State (Hover / Drag)

- On **hover**: the track expands slightly in height (to ~6pt) with a spring animation. A **small circular Liquid Glass thumb** appears at the playback position (~12-14pt diameter).
- On **drag start**: the thumb scales up slightly (to ~16-18pt) with momentum. The Liquid Glass thumb displays the characteristic specular highlight and refraction.
- On **drag release**: the thumb shrinks back, then fades out to return to the thumbless state after a brief delay.

### Explicit Slider State (Volume, Seek Confirmation)

For sliders that are always interactive (like the volume slider in the full Now Playing view), the thumb is **always visible** as a Liquid Glass circle, but remains small and unobtrusive:

- **Track height**: ~4-6pt.
- **Thumb diameter**: ~14-16pt.
- **Thumb material**: Liquid Glass with specular highlight. Refracts the background behind it.
- **Track fill**: Liquid Glass tinted fill from the leading edge to the thumb position.

### Tick Marks (Non-Media Context)

Sliders initialized with discrete steps automatically display **tick marks**. This is used for playback speed selectors (0.5x, 1x, 1.5x, 2x) where the slider snaps to defined values. The tick marks are small dots or dashes along the track.

### Neutral Value (Bidirectional Fill)

Sliders can start their track fill from a **neutral point** rather than the leading edge. This is used for:

- Playback speed (neutral = 1x, fill extends left for slower, right for faster).
- Audio balance/pan controls.
- EQ adjustments.

### Rounded End Caps

All slider tracks have **rounded end caps** (pill-shaped track). The cap radius equals half the track height, creating a smooth capsule shape.

---

## 9. Button Sizes and Shapes

### Transport Controls (Play/Pause, Skip)

| Control | Icon Size | Hit Target | Shape | Material |
|---------|-----------|------------|-------|----------|
| Play/Pause (full Now Playing) | ~24-28pt | ~44pt | Circle | Liquid Glass |
| Play/Pause (bottom bar) | ~20-24pt | ~36pt | Circle | Liquid Glass |
| Play/Pause (PiP overlay) | ~20pt | ~36pt | Circle | Liquid Glass |
| Skip Forward/Back | ~18-20pt | ~36pt | Circle | Liquid Glass |
| Shuffle/Repeat | ~16-18pt | ~32pt | Rounded rect | Liquid Glass (highlighted when active) |

### Ancillary Controls (AirPlay, Queue, Lyrics, Share)

| Control | Icon Size | Hit Target | Shape | Material |
|---------|-----------|------------|-------|----------|
| AirPlay | ~16-18pt | ~32pt | Circle | Liquid Glass |
| Queue | ~16-18pt | ~32pt | Circle | Liquid Glass |
| Lyrics | ~16-18pt | ~32pt | Circle | Liquid Glass |
| Share | ~16-18pt | ~32pt | Circle | Liquid Glass |

### Icon Treatment

- All icons use **SF Symbols** with the `.fill` variant for active/primary controls and the `.regular` variant for secondary controls.
- Active state (e.g., shuffle is on): the Liquid Glass button gains a **subtle filled tint** (usually white at reduced opacity in dark mode, or a system accent color).
- Hover state: the Liquid Glass material brightens with a specular highlight shift.
- Press state: the button scales down slightly (~0.95) with a spring animation, and the glass material darkens briefly.

---

## 10. Spacing and Layout Rules

### Horizontal Spacing

- **Between transport controls** (skip back, play/pause, skip forward): approximately 24-32pt.
- **Between ancillary controls**: approximately 16-20pt.
- **Between the scrubber and transport row**: approximately 12-16pt vertical.
- **Between transport row and volume slider**: approximately 8-12pt vertical.
- **Between volume slider and ancillary row**: approximately 12-16pt vertical.

### Control Cluster Constraints

- **Max-width**: approximately 500-600pt. Controls never stretch beyond this on wide screens.
- **Horizontal alignment**: always **centered** within the container. Never left-aligned, never justified/spread.
- **Padding within the floating bar**: approximately 12-16pt on all sides.

### Concentric Radius Application

Following the concentric radius system:

- **Floating bottom bar**: outer radius ~16-20pt (pill shape).
- **Album art thumbnail inside the bar**: radius = bar radius - internal padding gap. If bar radius is 18pt and padding is 8pt, thumbnail radius is ~10pt.
- **Buttons inside the bar**: radius = circular (fully rounded), derived from their size.
- **Scrubber track inside the bar**: radius = half the track height (capsule).

---

## 11. Two Liquid Glass Variants

macOS 26 offers two system-wide Liquid Glass styles. The user chooses in System Settings > Appearance:

### Clear (Default)

- Highly transparent. Maximum refraction and backdrop blur.
- Controls pick up the full color of the content behind them.
- Best with dark or moderately colored backgrounds.
- Can be harder to read on very busy/bright backgrounds.

### Tinted

- Adds a translucent tint layer behind the glass elements.
- Notifications, controls, and floating panels gain additional opacity.
- Text becomes easier to read.
- Reduces the "see-through" effect while maintaining the glass shape language.

### Reduce Transparency (Accessibility)

- System Settings > Accessibility > Display > Reduce Transparency.
- Makes all Liquid Glass elements **opaque** or near-opaque.
- In the Music app, this reverts the bottom bar to an opaque surface. It also moves the controls back to the top of the window (restoring the pre-Tahoe layout), which is a notable behavior.

---

## 12. Implementation Notes for Web Components

### What to Replicate

1. **Floating bottom player bar** with `backdrop-filter: blur()` and a subtle `background: rgba(255,255,255,0.12)` (dark mode) or `rgba(0,0,0,0.06)` (light mode). Add a luminous `box-shadow` for the glass border effect.

2. **Thumbless scrubber at rest** using a thin `<input type="range">` with the thumb hidden via `::-webkit-slider-thumb { opacity: 0; }`, replaced by a CSS pseudo-element that appears on `:hover` and `:active`.

3. **Expanding track height on hover** with a CSS transition: `height: 3px` at rest, `height: 6px` on hover, with `transition: height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like).

4. **Centered, max-width control cluster** using `max-width: 600px; margin: 0 auto;`.

5. **Concentric corner radii** on nested elements. Use CSS custom properties: `--bar-radius: 18px; --thumbnail-radius: calc(var(--bar-radius) - var(--bar-padding));`.

6. **Time display formatting**: monospaced tabular figures with `font-variant-numeric: tabular-nums;`. Format as `M:SS` (no leading zero on minutes). Remaining time prefixed with `-`.

7. **Button press animation**: `transform: scale(0.95)` on `:active` with a spring-like `transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)`.

8. **Auto-hiding video controls**: fade controls out after 3 seconds of no mouse movement using a timeout and opacity transition.

9. **Volume behind a click**: show a small Liquid Glass volume popover on click of the speaker icon, rather than an always-visible slider.

### CSS Glass Material Recipe

```css
.PlayerBar {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.2),   /* luminous inner border */
    0 8px 32px rgba(0, 0, 0, 0.3);            /* drop shadow */
  border-radius: var(--bar-radius, 18px);
}

.PlayerBar__Thumb {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 14px;
  height: 14px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.PlayerBar__Thumb:active {
  transform: scale(1.25);
}

.PlayerBar__Track {
  height: 3px;
  border-radius: 1.5px;
  background: rgba(255, 255, 255, 0.15);
  transition: height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.PlayerBar__Track:hover {
  height: 6px;
  border-radius: 3px;
}
```

### What NOT to Replicate

- The refraction/lensing effect (requires GPU shaders not available in CSS; `backdrop-filter: blur()` is the closest approximation).
- Animated album art (requires artist-provided assets).
- System-level PiP window management.
- Menu bar integration (OS-level; provide an in-app equivalent instead).

---

## Sources

- [Apple introduces a delightful and elegant new software design - Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Apple Music iOS 26 update brings motion, color, and depth - AppleInsider](https://appleinsider.com/articles/25/06/11/apple-music-ios-26-update-brings-motion-color-depth-to-the-iphone-lock-screen)
- [Apple Music iOS 26 vs iOS 18 - AppleInsider](https://appleinsider.com/inside/apple-music/vs/apple-music-ios-26-vs-ios-18-automix-liquid-glass-and-lyrics-in-your-language)
- [Apple Music in iOS 26.4 new design - 9to5Mac](https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/)
- [iOS 26.1 Apple Music swipe gesture - 9to5Mac](https://9to5mac.com/2025/11/04/ios-26-1-gave-apple-music-convenient-new-trick/)
- [macOS Tahoe Music app controls at bottom - Apple Community](https://discussions.apple.com/thread/256137017)
- [Music control moved - MacRumors Forums](https://forums.macrumors.com/threads/music-control-moved.2469823/)
- [Apple Music on macOS Tahoe is a mess - MacObserver](https://www.macobserver.com/news/apple-music-on-macos-tahoe-is-a-mess-and-users-have-had-enough/)
- [Notable User Interface Changes in macOS 26 - MacForce](https://www.macforce.com/blog/notable-user-interface-changes-to-expect-in-macos-26)
- [How Safari puts content first with Liquid Glass - AppleInsider](https://appleinsider.com/articles/25/06/18/how-safari-in-ios-26-macos-26-puts-content-first-with-liquid-glass-ui-changes)
- [Meet Liquid Glass - WWDC25 - Apple Developer](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Build an AppKit app with the new design - WWDC25 - Apple Developer](https://developer.apple.com/videos/play/wwdc2025/310/)
- [Build a SwiftUI app with the new design - WWDC25 - Apple Developer](https://developer.apple.com/videos/play/wwdc2025/323/)
- [Get to know the new design system - WWDC25 - Apple Developer](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Applying Liquid Glass to custom views - Apple Developer Documentation](https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views)
- [Getting Clarity on Apple's Liquid Glass - CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [WWDC 2025: Apple's Liquid Glass Design System - DEV Community](https://dev.to/arshtechpro/wwdc-2025-apples-liquid-glass-design-system-52an)
- [How to customize Mac's Control Center in macOS Tahoe - iDownloadBlog](https://www.idownloadblog.com/2025/06/27/customize-mac-control-center/)
- [Liquid Glass Figma Control Center macOS 26 - Figma Community](https://www.figma.com/community/file/1515113236376349942/apple-liquid-glass-ui-control-center-macos-26-apple-wwdc-2025)
- [macOS 26 got a makeover - CreativeTechs](https://www.creativetechs.com/2025/10/03/macos-26-got-a-makeoverheres-what-youll-actually-notice/)
- [Liquid Glass - Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)
- [iOS 26 Liquid Glass in SwiftUI reference - GitHub](https://github.com/conorluddy/LiquidGlassReference)
