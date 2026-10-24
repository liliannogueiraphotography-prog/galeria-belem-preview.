import {redeemPreviewInvite} from '../../../../lib/preview.ts';
import {z} from 'zod';
import {handle,json,Problem,auth,writeGuard,body,login,cookie,authCookie,cookies,galleryAuth} from '../../../../lib/auth.ts';
import {one,all,run,hash,audit,passwordMatches,passwordHash,transaction} from '../../../../lib/db.ts';
import {overview,saveFamily,saveClient,savePackage,saveSession,sessionDetail,review,publish,galleryLink,scoped,galleryContext,saveSelection,uuid} from '../../../../lib/service.ts';
import {upload,preview} from '../../../../lib/storage.ts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function dispatch(req:Request,ctx:Context){return handle(async()=>{
 const p=(await ctx.params).path,method=req.method;
 if(method!=='GET')writeGuard(req);
 if(p.join('/')==='health'&&method==='GET')return json({ok:true,storage:'private-local',database:'sqlite'});
 if(p.join('/')==='auth/preview-invite'&&method==='POST'){const access=redeemPreviewInvite(await body(req));return json({ok:true},200,{'Set-Cookie':cookie(authCookie,access.session,access.maxAge)});}
 if(p.join('/')==='auth/login'&&method==='POST'){const x=z.object({email:z.email().max(254),password:z.string().min(1).max(256)}).parse(await body(req));const raw=login(x.email,x.password);return json({ok:true},200,{'Set-Cookie':cookie(authCookie,raw,12*3600)});}
 if(p[0]==='gallery'){
  const key=uuid.parse(p[1]),g=galleryAuth(req,key);
  if(p.length===2&&method==='GET')return json(galleryContext(g));
  if(p[2]==='selection'&&p.length===3&&method==='PUT')return json(saveSelection(g,await body(req,400000)));
  if(p[2]==='photos'&&p.length===4&&method==='GET'){uuid.parse(p[3]);const photo=one("SELECT p.preview_key FROM photos p JOIN gallery_photos gp ON gp.photo_id=p.id AND gp.studio_id=p.studio_id WHERE gp.gallery_id=? AND gp.studio_id=? AND p.id=? AND p.status='approved'",g.id,g.studio_id,p[3]);if(!photo)throw new Problem(404,'Fotografia não encontrada.');return preview(photo.preview_key);}
  throw new Problem(404,'Página não encontrada.');
 }
 const a=auth(req),studio=a.studio_id,actor=a.user_id;
 if(p.join('/')==='auth/me'&&method==='GET')return json({email:a.email,studio:{id:studio,name:a.studio_name},memberships:all('SELECT s.id,s.name FROM memberships m JOIN studios s ON s.id=m.studio_id WHERE m.user_id=?',actor)});
 if(p.join('/')==='auth/logout'&&method==='POST'){run('DELETE FROM auth_sessions WHERE hash=?',hash(cookies(req)[authCookie]||''));return json({ok:true},200,{'Set-Cookie':cookie(authCookie,'',0)});}
 if(p.join('/')==='auth/password'&&method==='POST'){const x=z.object({current:z.string().min(1).max(256),password:z.string().min(12).max(256)}).parse(await body(req));const user=one('SELECT password_hash FROM users WHERE id=?',actor)!;if(!passwordMatches(x.current,user.password_hash))throw new Problem(400,'Senha atual incorreta.');transaction(()=>{run('UPDATE users SET password_hash=? WHERE id=?',passwordHash(x.password),actor);run('DELETE FROM auth_sessions WHERE user_id=?',actor);audit(studio,actor,'password.changed',actor);});return json({ok:true},200,{'Set-Cookie':cookie(authCookie,'',0)});}
 if(p.join('/')==='auth/studio'&&method==='POST'){const x=z.object({studioId:uuid}).parse(await body(req));if(!one('SELECT * FROM memberships WHERE studio_id=? AND user_id=?',x.studioId,actor))throw new Problem(403,'Acesso ao estúdio não permitido.');run('UPDATE auth_sessions SET studio_id=? WHERE hash=?',x.studioId,hash(cookies(req)[authCookie]));return json({ok:true});}
 if(p[0]!=='admin')throw new Problem(404,'Página não encontrada.');
 if(p.length===2&&p[1]==='overview'&&method==='GET')return json(overview(studio));
 if(p.length===2&&method==='POST'){
  const data=await body(req);const creators:Record<string,(s:string,d:unknown,a:string)=>string>={families:saveFamily,clients:saveClient,packages:savePackage,sessions:saveSession};
  if(creators[p[1]])return json({id:creators[p[1]](studio,data,actor)},201);
 }
 if(p.length===3&&method==='PATCH'&&['families','clients','packages'].includes(p[1])){const updaters:Record<string,(s:string,d:unknown,a:string,key:string)=>string>={families:saveFamily,clients:saveClient,packages:savePackage};return json({id:updaters[p[1]](studio,await body(req),actor,uuid.parse(p[2]))});}
 if(p[1]==='sessions'&&p[2]){
  const key=uuid.parse(p[2]);
  if(p.length===3&&method==='GET')return json(sessionDetail(studio,key));
  if(p.length===3&&method==='PATCH')return json({id:saveSession(studio,await body(req),actor,key)});
  if(p.length===4&&p[3]==='photos'&&method==='POST')return json({ids:await upload(req,studio,key,actor)},201);
  if(p.length===4&&p[3]==='review'&&method==='PATCH'){review(studio,key,await body(req),actor);return json({ok:true});}
  if(p.length===4&&p[3]==='publish'&&method==='POST')return json(publish(studio,key,actor));
 }
 if(p[1]==='photos'&&p.length===4&&p[3]==='preview'&&method==='GET'){const photo=scoped('photos',studio,p[2]);return preview(photo.preview_key);}
 if(p[1]==='galleries'&&p[2]){
  const key=uuid.parse(p[2]);
  if(p.length===4&&p[3]==='link'&&method==='GET')return json(galleryLink(studio,key));
  if(p.length===4&&p[3]==='selection'&&method==='GET'){const g=scoped('galleries',studio,key);const sel=one('SELECT photo_ids,revision,updated_at FROM selections WHERE gallery_id=? AND studio_id=?',key,studio);return json({selection:sel?{photoIds:JSON.parse(sel.photo_ids),revision:sel.revision,updatedAt:sel.updated_at}:null});}
  if(p.length===3&&method==='DELETE'){scoped('galleries',studio,key);run('UPDATE galleries SET active=0 WHERE id=? AND studio_id=?',key,studio);audit(studio,actor,'gallery.revoked',key);return json({ok:true});}
 }
 throw new Problem(404,'Página não encontrada.');
});}
export const GET=dispatch,POST=dispatch,PATCH=dispatch,PUT=dispatch,DELETE=dispatch;
