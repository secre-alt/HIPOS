import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import './build-pwa.mjs';
const root=resolve(process.env.HIPOS_ROOT||'dist'),port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.json':'application/json'};
// Apply the same response headers as production (vercel.json), so local runs and tests see the real
// security policy and caching rules. Later rules override earlier ones, like Vercel.
const config=JSON.parse(await readFile('vercel.json','utf8').catch(()=>'{}'));
const rules=(config.headers||[]).map(rule=>({test:rule.source.includes('(')?new RegExp('^'+rule.source+'$'):null,path:rule.source,headers:rule.headers}));
function headersFor(pathname){const out={};for(const rule of rules)if(rule.test?rule.test.test(pathname):rule.path===pathname)for(const h of rule.headers)out[h.key]=h.value;return out;}
http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache',...headersFor(pathname)});res.end(await readFile(path));}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`HIPOS: http://localhost:${port}`));
