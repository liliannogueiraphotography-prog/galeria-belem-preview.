import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(inlineScripts.length > 0, 'index.html must include its application scripts');
inlineScripts.forEach((script, index) => new vm.Script(script, { filename: 'index.html inline script ' + (index + 1) }));

const functionCount = name => (html.match(new RegExp('function ' + name + '\\s*\\(', 'g')) || []).length;
assert.equal(functionCount('belemNavigate'), 1, 'navigation must have one central implementation');
assert.equal(functionCount('belemPage'), 1, 'screen transitions must use one belemPage wrapper');
assert.equal(functionCount('belemHome'), 1, 'home transitions must use one belemHome wrapper');
assert.match(html, /href="#gallery" onclick="return belemNavigate\('gallery',event\)">Escolher minhas fotos/);
assert.match(html, /class="skip-gallery"[^>]*onclick="return belemNavigate\('gallery',event\)">Pular apresentação/);
assert.match(html, /setInterval\(\(\)=>\{index\+\+;if\(index>=photos\.length\)\{endSlides\(\);return\}render\(\)\},3000\)/);
assert.ok(html.includes('function togglePhoto(i){selected.has(i)?selected.delete(i):selected.add(i);persistBelemState();updateCounts()}'));
assert.ok(html.includes("button.textContent='✓ Adicionado · remover'}persistBelemState()}"));
assert.match(html, /window\.localStorage\.setItem/);
assert.match(html, /id="demoNotice"/);
assert.match(html, /produtos ainda não têm preços configurados/);
assert.match(html, /new Audio\('A_Bencao_Belem_Site\.mp3'\)/);
assert.match(html, /new Audio\('Trilha_Estrela_de_Belem_site\.mp3'\)/);
for (const asset of ['A_Bencao_Belem_Site.mp3', 'Trilha_Estrela_de_Belem_site.mp3']) {
  assert.ok(existsSync(asset), 'missing required audio asset: ' + asset);
}
console.log('Galeria Belém: smoke checks passaram.');
