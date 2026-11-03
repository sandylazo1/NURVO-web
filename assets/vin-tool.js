/* NURVO VIN & services: public NHTSA decoding, no Chilean registry credentials. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const vinForm = $('vin-form');
  if (!vinForm) return;
  const notice = $('vin-status');
  const detail = $('vin-detail');
  const quoteList = $('quote-list');
  const tasks = $('maintenance-list');
  const storageKey = 'nurvo-price-quotes-v1';
  const allowedVin = /^[A-HJ-NPR-Z0-9]{17}$/;
  const historicalId = /^[A-Z0-9-]{3,30}$/;
  const summaryPanel = $('vin-summary-panel');
  const summaryButton = $('vin-copy-summary');
  let latestSummary = null;
  let activeRequest = null;
  let searchRevision = 0;
  const $$ = (tag, content, className) => {
    const el = document.createElement(tag);
    if (content != null) el.textContent = String(content);
    if (className) el.className = className;
    return el;
  };
  function output(message, level = 'info') {
    notice.textContent = message;
    notice.dataset.level = level;
  }
  function field(label, value) {
    const div = $$('div', null, 'data-field');
    div.append($$('dt', label), $$('dd', value || 'No informado'));
    detail.append(div);
  }
  function normalizedVin() {
    return $('vin-number').value.toUpperCase().replace(/\s/g, '');
  }
  function updateGuide() {
    const code = normalizedVin();
    const legacy = $('vin-legacy').checked;
    const preview = $('vin-breakdown');
    const live = $('vin-live');
    preview.replaceChildren();
    let message = '';
    let level = 'info';
    if (!code) {
      message = '0 caracteres. Busca el identificador en el parabrisas, puerta o padrón.';
    } else if (!historicalId.test(code)) {
      message = code.length + ' caracteres. Revisa símbolos o espacios: solo se permiten letras, números y guiones para chasis antiguos.';
      level = 'warning';
    } else if (legacy) {
      message = code.length + ' caracteres. Modo antiguo seleccionado: no se consultará NHTSA; verifica el chasis con tus documentos.';
      level = 'warning';
    } else if (code.length === 17 && !allowedVin.test(code)) {
      message = '17 caracteres, pero el VIN moderno no admite I, O, Q ni guiones. Corrige el número o selecciona chasis antiguo.';
      level = 'warning';
    } else if (code.length === 17) {
      message = '17/17 caracteres. Formato moderno plausible; esto NO confirma que el vehículo exista ni que un repuesto sea compatible.';
      level = 'ok';
      [
        ['WMI · fabricante', code.slice(0,3)],
        ['VDS · descripción', code.slice(3,9)],
        ['VIS · identificador', code.slice(9,17)],
      ].forEach(([label,value]) => {
        const group = $('div');
        group.append($('code',value),$('span',label));
        preview.append(group);
      });
    } else {
      message = code.length + '/17 caracteres. ' +
        (code.length < 17 ? 'Si es moderno, faltan '+(17-code.length)+' caracteres. ' : 'Longitud no estándar. ') +
        'Si es un chasis antiguo, puedes registrarlo sin decodificación automática.';
      level = 'warning';
    }
    live.dataset.level = level;
    live.textContent = message;
    $('vin-number').setAttribute('aria-invalid', String(level==='warning' && code.length===17 && !legacy));
  }
  function invalidateVinResult() {
    searchRevision += 1;
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }
    $('vin-submit').disabled = false;
    latestSummary = null;
    summaryPanel.hidden = true;
    summaryButton.disabled = true;
    $('vin-copy-status').textContent = '';
    $('vin-include-full').checked = false;
    detail.replaceChildren();
    output('Identificador o contexto modificado. Revisa el formato y consulta cuando corresponda.');
  }
  ['vin-number','vin-year','vin-engine','vin-trim'].forEach(id => {
    $(id).addEventListener('input', () => { invalidateVinResult(); updateGuide(); });
  });
  $('vin-legacy').addEventListener('change', () => { invalidateVinResult(); updateGuide(); });
  $('vin-clear').addEventListener('click', () => {
    vinForm.reset();
    invalidateVinResult();
    output('Datos del VIN borrados de esta pantalla. No se guardó el VIN en NURVO.');
    updateGuide();
    $('vin-number').focus();
  });
  function summaryFor(mode, code, manufacturer) {
    latestSummary = {
      mode, code,
      userYear: $('vin-year').value.trim(),
      engine: $('vin-engine').value.trim().slice(0,80),
      trim: $('vin-trim').value.trim().slice(0,80),
      manufacturer: manufacturer || null,
    };
    summaryPanel.hidden = false;
    summaryButton.disabled = false;
    $('vin-copy-status').textContent = 'Ficha preparada localmente. El VIN completo está excluido por defecto.';
  }
  summaryButton.addEventListener('click', async () => {
    if (!latestSummary) return;
    const s = latestSummary;
    const includeFull = $('vin-include-full').checked;
    const masked = s.code.length <= 4 ? '••••' : '••••' + s.code.slice(-4);
    const manufacturer = s.manufacturer;
    const lines = [
      'NURVO — FICHA ORIENTATIVA PARA SOLICITAR COMPATIBILIDAD',
      'Este texto NO certifica piezas ni situación legal del vehículo.',
      'Identificador: ' + (includeFull ? s.code : masked + ' (parcial; VIN oculto)'),
      'Modo: ' + (s.mode === 'nhtsa' ? 'Decodificación pública NHTSA vPIC' : 'Chasis antiguo/no estándar sin decodificación'),
      'Año informado por usuario: ' + (s.userYear || 'No indicado'),
      'Motor informado por usuario: ' + (s.engine || 'No indicado'),
      'Versión informada por usuario: ' + (s.trim || 'No indicada'),
      'Marca declarada por NHTSA: ' + (manufacturer?.make || 'No disponible'),
      'Modelo declarado por NHTSA: ' + (manufacturer?.model || 'No disponible'),
      'Año declarado por NHTSA: ' + (manufacturer?.year || 'No disponible'),
      'Motorización NHTSA (orientativa): ' + (manufacturer?.engine || 'No informada'),
      'Fuente: ' + (s.mode === 'nhtsa' ? 'NHTSA vPIC, EE. UU.; cobertura internacional variable' : 'Datos de usuario sin fuente automática'),
      '',
      'PENDIENTE DE VERIFICAR ANTES DE COMPRAR/INSTALAR:',
      'Código OEM, variante del motor, equipamiento, medida, homologación, condición real, origen y garantía del producto.',
      'El proveedor/taller debe confirmar compatibilidad y seguridad por sus propios medios autorizados.',
      'No se verificaron patente, dueño, encargo por robo, multas, recalls ni registro chileno.',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      $('vin-copy-status').textContent = includeFull ?
        'Ficha copiada con VIN completo porque lo autorizaste expresamente. Compártela solo con un proveedor de confianza.' :
        'Ficha copiada con VIN oculto. Puedes pegarla en una solicitud de cotización.';
    } catch {
      $('vin-copy-status').textContent = 'El navegador bloqueó el portapapeles. Puedes revisar los datos mostrados y anotarlos manualmente.';
    }
  });
  updateGuide();
  const maintenance = [
    ['Aceite y filtro', 'Consultar especificación e intervalo del fabricante'],
    ['Frenos y neumáticos', 'Revisar desgaste y condiciones de seguridad'],
    ['Refrigerante y correas', 'Comprobar intervalos y especificaciones'],
    ['Batería e iluminación', 'Inspeccionar funcionamiento'],
    ['Filtros de aire y habitáculo', 'Revisar según uso y manual'],
    ['Revisión técnica y documentación', 'Confirmar vencimientos en fuentes oficiales'],
  ];
  for (const [name, info] of maintenance) {
    const li = $$('li');
    const label = $$('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    label.append(check, document.createTextNode(' ' + name));
    li.append(label, $$('small', info));
    tasks.append(li);
  }
  vinForm.addEventListener('submit', async e => {
    const requestId = ++searchRevision;
    latestSummary = null;
    summaryPanel.hidden = true;
    summaryButton.disabled = true;
    $('vin-copy-status').textContent = '';
    $('vin-include-full').checked = false;
    e.preventDefault();
    const raw = normalizedVin();
    const legacy = $('vin-legacy').checked;
    const yearRaw = $('vin-year').value.trim();
    const year = yearRaw ? Number(yearRaw) : null;
    const currentYear = new Date().getFullYear() + 1;
    const submit = $('vin-submit');
    $('vin-number').value = raw;
    detail.replaceChildren();
    if (yearRaw && (!Number.isInteger(year) || year < 1886 || year > currentYear)) {
      output('Revisa el año: debe ser un año de fabricación plausible.', 'error');
      return;
    }
    if (!historicalId.test(raw)) {
      output('Ingresa un identificador de chasis/VIN válido. No se aceptan espacios ni caracteres especiales distintos del guion para vehículos antiguos.', 'error');
      return;
    }
    field('Identificador ingresado', raw);
    field('Año informado por ti', year || 'No indicado');
    field('Encargo por robo, multas y propietario', 'No verificados. Usa los servicios oficiales de Chile.');
    if (raw.length === 17 && !allowedVin.test(raw) && !legacy) {
      output('El VIN moderno de 17 caracteres no admite I, O ni Q. Revisa la transcripción. Para chasis no estándar, indica el año antiguo si corresponde.', 'error');
      return;
    }
    if (legacy || (year && year < 1981) || !allowedVin.test(raw)) {
      output('Identificador antiguo o no estandarizado: NHTSA no puede verificar automáticamente vehículos previos a 1981. No se infiere marca, año ni existencia.', 'warning');
      field('Estado', 'Identificador ingresado manualmente; sin identificación automática');
      summaryFor('manual', raw, null);
      return;
    }
    output('Consultando los datos públicos de fabricante en NHTSA…');
    submit.disabled = true;
    const controller = new AbortController();
    activeRequest = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const params = new URLSearchParams({format:'json'});
      if (year) params.set('modelyear', String(year));
      const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + encodeURIComponent(raw) + '?' + params.toString();
      const response = await fetch(url, {signal: controller.signal, headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Servicio NHTSA no disponible (HTTP ' + response.status + ')');
      const payload = await response.json();
      if (requestId !== searchRevision) return;
      const row = payload && Array.isArray(payload.Results) && payload.Results[0];
      if (!row || typeof row !== 'object') throw new Error('NHTSA devolvió un formato no reconocido');
      const make = String(row.Make || '').trim();
      const model = String(row.Model || '').trim();
      const modelYear = String(row.ModelYear || '').trim();
      field('Marca según NHTSA', make);
      field('Modelo según NHTSA', model);
      field('Año según NHTSA', modelYear);
      field('Tipo', row.VehicleType || '');
      field('Fabricante', row.Manufacturer || '');
      if (row.EngineModel) field('Modelo de motor según NHTSA', row.EngineModel);
      if (row.EngineCylinders) field('Cilindros según NHTSA', row.EngineCylinders);
      if (row.FuelTypePrimary) field('Combustible según NHTSA', row.FuelTypePrimary);
      if (row.Trim) field('Versión según NHTSA', row.Trim);
      if (row.DriveType) field('Tracción según NHTSA', row.DriveType);
      field('Fuente', 'NHTSA vPIC: registros declarados por fabricantes, no Registro Civil de Chile');
      summaryFor('nhtsa', raw, {
        make, model, year: modelYear, engine: String(row.EngineModel || '').trim(),
      });
      if (!make || !model || !modelYear || String(row.ErrorCode || '').split(',').some(x => x.trim() === '1')) {
        output('Decodificación incompleta. No se puede confirmar identidad ni compatibilidad de repuestos. Verifica la ficha del fabricante.', 'warning');
      } else {
        output('Datos de fabricante recibidos de NHTSA. No certifican matrícula, dominio, versión comercial chilena ni situación legal.', 'ok');
      }
    } catch (err) {
      if (requestId !== searchRevision) return;
      field('Estado', 'Sin resultado automático verificable');
      output(err.name === 'AbortError' ? 'La consulta NHTSA excedió el tiempo permitido. Usa el enlace al decodificador externo.' : 'No fue posible conectar con NHTSA desde este navegador. Usa el enlace oficial externo. ' + (err.message || ''), 'warning');
    } finally {
      clearTimeout(timer);
      if (activeRequest === controller) activeRequest = null;
      if (requestId === searchRevision) submit.disabled = false;
    }
  });
  function quotes() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value.filter(x => x && typeof x === 'object').slice(0, 30) : [];
    } catch { return []; }
  }
  function renderQuotes() {
    const data = quotes();
    quoteList.replaceChildren();
    if (!data.length) { quoteList.append($$('li', 'Sin cotizaciones registradas. NURVO no inventa precios ni stock.')); return; }
    data.forEach((item, i) => {
      const li = $$('li', null, 'quote-item');
      const title = $$('strong', item.service + ' — ' + Number(item.price).toLocaleString('es-CL', {style:'currency',currency:'CLP',maximumFractionDigits:0}));
      const source = $$('small', 'Proveedor indicado: ' + item.provider + ' · Fecha: ' + item.date + ' · Ingresado por ti (no verificado por NURVO)');
      const remove = $$('button', 'Eliminar', 'text-button');
      remove.type = 'button';
      remove.addEventListener('click', () => {
        const list = quotes(); list.splice(i, 1);
        localStorage.setItem(storageKey, JSON.stringify(list)); renderQuotes();
      });
      li.append(title, source);
      if (item.url && /^https:\/\//.test(item.url)) {
        const a = $$('a', 'Ver enlace aportado');
        a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow';
        li.append(a);
      }
      li.append(remove); quoteList.append(li);
    });
  }
  $('quote-form').addEventListener('submit', e => {
    e.preventDefault();
    const service = $('quote-service').value.trim().slice(0, 100);
    const provider = $('quote-provider').value.trim().slice(0, 100);
    const price = Number($('quote-price').value);
    const date = $('quote-date').value;
    const url = $('quote-url').value.trim();
    if (!service || !provider || !Number.isSafeInteger(price) || price <= 0 || price > 1000000000 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > new Date().toISOString().slice(0, 10) || (url && !/^https:\/\//.test(url))) {
      $('quote-status').textContent = 'Verifica descripción, proveedor, precio CLP, fecha no futura y enlace HTTPS opcional.';
      return;
    }
    const list = quotes(); list.unshift({service, provider, price, date, url});
    try {
      localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 30)));
      $('quote-form').reset(); $('quote-status').textContent = 'Cotización guardada solo en este navegador; no confirmada por NURVO.';
      renderQuotes();
    } catch { $('quote-status').textContent = 'El navegador no permitió guardar datos.'; }
  });
  $('center-form').addEventListener('submit', e => {
    e.preventDefault();
    const location = $('center-location').value.trim().slice(0, 80);
    const service = $('center-service').value;
    const query = 'taller mecánico ' + service + ' ' + location + ' Chile';
    const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
    const link = $('center-link');
    link.href = url; link.hidden = false;
    $('center-status').textContent = 'Búsqueda externa: confirma ubicación, certificaciones, calificaciones, precios y disponibilidad directamente con cada taller.';
  });
  renderQuotes();
})();