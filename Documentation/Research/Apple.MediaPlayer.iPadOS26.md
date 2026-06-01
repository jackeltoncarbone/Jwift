# iPadOS 26 Media Player Patterns

Research compiled April 2026 for web component library reference.

---

## 1. Apple Music Full-Screen Now Playing

### Layout and Visual Treatment

The Now Playing screen in iOS/iPadOS 26 uses album artwork as the dominant visual element. In iOS 26.4, Apple introduced a true fullscreen design for albums and playlists where the artwork colors bleed into the entire background. The system performs dynamic color extraction from album art: a predominantly blue album produces a blue-tinted background; black/gray artwork gets a dark background. Foreground text is always white or black depending on contrast needs.

Controls float above this colored surface using Liquid Glass material. They are translucent, refracting the colors beneath them, which means the play/pause, skip, and scrubber controls subtly pick up the album's palette without explicit theming.

### Controls Architecture

- **Scrubber/progress bar**: A horizontal track with a Liquid Glass knob. Scrubbing is limited to the progress bar itself (iOS removed the old full-screen drag-to-scrub gesture back in iOS 17 and has not restored it).
- **Transport controls**: Play/pause, skip forward/back, centered horizontally beneath the album art.
- **Volume slider**: Below transport controls, same Liquid Glass treatment.
- **Ancillary controls**: AirPlay output picker, queue button, lyrics button, share -- arranged in a row beneath the volume slider.
- **Animated album art**: Tapping the album art on the Lock Screen expands it full-screen with artist-designed animations playing in real time. Controls remain visible as a Liquid Glass overlay on top of the animation.

### Portrait vs Landscape on iPad

- **Portrait**: Tab bar appears at the bottom for navigation. The Now Playing screen is a full-height modal with album art centered in the upper portion and controls in the lower third.
- **Landscape**: Sidebar replaces the tab bar on the left. The Now Playing screen can use the additional width but the control cluster remains centered, not stretched. Album art sits to the left of center with controls to the right in a two-column layout on larger iPads.

---

## 2. MiniPlayer (Floating Now Playing Bar)

### Design

The MiniPlayer is a pill-shaped Liquid Glass bar that floats above the tab bar (or sidebar edge in landscape). It shows the current track's artwork thumbnail, title, artist, and a play/pause button. When the user scrolls content, the MiniPlayer can truncate and slide into the gap next to the tab bar to save space.

### Gestures (added in iOS 26.1)

- **Swipe left** on the MiniPlayer: advance to next track.
- **Swipe right** on the MiniPlayer: go back to previous track.
- **Tap**: expand to the full Now Playing view.
- Each swipe triggers haptic feedback and a Liquid Glass ripple animation that reinforces the track change.

### iPad-Specific Behavior

The MiniPlayer works identically in both standard full-screen app mode and windowed app mode. In windowed mode, it remains anchored to the bottom of the Music app's window frame, not to the screen edge. This is important for component design: the MiniPlayer is window-relative, not viewport-relative.

---

## 3. Video Player Controls (Safari, TV App)

### Liquid Glass Floating Controls

Video player controls in iOS/iPadOS 26 are fully transparent Liquid Glass overlays that float above the video content. This is one of the biggest beneficiaries of the new design language -- when watching a show or movie, the translucent controls let you see the content behind them rather than obscuring it with an opaque black bar.

### TV App Redesign

The Apple TV app received a full Liquid Glass redesign in iOS 26 and tvOS 26. Transparent controls float over videos during playback. The design emphasizes immersion by making the chrome nearly invisible when not actively interacted with.

### Safari Video Player

Safari's video controls follow the same system-level Liquid Glass treatment. The tab bar floats above the webpage and automatically shrinks when scrolling to minimize distraction. Video fullscreen controls use the same floating transparent pattern.

### Control Visibility

Apple added an accessibility toggle in iOS 26.1 (Settings > Accessibility > Display > Reduce Transparency) that makes Liquid Glass controls more opaque for users who find the transparency problematic. The controls were also made slightly more opaque by default in iOS 26 beta 2 after feedback that they were too hard to see on busy backgrounds.

---

## 4. Control Center Now Playing

### Grid Layout

The iOS/iPadOS 26 Control Center uses a grid-based layout. The Now Playing control can expand to fill the entire grid (up to the full Control Center area). Smart home controls can use up to 24 grid spaces.

### Resizing

In edit mode, each control has a curved drag handle at its bottom-right corner. Users can drag outward to enlarge or inward to shrink. The Now Playing widget can range from a compact single-row display (track info + play/pause) up to a large card showing album art, full transport controls, and volume.

### Liquid Glass Treatment

All Control Center buttons use Liquid Glass. They were refined in beta 2 to be slightly more opaque for better visibility against varied wallpapers.

