import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceExtras} from '../lib/pricing.ts';
test('desconto usa extras, e não o total de fotos selecionadas',()=>{assert.equal(priceExtras(16,10,4000,16,3500).extraCents,24000);assert.equal(priceExtras(10,10,4000,16,3500).extraCents,0);});
test('limites de 15, 16 e 17 extras aplicam desconto a todas as extras',()=>{for(const [extras,unit,total,savings] of [[15,4000,60000,0],[16,3500,56000,8000],[17,3500,59500,8500]]){const p=priceExtras(extras+10,10,4000,16,3500);assert.equal(p.extraCount,extras);assert.equal(p.extraUnitCents,unit);assert.equal(p.extraCents,total);assert.equal(p.discountSavingsCents,savings);}});
test('todos os digitais substitui extras e contratos antigos não ganham desconto retroativo',()=>{assert.equal(priceExtras(40,10,4000,16,3500,true).extraCents,0);assert.equal(priceExtras(26,10,4000,null,null).extraCents,64000);});
