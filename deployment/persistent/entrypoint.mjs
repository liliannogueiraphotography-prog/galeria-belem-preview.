import {accessSync,constants} from 'node:fs';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function validatePersistentConfig(env){
 let url;try{url=new URL(env.APP_ORIGIN);}catch{throw new Error('Configure a dedicated HTTPS APP_ORIGIN.');}
 if(url.protocol!=='https:'||url.origin!==env.APP_ORIGIN||url.username||url.password||url.hostname==='localhost'||url.hostname.endsWith('.trycloudflare.com'))throw new Error('Persistent mode requires a fixed HTTPS origin, without a temporary tunnel.');
 if(env.BELEM_DATA_DIR!=='/var/lib/belem')throw new Error('Mount the persistent volume at /var/lib/belem.');
 if(env.BELEM_TEMPORARY_PREVIEW)throw new Error('Temporary account invitation mode is forbidden here.');
 return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{validatePersistentConfig(process.env);accessSync(process.env.BELEM_DATA_DIR,constants.R_OK|constants.W_OK);}catch(e){console.error(e.message);process.exit(1);}
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port','3000'],{stdio:'inherit'});
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
 server.on('error',()=>process.exit(1));server.on('exit',code=>process.exit(code??1));
}
