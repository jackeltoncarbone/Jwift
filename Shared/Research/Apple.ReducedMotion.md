# Reduce Motion, from Apple's own words

What Apple says an app must do when a person turns on the Reduce Motion accessibility setting, read
from the Human Interface Guidelines on 2026-09-17, and mapped onto Show Studio. Quotes are Apple's.

Sources read in full, as machine-readable JSON at
`developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:

- HIG: Accessibility (the Motion section).
- HIG: Motion.

## The rule, in one sentence

> "People who are prone to these effects can turn on the Reduce Motion accessibility setting. When this
> setting is active, ensure your app or game responds by reducing **automatic and repetitive**
> animations, including zooming, scaling, and peripheral motion."
>
> — HIG, Accessibility > Motion

**"Automatic and repetitive" is the whole test**, and it is the phrase to argue from, because it draws
the line by itself. It names two properties, and the motions Apple asks you to stop have both:

- **Automatic** — it started without the person asking for it.
- **Repetitive** — it does not end; it loops, idles or auto-advances.

A motion the person *asked for* is neither. That is why Reduce Motion is not a demand that video stop
playing or that a timeline stop scrubbing: pressing play is a request, and it terminates.

The same section lists the techniques:

> "Other best practices for reducing motion include: Tightening animation springs to reduce bounce
> effects · Tracking animations directly with people's gestures · Avoiding animating depth changes in
> z-axis layers · **Replacing transitions in x-, y-, and z-axes with fades to avoid motion** · Avoiding
> animating into and out of blurs"
>
> — HIG, Accessibility > Motion

So a *transition* is not deleted, it is **replaced by a fade**: it keeps its meaning and loses its
travel. That is the third case, and it is distinct from both of the above.

And the supporting principle, from the Motion page:

> "Add motion purposefully, supporting the experience without overshadowing it. Don't add motion for the
> sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel
> disconnected or physically uncomfortable."
>
> — HIG, Motion > Best practices

> "Make motion optional. Not everyone can or wants to experience the motion in your app or game, so it's
> essential to avoid using it as the only way to communicate important information."
>
> — HIG, Motion > Best practices

Note the standard this sets for *replacement*: motion may never be the ONLY carrier of meaning. If a
movement tells the user something, stopping it must not take the something away — the meaning has to
arrive by another route (a static state, a fill, a label).

## The three cases, which is how Show Studio applies it

Apple's two properties plus the fade clause give exactly three buckets. Every motion in the app is in
one of them, and the bucket decides the treatment.

| Case | Apple's test | Treatment | Mechanism here |
|---|---|---|---|
| **Decorative idle** | automatic **and** repetitive | **Park it.** Not slower, not a smaller loop — still. | `Ui/ReducedMotion.ts` (TS loops), `--Loop: 0` (CSS) |
| **Caused transition** | automatic, but **ends** | Keep the meaning, drop the travel: cross-fade or land immediately. | `--Dur*: 0.01ms` in `Design/Motion.scss` |
| **Requested playback** | **neither** — the user asked | **Leave it alone.** | nothing; it is not in scope |

The third row is the one that is easy to get wrong in this app specifically, because Show Studio is a
program about things that move. A director pressing play on a drill is asking a marching band to march.
Parking that under Reduce Motion would not be an accommodation, it would be a broken product: the show
IS the content, in the same sense that a video is the content of a video player. Apple does not stop
video playback under Reduce Motion, and neither do we.

The distinction is **who asked**, not **how much it moves**. A slow idle turntable is decorative and
stops; a fast, violent 200-marcher company front the director pressed play on is requested and does not.

## Why the meaning survives parking, in each case we park

"Make motion optional ... avoid using it as the only way to communicate important information" means a
parked motion must not take information with it.

- **The mannequin turntable** exists to show a uniform from every side. What it communicates is *the
  garment*, not *the rotation*. Parked, the figure still stands on its opening front three-quarter,
  which the renderer chose precisely because the jacket front, the buttons and the plume face the
  viewer. Nothing is lost; the user can still drag to see the back, which is a tracked gesture and
  therefore exactly what the HIG asks for ("Tracking animations directly with people's gestures").
- **A looping cover** communicates "this item has motion in it". Parked, the still frame plus the
  existing duration/─type labelling still says what the item is.
- **The presence orb** communicates listening/speaking state and level. Its engine already carries a
  `reducedMotion` mode that snaps the springs and stills the ambient breath while *keeping the state
  distinguishable by shape and fill* — state survives, breathing does not.

## Where this lands in the code

One reader, `ShowStudio.App/src/Ui/ReducedMotion.ts`, a root Angular service exposing a `Reduced`
signal backed by `matchMedia('(prefers-reduced-motion: reduce)')` and its `change` event. It covers
motion driven by **TypeScript** — rAF loops, `setInterval`, worker render loops.

CSS-driven motion does NOT use it and must not: `ShowStudio.App/src/Design/Motion.scss` already
collapses every `--Dur*` to `0.01ms`, flattens `--HoverScale`/`--PressScale*` to 1 and zeroes `--Loop`
under the same query, and `Design/FocusAndMotion.Conformance.spec.ts` enforces that this is total (no
literal durations, no bare `infinite`, no hand-rolled spinner). Two mechanisms for one preference is how
they drift apart, and a split like that is what let the mannequin turntable go unasked for in the first
place.
