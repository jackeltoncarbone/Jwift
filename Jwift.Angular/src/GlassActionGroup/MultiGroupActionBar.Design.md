# Multi-group action bar — design

Status: built (Slice A + B landed). Mocks: `ShowStudio.Design/Mockups/GlassActionGroup.Mock.html` and `GlassActionBar.Zones.Mock.html`.

## Why

Today the toolbar trailing cluster is a single `GlassActionGroup` pill: one flat
`Actions` list that tail-overflows into one unlabelled ellipsis menu. We want
several **named button groups** that each collapse on their own terms as the
toolbar narrows — folding into a single overflow menu (sectioned by group) or
vanishing — so the chrome stays legible at every width on every page.

The current flat list is just the N=1 case of this. `nav-avatar` is on every
page, so the model must degrade cleanly: no groups → just the avatar.

## Model

```ts
interface ActionGroup {
  Id: string;
  Label?: string;                          // header shown when folded into the sink menu
  Actions: GlassAction[];                  // existing GlassAction shape, reused as-is
  Priority: number;                        // lower folds FIRST; sink is +Infinity
  CollapseUnit?: 'WholeGroup' | 'PerItem'; // default 'WholeGroup'
  CollapsePolicy?: 'ToMenu' | 'Hide';      // default 'ToMenu'
}
```

- **Priority** is the sole knob for *which* group sheds next (lowest first).
  Tie-break: right-most (later in array) folds first.
- **CollapseUnit** is *how* a group sheds: `WholeGroup` jumps out all at once;
  `PerItem` sheds one cell at a time from its tail.
- **CollapsePolicy** is *where* shed items go: `ToMenu` → a labelled section in
  the sink menu; `Hide` → gone, no fallback.

## Layout — one glass per group + one sink

The trailing cluster is N glass pills side by side, then the **sink** pill:

```
[ group A pill ] [ group B pill ] … [ sink pill ]
```

- Each **group pill** is its own glass surface (`Jwift_GlassDropdown_Closed`
  geometry: radius-999, 4pt pad/gap, 40pt cells) showing only that group's
  inline cells. **Group pills have no dropdown** — they shed to the sink.
- The **sink is just another group, pinned to +Infinity priority** (never
  folds). It owns the avatar and the single overflow dropdown. It is the only
  ellipsis/menu trigger in the cluster — the avatar itself is the trigger.
- The sink menu = collapsed `ToMenu` items, **sectioned by source group**
  (label header + divider), followed by the sink's own items (auth / Exit).
- Opening the sink menu pops out of flow, raises z above all pills, and may
  overlap them (acceptable).

## Collapse engine

Generalizes today's `GlassActionGroup` rAF loop (`toolbar.Width − leading.Width`,
8pt hysteresis) from "max inline cell count" to "per-group inline counts":

1. Measure available trailing width (toolbar inner − leading width).
2. Start every group fully inline; while the cluster overflows, fold the
   lowest-priority still-inline group by one step (`WholeGroup` → all, `PerItem`
   → one cell). The sink (+Infinity) never folds.
3. Group pills render their resolved inline count; everything shed with
   `ToMenu` is consolidated into the sink menu, sectioned by group.

Same hysteresis discipline to avoid per-frame flicker.

## Leading: title flex + mask

The leading cluster (back button + title) shares the toolbar width with the
trailing cluster. The title flexes between a max and a small **stub**; its right
edge dissolves via a mask rather than a hard ellipsis. The title yields space
first (masking down to the stub) before any group folds; once at the stub,
further narrowing collapses groups by priority.

## Component shape

- `GlassActionGroup` stays the **single-pill primitive** (SectionEditBar and the
  flat-`Actions` back-compat path depend on it directly).
- New `GlassActionBar` orchestrator: owns the rAF solver, renders the N group
  pills + the sink, and builds the consolidated sectioned sink menu.
- `nav-avatar` routes through `GlassActionBar`:
  - bare `<nav-avatar />` → sink only (just the avatar), as today;
  - flat `[Actions]`/`[Menu]` → one default group + sink, as today;
  - new `[Groups]` → multi-group.
- All ~25 page consumers keep working through `nav-avatar` unchanged.

## Drill adoption (Slice B)

- Groups: **History** (undo/redo) · **Camera** (auto/virtual) · **File**
  (export/share/rename/duplicate/delete) · **Status** (warnings, `Hide`).
  Drop the `cue-list` and `roster` toolbar items.
- Cue navigation, off the existing shared `CueEditorService.cueListOpen`:
  - leading button = sidebar/open-cues icon on preview; tap → open cues
    (phone: cue page; desktop: expand rail);
  - while open it becomes **back** → closes cues → preview (hierarchical:
    pop cues before leaving the drill);
  - the cue surface's trailing edge carries the same glyph to collapse;
  - **Exit drill** lives in the sink menu.

## Rollout

Slice A = framework (`ActionGroup`, group pill, `GlassActionBar`, `nav-avatar`
wiring, back-compat). Verify all pages at :6767 + Jaui demo at :6777.
Slice B = drill groups + cue-nav rework. The `.Mock.html` is throwaway once A lands.
```
