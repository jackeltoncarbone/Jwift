// Renders glass surfaces through Jaui's own resolver, instance packer and panel shaders, the way the walk
// draws a glass fill: its pyramid (level n a Gaussian of the base sigma times 2^n), its probe texel (the mean
// luma of the backdrop under it), its shadow draw, then its face with the highlight in the same fragment.
import panelVert from 'JAUI/Jiv/Shaders/Jiv.Panel.vert.gen';
import panelFrag from 'JAUI/Jiv/Shaders/Jiv.Panel.frag.gen';
import clipStackSrc from 'JAUI/Core/Shaders/Clip.Stack.glsl.gen';
import { ResolveStyle } from 'JAUI/Core/Style.Resolver';
import { DefaultJivStyle } from 'JAUI/Jiv/Jiv.Defaults';
import { JivInstanceBuffer, JivFrostCssPx, JivGlassSpan, JIV_FLOATS_PER_INSTANCE } from 'JAUI/Jiv/Jiv.InstanceBuffer';
import { GlassBlurNeedsOf } from 'JAUI/Core/Glass.Pipeline';
import { MAT_IDENTITY } from 'JAUI/Transform/Mat2x3';

// `Rim`: 'Fragment' lights the band in the glass's own fragment; 'Pass' is the walk's rim pass, the face packed
// 'Suppress' and the band drawn by the RIM_ONLY program over a scene snapshot after the content. `Photo` is content
// filling the glass's shape (an avatar's picture), drawn between the face and the rim pass.
export interface Surface { X: number; Y: number; Width: number; Height: number; Style: Record<string, string>; Rim?: 'Fragment' | 'Pass'; Photo?: [number, number, number]; }

