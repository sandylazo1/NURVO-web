import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const ROOT = process.env.NURVO_TEST_URL || 'http://127.0.0.1:8765/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];
const warnings = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => { if (msg.type() === 'warning') warnings.push(msg.text()); });

try {
  await page.goto(ROOT, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#products .product').first().waitFor({ timeout: 15000 });
  assert.match(await page.title(), /NURVO/i);
  assert.equal(await page.locator('#products .product').count(), 8, 'Debe haber ocho familias');

  // Logo: actual PNG in an <img>, never an SVG substitute.
  assert.equal(await page.locator('a.image-logo img').count(), 2);
  assert.equal(await page.locator('a.image-logo img').first().evaluate(e => e.complete && e.naturalWidth > 0), true);

  // Search, filter, cards and image swapping work.
  await page.locator('#search').fill('frenos');
  assert.equal(await page.locator('#products .product').count(), 1);
  await page.locator('#search').fill('');
  await page.locator('#categories [data-cat="Filtros"]').click();
  assert.equal(await page.locator('#products .product').count(), 1);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#products .product').count(), 8);
  await page.locator('#products .product .photo-flip').first().click();
  assert.equal(await page.locator('#products .product .nurvo-part-photos').first().evaluate(el => el.classList.contains('alternate')), true);

  // Quote-first workflow with persistent list: no fake prices.
  await page.locator('[data-add="1"]').first().click();
  assert.match(await page.locator('#count').textContent(), /1/);
  await page.locator('#cart-open').click();
  assert.equal(await page.locator('#cart-dialog').evaluate(el => el.open), true);
  assert.match(await page.locator('#cart-items').textContent(), /frenos/i);
  assert.equal(await page.locator('#copy-quote').count(), 1);
  await page.locator('#cart-dialog [data-close]').first().click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#count').textContent(), '1');

  // Quote comparison operates without prices.
  await page.locator('[data-compare="1"]').first().click();
  await page.locator('[data-compare="2"]').first().click();
  await page.locator('#compare-open').click();
  assert.equal(await page.locator('#compare-dialog').evaluate(el => el.open), true);
  assert.match(await page.locator('#compare-result').textContent(), /Consultar con tienda|Consultar con proveedor/i);
  await page.locator('#compare-close').click();

  // Page without configured API must be explicit, never invent records.
  await page.locator('#official-plate').fill('ABCD12');
  await page.locator('#official-plate-form button[type="submit"]').click();
  assert.match(await page.locator('#official-status').textContent(), /Sin API conectada|No hay backend conectado|Modo demostración|API/i);
  assert.equal(await page.locator('#official-result').isHidden(), false);
  assert.match(await page.locator('#official-fields').textContent(), /No verificado/i);
  assert.match(await page.locator('#official-sync').textContent(), /Última sincronización de datos: No disponible/i);

  // The manual inspection assistant still runs.
  await page.locator('#diag-form [name="plate"]').fill('ABCD12');
  await page.locator('#diag-form [name="make"]').fill('Toyota');
  await page.locator('#diag-form [name="model"]').fill('Yaris');
  await page.locator('#diag-form [name="year"]').fill('2018');
  await page.locator('#diag-form [name="km"]').fill('85000');
  await page.locator('#diag-form [name="symptom"]').selectOption('brakes');
  await page.locator('#diag-form button[type="submit"]').click();
  assert.match(await page.locator('#diag-output').textContent(), /frenos|prioridad|revisión/i);

  // Tabs/cinematic motion are a working control, not decoration.
  await page.locator('[data-scene="1"]').click();
  assert.equal(await page.locator('.nurvo-journey-panel.is-active').count(), 1);
  assert.equal(await page.locator('[data-scene="1"]').getAttribute('aria-pressed'), 'true');

  // Detect broken interactions hidden behind horizontal scrolling.
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(desktopOverflow <= 2, 'Desbordamiento horizontal escritorio: ' + desktopOverflow + 'px');

  // Keyboard-accessible controls and reduced-motion preference.
  assert.equal(await page.locator('#cart-open').getAttribute('type') === 'button' || await page.locator('#cart-open').getAttribute('type') === null, true);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);

  await mkdir('test-artifacts', { recursive: true });
  await page.screenshot({ path: 'test-artifacts/nurvo-desktop.png', fullPage: true, animations: 'disabled' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(mobileOverflow <= 2, 'Desbordamiento horizontal móvil: ' + mobileOverflow + 'px');
  assert.equal(await page.locator('.nurvo-mobile-dock').isVisible(), true, 'La navegación móvil debe aparecer');
  await page.locator('#menu').click();
  assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#nav').evaluate(el => el.classList.contains('open')), true);
  await page.screenshot({ path: 'test-artifacts/nurvo-mobile.png', fullPage: true, animations: 'disabled' });

  assert.deepEqual(errors, [], 'Errores de JavaScript en navegador');
  console.log('NURVO browser checks passed: desktop, mobile, logos, search, images, quote list, compare, diagnostic, carousels.');
  if (warnings.length) console.log('Browser warnings (nonfatal): ' + warnings.slice(0, 6).join(' | '));
} finally {
  await context.close();
  await browser.close();
}
