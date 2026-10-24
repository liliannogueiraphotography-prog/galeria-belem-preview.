import {one,run,hash,token} from '../../../lib/db.ts';
import {cookie,origin} from '../../../lib/auth.ts';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){
 const raw=(await params).token;
 if(!/^[A-Za-z0-9_-]{43}$/.test(raw))return new Response('Link inválido.',{status:404});
 const g=one('SELECT * FROM galleries WHERE token_hash=? AND active=1 AND expires>?',hash(raw),Date.now());
 if(!g)return new Response('Este link expirou ou foi revogado. Peça um novo link ao estúdio.',{status:404,headers:{'Cache-Control':'no-store'}});
 const access=token(),expires=Math.min(g.expires,Date.now()+7*86400000);
 run('DELETE FROM gallery_sessions WHERE expires<?',Date.now());
 run('INSERT INTO gallery_sessions(hash,studio_id,gallery_id,version,expires) VALUES(?,?,?,?,?)',hash(access),g.studio_id,g.id,g.version,expires);
 return new Response(null,{status:303,headers:{Location:origin()+'/gallery/'+g.id,'Set-Cookie':cookie('belem_gallery_'+g.id,access,Math.floor((expires-Date.now())/1000)),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
