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

  await mkdir('test-artifacts', { recursive: true });
  await page.screenshot({ path: 'test-artifacts/nurvo-desktop.png', fullPage: true, animations: 'disabled' });

  // The shortcut bar must not cover the page or intercept the header menu.
  for (const width of [320, 360, 390, 430, 768, 960]) {
    await page.setViewportSize({ width, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sin desbordamiento a ${width}px`);
    if (width <= 600) {
      const dock = await page.locator('.nurvo-mobile-dock').boundingBox();
      assert.ok(dock && dock.height < 100 && dock.y > 700, 'La barra móvil queda al pie sin cubrir el contenido');
      await page.locator('.nurvo-mobile-dock button').click();
      assert.equal(await page.locator('#cart-dialog').evaluate(el => el.open), true);
      await page.keyboard.press('Escape');
    }
    await page.locator('#menu').click();
    assert.equal(await page.locator('#nav').isVisible(), true);
    await page.locator('#nav a[href="#marketplace"]').click();
    assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'false');
    await page.locator('#search').fill('frenos');
    assert.equal(await page.locator('#products .product').count(), 1);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.nurvo-mobile-dock').isVisible(), true, 'La navegación móvil debe aparecer');
  await page.locator('#menu').click();
  assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#nav').evaluate(el => el.classList.contains('open')), true);
  await page.screenshot({ path: 'test-artifacts/nurvo-mobile.png', fullPage: true, animations: 'disabled' });

  // VIN tools are a static Pages route. Mock NHTSA in browser tests: no claim of live API availability.
  const vinPage = await context.newPage();
  vinPage.on('pageerror', err => errors.push(err.message));
  await vinPage.goto(new URL('vin.html', ROOT).href, {waitUntil: 'domcontentloaded'});
  assert.match(await vinPage.title(), /VIN.*NURVO/);
  await vinPage.locator('#vin-number').fill('CHASIS1975');
  await vinPage.locator('#vin-year').fill('1975');
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(), /antiguo|1981/i);
  assert.match(await vinPage.locator('#vin-detail').textContent(), /no verificados/i);
  await vinPage.locator('#vin-number').fill('1HGCM82633A004352');
  await vinPage.locator('#vin-year').fill('');
  await vinPage.route('https://vpic.nhtsa.dot.gov/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({Results:[{Make:'HONDA', Model:'ACCORD', ModelYear:'2003', VehicleType:'PASSENGER CAR', ErrorCode:'0'}]})
  }));
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(), /NHTSA/i);
  assert.match(await vinPage.locator('#vin-detail').textContent(), /HONDA/);
  await vinPage.locator('#quote-service').fill('Frenos');
  await vinPage.locator('#quote-provider').fill('Cotización manual');
  await vinPage.locator('#quote-price').fill('15000');
  await vinPage.locator('#quote-date').fill(new Date().toISOString().slice(0,10));
  await vinPage.locator('#quote-form button').click();
  assert.match(await vinPage.locator('#quote-list').textContent(), /15.000/);
  assert.match(await vinPage.locator('#quote-list').textContent(), /no verificado/i);
  await vinPage.locator('#center-location').fill('Santiago');
  await vinPage.locator('#center-form button').click();
  assert.equal(await vinPage.locator('#center-link').isHidden(), false);
  assert.match(await vinPage.locator('#center-link').getAttribute('href'), /google\.com\/maps\/search/);
  await vinPage.close();

  assert.deepEqual(errors, [], 'Errores de JavaScript en navegador');
  console.log('NURVO browser checks passed: desktop, mobile, logos, search, images, quote list, compare, diagnostic, carousels.');
  if (warnings.length) console.log('Browser warnings (nonfatal): ' + warnings.slice(0, 6).join(' | '));
} finally {
  await context.close();
  await browser.close();
}
