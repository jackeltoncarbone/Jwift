/**
 * Public API — Jwift.Angular.
 *
 * Swift-style UI templates and components built on Jaui.
 */

export { Icon } from './Icon/Icon';
// THE person mark — one canvas primitive, one fallback ladder, a named size scale. Nothing else in the
// app may draw an initials disc; `Design/Avatar.Conformance.spec.ts` holds the tree to that.
export { Avatar } from './Avatar/Avatar';
// The caller's own bottom rung: `<ng-template avatarFallback>`, shown INSTEAD of the monogram when the
// ladder bottoms out. Exported beside the primitive because it is useless without it.
export { AvatarFallback } from './Avatar/Avatar.Fallback';
// Who is here: overlapping avatars beside a shared document's collaboration button.
export { AvatarStack, type AvatarStackPerson } from './AvatarStack/AvatarStack';
export {
  type AvatarSize,
  AvatarDiameter,
  AvatarInitialsFraction,
  AvatarGlyphFraction,
  AvatarFallbackGlyph,
  providerAvatarUrl,
  deriveInitials,
} from './Avatar/Avatar.Name';
export {
  AvatarPhoto,
  AvatarPhotoBlob,
  AvatarFetchCredentials,
  SetAvatarCredentialedOrigins,
  ResetAvatarPhotos,
  type AvatarPhotoVerdict,
  type AvatarPhotoState,
} from './Avatar/Avatar.Photo';
export { Sheet, SheetBody, SheetCancel, SheetEdits, SheetStack, JWIFT_SHEET_OUTLET } from './Sheet/Sheet';
export {
  type SheetDetent,
  type SheetPresentation,
  type FormSheetSize,
  type DocumentSheetConfig,
  SHEET_METRICS,
  FormSheetSizeFor,
  DocumentSheetSizeFor,
  InspectorWidthFor,
  PageEntryOffset,
  IsRegularWidth,
  LargeHeight,
  MediumHeight,
  PercentFullHeight,
  InsetFor,
  BottomRadius,
  RubberBand,
  ProjectedTravel,
  GrabberTarget,
  SettleIndex,
} from './Sheet/Sheet.Geometry';
export { Slider, type SliderScrubEvent } from './Slider/Slider';
export { GlassButton, type GlassButtonShape, type GlassButtonVariant, type GlassButtonSize } from './GlassButton/GlassButton';
// `GlassDropdown`, `GlassDropdownItem`, `GlassActionGroup` and `GlassActionBar` are NOT re-exported here —
// every one of their real consumers is a lazy page (Admin, the CMS surface editor, Picture/Item/Camera/
// Field/Uniform pages, the Drill editor's own toolbar), yet barrel-exporting them was enough to pull them
// into the one chunk every page's initial load imports, same as TokenSentence (see that component's own
// doc comment). The two *types* stay re-exported — a type has no runtime weight.
export type { GlassAction } from './GlassActionGroup/GlassActionGroup';
export type { ActionGroup } from './GlassActionBar/GlassActionBar';
export { Toolbar } from './Toolbar/Toolbar';
export { ToolbarTitle } from './ToolbarTitle/ToolbarTitle';
export { ToolbarCompactDef } from './ToolbarTitle/ToolbarCompactDef';
export { TabBar } from './TabBar/TabBar';
export { TabItem } from './TabBar/TabItem';
export { TabBarAccessory } from './TabBar/TabBarAccessory';
export { SelectionIndicator } from './SelectionIndicator/SelectionIndicator';
export { MorphSurface, MorphFace, MorphContent } from './Morph/MorphSurface';
export { Card, type CardSize } from './Card/Card';
export { CardFooter } from './Card/CardFooter';
export { SectionHeader } from './SectionHeader/SectionHeader';
export { JwiftStyleLoader } from './Jss/Jwift.Style.Loader';
export { JivHost, JWIFT_GLASS_TINT } from './Internal/JivHost';
export { JWIFT_MATERIAL, JwiftMaterialScope, type JwiftMaterial } from './Internal/Material';
export { IsEscapeKey } from './Internal/Keys';
export { ContextMenu } from './ContextMenu/ContextMenu';
export { ContextMenuService, type ContextMenuItem } from './ContextMenu/ContextMenu.Service';
export { TextInput, type TextInputSpan, type TextInputPeerCaret, type TextInputMaterial } from './TextInput/TextInput';
export { NumberTicker } from './NumberTicker/NumberTicker';
export { JwiftSpinner } from './Spinner/JwiftSpinner';
export { JwiftProgress } from './Progress/JwiftProgress';
export { JwiftState, type JwiftStateTone } from './State/JwiftState';
export { WheelPicker } from './WheelPicker/WheelPicker';
export { WheelItem } from './WheelPicker/WheelItem';
export {
  type WheelGeometry,
  type SlotProjection,
  DefaultWheelGeometry,
  ProjectSlot,
  ClampPosition,
  NearestIndex,
  DegreesPerItem,
} from './WheelPicker/WheelPicker.Logic';
// Universal Liquid-Glass JSS — opt in via space-separated class names
// (`class="MyThing JwiftGlass"`) or single-inheritance (`MyThing :
// JwiftGlass {...}`). Consumer page must register it once with a
// `<jyle [source]="JwiftGlassJss" />` (or include in their own sheet
// via `@import` if/when JSS supports it). Look-only — never sets
// layout, padding, or BorderRadius.
// @ts-ignore — vite handles .jss imports as default-export strings
export { default as JwiftGlassJss } from './Glass/Jwift.Glass.jss';
export { List } from './List/List';
export { ListRow } from './List/ListRow';
export { ListSeparator } from './List/ListSeparator';
export { Toggle } from './Toggle/Toggle';
// `Stepper` (Picture.Page/FieldDesigner only), `MediaTransport` (Camera/Drill editor only) and
// `SearchPicker` (Admin only) are NOT re-exported here — see GlassActionBar's own comment above.
export { TagBadge, type TagBadgeTone } from './TagBadge/TagBadge';
export { DisclosureRow } from './DisclosureRow/DisclosureRow';
export { SidebarRow } from './SidebarRow/SidebarRow';
export { ComposerBar } from './ComposerBar/ComposerBar';
export { TitleButton } from './TitleButton/TitleButton';
export { SwatchChip } from './SwatchChip/SwatchChip';
export type { HeldPill, PickGroup, PickOption } from './SearchPicker/SearchPicker';
export { FilterChip } from './FilterChip/FilterChip';
export { TokenChip } from './TokenChip/TokenChip';
export { ReferenceChip } from './ReferenceChip/ReferenceChip';
export { Callout } from './Callout/Callout';
export { DismissibleHint } from './DismissibleHint/DismissibleHint';
export { SelectMark } from './SelectMark/SelectMark';
// `EntryListEditor` (the CMS surface editor only) is NOT re-exported here — see GlassActionBar's own
// comment above. Its one type has no runtime weight, so it stays.
export type { EntryListEditorRowContext } from './EntryListEditor/EntryListEditor';
export { Paper, JWIFT_PAPER_GEOMETRY } from './Paper/Paper';
export { PaperRadius, RowRadius } from './Paper/Paper.Geometry';
// `Popover` and `PopoverMenu` (the Drill editor's own menus — WhoChooser, EditorToolbar, Drill.Page,
// UseDrillSettings — are their only consumers) are NOT re-exported here — see GlassActionBar's own
// comment above. Everything else these two files export is a token or a type, so it has no runtime
// weight and stays.
export type { PopoverClosed } from './Popover/Popover';
export { PresentationStack } from './Internal/PresentationOpen';
export { PlacePopover, type PopoverRect } from './Popover/Popover.Placement';
export type { PopoverMenuItem } from './Popover/PopoverMenu';
// `TokenSentence` (the component) and `TokenSentence.Layout`'s own functions are NOT re-exported here —
// see Jwift.Angular/src/TokenSentence/TokenSentence.ts's own doc comment on why: Drill Sentences' editor
// is their only runtime consumer (lazy, reached only through the App's Drill.Page route), and re-exporting
// them from this barrel was enough to drag both modules (~80 kB) into the one shared chunk EVERY page's
// initial load imports — this barrel is also reached eagerly (App.ts, Navigation.ts, the app-shell sheets)
// for components that ARE needed on every page. The two *types* stay re-exported: a type has no runtime
// weight, so there is no bundle cost to barrel-exporting it, and `Editor/SentenceTokens.ts` /
// `Roster/RosterSentence.ts` read them from here as `import type`.
export type { SentenceToken, SentenceTokenKind } from './TokenSentence/TokenSentence.Layout';
// `NumberField` (the Drill editor's own measures/counts fields — CastPanel, EditorPhrase, EditorControls
// — are its only consumers) and `SortableList`/`SortableSection`/`SortableRow` (EditorList.ts/
// EditorPhrase.ts, same editor) are NOT re-exported here — see GlassActionBar's own comment above.
export type { NumberFieldUnit, NumberFieldRow } from './NumberField/NumberField';
export { AngleDial } from './AngleDial/AngleDial';
export { Snap as AngleSnap } from './AngleDial/AngleDial.Logic';
export { SwipeRow } from './Swipe/SwipeRow';
export { type SwipeAction } from './Swipe/Swipe.Logic';
export type { SortableReorder } from './SortableList/SortableList';
