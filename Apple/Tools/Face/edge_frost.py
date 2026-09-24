import io
p = r'C:\Users\jackc\Code\Repositories\show-studio\ShowStudio.Libraries\Jaui\Jaui\src\Core\Jaui.ts'
s = io.open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
s = s.replace('\r\n', '\n')
def rep(a, b):
    global s
    assert s.count(a) == 1, (a[:90], s.count(a)); s = s.replace(a, b)
a = s.index('/** A scroll edge\'s pyramid, handed to the glass in its subtree')
b = s.index('/** ONE GLASS GROUP')
s = s[:a] + """/** A scroll edge's pyramid, handed to the glass in its subtree: the handle, the region it covers and the
 *  deepest level built. A surface in it reads the content at its own frost, undimmed. */
interface EdgeBackdrop {
  Handle: GpuTextureHandle;
  Region: { x: number; y: number; w: number; h: number };
  MaxLod: number;
}

""" + s[b:]
rep("""        // Handed to the subtree's glass only for a plain ramp along the element's own unrotated axis.
        if (lastBackdrop !== null && node.RenderStyle.ProgressiveBlurStops === null && !_rotated) {
          const vertical = dir === 'ToTop' || dir === 'ToBottom';
          const lo = vertical ? py : px;
          const span = feather > 0 ? feather : (vertical ? ph : pw);
          const toEnd = dir === 'ToBottom' || dir === 'ToRight';
          edgeHere = {
            Handle: lastBackdrop, Region: region, MaxLod: maxLod, Vertical: vertical,
            // t runs from the clear end: the top for ToBottom, the bottom for ToTop.
            Start: toEnd ? lo : lo + (vertical ? ph : pw),
            Length: toEnd ? span : -span,
            Easing: Math.max(0.001, node.RenderStyle.ProgressiveBlurEasing),
          };
        }
""", """        // Handed to the subtree's glass only for a plain ramp along the element's own unrotated axis.
        if (lastBackdrop !== null && node.RenderStyle.ProgressiveBlurStops === null && !_rotated) {
          edgeHere = { Handle: lastBackdrop, Region: region, MaxLod: maxLod };
        }
""")
rep("""          // Inside a scroll edge: the strip's own pyramid, when this surface's sample region lies within
          // it. The strip's level n is a Gaussian about 2^n device px wide over a raw level 0, and the
          // surface reads it at the heavier of its own frost and the strip's blur where the surface's
          // centre sits: blurred as the strip blurs the content there, but not dimmed. A frost-0 surface
          // reads the raw scene snapshot, which the strip has since dimmed, so it builds its own.""",
"""          // Inside a scroll edge: the strip's own pyramid, when this surface's sample region lies within
          // it. The strip's level n is a Gaussian about 2^n device px wide over a raw level 0, and the
          // surface reads it at its OWN frost, undimmed: Apple's bar keeps the content under it as sharp
          // as its frost (0.4 to 0.9pt), whatever the strip around it blurs to. A frost-0 surface reads
          // the raw scene snapshot, which the strip has since dimmed, so it builds its own.""")
rep("""            const centre = edgeFill.Vertical ? py + ph * 0.5 : px + pw * 0.5;
            const level = Math.min(edgeFill.MaxLod,
              Math.max(Math.log2(Math.max(1, frostCssPx * d)), _edgeLodAt(edgeFill, centre)));""",
"""            const level = Math.min(edgeFill.MaxLod, Math.log2(Math.max(1, frostCssPx * d)));""")
io.open(p, 'w', encoding='utf-8', newline='').write(s.replace('\n', nl))
print('ok')
