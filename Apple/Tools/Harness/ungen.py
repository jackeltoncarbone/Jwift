"""Write the resolved shader sources (the .gen.ts modules, includes spliced) for compile.html."""
import io, os
J = r'C:\Users\jackc\Code\Repositories\show-studio\ShowStudio.Libraries\Jaui\Jaui\src'
HERE = os.path.dirname(os.path.abspath(__file__))
def ungen(p):
    s = io.open(p, encoding='utf-8').read()
    start = s.index('export default `') + len('export default `')
    body = s[start:s.rindex('`')]
    return body.replace('\\`', '`').replace('\\${', '${').replace('\\\\', '\\')
for src, dst in [(r'\Jiv\Shaders\Jiv.Panel.frag.gen.ts', 'panel.frag'), (r'\Jiv\Shaders\Jiv.Panel.vert.gen.ts', 'panel.vert')]:
    io.open(os.path.join(HERE, dst), 'w', encoding='utf-8').write(ungen(J + src))
print('ok')
for src, dst in [(r'\Text\Shaders\Text.Quad.frag.gen.ts', 'text.frag'), (r'\Text\Shaders\Text.Quad.vert.gen.ts', 'text.vert'), (r'\Core\Shaders\Clip.Stack.glsl.gen.ts', 'clip.glsl')]:
    io.open(os.path.join(HERE, dst), 'w', encoding='utf-8').write(ungen(J + src))
