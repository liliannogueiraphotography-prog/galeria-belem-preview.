import path from 'node:path';
import { mkdir,writeFile,unlink,readFile } from 'node:fs/promises';
import sharp, {type Metadata} from 'sharp';
import {root,id,hash,run,transaction,audit,one} from './db.ts';
import {Problem,bounded} from './auth.ts';
export async function upload(req:Request,studio:string,session:string,actor:string){
 if(!one('SELECT id FROM sessions WHERE id=? AND studio_id=?',session,studio))throw new Problem(404,'Ensaio não encontrado.');
 const bytes=await bounded(req,64*1024*1024);
 let form:FormData;try{form=await new Response(new Uint8Array(bytes),{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();}catch{throw new Problem(400,'Envio inválido.');}
 const files=form.getAll('photos');if(!files.length||files.length>10||files.some(f=>!(f instanceof File)))throw new Problem(400,'Envie de 1 a 10 fotografias por vez.');
 const prepared:{photo:string,name:string,data:Buffer,preview:Buffer,metadata:Metadata,original:string,small:string}[]=[];
 for(const value of files){const file=value as File;
  if(file.size===0||file.size>20*1024*1024)throw new Problem(400,'Cada fotografia deve ter até 20 MB.');
  const name=file.name.normalize('NFC');if(name.length>180||/[\\/\x00-\x1f]/.test(name))throw new Problem(400,'Nome de arquivo inválido.');
  const data=Buffer.from(await file.arrayBuffer());
  let metadata,preview:Buffer;
  try{metadata=await sharp(data,{limitInputPixels:80000000}).metadata();if(!['jpeg','png','webp'].includes(metadata.format||'')||(metadata.pages||1)>1)throw new Error('unsupported');preview=await sharp(data,{limitInputPixels:80000000}).rotate().resize(1400,1400,{fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();}catch{throw new Problem(400,'Fotografia inválida. Use JPEG, PNG ou WebP estático, com até 80 megapixels. RAW e HEIC ficam para uma próxima etapa.');}
  const photo=id(),prefix=`${studio}/${session}/${photo}`;
  prepared.push({photo,name,data,preview,metadata,original:prefix+'.original',small:prefix+'.preview.jpg'});
 }
 const usage=one('SELECT COALESCE(SUM(bytes),0) bytes,COUNT(*) total FROM photos WHERE studio_id=?',studio)!;
 if(usage.bytes+prepared.reduce((n,p)=>n+p.data.length,0)>2*1024**3||usage.total+prepared.length>5000)throw new Problem(413,'Limite da demonstração atingido: 2 GB ou 5.000 fotografias por estúdio.');
 const written:string[]=[];
 try{
  await mkdir(path.join(root,'objects',studio,session),{recursive:true,mode:0o700});
  for(const p of prepared){for(const [key,data] of [[p.original,p.data],[p.small,p.preview]] as const){const dest=objectPath(key);await writeFile(dest,data,{flag:'wx',mode:0o600});written.push(dest);}}
  transaction(()=>{const current=one('SELECT COALESCE(SUM(bytes),0) bytes,COUNT(*) total FROM photos WHERE studio_id=?',studio)!;if(current.bytes+prepared.reduce((n,p)=>n+p.data.length,0)>2*1024**3||current.total+prepared.length>5000)throw new Problem(413,'Limite de armazenamento atingido.');for(const p of prepared)run('INSERT INTO photos(id,studio_id,session_id,original_name,original_key,preview_key,sha256,mime,bytes,width,height) VALUES(?,?,?,?,?,?,?,?,?,?,?)',p.photo,studio,session,p.name,p.original,p.small,hash(p.data),'image/'+(p.metadata.format==='jpeg'?'jpeg':p.metadata.format),p.data.length,p.metadata.width!,p.metadata.height!);audit(studio,actor,'photos.uploaded',session);});
 }catch(e){await Promise.allSettled(written.map(f=>unlink(f)));throw e;}
 return prepared.map(p=>p.photo);
}
export function objectPath(key:string){const dir=path.join(root,'objects'),resolved=path.resolve(dir,key);if(!resolved.startsWith(dir+path.sep))throw new Problem(403,'Arquivo não permitido.');return resolved;}
export async function preview(key:string){try{const data=await readFile(objectPath(key));return new Response(new Uint8Array(data),{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{throw new Problem(404,'Prévia indisponível.');}}
