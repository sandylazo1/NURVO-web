import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html=read('ecosistema.html');
const js=read('assets/ecosistema.js');
const css=read('assets/ecosistema.css');
const terms=read('terminos.html');
const privacy=read('privacidad.html');
const main=read('index.html');
const vin=read('vin.html');
assert.doesNotThrow(()=>new Script(js),'El JS del ecosistema debe compilar.');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'IDs duplicados');
for(const id of ['family-filter','part-search','part-grid','part-count','request-form','authorization','request-status','request-checks','request-preview','copy-request','download-request','workshop-form','workshop-location','workshop-specialty','workshop-policy','workshop-link','workshop-status']){
  assert.ok(ids.includes(id),'Falta ID requerido: '+id);
}
for(const name of ['brand','model','year','engine','work','part','supplied','warranty','tenure']){
  assert.match(html,new RegExp('name="'+name+'"'),'Campo de solicitud faltante: '+name);
}
assert.ok(html.includes('Content-Security-Policy'));
assert.ok(html.includes('assets/ecosistema.js'));
assert.ok(html.includes('assets/ecosistema.css'));
assert.ok(css.length>1000);
assert.ok(js.includes('textContent'),'Texto no confiable debe escapar como texto');
assert.ok(!/\blocalStorage\b/.test(js),'El generador de borradores no puede persistir datos del usuario');
assert.ok(!/\bfetch\s*\(/.test(js),'El ecosistema no debe enviar información a API');
assert.match(js,/encodeURIComponent/,'La búsqueda de talleres codifica el texto');
assert.match(js,/alta tensión|alto voltaje/i,'Debe alertar sobre piezas críticas');
assert.match(js,/arriendo|carsharing/i,'Debe pedir autorización para arrendados');
assert.match(js,/publico/,'Debe contemplar flotas públicas');
assert.match(terms,/no.*exonera|ninguna cláusula exonera/i,'No renunciar a deberes de taller');
assert.match(terms,/garantía legal/i);
for (const official of ['www.ford.cl/posventa/garantia','www.nissan.cl/servicios/mantenimiento-preventivo','www.hyundai.cl/repuestos','www.volkswagen.cl/informacion-legal-y-garantias','repuestos.derco.cl/faq']) {
  assert.ok(html.includes(official),'Fuente oficial de postventa faltante: '+official);
}

assert.match(privacy,/1 de diciembre de 2026/i,'Fecha entrada Ley 21.719');
assert.match(privacy,/responsable/i);
assert.ok(main.includes('href="ecosistema.html"'),'Enlace desde portada a ecosistema');
assert.ok(vin.includes('href="ecosistema.html"'),'Enlace desde VIN al ecosistema');
for(const path of ['docs/COMPLIANCE_CHILE_2026.md','docs/CYBERSECURITY_ASSESSMENT.md','docs/MARKET_PARTNERSHIPS_CL.md','docs/INTEGRATIONS_MATRIX.md']){
 const doc=read(path);
 assert.ok(doc.length>1500,'Documento incompleto: '+path);
}
console.log('NURVO ecosystem checks passed: CSP, JS, parts, legal/privacy disclosures, navigation, fleet permissions.');
