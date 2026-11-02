import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const html = readFileSync(new URL('../vin.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../assets/vin-tool.js', import.meta.url), 'utf8');
assert.doesNotThrow(() => new Script(code));
for (const id of ['vin-form','vin-number','vin-year','vin-status','vin-detail','quote-form','quote-list','quote-price','quote-date','maintenance-list','center-form','center-location','center-link']) {
  assert.ok(html.includes('id="' + id + '"'), 'Falta control: '+id);
}
assert.match(code, /DecodeVinValues/, 'Consulta vPIC pública');
assert.match(code, /1981/, 'Límite de VIN antiguos explicitado');
assert.match(html, /no tiene convenio ni credenciales/, 'No atribuir fuentes chilenas no conectadas');
assert.match(html, /cotizaciones se guardan únicamente/, 'Sin precios inventados');
assert.match(html, /GitHub Pages es estático/, 'No afirmar backend en Pages');
console.log('VIN page checks passed');
