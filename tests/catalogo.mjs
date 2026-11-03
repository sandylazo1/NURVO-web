import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html = read('catalogo.html'), css = read('assets/catalogo.css');
const script = read('assets/catalogo.js'), config = read('config.js');
assert.doesNotThrow(()=>new Script(script));
assert.match(html,/Content-Security-Policy/);
assert.match(html,/script src="config.js" defer/);
assert.match(html,/script src="assets\/catalogo.js" defer/);
assert.match(html,/assets\/catalogo.css/);
assert.ok(css.length>1500);
assert.ok(!/\bstyle="/.test(html),'No styles inline under CSP');
for(const id of ['catalog-status','catalog-condition','catalog-category','catalog-search','catalog-reload','catalog-count','catalog-products']){
  assert.ok(html.includes('id="'+id+'"'),'Missing catalogue control: '+id);
}
for(const page of ['index.html','ecosistema.html','vin.html','gestion.html','alianzas.html','equipo.html']){
  assert.ok(read(page).includes('href="catalogo.html"'),'No catalogue navigation from: '+page);
}
assert.match(script,/textContent/,'Escaped text rendering required');
assert.match(script,/declarad[oa]/i,'Supplier declaration disclaimer required');
assert.match(script,/\/api\/marketplace\/products\?limit=50/);
assert.match(script,/\/api\/marketplace\/status/);
assert.ok(!/\bX-NURVO-Key\b/i.test(script),'Never embed B2B keys in Pages');
assert.ok(!/Authorization\s*:/.test(script),'Never use B2B authorization in browser');
assert.match(script,/Sin backend comercial configurado/);
assert.match(config,/NURVO_API_BASE_URL = ""/,'Empty API by default');
console.log('NURVO catalogue static checks passed: config, safety, no keys, empty state and links.');
