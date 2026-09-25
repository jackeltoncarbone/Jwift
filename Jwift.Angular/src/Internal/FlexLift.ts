// UIKit's flex lift and big glow live with the flex itself, in Jaui (Core/Flex.ts).
export { FlexLiftScale, FlexBigGlow } from 'jaui';
/** The flex loupe's movement scale for a velocity along x in pt/s: 1 + v / movementNormalizationFactor (2500), held
 *  to movementMinScale 0.75 and movementMaxScale 1.15 (loupe setDefaultValues 0x188c4ed80). Signed on velocity, the
 *  cross axis taking the inverse, as Apple's own drag shows (Jwift/Apple/LiquidGlass.md 9). */
export const FlexMovementScale = (velocity: number): number => Math.min(1.15, Math.max(0.75, 1 + velocity / 2500));
