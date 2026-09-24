# Apple's web pages: apple.com, measured

What apple.com, its legal and support pages, and the App Store web listing measure. These are sales and reference surfaces, not app UI: where they disagree with a first-party app (`Apps.md`), the app is the reference. No Jaui, no JSS, none of our decisions; Show Studio's home-page targets built on this are in `ShowStudio.Documentation/Design/Apple.Measured.Spec.md`.

Every fact carries a status:
- **[C]** read from the live page: computed style or served CSS and HTML, with the harness or stylesheet named.
- **[I]** inferred from those readings (a rule fitted across pages), or measured from pixels.

## 1. Method [C]

Six surfaces in headless Chromium at 1440 × 1200, `deviceScaleFactor: 2`, in both `colorScheme: 'dark'` and `'light'` explicitly, each scrolled top to bottom in 80%-viewport steps before measuring (Apple lazy-mounts below the fold), then re-measured at 1024, 768 and 390. Harness: `ShowStudio.App/Scripts/Measure.AppleSurfaces.node.mjs`; raw output `ShowStudio.App/Scripts/apple-measured/measurements.json` with twelve screenshots. About six minutes, mostly the scroll-settle pass.

| surface | why |
|---|---|
| `apple.com` | the tile-grid model |
| `apple.com/macbook-pro` | long-scroll product page (33,287 px, 17 bands) |
| `apple.com/iphone` | a second product page |
| `apple.com/apple-vision-pro` | a third, the most text-heavy (36,852 px) |
| `apple.com/newsroom` | editorial rhythm, card grid |
| `apps.apple.com/.../freeform` | the closest first-party app surface that renders on the web |

Limits: Newsroom returned zero body paragraphs (its card copy is in `<div>`s), so its body cells are n/a. The App Store listing has no centered max-width container above 390 px (a fixed left sidebar plus a fluid pane), so its gutter reads null at 768 and up. Copy, imagery, iconography and brand were not measured.

## 2. Type

### 2.1 One ladder across every page [C] computed styles

| size | tracking px | tracking em | line height | lh − size | weights seen | pages |
|---:|---:|---:|---:|---:|---|---:|
| 80 | −1.2 | −0.015 | 84 | 4 | 600, 700 | 3 |
| 64 | −0.58 | −0.0091 | 68 | 4 | 600 | 1 |
| 56 | −0.28 | −0.005 | 60 | 4 | 600 | 4 |
| 48 | −0.14 | −0.0029 | 52 | 4 | 600 | 2 |
| 40 | 0 | 0 | 44 | 4 | 600, 700 | 3 |
| 32 | +0.13 | +0.0041 | 36 | 4 | 600, 700 | 4 |
| 28 | +0.2 | +0.0071 | 32 | 4 | 400, 600 | 4 |
| 24 | +0.22 | +0.0092 | 28 | 4 | 600, 700 | 3 |
| 21 | +0.23 | +0.011 | 24 / 25 | 3 / 4 | 400, 600, 700 | 4 |
| 17 | −0.37 | −0.0218 | 21 | 4 | 400, 600, 700 | 4 |
| 14 | −0.22 | −0.0157 | 18 | 4 | 400, 600, 700 | 4 |
| 12 | −0.12 | −0.010 | 16 | 4 | 400, 600, 700 | 5 |

Rules fitted from the table [I]:

- **RULE T1.** Line height is `size + 4px` at every rung from 12 to 80 (21 px is the one exception, +3). Not a ratio: the effective ratio slides from 1.333 at 12 to 1.050 at 80.
- **RULE T2.** Tracking is a smooth curve that crosses zero at 40 px: display sizes tighten as they grow (−0.015 em at 80), mid sizes loosen slightly (+0.011 em at 21).
- **RULE T3.** A hard break at 17 px marks a change of face: +0.23 at 21 px, then −0.37 at 17. 21 px and up is the display face, 17 px and down the text face. Every rung at 17 and below tracks negative.
- **RULE T4.** Weight is 400 or 600. 700 appears only on Newsroom and Vision Pro; there is no 500 and no 800. Emphasis is carried by size.
- Rungs: 12, 14, 17, 21, 24, 28, 32, 40, 48, 56, 64, 80; ratios about 1.17 at the bottom easing to 1.25 at the top.

