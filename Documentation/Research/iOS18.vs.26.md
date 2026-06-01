# iOS 18 vs iOS 26 Visual Differences (March 2026)

Comprehensive research for informing Jwift component design.

---

## The Big Picture

iOS 18 was the last flat-design iOS. iOS 26 replaces it with **Liquid Glass** — translucent, motion-responsive materials with refraction, specular highlights, and adaptive transparency. Every system UI element shifted from opaque/matte to frosted glass.

---

## Top 20 Visual Differences

### 1. Material: Flat → Liquid Glass
- **18**: Solid, opaque, matte backgrounds
- **26**: Translucent frosted glass with real-time refraction and blur

### 2. Light Response: Static → Motion-Reactive
- **18**: Static highlights, no motion response
- **26**: Specular highlights shift with device tilt (gyroscope-driven)

### 3. Tab Bars: Docked → Floating
- **18**: Fixed to bottom edge, 49pt tall, opaque
- **26**: Floating with rounded corners, ~68pt, glass material, minimizes on scroll down, expands on scroll up

### 4. Navigation Bars: Integrated → Floating Toolbars
- **18**: Flat bars with integrated buttons
- **26**: Renamed "toolbars", buttons float on glass layer above content, rounded and padded from edges

### 5. Corner Radius: Moderate → Extreme
- **18**: Tight squircle corners
- **26**: Significantly larger radii everywhere — sheets, list items, buttons, segmented controls. Alert dialogs use 28pt continuous corners.

### 6. Concentric Corners: Manual → Automatic
- **18**: Fixed radius values set manually
- **26**: `ConcentricRectangle` system — inner radius = parent radius - padding. Automatic at every nesting level.

### 7. Spacing: Compact → Generous
- **18**: Tighter spacing, elements close together
- **26**: Increased padding system-wide, more breathing room between all elements

### 8. Search: Top → Bottom
- **18**: Search bar at top of screen
- **26**: Relocated to bottom for thumb accessibility

### 9. Typography: Centered ALL CAPS → Left-Aligned Sentence Case
- **18**: Section headers in ALL CAPS, alerts center-aligned
- **26**: Sentence case with larger sizing, left-aligned text in alerts and sheets

### 10. Buttons: Solid/Bordered → Glass
- **18**: Flat solid or bordered button styles
- **26**: Translucent glass buttons with two new `UIButtonConfiguration` glass styles. "Done" becomes checkmark icon, "Close" becomes X icon.

### 11. Switches & Sliders: Opaque → Glass
- **18**: Standard solid toggle switches
- **26**: Elongated pill-shaped toggles with glass material, dynamic color adaptation

### 12. Lock Screen Clock: Flat → Glass Widget
- **18**: Flat typography with basic transparency
- **26**: Glowing frosted glass widget, six font options, resizable slider, adaptive weight based on wallpaper

### 13. Dock: Blurred → Multi-Layer Glass
- **18**: Simple dark blur background
- **26**: Multiple Liquid Glass layers with specular highlights, wallpaper colors filter through

### 14. Control Center: Flat → Glass
- **18**: Traditional flat iOS 7-era design
- **26**: Full Liquid Glass with frosted circular icons, rounded sliders, enhanced opacity for visibility

### 15. Icons: Flat → Multi-Layer Glass
- **18**: Single-layer flat images
- **26**: Multi-layer constructs (foreground/mid/background), each rendered as tinted glass. Dynamic parallax and specular highlights on tilt.

### 16. Widgets: Opaque → Three Modes
- **18**: Standard opaque/tinted styles
- **26**: Three modes — Clear (fully transparent, wallpaper color), Tinted (colored bg), Default (similar to 18)

### 17. Sheets: Edge-Pinned → Floating with Gap
- **18**: Sheets attach to screen edges
- **26**: Sheets float with visible gap at middle detent, gap disappears at top detent, corner radius adapts dynamically

### 18. Notifications: Opaque → Frosted Glass
- **18**: Solid backgrounds hiding wallpaper
- **26**: Frosted glass allowing wallpaper visibility behind notifications

### 19. Action Sheets: Bottom → Contextual
- **18**: Always appear at bottom of screen
- **26**: Anchor to the interaction source (the button you tapped). No cancel button on iPhone — tap elsewhere to dismiss.

### 20. Shadows: Static → Adaptive
- **18**: Simple static shadows or none
- **26**: Context-aware adaptive shadows that increase over dark text, decrease over light backgrounds

---

## Detailed Breakdowns

### Tab Bar
| Property | iOS 18 | iOS 26 |
|----------|--------|--------|
| Position | Fixed to bottom edge | Floating with padding |
| Height | 49pt | ~68pt |
| Material | Opaque solid | Liquid Glass translucent |
| Shape | Edge-to-edge rectangle | Rounded corners |
| Scroll | Static | Minimizes on scroll down |
| Search | Separate bar at top | Integrated at right side |

### Settings App
| Property | iOS 18 | iOS 26 |
|----------|--------|--------|
| List rows | Minimal rounding | Significantly more rounded |
| Headers | Mixed case, varied alignment | Left-aligned, sentence case |
| Icons | Squircle style | Circular/pill-shaped, glass layers |
| Backgrounds | Flat, solid | Liquid Glass translucent |
| Search | Top of screen | Bottom of screen |
| Toggles | Standard rectangular | Elongated pill, glass material |
| Navigation | Fixed bars | Floating rounded toolbars |

### Messages App
| Property | iOS 18 | iOS 26 |
|----------|--------|--------|
| Search | Top of list | Bottom of screen |
| New message | Top right | Bottom right |
| Chat bubbles | Opaque blue/green | Lighter, translucent glass |
| Top bar | Solid gray | Frosted glass |
| Chat backgrounds | Basic colors | Customizable liquid glass themes |

### Phone App
| Property | iOS 18 | iOS 26 |
|----------|--------|--------|
| Layout | Separate tabs (Recents, Contacts, Keypad, Voicemail) | Unified single view |
| Favorites | Text list | Large tile cards with contact posters |
| Keypad | Flat circles | Liquid Glass bubble-like keys |
| Controls | Fixed to bezels | Floating glass elements |

### Sheets & Modals
| Property | iOS 18 | iOS 26 |
|----------|--------|--------|
| Corner radius | Moderate | 28pt continuous curves |
| Background | Semi-transparent | Liquid Glass, opaque when large |
| Floating | Pinned to edges | Gap visible at middle detent |
| Fullscreen | Black stacking effect | Simply covers without stack |
| Text alignment | Center | Left-aligned |
| Close action | Text buttons | Icon-based (X, checkmark) |

---

## Design Principles for Jwift

Based on these differences, Jwift components should:

1. **Glass for navigation only** — content stays solid/opaque
2. **Float everything** — tab bars, toolbars, sheets should have visible gap from edges
3. **Concentric corners** — automatic inner radius = parent - padding
4. **Generous spacing** — 8pt grid, 16-24px between elements, 16-20px margins
5. **Minimize on scroll** — navigation chrome shrinks during content scroll
6. **Left-align text** — sentence case headers, no ALL CAPS
7. **Bottom-placed search** — thumb-friendly positioning
8. **Adaptive shadows** — context-aware, not static
9. **Larger corners everywhere** — sheets, cards, buttons, list items
10. **Motion response** — specular highlights shift with interaction (hover/press states in web)
