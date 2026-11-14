import {build} from 'esbuild';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
await mkdir('dist/icons',{recursive:true});
for(const f of ['index.html','app.css','manifest.webmanifest'])await copyFile(`pwa/${f}`,`dist/${f}`);
await build({entryPoints:['pwa/app.js'],bundle:true,minify:true,format:'esm',target:['es2022'],outfile:'dist/app.js'});
// Generate app-owned PNG artwork directly; no remote image/font dependencies.
function crc(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,body){const t=Buffer.from(type),n=Buffer.alloc(4),checksum=Buffer.alloc(4);n.writeUInt32BE(body.length);checksum.writeUInt32BE(crc(Buffer.concat([t,body])));return Buffer.concat([n,t,body,checksum]);}
// Match the sidebar brand mark: three round corners and a smaller bottom-right corner.
function insideMark(x,y,inset=0){
  const left=.25+inset,right=.75-inset,top=.25+inset,bottom=.75-inset;
  if(x<left||x>right||y<top||y>bottom)return false;
  const radius=(x>.5&&y>.5?.09:.25)-inset;
  const cx=x<.5?left+radius:right-radius,cy=y<.5?top+radius:bottom-radius;
  return (x>=left+radius&&x<=right-radius)||(y>=top+radius&&y<=bottom-radius)||Math.hypot(x-cx,y-cy)<=radius;
}
function icon(size){
  const pixels=Buffer.alloc((size*4+1)*size),samples=4;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const color=[0,0,0];
    for(let sy=0;sy<samples;sy++)for(let sx=0;sx<samples;sx++){
      const nx=(x+(sx+.5)/samples)/size,ny=(y+(sy+.5)/samples)/size;
      const h=ny>=.395&&ny<=.605&&((nx>=.415&&nx<=.441)||(nx>=.559&&nx<=.585)||(ny>=.486&&ny<=.512&&nx>=.415&&nx<=.585));
      const outline=insideMark(nx,ny)&&!insideMark(nx,ny,.011);
      const sample=h?[212,232,183]:outline?[139,181,155]:[18,63,50];
      for(let c=0;c<3;c++)color[c]+=sample[c]/(samples*samples);
    }
    const p=y*(size*4+1)+1+x*4;
    for(let c=0;c<3;c++)pixels[p+c]=Math.round(color[c]);
    pixels[p+3]=255;
  }
  const head=Buffer.alloc(13);head.writeUInt32BE(size);head.writeUInt32BE(size,4);head[8]=8;head[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
await writeFile('dist/icons/icon-192.png',icon(192));await writeFile('dist/icons/icon-512.png',icon(512));await writeFile('dist/icons/maskable-512.png',icon(512));
const assets=['./','./index.html','./app.js','./app.css','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
const hash=createHash('sha256');for(const f of assets.slice(1))hash.update(await readFile(`dist/${f.slice(2)}`));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`const PREFIX='hipos-shell-'+self.registration.scope;\nconst CACHE=PREFIX+'${version}';\nconst ASSETS=${JSON.stringify(assets)};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));\nself.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});\nself.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));\nself.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return (await cache.match('./index.html'))||fetch(event.request);return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);})());});\n`);
console.log(`HIPOS built in dist/ (offline cache ${version}).`);