### 2.2 Headlines step; they are never fluid [C]

| page | 1440 | 1024 | 768 | 390 |
|---|---:|---:|---:|---:|
| macbook-pro | 80 | 64 | 64 | 48 |
| iphone | 80 | 64 | 64 | 48 |
| vision-pro | 80 | 64 | 64 | 40 |
| apple-home | 56 | 48 | 48 | 32 |
| newsroom | 40 | 32 | 32 | 24 |

**RULE T5** [I]: the hero headline takes three values across the range, rungs of the ladder (80 / 64 / 48); 1024 and 768 are always identical, so there is a breakpoint between 1440 and 1024 and another below 768. No `clamp()`, no viewport interpolation.

## 3. Layout

### 3.1 Column and gutter [C] (gutter px / content column px)

| page | 1440 | 1024 | 768 | 390 |
|---|---|---|---|---|
| apple-home | 230 / 980 | 22 / 980 | 16 / 736 | 16 / 358 |
| macbook-pro | 90 / 1260 | 64 / 896 | 48 / 672 | 24 / 342 |
| iphone | 90 / 1260 | 64 / 896 | 48 / 672 | 24 / 342 |
| vision-pro | 230 / 980 | 166 / 692 | 38 / 692 | 24 / 342 |
| newsroom | 230 / 980 | 166 / 692 | 38 / 692 | 24 / 342 |

- **RULE G1** [I]: two content column widths, 980 (text-led pages) and 1260 (media-led). Nothing is full-bleed for text.
- **RULE G2** [I]: at desktop the gutter is `(viewport − column) / 2`; the designed number is the column.
- **RULE G3** [I]: below about 768 the model inverts: the gutter is fixed and the column takes the remainder. At 390 every page lands on 16 to 26 px, clustering at 24.
- **RULE G4** [C]: the minimum desktop gutter observed is 90 px.

### 3.2 Vertical rhythm [C]

| page | padding-top values | padding-bottom values |
|---|---|---|
| apple-home | 18, 38 | 12 |
| macbook-pro | 0, 18, 38, **144** | 0, 12, **144, 216** |
| iphone | 18, 38, 60, **112** | 0, 12, **112** |
| vision-pro | 18, 38, **180** | 0, 12 |
| newsroom | 38 | 12 |

18, 38 and 12 are nav and footer chrome. Content rhythm: macbook-pro 144 top on 11 of 12 content sections; iphone 112 on 7 of 8; vision-pro 180 on both.

- **RULE V1** [I]: a page uses one section padding value on nearly every band (216 is 144 × 1.5; 0 is where two bands butt).
- **RULE V2** [C]: apple.com home uses no section padding; it is a grid of fixed 692 px tiles with a 12 px gap, each tile carrying its own background.

### 3.3 Body measure [C]

| page | median | min | max | median chars per line |
|---|---:|---:|---:|---:|
| apple-home | 699 | 265 | 980 | 85 |
| macbook-pro | 400 | 210 | 980 | 48 |
| iphone | 946 | 281 | 946 | 163 |
| vision-pro | 697 | 340 | 898 | n/a |
| appstore | 500 | 293 | 1100 | 82 |

iphone's 946 median is a legal block repeated 28 times; its editorial paragraphs measure 292 to 400.

- **RULE B1** [I]: body text runs 400 to 700 px, about 50 to 85 characters per line, capped narrower than the column.
- **RULE B2** [C]: body is 17 px on product pages, 21 px for lead paragraphs, 12 px for legal footnotes.
- At 390 the body measure is 260 to 324 px, the column less the 24 px gutters. [C]

### 3.4 Radii [C] (count of elements)

| page | distinct radii |
|---|---|
| apple-home | pill (36), 8 (3) |
| macbook-pro | pill (52), 28 (42) |
| iphone | pill (27), 28 (24) |
| vision-pro | 20 (50), pill (22) |
| newsroom | pill (19), 32 (10), 24 (9), 20 (8) |
| appstore | pill (27), 130 (12), 24 (4), 10 (3) |

