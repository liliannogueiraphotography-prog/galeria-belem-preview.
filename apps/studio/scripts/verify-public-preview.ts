import {randomBytes} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {root} from '../lib/db.ts';
import {createPreviewInvite} from '../lib/preview.ts';
const base=process.env.APP_ORIGIN!,resultFile=process.env.PREVIEW_VERIFICATION_FILE!;
if(!base?.startsWith('https://')||!resultFile)throw new Error('HTTPS verification configuration missing');
const admin=new Map<string,string>(),family=new Map<string,string>();
const passed:string[]=[];
async function request(label:string,url:string,method='GET',data?:unknown,jar=new Map<string,string>(),expected=200){
 const headers:Record<string,string>={Origin:base};if(jar.size)headers.Cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
 if(data&&!(data instanceof FormData))headers['Content-Type']='application/json';
 const r=await fetch(new URL(url,base),{method,headers,body:data instanceof FormData?data:data?JSON.stringify(data):undefined,redirect:'manual',signal:AbortSignal.timeout(45000)});
 if(r.status!==expected)throw new Error(label+': HTTP '+r.status);
 for(const value of r.headers.getSetCookie()){const pair=value.split(';')[0],at=pair.indexOf('=');jar.set(pair.slice(0,at),pair.slice(at+1));}
 return r;
}
try{
 // A newly issued tunnel can take a few seconds to propagate. Retry only this read.
 let landing:Response|undefined;for(let attempt=0;attempt<8;attempt++){try{landing=await request('login HTTPS','/admin');break;}catch(error){if(attempt===7)throw error;await new Promise(resolve=>setTimeout(resolve,3000));}}if(!landing)throw new Error('HTTPS tunnel did not become ready');if(!(await landing.text()).includes('Belém Studio'))throw new Error('Unexpected login page');passed.push('HTTPS login page');
 await request('unauthenticated admin','/api/v1/admin/overview','GET',undefined,undefined,401);passed.push('anonymous admin denied');
 const secret=createPreviewInvite('outro@belem.test',Date.now()+20*60000),password=randomBytes(24).toString('base64url');
 const login=await request('one-time invitation','/api/v1/auth/preview-invite','POST',{token:secret,password},admin);
 const cookies=login.headers.getSetCookie().join(';');if(!cookies.includes('Secure')||!cookies.includes('HttpOnly'))throw new Error('Missing secure cookie attributes');
 await request('invite reuse denied','/api/v1/auth/preview-invite','POST',{token:secret,password},admin,410);passed.push('one-use invitation and Secure HttpOnly session');
 const fam=await (await request('family registration','/api/v1/admin/families','POST',{name:'Família de verificação fictícia'},admin,201)).json();
 const client=await (await request('client registration','/api/v1/admin/clients','POST',{name:'Cliente de verificação fictícia',familyId:fam.id,email:'check@example.invalid'},admin,201)).json();
 const pkg=await (await request('package registration','/api/v1/admin/packages','POST',{name:'Pacote artificial',included:2,extraCents:1000},admin,201)).json();
 const session=await (await request('session registration','/api/v1/admin/sessions','POST',{title:'Verificação pública HTTPS',clientId:client.id,packageId:pkg.id},admin,201)).json();passed.push('family client package and session registration');
 const jpeg=await sharp({create:{width:600,height:800,channels:3,background:'#7a8f6a'}}).jpeg().toBuffer();
 const storeProduct=await (await request('product registration','/api/v1/admin/products','POST',{name:'Caneca HTTPS fictícia',description:'Produto artificial para teste',category:'mug',priceCents:4500,active:true},admin,201)).json();
 const productImage=new FormData();productImage.append('image',new File([new Uint8Array(jpeg)],'ARTIFICIAL-PRODUCT.jpg',{type:'image/jpeg'}));await request('product image upload','/api/v1/admin/products/'+storeProduct.id+'/image','POST',productImage,admin);
 const files=new FormData();files.append('photos',new File([new Uint8Array(jpeg)],'ARTIFICIAL-HTTPS.jpg',{type:'image/jpeg'}));
 const upload=await (await request('private upload','/api/v1/admin/sessions/'+session.id+'/photos','POST',files,admin,201)).json();
 await request('manual approval','/api/v1/admin/sessions/'+session.id+'/review','PATCH',{photoIds:upload.ids,status:'approved'},admin);
 const g=await (await request('individual publication','/api/v1/admin/sessions/'+session.id+'/publish','POST',{},admin)).json();passed.push('private upload approval and individual gallery publication');
 const redirect=await request('individual gallery link',g.url,'GET',undefined,family,303);await request('connected gallery',redirect.headers.get('location')!,'GET',undefined,family);
 const context=await (await request('gallery context','/api/v1/gallery/'+g.id,'GET',undefined,family)).json();
 await request('save product cart','/api/v1/gallery/'+g.id+'/cart','PUT',{items:[{productId:storeProduct.id,quantity:2}],revision:context.cart.revision},family);
 await request('save selection','/api/v1/gallery/'+g.id+'/selection','PUT',{photoIds:upload.ids,revision:context.revision},family);passed.push('approved frontend and server selection');
 const fresh=new Map<string,string>();await request('fresh browser access',g.url,'GET',undefined,fresh,303);
 const recovered=await (await request('persistent selection','/api/v1/gallery/'+g.id,'GET',undefined,fresh)).json();if(recovered.selectedPhotoIds[0]!==upload.ids[0])throw new Error('Selection was not recovered');passed.push('selection recovery in fresh cookie context');if(recovered.cart.items[0]?.quantity!==2||recovered.estimate.totalCents!==9000)throw new Error('Shop persistence or server estimate failed');await request('customer product image','/api/v1/gallery/'+g.id+'/products/'+storeProduct.id,'GET',undefined,fresh);passed.push('private product image, persistent cart and server estimate');
 const mainAccount=JSON.parse(readFileSync(path.join(root,'demo-access.json'),'utf8')).accounts[0],other=new Map<string,string>();
 await request('other studio login','/api/v1/auth/login','POST',{email:mainAccount.email,password:mainAccount.password},other);
 await request('tenant isolation','/api/v1/admin/sessions/'+session.id,'GET',undefined,other,404);await request('product tenant isolation','/api/v1/admin/products/'+storeProduct.id+'/image','GET',undefined,other,404);passed.push('cross-studio access denied');
 const result={verified:true,origin:base,checkedAt:new Date().toISOString(),checks:passed};writeFileSync(resultFile,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){console.error('Public preview verification failed:',e instanceof Error?e.message:'unknown error');process.exit(1);}
