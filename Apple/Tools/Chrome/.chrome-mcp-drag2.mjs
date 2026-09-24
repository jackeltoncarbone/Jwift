// Press at x,y, move through a series of dx offsets capturing each, then release and capture.
//   VW=.. VH=.. DPR=.. node ~/.chrome-mcp-drag2.mjs x y outPrefix dx1,dx2,dx3
const BASE='http://127.0.0.1:9222';
const [x,y]=process.argv.slice(2,4).map(Number);
const prefix=process.argv[4];
const offsets=(process.argv[5]||'0').split(',').map(Number);
const vw=Number(process.env.VW??-1), vh=Number(process.env.VH??0), dpr=Number(process.env.DPR??1);
const targets=await (await fetch(`${BASE}/json/list`)).json();
const page=targets.find(t=>t.type==='page'&&t.url.includes('localhost:6767'))||targets.find(t=>t.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);
let id=0; const pending=new Map();
const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){const{res,rej}=pending.get(m.id);pending.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result);}});
await new Promise(r=>ws.addEventListener('open',r));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
if(vw>0){await send('Emulation.setDeviceMetricsOverride',{width:vw,height:vh||900,deviceScaleFactor:dpr,mobile:false});await sleep(2500);}
const {writeFileSync}=await import('node:fs');
await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
await sleep(220);
for(let i=0;i<offsets.length;i++){
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+offsets[i],y,button:'left',buttons:1});
  await sleep(320);
  const {data}=await send('Page.captureScreenshot',{format:'png'});
  writeFileSync(`${prefix}_d${i}.png`,Buffer.from(data,'base64'));
  console.log(`captured dx=${offsets[i]}`);
}
// release far away from the control: a pointer up ANYWHERE must finish the gesture
await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+400,y:y+260,button:'left',buttons:1});
await sleep(150);
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+400,y:y+260,button:'left',buttons:0,clickCount:1});
await sleep(700);
const {data}=await send('Page.captureScreenshot',{format:'png'});
writeFileSync(`${prefix}_release.png`,Buffer.from(data,'base64'));
console.log('released far off the control');
ws.close();
