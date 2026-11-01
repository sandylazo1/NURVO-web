/* NURVO: live lookup UI. This script never invents vehicle or theft records. */
(() => {
  'use strict';
  const form = document.getElementById('official-plate-form');
  if (!form) return;
  const plateInput = document.getElementById('official-plate');
  const status = document.getElementById('official-status');
  const result = document.getElementById('official-result');
  const submit = form.querySelector('[type="submit"]');
  const title = document.getElementById('official-result-title');
  const fields = document.getElementById('official-fields');
  const sync = document.getElementById('official-sync');
  const use = document.getElementById('official-use-data');
  const notice = document.getElementById('official-privacy');
  let latest = null;
  const BASE = String(window.NURVO_API_BASE_URL || '').trim().replace(/\/+$/, '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const validPlate = p => /^(?:[A-Z]{4}[0-9]{2}|[A-Z]{2}[0-9]{4})$/.test(p);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  function lastSync(iso) {
    if (!iso) return 'Última sincronización de datos: No disponible';
    const when = new Date(iso);
    if (!Number.isFinite(when.getTime())) return 'Última sincronización de datos: Fecha inválida';
    const part = new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(when).reduce((out, entry) => (out[entry.type] = entry.value, out), {});
    return 'Última sincronización de datos: ' +
      part.day + '/' + part.month + '/' + part.year + ' ' + part.hour + ':' + part.minute + ':' + part.second + ' (Chile)';
  }
  function row(name, value) {
    const wrapper = el('div', 'official-data-row');
    wrapper.append(el('dt', '', name), el('dd', '', value ?? 'No disponible'));
    fields.append(wrapper);
  }
  function setState(message, busy = false) {
    status.textContent = message;
    status.classList.toggle('is-loading', busy);
    submit.disabled = busy;
    submit.setAttribute('aria-busy', String(busy));
  }
  function render(data) {
    latest = data;
    result.hidden = false;
    const placeholder = document.getElementById("official-placeholder");
    if (placeholder) placeholder.hidden = true;
    fields.replaceChildren();
    const heading = data.marca && data.modelo ? data.marca + ' ' + data.modelo : 'Vehículo no identificado automáticamente';
    title.textContent = heading;
    row('Patente consultada', data.patente || plateInput.value);
    row('Marca', data.marca);
    row('Modelo', data.modelo);
    row('Año', data.ano);
    row('Fuente de los datos', data.fuente || 'Sin proveedor conectado');
    const theft = el('span', 'official-badge', 'Encargo por robo: No verificado');
    if (data.estado_robo === 'encargo_vigente') {
      theft.className = 'official-badge is-alert';
      theft.textContent = 'Posible encargo vigente · verifica oficialmente';
    } else if (data.estado_robo === 'sin_encargo_reportado') {
      theft.className = 'official-badge is-reported';
      theft.textContent = 'Sin encargo reportado por la fuente consultada';
    }
    const wrap = el('div', 'official-data-row'); wrap.append(el('dt', '', 'Encargo por robo'), el('dd')); wrap.querySelector('dd').append(theft); fields.append(wrap);
    row('Multas', data.multas || 'No verificadas. Consulta el certificado oficial.');
    row('Estado de la consulta', ({
      actualizado: 'Datos de proveedor conectado',
      actualizando: 'Datos antiguos; actualización solicitada',
      sin_fuente: 'No hay fuente oficial conectada',
      fuente_no_disponible: 'Fuente temporalmente no disponible',
    })[data.estado_consulta] || 'No verificado');
    sync.textContent = lastSync(data.ultima_actualizacion);
    notice.textContent = data.mensaje || 'Este resultado no reemplaza los certificados oficiales.';
    use.hidden = !(data.marca && data.modelo && data.ano);
    if (data.estado_consulta === 'actualizando') setState('Mostrando la última información disponible. Se está solicitando actualización.');
    else if (data.estado_consulta === 'actualizado') setState('Respuesta recibida del proveedor.');
    else setState('No se obtuvo una identificación automática verificable.');
  }
  use.addEventListener('click', () => {
    if (!latest) return;
    const manual = document.getElementById('diag-form');
    const plate = latest.patente || plateInput.value.toUpperCase();
    manual.elements.plate.value = plate;
    if (latest.marca) manual.elements.make.value = latest.marca;
    if (latest.modelo) manual.elements.model.value = latest.modelo;
    if (latest.ano) manual.elements.year.value = latest.ano;
    document.getElementById('asistente').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    manual.elements.km.focus({ preventScroll: true });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const plate = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!validPlate(plate)) {
      plateInput.setCustomValidity('Usa el formato chileno habitual ABCD12 o AB1234.');
      plateInput.reportValidity();
      plateInput.setCustomValidity('');
      return;
    }
    plateInput.value = plate;
    result.hidden = true;
    const placeholder = document.getElementById("official-placeholder");
    if (placeholder) placeholder.hidden = false;
    latest = null;
    if (!BASE) {
      setState('No hay backend conectado. Puedes continuar con el asistente manual o verificar en sitios oficiales.');
      return;
    }
    if (!/^https:\/\//i.test(BASE) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(BASE)) {
      setState('La API debe usar HTTPS, excepto en desarrollo local.');
      return;
    }
    setState('Consultando proveedor autorizado…', true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch(BASE + '/api/patente/' + encodeURIComponent(plate), {
        method: 'GET', headers: { Accept: 'application/json' },
        cache: 'no-store', signal: controller.signal, mode: 'cors',
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('Se alcanzó el límite de consultas. Inténtalo más tarde.');
        throw new Error('La fuente no respondió correctamente (HTTP ' + response.status + ').');
      }
      const data = await response.json();
      if (!data || typeof data !== 'object' || data.patente !== plate) throw new Error('Respuesta inválida del proveedor.');
      render(data);
    } catch (error) {
      setState(error.name === 'AbortError' ?
        'La consulta tardó demasiado. Vuelve a intentar o usa el portal oficial.' :
        (error instanceof TypeError ? 'No se pudo conectar con el backend. Revisa HTTPS, CORS y disponibilidad.' : error.message));
    } finally {
      clearTimeout(timer);
      submit.disabled = false;
      submit.setAttribute('aria-busy', 'false');
      status.classList.remove('is-loading');
    }
  });
  const fromHero = document.getElementById('hero-plate');
  if (fromHero) {
    fromHero.addEventListener('change', () => {
      const plate = fromHero.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (validPlate(plate)) plateInput.value = plate;
    });
  }
  if (!BASE) setState('Modo demostración: consulta automática deshabilitada hasta conectar una API autorizada.');
})();
