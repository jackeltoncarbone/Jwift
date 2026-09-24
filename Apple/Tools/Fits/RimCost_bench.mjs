// Rim pass cost: per glass surface, one box-sized scene snapshot + a rim draw, against the in-fragment rim
// (no extra draw, no copy). Scene at 390x844 pt, dpr 3. Two GPUs: the machine's (ANGLE D3D11) and SwiftShader.
import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';

const body = () => {
  const W = 1170, H = 2532;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const gl = c.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
  const prog = (fs) => {
    const p = gl.createProgram();
    const vs = '#version 300 es\nin vec2 a; uniform vec4 r; uniform vec2 res; out vec2 uv; void main(){ vec2 px = r.xy + a * r.zw; uv = px / res; gl_Position = vec4(px / res * 2. - 1., 0., 1.); }';
    for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); gl.attachShader(p, sh); }
    gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); return p;
  };
  // The face stands in for the glass fragment (a few taps), the rim for RIM_ONLY (one tap of the snapshot).
  const face = prog('#version 300 es\nprecision highp float; in vec2 uv; uniform sampler2D t; out vec4 o; void main(){ vec3 s = vec3(0.); for (int i = 0; i < 4; i++) s += texture(t, uv + float(i) * 0.001).rgb; o = vec4(s * 0.25, 1.); }');
  const rim = prog('#version 300 es\nprecision highp float; in vec2 uv; uniform sampler2D t; out vec4 o; void main(){ vec3 u = texture(t, uv).rgb; o = vec4(clamp(u * 1.4 + 0.1, 0., 1.), 0.3); }');
  const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); return t; };
  const sceneT = tex(), snapT = tex(), artT = tex();
  const sceneF = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, sceneF);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneT, 0);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const quad = (p, t, x, y, w, h) => { gl.useProgram(p); gl.uniform4f(gl.getUniformLocation(p, 'r'), x, y, w, h);
    gl.uniform2f(gl.getUniformLocation(p, 'res'), W, H); gl.bindTexture(gl.TEXTURE_2D, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  // The library page's glass at 3x: a tab bar, a search button, 6 card pills, 2 avatars, 2 header buttons.
  const boxes = [[36, 2280, 1098, 186], [36, 2280, 186, 186], [48, 120, 144, 144], [978, 120, 144, 144]];
  for (let i = 0; i < 6; i++) boxes.push([60 + (i % 2) * 560, 700 + Math.floor(i / 2) * 500, 320, 144]);
  for (let i = 0; i < 2; i++) boxes.push([60 + i * 560, 560, 108, 108]);
  const frame = (pass) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneF); gl.viewport(0, 0, W, H); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    quad(face, artT, 0, 0, W, H);
    for (const [x, y, w, h] of boxes) {
      quad(face, artT, x, y, w, h);
      if (pass) {
        gl.bindTexture(gl.TEXTURE_2D, snapT);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, x - 1, y - 1, x - 1, y - 1, w + 2, h + 2);
        quad(rim, snapT, x - 1, y - 1, w + 2, h + 2);
      }
    }
  };
  const time = (pass, n) => { for (let i = 0; i < 20; i++) frame(pass); gl.finish();
    const t0 = performance.now(); for (let i = 0; i < n; i++) frame(pass); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return (performance.now() - t0) / n; };
  const out = {};
  for (let k = 0; k < 3; k++) { out['fragment' + k] = time(false, 150); out['pass' + k] = time(true, 150); }
  out.renderer = gl.getParameter(gl.RENDERER);
  return out;
};

for (const [name, args] of [['gpu', ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']], ['swiftshader', ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']]]) {
  const browser = await chromium.launch({ args });
  const page = await browser.newPage();
  const r = await page.evaluate(body);
  const med = (k) => [0, 1, 2].map(i => r[k + i]).sort((a, b) => a - b)[1];
  console.log(`${name} (${r.renderer}): in-fragment ${med('fragment').toFixed(3)} ms/frame, rim pass ${med('pass').toFixed(3)} ms/frame, +${(med('pass') - med('fragment')).toFixed(3)} ms for 12 glass`);
  await browser.close();
}
