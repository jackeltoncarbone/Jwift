/**
 * Public API — Jwift.Angular.
 *
 * Swift-style UI templates and components built on Jaui.
 */

export { Icon } from './Icon/Icon';
export { Drawer } from './Drawer/Drawer';
export { Slider, type SliderScrubEvent } from './Slider/Slider';
export { GlassButton, type GlassButtonShape } from './GlassButton/GlassButton';
export { GlassDropdown } from './GlassDropdown/GlassDropdown';
export { GlassDropdownItem, type GlassDropdownItemVariant } from './GlassDropdown/GlassDropdownItem';
export { Toolbar } from './Toolbar/Toolbar';
export { ToolbarTitle } from './ToolbarTitle/ToolbarTitle';
export { ToolbarCompactDef } from './ToolbarTitle/ToolbarCompactDef';
export { TabBar } from './TabBar/TabBar';
export { TabItem } from './TabBar/TabItem';
export { SelectionIndicator } from './SelectionIndicator/SelectionIndicator';
export { Card, type CardSize } from './Card/Card';
export { CardFooter } from './Card/CardFooter';
export { SectionHeader } from './SectionHeader/SectionHeader';
export { JwiftStyleLoader } from './Jss/Jwift.Style.Loader';
export { JivHost } from './Internal/JivHost';
// Universal Liquid-Glass JSS — opt in via space-separated class names
// (`class="MyThing JwiftGlass"`) or single-inheritance (`MyThing :
// JwiftGlass {...}`). Consumer page must register it once with a
// `<jyle [source]="JwiftGlassJss" />` (or include in their own sheet
// via `@import` if/when JSS supports it). Look-only — never sets
// layout, padding, or BorderRadius.
// @ts-ignore — vite handles .jss imports as default-export strings
export { default as JwiftGlassJss } from './Glass/Jwift.Glass.jss';
