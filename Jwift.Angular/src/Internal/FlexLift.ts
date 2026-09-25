// UIKit's _UIFlexInteraction lift, the pressed swell: liftScalePoints interpolated between the small variant (16 pt
// at 44 pt) and the large one (4 pt at 160 pt) by the shorter side, added to the longer (UIKitCore setDefaultValues
// 0x188c4f3c0 and 0x188c4ebe0, interpolation sub_188f76b80; Jwift/Apple/LiquidGlass.md 7).
const flexT = (width: number, height: number): number => Math.min(1, Math.max(0, (Math.min(width, height) - 44) / (160 - 44)));
export const FlexLiftScale = (width: number, height: number): number => {
  const points = 16 + (4 - 16) * flexT(width, height);
  return 1 + points / Math.max(width, height, 1);
};
/** The flex's big glow while pressed: bigGlowOpacity, 1 on the small variant and 0 on the large, by the same
 *  interpolation (the glass's GlassGlow). */
export const FlexBigGlow = (width: number, height: number): number => 1 - flexT(width, height);
/** The flex loupe's movement scale for a velocity along x in pt/s: 1 + v / movementNormalizationFactor (2500), held
 *  to movementMinScale 0.75 and movementMaxScale 1.15 (loupe setDefaultValues 0x188c4ed80). Signed on velocity, the
 *  cross axis taking the inverse, as Apple's own drag shows (Jwift/Apple/LiquidGlass.md 9). */
export const FlexMovementScale = (velocity: number): number => Math.min(1.15, Math.max(0.75, 1 + velocity / 2500));
