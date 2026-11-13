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
function icon(size){const pixels=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=x/size,ny=y/size;const h=ny>.28&&ny<.72&&((nx>.30&&nx<.39)||(nx>.61&&nx<.70)||(ny>.46&&ny<.55&&nx>.30&&nx<.70));const color=h?[225,234,190]:[18,63,50];const p=y*(size*4+1)+1+x*4;pixels[p]=color[0];pixels[p+1]=color[1];pixels[p+2]=color[2];pixels[p+3]=255;}const head=Buffer.alloc(13);head.writeUInt32BE(size);head.writeUInt32BE(size,4);head[8]=8;head[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);}
await writeFile('dist/icons/icon-192.png',icon(192));await writeFile('dist/icons/icon-512.png',icon(512));await writeFile('dist/icons/maskable-512.png',icon(512));
const assets=['./','./index.html','./app.js','./app.css','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
const hash=createHash('sha256');for(const f of assets.slice(1))hash.update(await readFile(`dist/${f.slice(2)}`));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`const PREFIX='hipos-shell-'+self.registration.scope;\nconst CACHE=PREFIX+'${version}';\nconst ASSETS=${JSON.stringify(assets)};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));\nself.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));\nself.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return (await cache.match('./index.html'))||fetch(event.request);return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);})());});\n`);
console.log(`HIPOS built in dist/ (offline cache ${version}).`);
