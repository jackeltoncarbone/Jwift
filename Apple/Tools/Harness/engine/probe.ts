import { ResolveStyle } from 'JAUI/Core/Style.Resolver';
import { DefaultJivStyle } from 'JAUI/Jiv/Jiv.Defaults';
import { JivFrostCssPx } from 'JAUI/Jiv/Jiv.InstanceBuffer';
import * as fs from 'fs';
const spec = JSON.parse(fs.readFileSync('specs/circle-photo.json', 'utf8'));
const s = spec.surfaces[0];
const rs: any = ResolveStyle({ ...DefaultJivStyle, ...s.Style } as any, { ParentWidth: 1000, ParentHeight: 1000, PointScale: 1, ParentPointScale: 1, RootPointScale: 1, ViewportWidth: 1000, ViewportHeight: 1000, Vars: new Map(Object.entries(spec.vars)) } as any);
console.log('blur', rs.BackdropFrostBlur, 'auto', rs.BackdropFrostAuto, 'frost', JivFrostCssPx({ ...s, RenderStyle: rs } as any), 'b/s/c', rs.BackdropBrightness, rs.BackdropSaturation, rs.BackdropContrast, 'tint', rs.Tint, 'thick', rs.Thickness, 'rim', rs.RimWidth, rs.RimStrength);
