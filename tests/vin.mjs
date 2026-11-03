import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const html = readFileSync(new URL('../vin.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../assets/vin-tool.js', import.meta.url), 'utf8');
assert.doesNotThrow(() => new Script(code));
for (const id of ['vin-form','vin-number','vin-year','vin-status','vin-detail','quote-form','quote-list','quote-price','quote-date','maintenance-list','center-form','center-location','center-link']) {
  assert.ok(html.includes('id="' + id + '"'), 'Falta control: '+id);
}
const baseCss = readFileSync(new URL('../assets/vin-base.css', import.meta.url), 'utf8');
const guideCss = readFileSync(new URL('../assets/vin-guide.css', import.meta.url), 'utf8');
for (const id of ['donde-encontrarlo','consulta-vin','vin-live','vin-breakdown','vin-legacy','vin-engine',
  'vin-trim','vin-part','vin-condition','vin-oem','vin-clear','vin-summary-panel','vin-include-full','vin-copy-summary','vin-copy-status']){
  assert.ok(html.includes('id="' + id + '"'), 'Falta función o ayuda del VIN: '+id);
}
assert.ok(html.includes('vin-svg-title') && html.includes('vin-svg-desc'), 'Dibujo accesible de ubicaciones VIN');
assert.ok(html.includes('Parabrisas') && html.includes('Marco de puerta') && html.includes('padrón'), 'Guía real VIN');
assert.ok(html.includes('chileatiende.gob.cl/fichas/3412-certificado'), 'Fuente oficial del padrón');
assert.ok(html.includes('assets/vin-base.css') && html.includes('assets/vin-guide.css'));
assert.ok(baseCss.length > 1500 && guideCss.length > 1500);
assert.ok(!/<style>/i.test(html), 'Estilos VIN externalizados para CSP estricta');
assert.ok(!/\\sstyle="/i.test(html), 'La CSP no admite style inline');
assert.match(html,/Content-Security-Policy/);
assert.match(code,/WMI · fabricante/);
assert.match(code,/VDS · descripción/);
assert.match(code,/VIS · identificador/);
assert.match(code,/summaryFor\('manual'/);
assert.match(code,/summaryFor\('nhtsa'/);
assert.match(code,/vin-include-full/);
assert.match(code,/VIN oculto/);
assert.match(code,/requestId !== searchRevision/,'Los resultados antiguos deben ignorarse tras borrar VIN');
assert.match(code, /DecodeVinValues/, 'Consulta vPIC pública');
assert.match(code, /1981/, 'Límite de VIN antiguos explicitado');
assert.match(html, /no tiene convenio ni credenciales/, 'No atribuir fuentes chilenas no conectadas');
assert.match(html, /cotizaciones se guardan únicamente/, 'Sin precios inventados');
assert.match(html, /GitHub Pages es estático/, 'No afirmar backend en Pages');
console.log('VIN page checks passed');