const compile = (gl: WebGL2RenderingContext, vs: string, fs: string, defines: string[] = []): WebGLProgram => {
  const inject = (s: string) => s.replace('#pragma ClipStack', clipStackSrc).replace(/^(#version[^\n]*\n)/, '$1' + defines.map(d => '#define ' + d + ' 1\n').join(''));
  const p = gl.createProgram()!;
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(t)!; gl.shaderSource(sh, inject(s)); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'compile');
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  return p;
};

const fakeJiv = (s: Surface, vars: Record<string, string>): any => {
  const style = { ...DefaultJivStyle, ...s.Style } as any;
  const ctx = { ParentWidth: 1000, ParentHeight: 1000, PointScale: 1, ParentPointScale: 1, RootPointScale: 1, ViewportWidth: 1000, ViewportHeight: 1000, Vars: new Map(Object.entries(vars)) };
  const rs = ResolveStyle(style, ctx as any);
  return { X: s.X, Y: s.Y, Width: s.Width, Height: s.Height, RenderStyle: rs,
    EffectiveOpacity: 1, EffectiveBrightness: 1, EffectiveSaturation: 1, EffectiveContrast: 1 };
};

const QUAD_VS = '#version 300 es\nin vec2 aPos; void main(){ gl_Position = vec4(aPos, 0., 1.); }';
const BLUR_FS = `#version 300 es
precision highp float; out vec4 o; uniform sampler2D uT; uniform vec2 uRes, uDir; uniform float uSigma;
void main(){ vec2 uv = gl_FragCoord.xy / uRes; vec4 a = vec4(0.); float ws = 0.;
 float step = max(1.0, ceil(uSigma * 3.0 / 150.0)); int n = int(ceil(uSigma * 3. / step));
 for (int i = -150; i <= 150; i++) { if (abs(i) > n) continue; float x = float(i) * step; float w = uSigma < 0.01 ? (i == 0 ? 1. : 0.) : exp(-x * x / (2.*uSigma*uSigma));
  a += texture(uT, uv + uDir * x / uRes) * w; ws += w; } o = a / ws; }`;
const COPY_FS = '#version 300 es\nprecision highp float; out vec4 o; uniform sampler2D uT; uniform vec2 uRes; uniform float uFlip;\n'
  + 'void main(){ vec2 uv = gl_FragCoord.xy / uRes; if (uFlip > 0.5) uv.y = 1. - uv.y; o = texture(uT, uv); }';

export const Render = async (canvas: HTMLCanvasElement, image: HTMLImageElement, surfaces: Surface[], vars: Record<string, string>, dpr: number, skip = 0): Promise<void> => {
  const W = image.width, H = image.height;
  canvas.width = W; canvas.height = H;
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true })!;
  gl.getExtension('EXT_color_buffer_float');
  const blur = compile(gl, QUAD_VS, BLUR_FS);
  const copy = compile(gl, QUAD_VS, COPY_FS);
  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex = (w: number, h: number, levels = 1, float = false): WebGLTexture => {
    const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, levels, float ? gl.RGBA32F : gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, float ? gl.NEAREST : levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, float ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const fbo = (t: WebGLTexture, level = 0): WebGLFramebuffer => {
    const f = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, level); return f;
  };
  const src = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, src);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const sceneT = tex(W, H), snapT = tex(W, H), tmpT = tex(W, H), tmp2T = tex(W, H);
  const sceneF = fbo(sceneT), snapF = fbo(snapT), tmpF = fbo(tmpT), tmp2F = fbo(tmp2T);
  const dummy = tex(4, 4, 1, true);
  const stateT = tex(1, 1, 1, true);
  const pass = (prog: WebGLProgram, target: WebGLFramebuffer, w: number, h: number, input: WebGLTexture, set: (u: (n: string) => WebGLUniformLocation | null) => void) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target); gl.viewport(0, 0, w, h); gl.disable(gl.BLEND);
    gl.useProgram(prog); gl.bindVertexArray(quadVao);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform2f(u('uRes'), w, h); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input); gl.uniform1i(u('uT'), 0);
    set(u); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  // The scene holds top-of-scene at UV.y = 1, as the engine's does.
  pass(copy, sceneF, W, H, src, (u) => gl.uniform1f(u('uFlip'), 1));

  const glassProgram = compile(gl, panelVert, panelFrag, ['MATERIAL_GLASS']);
  const flatProgram = compile(gl, panelVert, panelFrag, ['MATERIAL_FLAT']);
  const rimProgram = compile(gl, panelVert, panelFrag, ['MATERIAL_FLAT', 'RIM_ONLY']);

  const unit = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, unit);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const inst = gl.createBuffer()!;
  const panelVao = gl.createVertexArray(); gl.bindVertexArray(panelVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, unit); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, inst);
  for (let loc = 1; loc <= 14; loc++) {
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, JIV_FLOATS_PER_INSTANCE * 4, (loc - 1) * 16);
    gl.vertexAttribDivisor(loc, 1);
  }
  const draw = (program: WebGLProgram, data: Float32Array, backdrop: WebGLTexture, baseLod: number, appearance: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneF); gl.viewport(0, 0, W, H);
    gl.useProgram(program);
    const u = (n: string) => gl.getUniformLocation(program, n);
    gl.uniform2f(u('u_Resolution'), W, H); gl.uniform2f(u('u_ViewOffset'), 0, 0);
    gl.uniform4f(u('u_BackdropXf'), 1, 1, 0, 0); gl.uniform1f(u('u_BaseFrostLod'), baseLod);
    gl.uniform1i(u('u_GlassSkip'), skip); gl.uniform1i(u('u_BgMode'), 0); gl.uniform1f(u('u_VibrancyCover'), -1);
    gl.uniform1f(u('u_GlassAppearance'), appearance);
    const bind = (name: string, index: number, t: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u(name), index); };
    bind('u_Backdrop', 0, backdrop); bind('u_ClipTex', 1, dummy); bind('u_Scene', 2, snapT); bind('u_XformTex', 3, dummy);
    bind('u_RimScene', 6, snapT);
    bind('u_ShadowState', 4, stateT); bind('u_BgTexture', 5, dummy);
    gl.bindVertexArray(panelVao); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND);
    if (program === rimProgram) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
  };
  const gauss = (sigma: number, into: WebGLFramebuffer) => {
    pass(blur, tmpF, W, H, snapT, (u) => { gl.uniform1f(u('uSigma'), sigma); gl.uniform2f(u('uDir'), 1, 0); });
    pass(blur, into, W, H, tmpT, (u) => { gl.uniform1f(u('uSigma'), sigma); gl.uniform2f(u('uDir'), 0, 1); });
  };
  const probes: number[] = [];
  for (const s of surfaces) {
    const jiv = fakeJiv(s, vars);
    const rs = jiv.RenderStyle;
    // The scene so far, sharp.
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sceneF); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, snapF);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    const frostPt = JivFrostCssPx(jiv, dpr);
    const needs = GlassBlurNeedsOf(JivGlassSpan(jiv), dpr, rs.GlassVariant);
    const base = Math.log2(Math.max(1, frostPt * dpr));
    const levels = Math.min(Math.max(1, needs.MaxLod) + 2, 9);
    const pyr = tex(W, H, levels);
    for (let n = 0; n < levels; n++) {
      gauss(Math.pow(2, base + n), tmp2F);
      const lw = Math.max(1, W >> n), lh = Math.max(1, H >> n);
      const lf = fbo(pyr, n);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, tmp2F); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, lf);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, lw, lh, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    }
    // The probe: the pyramid's mean luma under the footprint at the level the walk reads (4 pt floor).
    const probeLevel = Math.max(0, Math.round(Math.log2(Math.max(frostPt, 4) * dpr) - base));
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo(pyr, 0));
    const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    void probeLevel;
    let sum = 0;
    for (let k = 0; k < 96; k++) {
      const cx = (0.5 + (k + 1) * 0.7548776662) % 1, cy = (0.5 + (k + 1) * 0.5698402910) % 1;
      const x = Math.min(W - 1, Math.max(0, Math.floor((s.X + cx * s.Width) * dpr)));
      const y = Math.min(H - 1, Math.max(0, Math.floor((s.Y + cy * s.Height) * dpr)));
      const i = ((H - 1 - y) * W + x) * 4;
      sum += (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    }
    const mean = sum / 96;
    probes.push(mean);
    gl.bindTexture(gl.TEXTURE_2D, stateT);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array([0, mean, 0, 1]));
    // The shadow, then the face.
    const shadow = new JivInstanceBuffer(4);
    shadow.Push(jiv, dpr, MAT_IDENTITY, 0, 0, -1, 'Normal', null, 'Only');
    const sd = shadow.Data.slice(0, JIV_FLOATS_PER_INSTANCE);
    if (sd[23] > 0) {
      if (sd[38] > 1.5) draw(glassProgram, sd, pyr, base, 0);
      else draw(flatProgram, sd, dummy, 0, -1);
    }
    const rimPass = s.Rim === 'Pass';
    const face = new JivInstanceBuffer(4);
    face.Push(jiv, dpr, MAT_IDENTITY, 0, 0, -1, rimPass ? 'Suppress' : 'Normal', null, 'Excluded');
    draw(glassProgram, face.Data.slice(0, JIV_FLOATS_PER_INSTANCE), pyr, base, 0);
    if (s.Photo) {
      const [r, g, b] = s.Photo;
      const photo = fakeJiv({ X: s.X, Y: s.Y, Width: s.Width, Height: s.Height,
        Style: { BorderRadius: s.Style.BorderRadius ?? '0', Background: `rgba(${r}, ${g}, ${b}, 1)` } }, vars);
      const pb = new JivInstanceBuffer(4);
      pb.Push(photo, dpr, MAT_IDENTITY, 0, 0, -1, 'Normal', null, 'Excluded');
      draw(flatProgram, pb.Data.slice(0, JIV_FLOATS_PER_INSTANCE), dummy, 0, -1);
    }
    if (rimPass && !(skip & 4)) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sceneF); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, snapF);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      const rb = new JivInstanceBuffer(4);
      rb.Push(jiv, dpr, MAT_IDENTITY, 0, 0, -1, 'RimOnly');
      draw(rimProgram, rb.Data.slice(0, JIV_FLOATS_PER_INSTANCE), dummy, 0, 0);
    }
  }
  (window as any).__probe = probes;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
  pass(copy, null as any, W, H, sceneT, (u) => gl.uniform1f(u('uFlip'), 0));
  const err = gl.getError(); if (err) throw new Error('gl error ' + err);
};
(window as any).JauiHarness = { Render };