---

## 5. Multitasking and Windowed Mode

### Split View Replacement

iPadOS 26 removed Split View and Slide Over entirely. They are replaced by a macOS-like windowing system:

- **Windowed App Mode**: Apps run in freely resizable, overlapping windows with macOS-style traffic light buttons (close, minimize, fullscreen).
- **Stage Manager**: Continues to exist and gains improvements -- you can now bring more than four apps into a Stage without the oldest being kicked out.
- **Window Tiling**: Drag/flick a window to the left or right edge to snap it to half-screen (emulating the old Split View). Tap-and-hold the traffic light buttons to see tiling options (same as macOS 15 Sequoia).
- **Slide Over (iPadOS 26.2+)**: Restored as a floating window mode where one window stays on top of others and can be swiped off-screen.

### Media Player in Windows

- Music app respects the window frame. Controls scale to the window width but maintain their centered layout.
- Picture-in-Picture works in Stage Manager mode. In full-screen or windowed mode, PiP behavior has reported issues. The gesture to enter PiP from fullscreen is a single-finger flick down on the home indicator area.
- Audio continues playing when the Music app window is behind other windows or minimized.

---

## 6. Gestures for Media Interaction

### Confirmed Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe left on MiniPlayer | Music app | Next track |
| Swipe right on MiniPlayer | Music app | Previous track |
| Tap MiniPlayer | Music app | Expand to full Now Playing |
| Tap album art on Lock Screen | System-wide | Expand to fullscreen animated art |
| Drag on progress bar | Now Playing / Video | Scrub position |
| Drag on volume slider | Now Playing | Adjust volume |
| Single-finger flick down on home bar | Video fullscreen | Enter PiP |

### What Was NOT Added

- No full-screen swipe-to-scrub gesture (removed in iOS 17, not restored).
- No dedicated Apple Pencil media interactions. Apple Pencil gestures in iPadOS 26 focus on corner swipes (Quick Notes, screenshots) and markup tools. There is no Pencil-specific precision scrubbing mode for media.
- No multi-touch volume or scrub gestures (two-finger spread to zoom remains limited to photos/maps).

---

## 7. Adaptive Layout Patterns (Key Takeaways for Web Components)

### Size Class Behavior

| Context | Navigation | MiniPlayer Position | Controls Layout |
|---------|-----------|-------------------|-----------------|
| iPhone portrait | Tab bar (bottom) | Above tab bar | Single column, centered |
| iPhone landscape | Tab bar (bottom, compact) | Above tab bar | Single column, centered |
| iPad portrait | Tab bar (bottom) | Above tab bar | Single column, centered, wider max-width |
| iPad landscape | Sidebar (left) | Above bottom edge, right of sidebar | Two-column possible (art left, controls right) |
| iPad windowed (compact) | Tab bar | Above tab bar, within window | Single column, constrained to window |
| iPad windowed (wide) | Sidebar | Above bottom edge | Two-column |
| iPad Stage Manager | Per-window | Per-window | Adapts to window width |

### Glass Material Rules

1. **MiniPlayer**: Liquid Glass (it floats over scrolling content).
2. **Full Now Playing controls**: Liquid Glass (overlay on album art / animated artwork).
3. **Tab bar / Sidebar**: Liquid Glass (system chrome that floats above content).
4. **Album/playlist background**: NOT glass -- it is a solid color-extracted fill from the artwork. Text and list items sit on this solid surface.
5. **Video player controls**: Liquid Glass (float transparently over video).
6. **Control Center Now Playing**: Liquid Glass (part of the Control Center overlay).

### Dimensional Rules

- Controls are always **horizontally centered** within their container, never anchored to a side.
- The control cluster has a **max-width** (approximately 500pt on iPad) -- it does not stretch to fill a 12.9" screen.
- The MiniPlayer is **window-relative**, not screen-relative.
- Progress bars and volume sliders stretch to the control cluster width but have rounded Liquid Glass end caps.
- On iPad landscape with sidebar, the Now Playing full-screen view occupies the content area (right of sidebar), not the full screen width.

### Transition Patterns

- **MiniPlayer to Full Now Playing**: Expands upward with a fluid spring animation. The album art thumbnail grows to become the full-size art.
- **Full Now Playing dismiss**: Swipe down or tap the chevron; the art shrinks back into the MiniPlayer pill.
- **Track change in MiniPlayer**: Swipe triggers a horizontal slide of the track info with Liquid Glass ripple + haptic.
- **Video controls appear/disappear**: Fade in/out with Liquid Glass material dissolve. Auto-hide after a few seconds of no interaction.

---

## 8. Implementation Notes for Web Components

### What to Replicate

