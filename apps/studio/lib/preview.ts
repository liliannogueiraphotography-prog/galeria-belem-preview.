import {z} from 'zod';
import {db,one,run,id,token,hash,passwordHash,transaction} from './db.ts';
import {Problem} from './auth.ts';
function enabled(){if(process.env.BELEM_TEMPORARY_PREVIEW!=='1')throw new Problem(404,'Página não encontrada.');}
export function createPreviewInvite(email:string,expires:number){
 enabled();if(expires<=Date.now()||expires>Date.now()+4*3600000)throw new Error('Invalid preview lifetime');
 const member=one("SELECT u.id user_id,m.studio_id FROM users u JOIN memberships m ON m.user_id=u.id JOIN studios s ON s.id=m.studio_id WHERE u.email=? AND s.name LIKE '%demonstração%'",email);
 if(!member||!email.endsWith('@belem.test'))throw new Error('Only seeded fictitious accounts can receive preview invitations');
 db.exec('CREATE TABLE IF NOT EXISTS preview_invites(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),studio_id TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0,FOREIGN KEY(studio_id,user_id) REFERENCES memberships(studio_id,user_id))');
 const raw=token();transaction(()=>{run('DELETE FROM preview_invites WHERE user_id=?',member.user_id);run('INSERT INTO preview_invites(hash,user_id,studio_id,expires) VALUES(?,?,?,?)',hash(raw),member.user_id,member.studio_id,expires);});return raw;
}
export function redeemPreviewInvite(input:unknown){
 enabled();const x=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),password:z.string().min(12).max(128)}).parse(input);
 return transaction(()=>{const invite=one('SELECT p.*,u.email FROM preview_invites p JOIN users u ON u.id=p.user_id WHERE p.hash=? AND p.used=0 AND p.expires>?',hash(x.token),Date.now());if(!invite||!invite.email.endsWith('@belem.test'))throw new Problem(410,'Convite inválido, utilizado ou expirado. Solicite um novo acesso.');
 const raw=token();run('UPDATE users SET password_hash=? WHERE id=?',passwordHash(x.password),invite.user_id);run('UPDATE preview_invites SET used=1 WHERE hash=?',hash(x.token));run('DELETE FROM auth_sessions WHERE user_id=?',invite.user_id);run('INSERT INTO auth_sessions(hash,user_id,studio_id,expires) VALUES(?,?,?,?)',hash(raw),invite.user_id,invite.studio_id,Math.min(invite.expires,Date.now()+12*3600000));return {session:raw,maxAge:Math.max(1,Math.floor((invite.expires-Date.now())/1000))};});
}
