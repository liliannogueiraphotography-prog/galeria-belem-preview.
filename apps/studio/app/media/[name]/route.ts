import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {repository} from '../../../lib/gallery.ts';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{name:string}>}){
 const name=(await params).name;if(!['A_Bencao_Belem_Site.mp3','Trilha_Estrela_de_Belem_site.mp3'].includes(name))return new Response('Não encontrado',{status:404});
 const buffer=await readFile(path.join(repository,name));
 return new Response(new Uint8Array(buffer),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'public,max-age=86400'}});
}