1. **Floating control bars** using `backdrop-filter: blur()` with a subtle refraction tint sampled from the content beneath. This is the web equivalent of Liquid Glass for overlays.
2. **Color extraction from artwork** for the fullscreen Now Playing background. Use a canvas-based dominant color extraction or a pre-computed palette.
3. **Centered, max-width-constrained control clusters** that do not stretch on large screens.
4. **MiniPlayer as a position-relative pill** within the component's own frame, not fixed to the viewport.
5. **Swipe gestures on the MiniPlayer** using touch events with haptic feedback via `navigator.vibrate()` where available.
6. **Adaptive navigation**: tab bar in portrait/compact, sidebar in landscape/wide. The breakpoint is roughly 768px (iPad portrait width) for tab-to-sidebar transition.
7. **Spring-animated expand/collapse** between MiniPlayer and full Now Playing view.

### What NOT to Replicate

- Animated album art (requires artist-provided assets from Apple Music).
- Apple Pencil-specific interactions (none exist for media players).
- PiP window management (OS-level feature).
- Control Center integration (OS-level feature).

---

## Sources

- [Apple Music iOS 26 update - AppleInsider](https://appleinsider.com/articles/25/06/11/apple-music-ios-26-update-brings-motion-color-depth-to-the-iphone-lock-screen)
- [9 New Apple Music Features in iOS 26 - 360-Reader](https://360-reader.com/new-apple-music-features-in-ios-26-and-ipados-26/)
- [Apple introduces a delightful and elegant new software design - Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Apple Music in iOS 26.4 new design - 9to5Mac](https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/)
- [Apple Music in iOS 26.4: Five brand new features - 9to5Mac](https://9to5mac.com/2026/03/27/apple-music-in-ios-26-4-five-brand-new-features-available-now/)
- [iOS 26.1 Apple Music swipe gesture - 9to5Mac](https://9to5mac.com/2025/11/04/ios-26-1-gave-apple-music-convenient-new-trick/)
- [Swipe Gesture in Apple Music MiniPlayer - AppleMagazine](https://applemagazine.com/swipe-gesture-in-apple-music-miniplayer-ios-26/)
- [Apple TV app Liquid Glass redesign - 9to5Mac](https://9to5mac.com/2025/07/16/apples-tv-app-gets-fresh-design-in-ios-26-and-tvos-26-heres-whats-new/)
- [Safari Liquid Glass interface - 9to5Mac](https://9to5mac.com/2025/06/09/safari-gets-the-ios-26-treatment-with-new-liquid-glass-interface/)
- [Inside iOS 26 Control Center - AppleInsider](https://appleinsider.com/inside/ios-26/tips/inside-ios-26-control-center----fast-access-to-the-best-iphone-features)
- [Control Center iOS 26 customization guide](https://www.onoff.gr/blog/en/iphone/control-center-ios-26-perfect-customization-guide/)
- [iOS 26 Beta 2 Control Center fix - MacRumors](https://www.macrumors.com/2025/06/23/ios-26-b2-control-center/)
- [iPadOS 26 removes Split View - 9to5Mac](https://9to5mac.com/2025/06/09/psa-ipados-26-removes-split-view-and-slide-over-multitasking-features/)
- [iPadOS 26 multitasking guide - SlatePad](https://slatepad.org/2026/01/24/ipados-26-multitasking-guide/)
- [How multitasking works in iPadOS 26 - SlatePad](https://slatepad.org/2025/06/17/heres-how-multitasking-works-in-ipados-26/)
- [iPadOS 26 windowed apps - AppleInsider](https://appleinsider.com/inside/ipados-26/tips/whats-new-with-ipad-app-windows-in-ipados-26-and-how-they-work)
- [Build a UIKit app with the new design - WWDC25](https://developer.apple.com/videos/play/wwdc2025/284/)
- [WWDC25 UIKit Liquid Glass design - Appcircle](https://appcircle.io/blog/wwdc25-build-a-uikit-app-with-the-new-liquid-glass-design)
- [iPadOS 26 review - Six Colors](https://sixcolors.com/post/2025/09/ipados-26-review-a-computer/)
- [Customize Music layout on iPad - Apple Support](https://support.apple.com/guide/ipad/customize-music-ipad5fc2cef3/ipados)
- [Music player controls on iPad - Apple Support](https://support.apple.com/guide/ipad/use-the-music-player-controls-ipad9a4ba1e8/ipados)
- [iOS 26.1 Reduce Liquid Glass - MacRumors](https://www.macrumors.com/how-to/ios-26-1-reduce-liquid-glass-effects/)
- [Apple releases iOS 26.2 - The Apple Post](https://www.theapplepost.com/2025/12/12/69790/apple-releases-ios-26-2-with-new-liquid-glass-controls-one-time-airdrop-codes-and-offline-apple-music-lyrics/)