- **RULE R1** [I]: a page has one box radius plus the pill (Newsroom, the busiest page, has three).
- **RULE R2** [I]: every button is a pill; pills are the most common rounded element on five of six pages.
- **RULE R3** [C]: zero uniformly inset rounded-child-in-rounded-parent pairs on Newsroom, macbook-pro and the App Store listing. Card padding values are sparse: newsroom 5 / 12, macbook-pro 8 / 11 / 40 / 120, appstore 7 / 20 / 30.

## 4. Ink and grounds [C]

- **RULE I1**: apple.com ignores `prefers-color-scheme`: requested dark, served light, identical computed ink on all five marketing pages. The dark pages are dark because a section is authored black. The App Store listing is the only surface of the six that responds to the theme.
- **RULE I2**: text color is an alpha ladder over the ground. The App Store listing:

| role | dark | light |
|---|---|---|
| primary | `rgba(255,255,255,0.92)` | `rgba(0,0,0,0.88)` |
| secondary | `rgba(255,255,255,0.64)` | `rgba(0,0,0,0.56)` |
| tertiary | `rgba(255,255,255,0.40)` | `rgba(0,0,0,0.48)` |
| accent | `rgb(0,122,255)` | `rgb(0,122,255)` |

  Marketing pages: `rgba(0,0,0,0.88)` / `0.72` / `0.56`, plus solid `rgb(29,29,31)` for headlines and `rgb(245,245,247)` for text on dark grounds.
- **RULE I3**: three text rungs; the accent does not change between themes. Distinct ink counts: App Store 8 (4 carry meaning), apple-home 9, newsroom 5, iphone 10, macbook-pro 17.
- Sections with their own background: apple-home 0 of 5 (the tiles carry it), macbook-pro 15 of 17, iphone 4 of 10, vision-pro 2 of 10, newsroom 0 of 5 (the cards carry it).
- **RULE S1**: grounds come from four values sitewide, `#000`, `#1d1d1f`, `#f5f5f7`, `#fff`, plus `#fafafc` once.
- **RULE S2** [I]: a page picks one strategy: alternating full-bleed bands (macbook-pro) or one ground with the cards carrying the color (newsroom, apple-home).

## 5. Legal, support and contact pages [C] served HTML and `apple.com/legal/v/legal/e/built/styles/main.built.css`, read 2026-09-16

- **Privacy Policy** (apple.com/legal/privacy/en-ww/, "Updated July 30, 2025"): a centered hero, the `h1`, the date as an `h3.typography-subsection-headline`, intro paragraphs at `typography-intro` (21 px / 29, weight 400, +0.011 em; 19 px under the large breakpoint) set `large-8`, two thirds of the 980 column. Every section is a row in an accordion (`section-transparency-accordion`): an `h2` at `typography-callout` (32 px / 36, weight 600; 28 and 24 at smaller breakpoints), a plus button (`aria-expanded`), a 1 px `#d2d2d7` hairline on each item's top, the panel opened in place, heading padding `1.937rem` top and bottom. With JavaScript off every panel is open. The section list is the table of contents.
- **Apple Media Services Terms** (apple.com/legal/internet-services/itunes/us/terms.html): one running column, `large-10` of 980 (about 816 px), no accordion; a "TABLE OF CONTENTS" as plain paragraphs, A to T, not linked.
- Body type on both: 17 px on a 25 px line (`line-height: 1.4706`), weight 400, tracking −0.022 em, paragraphs `margin: 0 0 1em`. Legal copy is not shrunk inside the document; the 12 px legal size of section 3.3 is footnote text on product pages.
- **support.apple.com**: an `h1` ("Apple Support"), a search field, then product tiles and task blocks ("Handled with AppleCare", "Apple Repair and Service").
- **apple.com/contact** ("Contacting Apple"): two `h2` groups ("Sales and Product Inquiries", "Product and Services Support") of `h3` tasks, each a destination.
