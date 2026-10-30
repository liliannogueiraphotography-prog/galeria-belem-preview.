import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePersistentConfig} from './entrypoint.mjs';
const valid={APP_ORIGIN:'https://studio.example.invalid',BELEM_DATA_DIR:'/var/lib/belem'};
test('persistent startup accepts fixed HTTPS origin and explicit volume path',()=>assert.equal(validatePersistentConfig(valid),true));
test('temporary invitations, tunnels and ephemeral data paths fail closed',()=>{for(const change of [{APP_ORIGIN:'http://studio.example.invalid'},{APP_ORIGIN:'https://temporary.trycloudflare.com'},{APP_ORIGIN:'https://studio.example.invalid/path'},{BELEM_TEMPORARY_PREVIEW:'1'},{BELEM_DATA_DIR:'/tmp/photos'}])assert.throws(()=>validatePersistentConfig({...valid,...change}));});
