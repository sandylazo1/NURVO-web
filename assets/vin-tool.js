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
    e.preventDefault();
    const raw = $('vin-number').value.toUpperCase().replace(/\s/g, '');
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
    if (raw.length === 17 && !allowedVin.test(raw)) {
      output('El VIN moderno de 17 caracteres no admite I, O ni Q. Revisa la transcripción. Para chasis no estándar, indica el año antiguo si corresponde.', 'error');
      return;
    }
    if ((year && year < 1981) || !allowedVin.test(raw)) {
      output('Identificador antiguo o no estandarizado: NHTSA no puede verificar automáticamente vehículos previos a 1981. No se infiere marca, año ni existencia.', 'warning');
      field('Estado', 'Identificador ingresado manualmente; sin identificación automática');
      return;
    }
    output('Consultando los datos públicos de fabricante en NHTSA…');
    submit.disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const params = new URLSearchParams({format:'json'});
      if (year) params.set('modelyear', String(year));
      const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + encodeURIComponent(raw) + '?' + params.toString();
      const response = await fetch(url, {signal: controller.signal, headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Servicio NHTSA no disponible (HTTP ' + response.status + ')');
      const payload = await response.json();
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
      field('Fuente', 'NHTSA vPIC: registros declarados por fabricantes, no Registro Civil de Chile');
      if (!make || !model || !modelYear || String(row.ErrorCode || '').split(',').some(x => x.trim() === '1')) {
        output('Decodificación incompleta. No se puede confirmar identidad ni compatibilidad de repuestos. Verifica la ficha del fabricante.', 'warning');
      } else {
        output('Datos de fabricante recibidos de NHTSA. No certifican matrícula, dominio, versión comercial chilena ni situación legal.', 'ok');
      }
    } catch (err) {
      field('Estado', 'Sin resultado automático verificable');
      output(err.name === 'AbortError' ? 'La consulta NHTSA excedió el tiempo permitido. Usa el enlace al decodificador externo.' : 'No fue posible conectar con NHTSA desde este navegador. Usa el enlace oficial externo. ' + (err.message || ''), 'warning');
    } finally {
      clearTimeout(timer);
      submit.disabled = false;
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