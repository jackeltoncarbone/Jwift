/**
 * Apple's keyboard conventions for a control that holds keyboard focus (HIG Keyboard conventions,
 * section 24: "Tab moves focus forward through controls, Shift-Tab moves it backward"; "Esc... cancels
 * the current action"). Tab/Shift-Tab traversal itself is never this file's job — `JivHost` gives a
 * focusable control a real `tabIndex`, in real DOM document order, so the browser's own native Tab
 * walks it; these two predicates are only what a `keydown` on an already-focused control still has to
 * decide for itself: which key activates it, and which key leaves it. Pure so they are cheap to pin
 * (no Angular, no jaui, no DOM).
 */

/** Space and Return both activate a focused control; nothing else does. */
export function IsActivationKey(key: string): boolean {
  return key === ' ' || key === 'Enter';
}

/** Esc leaves the control that holds keyboard focus. */
export function IsEscapeKey(key: string): boolean {
  return key === 'Escape';
}
