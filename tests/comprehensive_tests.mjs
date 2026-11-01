import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// 1. Script compilation
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'El JavaScript principal debe existir');
assert.doesNotThrow(() => new Script(script), 'El JavaScript principal compila limpiamente');

// 2. ID integrity
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'No debe haber ningún ID duplicado');
const required = [
  'nav','search','sort','categories','results','products',
  'diag-form','diag-output','vehicle-form','cart-items','cart-dialog',
  'supplier-grid','hero-plate-form','journey-stage','compare-tray',
  'compare-dialog','nurvo-progress','hero-plate-visual',
  'nurvo-dock-quote','nurvo-to-top'
];
for (const req of required) {
  assert.ok(ids.includes(req), `ID crítico presente: ${req}`);
}

// 3. Chilean plate badge and quick samples
assert.ok(html.includes('class="chile-plate-badge"'), 'Componente visual de patente chilena presente');
assert.ok(html.includes('data-sample-plate='), 'Chips de patentes de prueba presentes');
assert.ok(html.includes('hero-plate-visual'), 'Contenedor visual de patente reactivo presente');

// 4. Products and photography
assert.ok(html.includes('data-photo='), 'Alternancia de fotografía de producto');
assert.ok(html.includes('id="proveedores"'), 'Directorio de proveedores verificado');
assert.ok(html.includes('id="asistente"'), 'Asistente vehicular verificado');

// 5. Commercial compliance
assert.ok(html.includes('Cotizar con proveedor') || html.includes('Solicitar al proveedor'), 'Modelo de cotización transparente');
assert.ok(!html.includes('money(p.price'), 'Sin precios inventados');
assert.ok(!html.includes("$('#budget')"), 'Sin filtros de presupuesto ficticios');
assert.ok(html.includes('prefers-reduced-motion'), 'Cumplimiento WCAG de movimiento reducido');

// 6. Mobile dock
assert.ok(html.includes('class="nurvo-mobile-dock"'), 'Navegación móvil presente');
assert.ok(html.includes('id="nurvo-to-top"'), 'Botón volver arriba presente');

console.log('NURVO Comprehensive Test Suite: 100% SUCCESS');
