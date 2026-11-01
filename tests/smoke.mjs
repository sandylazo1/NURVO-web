import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'El JavaScript principal debe existir');
assert.doesNotThrow(() => new Script(script), 'El JavaScript debe poder compilar');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'No debe haber IDs HTML duplicados');
for (const id of ['nav','search','sort','categories','results','products','diag-form','diag-output','vehicle-form','cart-items','cart-dialog','supplier-grid','hero-plate-form','journey-stage']) {
  assert.ok(ids.includes(id), 'Falta un elemento esencial: ' + id);
}
assert.equal((html.match(/data:image\/png;base64,/g) || []).length, 2, 'Logotipos PNG transparentes en cabecera y pie');
assert.ok(html.includes('photos:[3642618'), 'Catálogo con imágenes reales');
assert.ok(html.includes('data-photo='), 'Cambio de imagen accesible');
assert.ok(html.includes('id="proveedores"'), 'Directorio de proveedores');
assert.ok(html.includes('id="asistente"'), 'Asistente vehicular');
assert.ok(html.includes('Solicitar al proveedor') || html.includes('Cotizar con proveedor'), 'Modelo de cotización');
assert.ok(!html.includes('money(p.price'), 'No mostrar precios inventados');
assert.ok(!html.includes("$('#budget')"), 'No ofrecer filtro de precios ficticios');
assert.ok(html.includes('prefers-reduced-motion'), 'Respetar reducción de movimiento');

const externalScripts = ['config.js','assets/patente-api.js'];
for (const filename of externalScripts) {
  assert.ok(html.includes('src="' + filename + '"'), 'Script no enlazado: ' + filename);
  assert.doesNotThrow(() => new Script(readFileSync(new URL('../' + filename, import.meta.url), 'utf8')),
    'El script no compila: ' + filename);
}
const productPairs = [...html.matchAll(/photos:\[(\d+),(\d+)\]/g)].map(match => match.slice(1));
assert.equal(productPairs.length, 8, 'Ocho familias con doble fotografía');
assert.equal(new Set(productPairs.flat()).size, 16, 'Cada foto debe ser diferente');
for (const filename of ['backend/app/main.py', 'backend/app/providers.py', 'backend/app/db.py']) {
  assert.ok(readFileSync(new URL('../' + filename, import.meta.url), 'utf8').length > 250);
}

console.log('NURVO: comprobaciones estáticas superadas (estructura, JS, PNG, cotizaciones y accesibilidad básica).');
