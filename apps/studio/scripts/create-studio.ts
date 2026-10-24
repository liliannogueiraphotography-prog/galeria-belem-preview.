import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {createStudio,root,token} from '../lib/db.ts';
const args=process.argv.slice(2),value=(flag:string)=>args[args.indexOf(flag)+1];
if(!args.includes('--name')||!args.includes('--email')){console.error('Uso: npm run create-studio -- --name "Nome do estúdio" --email "admin@example.invalid"');process.exit(1);}
const name=z.string().trim().min(2).max(160).parse(value('--name')),email=z.email().max(254).parse(value('--email'));
const password=token().slice(0,20)+'aA7!';
const created=createStudio(name,email,password),file=path.join(root,'access-'+created.studio+'.json');
await writeFile(file,JSON.stringify({email,password,studioId:created.studio},null,2)+'\n',{mode:0o600,flag:'wx'});
console.log('Estúdio criado. A credencial inicial está no arquivo privado '+file+'. Altere a senha no primeiro acesso.');
