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
  assert.equal(await vinPage.locator('#donde-encontrarlo svg[role="img"]').count(),1);
  assert.match(await vinPage.locator('#donde-encontrarlo').textContent(),/parabrisas/i);
  assert.match(await vinPage.locator('#donde-encontrarlo').textContent(),/padrón/i);
  assert.match(await vinPage.locator('a[href="https://www.chileatiende.gob.cl/fichas/3412-certificado"]').first().textContent(),/padrón/i);
  await vinPage.locator('#vin-number').fill('1HGCM82633A00435I');
  assert.match(await vinPage.locator('#vin-live').textContent(),/no admite I, O, Q/i);
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(),/no admite I, O ni Q/);
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),true);
  await vinPage.locator('#vin-number').fill('CHASIS1975');
  await vinPage.locator('#vin-year').fill('1975');
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(), /antiguo|1981/i);
  assert.match(await vinPage.locator('#vin-detail').textContent(), /no verificados/i);
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),false);
  assert.equal(await vinPage.locator('#vin-copy-summary').isDisabled(),false);
  await vinPage.locator('#vin-number').fill('1HGCM82633A004352');
  await vinPage.locator('#vin-year').fill('');
  await vinPage.route('https://vpic.nhtsa.dot.gov/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({Results:[{Make:'HONDA', Model:'ACCORD', ModelYear:'2003', VehicleType:'PASSENGER CAR', ErrorCode:'0'}]})
  }));
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(), /NHTSA/i);
  await vinPage.locator('#vin-detail').getByText('HONDA').waitFor({timeout:10000});
  assert.match(await vinPage.locator('#vin-detail').textContent(), /HONDA/);
  assert.equal(await vinPage.locator('#vin-breakdown code').count(),3);
  assert.match(await vinPage.locator('#vin-live').textContent(),/17\/17 caracteres/);
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),false);
  await vinPage.evaluate(() => {
    window.__vinCopied = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: {writeText: async text => { window.__vinCopied = text; }}
    });
  });
  await vinPage.locator('#vin-copy-summary').click();
  const masked = await vinPage.evaluate(() => window.__vinCopied);
  assert.match(masked,/VIN oculto/);
  assert.ok(!masked.includes('1HGCM82633A004352'),'Por defecto, no exponer VIN completo');
  await vinPage.locator('#vin-include-full').check();
  await vinPage.locator('#vin-copy-summary').click();
  assert.match(await vinPage.evaluate(() => window.__vinCopied), /1HGCM82633A004352/);
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
  await vinPage.locator('#vin-number').fill('ABCD2026');
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),true,
    'Una ficha anterior no debe permanecer habilitada tras modificar el VIN');
  await vinPage.locator('#vin-legacy').check();
  await vinPage.locator('#vin-submit').click();
  assert.match(await vinPage.locator('#vin-status').textContent(),/antiguo|no estandarizado/i);
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),false);
  await vinPage.locator('#vin-clear').click();
  assert.equal(await vinPage.locator('#vin-number').inputValue(),'');
  assert.equal(await vinPage.locator('#vin-summary-panel').isHidden(),true);
  for(const width of [320,390,768]){
    await vinPage.setViewportSize({width,height:844});
    assert.equal(await vinPage.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),true,
      'Guía VIN con diseño móvil sin overflow a '+width+' px');
  }
  await vinPage.screenshot({path:'test-artifacts/nurvo-vin-guide-mobile.png',fullPage:true,animations:'disabled'});
  await vinPage.close();

  // Automotive ecosystem: real browser behavior, without fabricated provider/official API data.
  assert.equal(await page.locator('#nav a[href="ecosistema.html"]').count(), 1);
  const hub = await context.newPage();
  hub.on('pageerror', err => errors.push('Ecosistema: ' + err.message));
  await hub.goto(new URL('ecosistema.html', ROOT).href, {waitUntil:'domcontentloaded'});
  await hub.locator('#part-grid .part-tile').first().waitFor();
  assert.equal(await hub.locator('#part-grid .part-tile').count(), 16);
  await hub.locator('#family-filter').selectOption('seguridad');
  assert.equal(await hub.locator('#part-grid .part-tile').count(), 4);
  await hub.locator('#part-search').fill('Frenos');
  assert.equal(await hub.locator('#part-grid .part-tile').count(), 1);
  await hub.locator('#part-search').fill('');
  await hub.locator('#family-filter').selectOption('todos');
  await hub.locator('#request-form [name="brand"]').selectOption('Nissan');
  await hub.locator('#request-form [name="model"]').fill('Versa');
  await hub.locator('#request-form [name="year"]').fill('2020');
  await hub.locator('#request-form [name="work"]').selectOption('Frenos / ABS');
  await hub.locator('#request-form [name="part"]').selectOption('Alternativo aftermarket');
  await hub.locator('#request-form [name="supplied"]').selectOption('cliente');
  await hub.locator('#request-form [name="warranty"]').selectOption('vigente');
  await hub.locator('#request-form [name="tenure"]').selectOption('arriendo');
  await hub.locator('#request-form button[type="submit"]').click();
  assert.match(await hub.locator('#request-preview').textContent(), /Nissan Versa/);
  assert.match(await hub.locator('#request-checks').textContent(), /Awto/i);
  assert.match(await hub.locator('#request-checks').textContent(), /taller sigue respondiendo|taller.*negligencia/i);
  assert.equal(await hub.locator('#copy-request').isDisabled(), false);
  await hub.locator('#request-form [name="model"]').fill('Versa nuevo');
  assert.equal(await hub.locator('#copy-request').isDisabled(), true);
  await hub.locator('#authorization').check();
  await hub.locator('#request-form button[type="submit"]').click();
  assert.match(await hub.locator('#request-status').textContent(), /Borrador listo/i);
  await hub.locator('#workshop-location').fill('Maipú');
  await hub.locator('#workshop-specialty').selectOption('frenos automotrices');
  await hub.locator('#workshop-policy').selectOption('cliente');
  await hub.locator('#workshop-form button[type="submit"]').click();
  assert.equal(await hub.locator('#workshop-link').isHidden(), false);
  assert.match(await hub.locator('#workshop-link').getAttribute('href'), /google\.com\/maps\/search/);
  assert.match(await hub.locator('#workshop-status').textContent(), /NURVO no verifica/i);
  await hub.screenshot({path:'test-artifacts/nurvo-ecosistema-desktop.png',fullPage:true,animations:'disabled'});
  await hub.setViewportSize({width:390,height:844});
  assert.equal(await hub.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth), true,'Ecosistema móvil sin overflow');
  await hub.screenshot({path:'test-artifacts/nurvo-ecosistema-mobile.png',fullPage:true,animations:'disabled'});
  await hub.goto(new URL('terminos.html', ROOT).href);
  assert.match(await hub.locator('main').textContent(), /no.*exonera|ninguna cláusula exonera/i);
  await hub.goto(new URL('privacidad.html', ROOT).href);
  assert.match(await hub.locator('main').textContent(), /1 de diciembre de 2026/);
  await hub.close();

  // Expansion: maintenance is based on user-supplied manual intervals, never guessed.
  assert.equal(await page.locator('#nav a[href="gestion.html"]').count(), 1);
  assert.equal(await page.locator('#nav a[href="alianzas.html"]').count(), 1);
  assert.equal(await page.locator('#nav a[href="equipo.html"]').count(), 1);
  const toolsPage = await context.newPage();
  toolsPage.on('pageerror', error => errors.push('Gestion: ' + error.message));
  await toolsPage.goto(new URL('gestion.html', ROOT).href, {waitUntil: 'domcontentloaded'});
  await toolsPage.locator('#service-current').fill('85000');
  await toolsPage.locator('#service-last').fill('80000');
  await toolsPage.locator('#service-interval').fill('10000');
  await toolsPage.locator('#service-form button[type="submit"]').click();
  assert.match(await toolsPage.locator('#service-metrics').textContent(), /90.000/);
  assert.match(await toolsPage.locator('#service-metrics').textContent(), /5.000/);
  assert.match(await toolsPage.locator('#service-result').textContent(), /aún no se alcanza/i);
  await toolsPage.locator('#service-current').fill('91000');
  await toolsPage.locator('#service-form button[type="submit"]').click();
  assert.match(await toolsPage.locator('#service-result').textContent(), /hito declarado ya se alcanzó/i);
  // Comparing declared prices is not a statement that offers are real or safe.
  await toolsPage.locator('#offer-a-name').fill('Taller A');
  await toolsPage.locator('#offer-a-total').fill('15000');
  await toolsPage.locator('#offer-b-name').fill('Taller B');
  await toolsPage.locator('#offer-b-total').fill('22000');
  await toolsPage.locator('#offer-verified').check();
  await toolsPage.locator('#compare-form button[type="submit"]').click();
  assert.match(await toolsPage.locator('#compare-result').textContent(), /7.000/);
  // Fleet data remains local, pseudonymous, exportable and erasable.
  await toolsPage.locator('#fleet-alias').fill('Unidad Demo');
  await toolsPage.locator('#fleet-type').selectOption('arriendo');
  await toolsPage.locator('#fleet-service').selectOption('Frenos');
  await toolsPage.locator('#fleet-km').fill('95000');
  await toolsPage.locator('#fleet-due').fill('90000');
  await toolsPage.locator('#fleet-permission').check();
  await toolsPage.locator('#fleet-form button[type="submit"]').click();
  assert.match(await toolsPage.locator('#fleet-rows').textContent(), /Unidad Demo/);
  assert.match(await toolsPage.locator('#fleet-rows').textContent(), /Hito alcanzado/);
  const downloadFleet = toolsPage.waitForEvent('download');
  await toolsPage.locator('#fleet-export').click();
  const savedFleet = await downloadFleet;
  assert.equal(savedFleet.suggestedFilename(), 'nurvo-flota-local.csv');
  await toolsPage.reload({waitUntil: 'domcontentloaded'});
  assert.match(await toolsPage.locator('#fleet-rows').textContent(), /Unidad Demo/);
  await toolsPage.locator('#fleet-clear').click();
  assert.match(await toolsPage.locator('#fleet-rows').textContent(), /Sin unidades|No hay unidades/);
  await toolsPage.screenshot({path:'test-artifacts/nurvo-gestion-desktop.png',fullPage:true,animations:'disabled'});
  for (const width of [320,390,768]) {
    await toolsPage.setViewportSize({width,height:844});
    assert.equal(await toolsPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true,'Gestión móvil sin overflow a '+width+'px');
  }
  await toolsPage.screenshot({path:'test-artifacts/nurvo-gestion-mobile.png',fullPage:true,animations:'disabled'});
  await toolsPage.close();
  // Partnership form is a local proposal, not an online lead collection.
  const partnersPage = await context.newPage();
  partnersPage.on('pageerror',error=>errors.push('Alianzas: '+error.message));
  await partnersPage.goto(new URL('alianzas.html',ROOT).href,{waitUntil:'domcontentloaded'});
  await partnersPage.locator('#partner-type').selectOption('taller');
  await partnersPage.locator('#partner-org').fill('Taller Demostrativo');
  await partnersPage.locator('#partner-region').fill('Santiago');
  await partnersPage.locator('#partner-authorized').check();
  await partnersPage.locator('#partner-form button[type="submit"]').click();
  assert.match(await partnersPage.locator('#partner-preview').textContent(),/Taller Demostrativo/);
  assert.match(await partnersPage.locator('#partner-preview').textContent(),/NO CONSTITUYE CONVENIO/i);
  assert.equal(await partnersPage.locator('#partner-copy').isDisabled(),false);
  await partnersPage.locator('#partner-type').selectOption('publico');
  assert.equal(await partnersPage.locator('#partner-copy').isDisabled(),true);
  await partnersPage.locator('#partner-form button[type="submit"]').click();
  assert.match(await partnersPage.locator('#partner-requirements').textContent(),/ChileCompra/i);
  await partnersPage.screenshot({path:'test-artifacts/nurvo-alianzas.png',fullPage:true,animations:'disabled'});
  await partnersPage.close();
  const foundersPage = await context.newPage();
  foundersPage.on('pageerror',error=>errors.push('Equipo: '+error.message));
  await foundersPage.goto(new URL('equipo.html',ROOT).href,{waitUntil:'domcontentloaded'});
  for (const person of ['Rafael Vester','Tomás Venegas','Sandy Lazo']) {
    assert.match(await foundersPage.locator('main').textContent(),new RegExp(person));
  }
  for(const width of [320,390,768]){
    await foundersPage.setViewportSize({width,height:844});
    assert.equal(await foundersPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true,'Equipo móvil sin overflow a '+width+'px');
  }
  await foundersPage.screenshot({path:'test-artifacts/nurvo-equipo-mobile.png',fullPage:true,animations:'disabled'});
  await foundersPage.close();


  // Supplier catalogue must not fabricate offers if no backend is configured.
  assert.equal(await page.locator('#nav a[href="catalogo.html"]').count(),1);
  const supplierCatalog = await context.newPage();
  supplierCatalog.on('pageerror',error=>errors.push('Catálogo: '+error.message));
  await supplierCatalog.goto(new URL('catalogo.html',ROOT).href,{waitUntil:'domcontentloaded'});
  await supplierCatalog.waitForFunction(() => document.getElementById('catalog-status')?.textContent.includes('Sin backend comercial configurado'));
  assert.match(await supplierCatalog.locator('#catalog-products').textContent(),/Sin API conectada|Catálogo sin API/);
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),0);
  // The API is intercepted ONLY for the browser test; no real supplier or price is claimed.
  await supplierCatalog.route('**/config.js',route=>route.fulfill({
    status:200,contentType:'application/javascript',
    body:"window.NURVO_API_BASE_URL = 'https://api.nurvo.example';"
  }));
  await supplierCatalog.route('https://api.nurvo.example/api/marketplace/status',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({enabled:true,checkout:'no_disponible'})
  }));
  await supplierCatalog.route('https://api.nurvo.example/api/marketplace/products?limit=50',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({results:[{
      id:'00000000-0000-4000-8000-000000000001',
      tenant_id:'supplier-test',
      sku:'TEST-BRAKE-007',
      title:'<img src=x onerror=alert(1)> Pastillas de ensayo',
      condition:'alternativo',category:'frenos',oem_reference:'REF-TEST-123',brand:'Marca ficticia',
      fitment_note:'No certificado',
      price_clp:45990,stock_qty:4,
      source_url:'https://repuestos.example.cl/prueba',
      warranty_summary:'Garantía por definir en pruebas',
      review_state:'published',updated_at:'2026-11-02T00:00:00+00:00'
    }]})
  }));
  await supplierCatalog.reload({waitUntil:'domcontentloaded'});
  await supplierCatalog.locator('.catalog-card').first().waitFor();
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),1);
  assert.match(await supplierCatalog.locator('.catalog-price').textContent(),/45.990/);
  assert.equal(await supplierCatalog.locator('.catalog-card img').count(),0,'No ejecutar HTML malicioso de proveedor');
  assert.match(await supplierCatalog.locator('.catalog-card h3').textContent(),/<img src=x onerror=alert\(1\)>/);
  await supplierCatalog.locator('#catalog-condition').selectOption('genuino');
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),0);
  await supplierCatalog.locator('#catalog-condition').selectOption('alternativo');
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),1);
  await supplierCatalog.locator('#catalog-category').selectOption('accesorios');
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),0);
  await supplierCatalog.locator('#catalog-category').selectOption('frenos');
  assert.equal(await supplierCatalog.locator('.catalog-card').count(),1);
  for(const width of [320,390,768]){
    await supplierCatalog.setViewportSize({width,height:844});
    assert.equal(await supplierCatalog.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),
      true,'Catálogo móvil sin overflow a '+width);
  }
  await supplierCatalog.screenshot({path:'test-artifacts/nurvo-catalogo-mobile.png',fullPage:true,animations:'disabled'});
  await supplierCatalog.close();

  assert.deepEqual(errors, [], 'Errores de JavaScript en navegador');
  console.log('NURVO browser checks passed: desktop, mobile, logos, search, images, quote list, compare, diagnostic, carousels.');
  if (warnings.length) console.log('Browser warnings (nonfatal): ' + warnings.slice(0, 6).join(' | '));
} finally {
  await context.close();
  await browser.close();
}
