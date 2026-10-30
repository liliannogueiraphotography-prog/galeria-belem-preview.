import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash, createCipheriv, createDecipheriv } from 'node:crypto';

export const root = path.resolve(process.env.BELEM_DATA_DIR || '/workspace/.belem-runtime');
mkdirSync(root, {recursive:true, mode:0o700}); chmodSync(root,0o700);
export const db = new DatabaseSync(path.join(root,'studio.sqlite'));
chmodSync(path.join(root,'studio.sqlite'),0o600);
// Configure contention handling before WAL/schema initialization in concurrent workers.
db.exec('PRAGMA busy_timeout=5000');
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS studios(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS memberships(studio_id TEXT NOT NULL REFERENCES studios(id),user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('owner','admin')),PRIMARY KEY(studio_id,user_id));
CREATE TABLE IF NOT EXISTS auth_sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),studio_id TEXT NOT NULL,expires INTEGER NOT NULL,FOREIGN KEY(studio_id,user_id) REFERENCES memberships(studio_id,user_id));
CREATE TABLE IF NOT EXISTS login_attempts(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,reset_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS families(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL REFERENCES studios(id),name TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',UNIQUE(studio_id,id));
CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL,family_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',UNIQUE(studio_id,id),FOREIGN KEY(studio_id,family_id) REFERENCES families(studio_id,id));
CREATE TABLE IF NOT EXISTS packages(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL REFERENCES studios(id),name TEXT NOT NULL,included INTEGER NOT NULL CHECK(included>=0),extra_cents INTEGER NOT NULL CHECK(extra_cents>=0),UNIQUE(studio_id,id));
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL REFERENCES studios(id),client_id TEXT,package_id TEXT,title TEXT NOT NULL,shoot_date TEXT NOT NULL DEFAULT '',included INTEGER NOT NULL DEFAULT 0 CHECK(included>=0),extra_cents INTEGER NOT NULL DEFAULT 0 CHECK(extra_cents>=0),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(studio_id,id),FOREIGN KEY(studio_id,client_id) REFERENCES clients(studio_id,id),FOREIGN KEY(studio_id,package_id) REFERENCES packages(studio_id,id));
CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL,session_id TEXT NOT NULL,original_name TEXT NOT NULL,original_key TEXT NOT NULL,preview_key TEXT NOT NULL,sha256 TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),ai_status TEXT NOT NULL DEFAULT 'not_requested',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(studio_id,id),FOREIGN KEY(studio_id,session_id) REFERENCES sessions(studio_id,id));
CREATE TABLE IF NOT EXISTS curation_runs(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL,session_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'not_requested',model TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(studio_id,id),FOREIGN KEY(studio_id,session_id) REFERENCES sessions(studio_id,id));
CREATE TABLE IF NOT EXISTS curation_suggestions(studio_id TEXT NOT NULL,run_id TEXT NOT NULL,photo_id TEXT NOT NULL,score REAL,reason TEXT,PRIMARY KEY(run_id,photo_id),FOREIGN KEY(studio_id,run_id) REFERENCES curation_runs(studio_id,id),FOREIGN KEY(studio_id,photo_id) REFERENCES photos(studio_id,id));
CREATE TABLE IF NOT EXISTS galleries(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL,session_id TEXT NOT NULL UNIQUE,token_hash TEXT NOT NULL UNIQUE,token_encrypted TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,expires INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(studio_id,id),FOREIGN KEY(studio_id,session_id) REFERENCES sessions(studio_id,id));
CREATE TABLE IF NOT EXISTS gallery_photos(studio_id TEXT NOT NULL,gallery_id TEXT NOT NULL,photo_id TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(gallery_id,photo_id),FOREIGN KEY(studio_id,gallery_id) REFERENCES galleries(studio_id,id),FOREIGN KEY(studio_id,photo_id) REFERENCES photos(studio_id,id));
CREATE TABLE IF NOT EXISTS gallery_sessions(hash TEXT PRIMARY KEY,studio_id TEXT NOT NULL,gallery_id TEXT NOT NULL,version INTEGER NOT NULL,expires INTEGER NOT NULL,FOREIGN KEY(studio_id,gallery_id) REFERENCES galleries(studio_id,id));
CREATE TABLE IF NOT EXISTS selections(studio_id TEXT NOT NULL,gallery_id TEXT PRIMARY KEY,photo_ids TEXT NOT NULL DEFAULT '[]',revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(studio_id,gallery_id) REFERENCES galleries(studio_id,id));
CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY,studio_id TEXT NOT NULL REFERENCES studios(id),actor_id TEXT NOT NULL,action TEXT NOT NULL,resource_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS photos_by_session ON photos(studio_id,session_id);
CREATE INDEX IF NOT EXISTS clients_by_studio ON clients(studio_id);
CREATE INDEX IF NOT EXISTS sessions_by_studio ON sessions(studio_id);
`);
// Upgrade the initial local demo schema without dropping persisted studio data.
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS curation_runs_by_studio ON curation_runs(studio_id,id)');
const curationKeys=db.prepare('PRAGMA foreign_key_list(curation_suggestions)').all();
if(!curationKeys.some(k=>k.table==='curation_runs'&&k.from==='studio_id')){
 db.exec(`BEGIN IMMEDIATE;
 CREATE TABLE curation_suggestions_v1(studio_id TEXT NOT NULL,run_id TEXT NOT NULL,photo_id TEXT NOT NULL,score REAL,reason TEXT,PRIMARY KEY(run_id,photo_id),FOREIGN KEY(studio_id,run_id) REFERENCES curation_runs(studio_id,id),FOREIGN KEY(studio_id,photo_id) REFERENCES photos(studio_id,id));
 INSERT INTO curation_suggestions_v1 SELECT studio_id,run_id,photo_id,score,reason FROM curation_suggestions;
 DROP TABLE curation_suggestions;
 ALTER TABLE curation_suggestions_v1 RENAME TO curation_suggestions;
 PRAGMA user_version=1;
 COMMIT;`);
}else db.exec('PRAGMA user_version=1');
export type Row = Record<string,any>;
export function one(sql:string,...args:any[]):Row|undefined {return db.prepare(sql).get(...args) as Row|undefined;}
export function all(sql:string,...args:any[]):Row[] {return db.prepare(sql).all(...args) as Row[];}
export function run(sql:string,...args:any[]) {return db.prepare(sql).run(...args);}
export function transaction<T>(fn:()=>T):T {db.exec('BEGIN IMMEDIATE');try {const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}}
export const id=()=>randomUUID();
export const token=()=>randomBytes(32).toString('base64url');
export const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
export function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64,{N:32768,maxmem:64*1024*1024}).toString('hex');}
export function passwordMatches(password:string,encoded:string){try{const [salt,expected]=encoded.split(':');const a=Buffer.from(expected,'hex');const b=scryptSync(password,salt,64,{N:32768,maxmem:64*1024*1024});return a.length===b.length&&timingSafeEqual(a,b);}catch{return false;}}
const keyPath=path.join(root,'link-encryption.key');
if(!existsSync(keyPath)){try{writeFileSync(keyPath,randomBytes(32),{mode:0o600,flag:'wx'});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}}
const key=readFileSync(keyPath);
export function seal(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,cipher.update(value),cipher.final(),cipher.getAuthTag()]).toString('base64url');}
export function unseal(value:string){const b=Buffer.from(value,'base64url'),dec=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));dec.setAuthTag(b.subarray(-16));return Buffer.concat([dec.update(b.subarray(12,-16)),dec.final()]).toString();}
export function audit(studio:string,actor:string,action:string,resource:string){run('INSERT INTO audit_events(id,studio_id,actor_id,action,resource_id) VALUES(?,?,?,?,?)',id(),studio,actor,action,resource);}
export function createStudio(name:string,email:string,password:string){return transaction(()=>{const studio=id(),user=id();run('INSERT INTO studios(id,name) VALUES(?,?)',studio,name);run('INSERT INTO users(id,email,password_hash) VALUES(?,?,?)',user,email.toLowerCase(),passwordHash(password));run('INSERT INTO memberships(studio_id,user_id,role) VALUES(?,?,?)',studio,user,'owner');return {studio,user};});}
