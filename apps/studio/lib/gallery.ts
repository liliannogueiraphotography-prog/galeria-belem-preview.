import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {galleryContext} from './service.ts';
import {origin} from './auth.ts';
function findRepository(){let current=process.env.BELEM_REPOSITORY_DIR||process.cwd();for(let i=0;i<5;i++){if(existsSync(path.join(current,'index.html'))&&existsSync(path.join(current,'.github/scripts/gallery-smoke.mjs')))return current;current=path.dirname(current);}throw new Error('Approved gallery template not found');}
export const repository=findRepository();
export function renderGallery(g:any){
 const context=galleryContext(g);const urls=context.photos.map(p=>new URL(p.url,origin()).href);
 const selected=context.selectedPhotoIds.map((key:string)=>context.photos.findIndex(p=>p.id===key)).filter((i:number)=>i>=0);
 let source=readFileSync(path.join(repository,'index.html'),'utf8');
 let index=0;source=source.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g,()=>urls[index++%urls.length]);
 source=source.replace('let savedBelemState={selected:[],products:[]};',`let savedBelemState={selected:${JSON.stringify(selected)},products:[]};`);
 const begin=source.indexOf('if(belemStorageKey){try{const saved='),end=source.indexOf('const selected=new Set(savedBelemState.selected);');
 if(begin<0||end<begin)throw new Error('Legacy template contract changed');source=source.slice(0,begin)+source.slice(end);
 source=source.replaceAll("new Audio('A_Bencao_Belem_Site.mp3')","new Audio('/media/A_Bencao_Belem_Site.mp3')").replaceAll("new Audio('Trilha_Estrela_de_Belem_site.mp3')","new Audio('/media/Trilha_Estrela_de_Belem_site.mp3')");
 const safe=(x:unknown)=>JSON.stringify(x).replace(/</g,'\\u003c');
 source=source.replace('<script>const demoPhotos=',`<script>window.BELEM_UPLOADED_PHOTOS=${safe(urls)};window.BELEM_GALLERY_ID=${safe(g.id)};</script><script>const demoPhotos=`);
 const adapter=readFileSync(path.join(repository,'apps/studio/lib/gallery-adapter.js'),'utf8');
 return source.replace('</body>',`<script>window.BELEM_SERVER_CONTEXT=${safe(context)};</script><script>${adapter}</script></body>`);
}
export const galleryHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"};
