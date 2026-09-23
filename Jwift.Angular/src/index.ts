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
export { Drawer, JWIFT_SHEET_OUTLET } from './Drawer/Drawer';
export { Slider, type SliderScrubEvent } from './Slider/Slider';
export { GlassButton, type GlassButtonShape, type GlassButtonVariant } from './GlassButton/GlassButton';
export { GlassDropdown } from './GlassDropdown/GlassDropdown';
export { GlassDropdownItem } from './GlassDropdown/GlassDropdownItem';
export { GlassActionGroup, type GlassAction } from './GlassActionGroup/GlassActionGroup';
export { GlassActionBar, type ActionGroup } from './GlassActionBar/GlassActionBar';
export { Toolbar } from './Toolbar/Toolbar';
export { ToolbarTitle } from './ToolbarTitle/ToolbarTitle';
export { ToolbarCompactDef } from './ToolbarTitle/ToolbarCompactDef';
export { TabBar } from './TabBar/TabBar';
export { TabItem } from './TabBar/TabItem';
export { TabBarAccessory } from './TabBar/TabBarAccessory';
export { SelectionIndicator } from './SelectionIndicator/SelectionIndicator';
export { MorphSurface, MorphFace, MorphContent } from './Morph/MorphSurface';
export { ModalHost, ModalOutletService, JWIFT_MODAL_OUTLET } from './Modal/ModalHost';
export { Card, type CardSize } from './Card/Card';
export { CardFooter } from './Card/CardFooter';
export { SectionHeader } from './SectionHeader/SectionHeader';
export { JwiftStyleLoader } from './Jss/Jwift.Style.Loader';
export { JivHost, JWIFT_GLASS_TINT } from './Internal/JivHost';
export { ContextMenu } from './ContextMenu/ContextMenu';
export { ContextMenuService, type ContextMenuItem } from './ContextMenu/ContextMenu.Service';
export { TextInput, type TextInputSpan, type TextInputPeerCaret, type TextInputMaterial } from './TextInput/TextInput';
export { NumberTicker } from './NumberTicker/NumberTicker';
export { JwiftSpinner } from './Spinner/JwiftSpinner';
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
