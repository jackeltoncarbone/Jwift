import * as esbuild from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.App/node_modules/esbuild/lib/main.js';
const src = 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/tests/Corner.Apple.test.ts';
const shim = `const R=[];export const describe=(n,f)=>f();export const it=(n,f)=>{try{f();R.push('ok '+n)}catch(e){R.push('FAIL '+n+': '+e.message)}};export const expect=(v)=>({toBeLessThan:(x)=>{if(!(v<x))throw new Error(v+' !< '+x)},toContain:(x)=>{if(!v.includes(x))throw new Error('missing '+x)}});globalThis.__R=R;`;
await esbuild.build({ entryPoints: [src], bundle: true, platform: 'node', format: 'esm', outfile: 'corner_test.bundle.mjs', logLevel: 'error',
  plugins: [{ name: 'v', setup(b) { b.onResolve({ filter: /^vitest$/ }, () => ({ path: 'vitest', namespace: 'v' })); b.onLoad({ filter: /.*/, namespace: 'v' }, () => ({ contents: shim, loader: 'js' })); } }],
  define: { __dirname: JSON.stringify('C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/tests') } });
await import('./corner_test.bundle.mjs?' + Date.now());
console.log(globalThis.__R.join('\n'));
