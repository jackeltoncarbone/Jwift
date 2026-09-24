// Renders glass surfaces with Jaui's own resolver, instance packer, outline and shaders.
import panelVert from 'JAUI/Jiv/Shaders/Jiv.Panel.vert.gen';
import panelFrag from 'JAUI/Jiv/Shaders/Jiv.Panel.frag.gen';
import { ResolveStyle } from 'JAUI/Core/Style.Resolver';
import { DefaultJivStyle } from 'JAUI/Jiv/Jiv.Defaults';
import { JivInstanceBuffer, JivFrostCssPx, JIV_FLOATS_PER_INSTANCE } from 'JAUI/Jiv/Jiv.InstanceBuffer';
import { MAT_IDENTITY } from 'JAUI/Transform/Mat2x3';
import { PROGRESSIVE_BLUR_VERT, PROGRESSIVE_BLUR_FRAG } from 'JAUI/ProgressiveBlur/ProgressiveBlur.Shader';
import { FoldLift, LiftGraded } from 'JAUI/Core/Lift';

const RIM_WHITE_SHARE = 0.96;
const DPR = 3;

export interface Surface { X: number; Y: number; Width: number; Height: number; Style: Record<string, string>; Edge?: boolean; Old?: boolean; Base?: string; Flat?: boolean; }

