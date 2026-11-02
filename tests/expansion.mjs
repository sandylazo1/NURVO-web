import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url),'utf8');
const main=read('index.html'),hub=read('ecosistema.html'),vin=read('vin.html');
const team=read('equipo.html'),management=read('gestion.html'),partnerships=read('alianzas.html');
const privacy=read('privacidad.html'),terms=read('terminos.html');
const fleetJS=read('assets/gestion.js'),businessJS=read('assets/alianzas.js');
const css=read('assets/nurvo-plus.css');
assert.doesNotThrow(()=>new Script(fleetJS));
assert.doesNotThrow(()=>new Script(businessJS));
for (const page of [team,management,partnerships]) {
  assert.match(page,/Content-Security-Policy/,'CSP missing');
  assert.ok(page.includes('assets/nurvo-plus.css'),'Shared CSS absent');
  assert.ok(!/\sstyle="/.test(page),'Inline style is incompatible with CSP');
}
for(const name of ['Rafael Vester','Tomás Venegas','Sandy Lazo']){
  assert.ok(team.includes(name),'Missing team member '+name);
}
for(const role of ['CEO','Ingeniero Mecánico','Founder','Consultor del Departamento de Negocios','Co-Founder','Product Management','Consultora del Departamento TI']){
  assert.ok(team.includes(role),'Team role not accurate: '+role);
}
assert.match(team,/mayoritario proyectado/i,'Shareholding must be described as projected');
assert.match(team,/no.*acreditan poderes de representación legal/i,'No false corporate powers');
for(const page of [main,hub,vin,terms,privacy]){
  for(const route of ['gestion.html','alianzas.html','equipo.html']){
    assert.ok(page.includes('href="'+route+'"'), 'Missing crosslink '+route);
  }
}
const ids = page => [...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const page of [management,partnerships,team]){
  const collection=ids(page);
  assert.equal(collection.length,new Set(collection).size,'Duplicate HTML IDs');
}
for(const id of ['service-form','service-current','service-last','service-interval','service-result','compare-form','compare-result','fleet-form','fleet-rows','fleet-clear','fleet-export']){
  assert.ok(management.includes('id="'+id+'"'),'Maintenance interface control absent: '+id);
}
for(const id of ['partner-form','partner-preview','partner-requirements','partner-authorized','partner-copy','partner-download']){
  assert.ok(partnerships.includes('id="'+id+'"'),'Partner interface control absent: '+id);
}
assert.match(fleetJS,/localStorage/,'Fleet records must be local and cancellable');
assert.match(fleetJS,/removeItem/,'Fleet data removal required');
assert.match(fleetJS,/URL.createObjectURL/,'Exports must be possible');
assert.match(fleetJS,/CSV formula injection/,'CSV injection guard required');
assert.match(fleetJS,/textContent/);
assert.ok(!/\bfetch\s*\(/.test(fleetJS),'Management must not send data to network');
assert.ok(!/\bfetch\s*\(/.test(businessJS),'Partner form must not send data to network');
assert.match(businessJS,/textContent/);
assert.match(privacy,/gestion.html/,'Privacy disclosure must cover fleet localStorage');
assert.match(terms,/ninguna cláusula exonera/i);
assert.ok(css.length>3000,'Responsive CSS missing');
console.log('NURVO expansion static checks passed: roles, pages, security, local fleets and onboarding.');
