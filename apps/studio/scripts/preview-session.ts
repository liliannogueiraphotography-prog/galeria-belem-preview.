import {readFileSync,writeFileSync} from 'node:fs';
import {publicEncrypt,constants} from 'node:crypto';
import path from 'node:path';
import {one} from '../lib/db.ts';
import {galleryLink} from '../lib/service.ts';
import {createPreviewInvite} from '../lib/preview.ts';
const origin=process.env.APP_ORIGIN!;if(!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin))throw new Error('A verified HTTPS tunnel is required');
const verification=JSON.parse(readFileSync(process.env.PREVIEW_VERIFICATION_FILE!,'utf8'));if(!verification.verified||verification.origin!==origin)throw new Error('External verification is required');
const expires=Date.now()+3*3600000,key=readFileSync(path.resolve('../../deployment/preview-public.pem'));
function sealed(email:string){const gallery=one('SELECT g.id,g.studio_id FROM galleries g JOIN memberships m ON m.studio_id=g.studio_id JOIN users u ON u.id=m.user_id WHERE u.email=? AND g.active=1 ORDER BY g.created_at LIMIT 1',email);if(!gallery)throw new Error('Seeded demonstration gallery missing');const customerUrl=galleryLink(gallery.studio_id,gallery.id).url;const invite=createPreviewInvite(email,expires);return publicEncrypt({key,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(JSON.stringify({invite:origin+'/preview-access#'+invite,expiresAt:new Date(expires).toISOString(),email,customerUrl}))).toString('base64');}
const result={verification,url:origin+'/admin',expiresAt:new Date(expires).toISOString(),user_invite_ciphertext:sealed('demo@belem.test'),verification_invite_ciphertext:sealed('outro@belem.test')};
writeFileSync('../../deployment/preview-result.json',JSON.stringify(result,null,2)+'\n');console.log('Prévia pronta. Convites cifrados com a chave pública; nenhuma senha foi publicada.');
