import { one,run,hash,token,passwordHash,passwordMatches,transaction } from './db.ts';
export class Problem extends Error {status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export const origin = ()=>process.env.APP_ORIGIN || 'http://localhost:3000';
export const authCookie='belem_admin';
export function cookies(req:Request){return Object.fromEntries((req.headers.get('cookie')||'').split(';').filter(x=>x.includes('=')).map(x=>{const at=x.indexOf('=');return [x.slice(0,at).trim(),x.slice(at+1).trim()];}));}
export function cookie(name:string,value:string,maxAge:number){return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${origin().startsWith('https:')?'; Secure':''}`;}
export function writeGuard(req:Request){if(req.headers.get('origin')!==origin())throw new Problem(403,'Origem da solicitação não permitida.');if(req.headers.get('sec-fetch-site')==='cross-site')throw new Problem(403,'Solicitação não permitida.');}
export function auth(req:Request){const raw=cookies(req)[authCookie];if(!raw)throw new Problem(401,'Entre no painel para continuar.');const session=one('SELECT a.*,u.email,s.name studio_name FROM auth_sessions a JOIN users u ON u.id=a.user_id JOIN studios s ON s.id=a.studio_id JOIN memberships m ON m.user_id=a.user_id AND m.studio_id=a.studio_id WHERE a.hash=? AND a.expires>?',hash(raw),Date.now());if(!session)throw new Problem(401,'Sua sessão expirou. Entre novamente.');return session;}
const dummy=passwordHash(token());
export function login(email:string,password:string){
 const normalized=email.trim().toLowerCase(),key=hash(normalized),now=Date.now();
 run('DELETE FROM login_attempts WHERE reset_at<?',now);
 const global=one('SELECT * FROM login_attempts WHERE key=?','global-login');if(global&&global.attempts>=90)throw new Problem(429,'Muitas solicitações. Aguarde um minuto e tente novamente.');
 run('INSERT INTO login_attempts(key,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1','global-login',now+60000);
 const rate=one('SELECT * FROM login_attempts WHERE key=?',key);
 if(rate&&rate.reset_at>now&&rate.attempts>=6)throw new Problem(429,'Muitas tentativas. Aguarde 15 minutos e tente novamente.');
 const user=one('SELECT * FROM users WHERE email=?',normalized);
 const valid=passwordMatches(password,user?.password_hash||dummy);
 if(!user||!valid){run(`INSERT INTO login_attempts(key,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END`,key,now+900000,now,now);throw new Problem(401,'E-mail ou senha incorretos.');}
 const member=one('SELECT studio_id FROM memberships WHERE user_id=? ORDER BY studio_id LIMIT 1',user.id);if(!member)throw new Problem(403,'Conta sem acesso a um estúdio.');
 const raw=token();transaction(()=>{run('DELETE FROM login_attempts WHERE key=?',key);run('DELETE FROM auth_sessions WHERE expires<?',now);run('INSERT INTO auth_sessions(hash,user_id,studio_id,expires) VALUES(?,?,?,?)',hash(raw),user.id,member.studio_id,now+12*3600000);});return raw;
}
export function galleryAuth(req:Request,galleryId:string){const raw=cookies(req)['belem_gallery_'+galleryId];if(!raw)throw new Problem(401,'Abra o link individual enviado pelo estúdio.');const g=one(`SELECT g.* FROM gallery_sessions a JOIN galleries g ON g.id=a.gallery_id AND g.studio_id=a.studio_id AND g.version=a.version WHERE a.hash=? AND a.gallery_id=? AND a.expires>? AND g.expires>? AND g.active=1`,hash(raw),galleryId,Date.now(),Date.now());if(!g)throw new Problem(401,'O acesso expirou ou foi atualizado. Peça um novo link ao estúdio.');return g;}
export function json(data:any,status=200,headers:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store, private',...headers}});}
export async function handle(fn:()=>Promise<Response>|Response){try{return await fn();}catch(e){if(e instanceof Problem)return json({error:e.message},e.status);if(e&&typeof e==='object'&&'issues' in e)return json({error:'Confira os campos preenchidos. Há informações inválidas.'},400);console.error('Falha interna da operação:',e instanceof Error?e.name:'unknown');return json({error:'Não foi possível concluir. Tente novamente.'},500);}}
export async function body(req:Request,max=64000){const bytes=await bounded(req,max);try{return JSON.parse(bytes.toString());}catch{throw new Problem(400,'Dados inválidos.');}}
export async function bounded(req:Request,max:number){const len=Number(req.headers.get('content-length')||0);if(len>max)throw new Problem(413,'O envio excede o limite permitido.');const reader=req.body?.getReader();if(!reader)throw new Problem(400,'Envio vazio.');let count=0;const chunks:Buffer[]=[];while(true){const {value,done}=await reader.read();if(done)break;count+=value.length;if(count>max){await reader.cancel();throw new Problem(413,'O envio excede o limite permitido.');}chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}
