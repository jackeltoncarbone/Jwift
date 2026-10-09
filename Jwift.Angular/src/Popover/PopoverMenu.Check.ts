/**
 * WHETHER THIS PAGE'S ROWS ACTUALLY WEAR A LEADING MARK.
 *
 * Pulled out of `PopoverMenu` so `ShowsLeadingMenuColumn` (`Internal/PointerMedia.ts`) has a plain boolean
 * to combine with the reader's pointer, and so a spec can drive it with bare data instead of mounting the
 * component. A row's mark is its checkmark (`Checked`) or, the SAME column (`PopoverMenuItem.Icon`'s own
 * doc comment: never both on one row), its icon. Duck-typed rather than importing `PopoverMenuItem` itself,
 * the same reason `GlassDropdown.Escape.ts`'s own `EscapeStep` takes bare primitives — no import cycle back
 * into the component this helper exists to keep pure.
 */
export function PopoverMenuHasLeadingMark(
  items: readonly { readonly Kind: string; readonly Checked?: boolean | null; readonly Icon?: string }[],
): boolean {
  return items.some((item) => item.Kind === 'Item' && (!!item.Checked || !!item.Icon));
}
