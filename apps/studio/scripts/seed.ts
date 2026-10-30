import {productDescriptions} from '../lib/product-copy.ts';
import {saveProduct} from '../lib/shop.ts';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {root,createStudio,one,run,id,hash,token} from '../lib/db.ts';
import {saveFamily,saveClient,savePackage,saveSession,publish} from '../lib/service.ts';
process.env.XDG_CACHE_HOME=path.join(root,'cache');
await mkdir(process.env.XDG_CACHE_HOME,{recursive:true,mode:0o700});
const accessPath=path.join(root,'demo-access.json');
if(one('SELECT id FROM users LIMIT 1')){console.log('Banco existente preservado. Acesso da demonstração em '+accessPath);process.exit(0);}
const accounts=[];
for(const [i,email,name] of [[0,'demo@belem.test','Estúdio Lilian Cristina · demonstração'],[1,'outro@belem.test','Ateliê Horizonte · demonstração']] as const){
 const password=token().slice(0,20)+'aA7!',{studio,user}=createStudio(name,email,password);accounts.push({email,password,studioId:studio});
 for(const [category,name,priceCents] of [['mug','Caneca · fictícia',4500],['album','Álbum · fictício',25000],['frame','Quadro · fictício',12000],['shirt','Camiseta · fictícia',6500],['magnet','Ímã · fictício',1500],['digital-all','Todos os arquivos digitais · fictício',35000]] as const)saveProduct(studio,{name,category,priceCents,description:productDescriptions[category],active:true},user);
 const family=saveFamily(studio,{name:i?'Família Horizonte · fictícia':'Família Aurora · fictícia',notes:'Cadastro inteiramente fictício para demonstração.'},user);
 const pkg=savePackage(studio,{name:'Memórias · pacote fictício',included:10,extraCents:4000},user);
 const client=saveClient(studio,{name:i?'Cliente Horizonte · fictícia':'Cliente Aurora · fictícia',familyId:family,email:i?'horizonte@example.invalid':'aurora@example.invalid',phone:'',packageId:pkg},user);
 savePackage(studio,{name:'Essência · pacote fictício',included:5,extraCents:4000},user);
 const session=saveSession(studio,{title:i?'Uma tarde no Horizonte':'Uma história de Belém',clientId:client,packageId:pkg,shootDate:''},user);
 await mkdir(path.join(root,'objects',studio,session),{recursive:true,mode:0o700});
 for(let n=0;n<5;n++){
  const photo=id(),key=`${studio}/${session}/${photo}`,colors=['#778865','#c1ac87','#647f7b','#b39c91','#8190a0'];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${colors[n]}"/><stop offset="1" stop-color="#e3decd"/></linearGradient></defs><rect width="1200" height="1600" fill="url(#g)"/><path d="M270 1300V650a330 330 0 0 1 660 0v650z" fill="#faf5e0" opacity=".35"/><circle cx="600" cy="650" r="105" fill="#f7f0d4" opacity=".6"/><text x="600" y="1420" text-anchor="middle" font-family="serif" font-size="32" fill="#ffffff">BELÉM · IMAGEM ARTIFICIAL ${n+1}</text></svg>`;
  const data=await sharp(Buffer.from(svg)).jpeg({quality:95}).toBuffer(),preview=await sharp(data).resize(1000).jpeg({quality:80}).toBuffer();
  await writeFile(path.join(root,'objects',key+'.original'),data,{mode:0o600});await writeFile(path.join(root,'objects',key+'.preview.jpg'),preview,{mode:0o600});
  run('INSERT INTO photos(id,studio_id,session_id,original_name,original_key,preview_key,sha256,mime,bytes,width,height,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',photo,studio,session,`FICTICIA_${String(n+1).padStart(3,'0')}.jpg`,key+'.original',key+'.preview.jpg',hash(data),'image/jpeg',data.length,1200,1600,n<3?'approved':'pending');
 }
 publish(studio,session,user);
 if(!i){const f=saveFamily(studio,{name:'Família Luz · fictícia',notes:''},user);const c=saveClient(studio,{name:'Cliente Luz · fictícia',familyId:f,email:'luz@example.invalid'},user);saveSession(studio,{title:'Memórias em família',clientId:c,packageId:pkg,shootDate:''},user);}
}
await writeFile(accessPath,JSON.stringify({local_demo_only:true,accounts},null,2)+'\n',{mode:0o600,flag:'wx'});
console.log('Demonstração criada com dois estúdios fictícios. Credenciais geradas em '+accessPath+'. Nenhum dado real ou serviço pago utilizado.');