const compile = (gl: WebGL2RenderingContext, vs: string, fs: string, defines: string[] = []): WebGLProgram => {
  const inject = (s: string) => s.replace(/^(#version[^\n]*\n)/, '$1' + defines.map(d => '#define ' + d + ' 1\n').join(''));
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

const texFrom = (gl: WebGL2RenderingContext, w: number, h: number, src: TexImageSource | null, float = false): WebGLTexture => {
  const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
  if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
  else gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA32F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.FLOAT : gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, float ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, float ? gl.NEAREST : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
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
void main(){ vec2 uv = gl_FragCoord.xy / uRes; vec4 a = vec4(0.); float ws = 0.; int n = int(ceil(uSigma * 3.));
 for (int i = -90; i <= 90; i++) { if (abs(i) > n) continue; float w = uSigma < 0.01 ? (i == 0 ? 1. : 0.) : exp(-float(i*i) / (2.*uSigma*uSigma));
  a += texture(uT, uv + uDir * float(i) / uRes) * w; ws += w; } o = a / ws; }`;
const BLIT_FS = '#version 300 es\nprecision highp float; out vec4 o; uniform sampler2D uT; uniform vec2 uRes; uniform float uFlip;\n'
  + 'void main(){ vec2 uv = gl_FragCoord.xy / uRes; if (uFlip > 0.5) uv.y = 1. - uv.y; o = texture(uT, uv); }';

export const Render = async (canvas: HTMLCanvasElement, image: HTMLImageElement, surfaces: Surface[], vars: Record<string, string>): Promise<void> => {
  const W = image.width, H = image.height;
  canvas.width = W; canvas.height = H;
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true })!;
  gl.getExtension('EXT_color_buffer_float');
  const blur = compile(gl, QUAD_VS, BLUR_FS);
  const blit = compile(gl, QUAD_VS, BLIT_FS);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const target = () => { const t = texFrom(gl, W, H, null); const f = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f }; };
  // The scene FBO holds top-of-scene at UV.y = 1, as the engine's does: the image uploads unflipped
  // and the blit into it flips.
  const src = texFrom(gl, W, H, image);
  const scene = target(), snap = target(), tmp = target(), frost = target();
  const dummy = texFrom(gl, 4, 4, null, true);
  gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H);
  gl.useProgram(blit); gl.uniform2f(gl.getUniformLocation(blit, 'uRes'), W, H); gl.uniform1f(gl.getUniformLocation(blit, 'uFlip'), 1);
  gl.bindTexture(gl.TEXTURE_2D, src); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const glassProgram = compile(gl, panelVert, panelFrag, ['MATERIAL_GLASS']);
  const flatProgram = compile(gl, panelVert, panelFrag, ['MATERIAL_FLAT']);
  const rimProgramEarly = compile(gl, panelVert, panelFrag, ['MATERIAL_FLAT', 'RIM_ONLY']);
  const rimProgram = rimProgramEarly;
  const pblurProgram = compile(gl, PROGRESSIVE_BLUR_VERT, PROGRESSIVE_BLUR_FRAG);
  // The strip's sharp-rooted pyramid: level 0 the raw scene, box mips above it (the engine's are Gaussian).
  const pyr = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, pyr);
  const levels = Math.floor(Math.log2(Math.max(W, H))) + 1;
  gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, W, H);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const pyrFbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, pyrFbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pyr, 0);
  let inEdge = false;
  let edgeBase = 0;
  let edgeMode = 'ramp';
  let edge = { Start: 0, Length: 1, Easing: 1, MaxLod: 1 };

  const unit = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, unit);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const inst = gl.createBuffer()!;
  const unitVao = gl.createVertexArray(); gl.bindVertexArray(unitVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, unit); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const panelVao = gl.createVertexArray(); gl.bindVertexArray(panelVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, unit); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, inst);
  for (let loc = 1; loc <= 14; loc++) {
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, JIV_FLOATS_PER_INSTANCE * 4, (loc - 1) * 16);
    gl.vertexAttribDivisor(loc, 1);
  }

  const panelDraw = (program: WebGLProgram, data: Float32Array, baseFrostLod: number, draw?: () => void, backdrop?: WebGLTexture) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H);
    gl.useProgram(program);
    const u = (n: string) => gl.getUniformLocation(program, n);
    gl.uniform2f(u('u_Resolution'), W, H); gl.uniform2f(u('u_ViewOffset'), 0, 0);
    gl.uniform4f(u('u_BackdropXf'), 1, 1, 0, 0); gl.uniform1f(u('u_BaseFrostLod'), baseFrostLod);
    gl.uniform2f(u('u_SpecularTilt'), 0, 0); gl.uniform1i(u('u_GlassSkip'), 0); gl.uniform1i(u('u_BgMode'), 0);
    gl.uniform2f(u('u_ShadowBackdrop'), -1, 0); gl.uniform2f(u('u_GlassAdapt'), -1, 0);
    const bind = (name: string, index: number, t: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u(name), index); };
    bind('u_Backdrop', 0, backdrop ?? frost.t); bind('u_ClipTex', 1, dummy); bind('u_Scene', 2, snap.t); bind('u_XformTex', 3, dummy);
    bind('u_ShadowState', 4, dummy); bind('u_BgTexture', 5, dummy);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(panelVao); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    if (draw) { draw(); return; }
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
  };
  const copyScene = () => {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, scene.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, snap.f);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
  };
  const blurSnap = (sigma: number) => {
    gl.disable(gl.BLEND); gl.useProgram(blur); gl.bindVertexArray(quadVao); gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(blur, 'uRes'), W, H); gl.uniform1f(gl.getUniformLocation(blur, 'uSigma'), sigma);
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(gl.getUniformLocation(blur, 'uT'), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmp.f); gl.bindTexture(gl.TEXTURE_2D, snap.t); gl.uniform2f(gl.getUniformLocation(blur, 'uDir'), 1, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frost.f); gl.bindTexture(gl.TEXTURE_2D, tmp.t); gl.uniform2f(gl.getUniformLocation(blur, 'uDir'), 0, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // The engine's edge level (Jaui.ts, the edge fill): the heavier of the surface's frost and the strip's
  // blur at its centre, landed through the base.
  const edgeBaseFor = (s: Surface): number => {
    if (edgeMode === 'dpr') return edgeBase;
    const frost = Math.max(1 / DPR, JivFrostCssPx(fakeJiv(s, vars)));
    const inst = Math.max(0, Math.min(10, Math.log2(Math.max(0.5, frost * DPR))));
    const t = Math.max(0, Math.min(1, ((s.Y + s.Height / 2) * DPR - edge.Start) / edge.Length));
    const ramp = Math.pow(t * t * (3 - 2 * t), edge.Easing);
    const level = Math.min(edge.MaxLod, Math.max(Math.log2(Math.max(1, frost * DPR)), ramp * ramp * edge.MaxLod));
    return inst - level;
  };
  for (const s of surfaces) {
    const jiv = fakeJiv(s, vars);
    const rs = jiv.RenderStyle;
    if (s.Edge) {
      copyScene();
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, scene.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, pyrFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, pyr); gl.generateMipmap(gl.TEXTURE_2D);
      const maxLod = Math.max(1, Math.log2(Math.max(1, rs.BackdropFrostBlur * DPR / DPR)));
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H);
      gl.useProgram(pblurProgram);
      const u = (n: string) => gl.getUniformLocation(pblurProgram, n);
      gl.uniform2f(u('u_Resolution'), W, H);
      gl.uniform4f(u('u_Rect'), s.X * DPR, s.Y * DPR, s.Width * DPR, s.Height * DPR);
      gl.uniform4f(u('u_Rot'), 1, 0, 0, 0);
      gl.uniform4f(u('u_PyramidXf'), 1, 1, 0, 0);
      gl.uniform1f(u('u_MaxLod'), maxLod);
      gl.uniform1i(u('u_Direction'), ({ ToTop: 0, ToBottom: 1, ToLeft: 2, ToRight: 3 } as Record<string, number>)[rs.ProgressiveBlurDirection] ?? 0);
      gl.uniform1f(u('u_Feather'), 0);
      gl.uniform1f(u('u_Easing'), Math.max(0.001, rs.ProgressiveBlurEasing));
      gl.uniform1f(u('u_Opacity'), 1);
      gl.uniform4f(u('u_Background'), 0, 0, 0, 0);
      const g = FoldLift(rs.BackdropBrightness, rs.BackdropContrast, LiftGraded(jiv));
      gl.uniform3f(u('u_Grading'), g.Brightness, rs.BackdropSaturation, g.Contrast);
      gl.uniform2i(u('u_ClipMeta'), 0, 0);
      gl.uniform1i(u('u_HasStops'), 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, snap.t); gl.uniform1i(u('u_Scene'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, pyr); gl.uniform1i(u('u_Pyramid'), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, dummy); gl.uniform1i(u('u_ClipTex'), 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindVertexArray(unitVao);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      inEdge = !s.Old;
      edgeMode = s.Base ?? 'ramp';
      edgeBase = Math.log2(DPR);
      edge = { Start: s.Y * DPR, Length: s.Height * DPR, Easing: Math.max(0.001, rs.ProgressiveBlurEasing), MaxLod: maxLod };
      continue;
    }
    // A flat element (no glass fill): its Lift() under-draw, additive, then its rim. As the walk draws it.
    if (s.Flat) {
      if (rs.BackdropLift !== 0) {
        const liftBuffer = new JivInstanceBuffer(4);
        liftBuffer.Push(jiv, DPR, MAT_IDENTITY, 0, 0, -1, 'LiftOnly');
        panelDraw(flatProgram, liftBuffer.Data.slice(0, JIV_FLOATS_PER_INSTANCE), 0, () => {
          gl.enable(gl.BLEND);
          if (rs.BackdropLift > 0) gl.blendEquation(gl.FUNC_ADD);
          else gl.blendEquationSeparate(gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD);
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
          gl.blendEquation(gl.FUNC_ADD);
        });
      }
    } else {
    // As the walk: the pyramid first, then the shadow alone and flat, then the surface.
    copyScene();
    const frostCssPx = Math.max(1 / DPR, JivFrostCssPx(jiv));
    if (!inEdge) blurSnap(frostCssPx * DPR);
    const shadowBuffer = new JivInstanceBuffer(4);
    shadowBuffer.Push(jiv, DPR, MAT_IDENTITY, 0, 0, -1, 'Normal', null, 'Only');
    if (rs.ShadowColor.A > 0) panelDraw(flatProgram, shadowBuffer.Data.slice(0, JIV_FLOATS_PER_INSTANCE), 0);
    const glassBuffer = new JivInstanceBuffer(4);
    glassBuffer.Push(jiv, DPR, MAT_IDENTITY, 0, 0, -1, 'Normal', null, 'Excluded');
    panelDraw(glassProgram, glassBuffer.Data.slice(0, JIV_FLOATS_PER_INSTANCE),
      inEdge ? edgeBaseFor(s) : Math.log2(Math.max(1, frostCssPx * DPR)), undefined, inEdge ? pyr : undefined);
    }
    if (rs.RimWidth > 0 && rs.RimStrength > 0) {
      const rimBuffer = new JivInstanceBuffer(4);
      rimBuffer.Push(jiv, DPR, MAT_IDENTITY, 0, 0, -1, 'RimOnly');
      const data = rimBuffer.Data.slice(0, JIV_FLOATS_PER_INSTANCE);
      panelDraw(rimProgram, data, 0, () => {
        const u = (n: string) => gl.getUniformLocation(rimProgram, n);
        gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD);
        gl.uniform1f(u('u_RimPass'), 1);
        gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE, gl.ZERO, gl.ONE);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
        gl.uniform1f(u('u_RimPass'), RIM_WHITE_SHARE);
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ZERO, gl.ONE);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
      });
    }
    copyScene();
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND);
  gl.useProgram(blit); gl.bindVertexArray(quadVao); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.t);
  gl.uniform2f(gl.getUniformLocation(blit, 'uRes'), W, H); gl.uniform1f(gl.getUniformLocation(blit, 'uFlip'), 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const err = gl.getError(); if (err) throw new Error('gl error ' + err);
};
(window as any).JauiHarness = { Render };
