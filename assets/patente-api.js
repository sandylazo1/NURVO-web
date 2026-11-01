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
    const sourceTime = data.ultima_actualizacion ? new Date(data.ultima_actualizacion).getTime() : NaN;
    const fresh = data.estado_consulta === 'actualizado' &&
      Number.isFinite(sourceTime) && sourceTime <= Date.now() &&
      Date.now() - sourceTime <= 24 * 60 * 60 * 1000;
    if (data.estado_robo === 'encargo_vigente') {
      theft.className = 'official-badge is-alert';
      theft.textContent = fresh ?
        'Posible encargo vigente · verifica oficialmente' :
        'Encargo reportado anteriormente · verifica vigencia';
    } else if (data.estado_robo === 'sin_encargo_reportado') {
      if (fresh) {
        theft.className = 'official-badge is-reported';
        theft.textContent = 'Sin encargo reportado por la fuente consultada';
      } else {
        theft.textContent = 'Resultado anterior desactualizado · NO verificado ahora';
      }
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
    const attribution = document.getElementById('official-provider-attribution');
    if (attribution) attribution.hidden = !(
      typeof data.fuente === 'string' && /autoriesgo/i.test(data.fuente)
    );
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
      render({
        patente: plate, marca: null, modelo: null, ano: null,
        estado_robo: 'no_verificado', multas: null,
        fuente: null, ultima_actualizacion: null,
        estado_consulta: 'sin_fuente',
        mensaje: 'La patente solo fue validada por formato. No existe consulta a registros oficiales ni confirmación de que el vehículo exista.',
      });
      setState('Sin API conectada. Copia tu patente y comprueba los datos en los portales externos.');
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


  const copyPlate = document.getElementById('official-copy-plate');
  if (copyPlate) copyPlate.addEventListener('click', async () => {
    const plate = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!validPlate(plate)) {
      setState('Ingresa primero una patente de seis caracteres.');
      plateInput.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(plate);
      setState('Patente ' + plate + ' copiada. Pégala en el servicio externo que elijas.');
    } catch {
      plateInput.select();
      setState('Seleccioné la patente para que puedas copiarla con Ctrl+C.');
    }
  });
  const vinForm = document.getElementById('official-vin-form');
  if (vinForm) vinForm.addEventListener('submit', async event => {
    event.preventDefault();
    const output = document.getElementById('official-vin-result');
    const raw = document.getElementById('official-vin-input').value.toUpperCase().trim();
    const button = vinForm.querySelector('[type="submit"]');
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(raw)) {
      output.textContent = 'El VIN necesita 17 caracteres válidos, sin I, O ni Q.';
      return;
    }
    if (!BASE) {
      output.replaceChildren();
      output.append(document.createTextNode('Consulta el VIN directamente en la herramienta oficial NHTSA: '));
      const link = document.createElement('a');
      link.href = 'https://vpic.nhtsa.dot.gov/decoder/';
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = 'Abrir decodificador VIN ↗';
      link.style.textDecoration = 'underline';
      output.append(link);
      return;
    }
    button.disabled = true;
    output.textContent = 'Consultando la API pública NHTSA…';
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 18000);
    try {
      const response = await fetch(BASE + '/api/vin/' + encodeURIComponent(raw), {
        headers: {Accept: 'application/json'}, signal: abort.signal, cache: 'no-store'
      });
      if (!response.ok) throw new Error('La API VIN no está disponible ahora.');
      const data = await response.json();
      if (data.vin !== raw) throw new Error('La fuente devolvió otro VIN.');
      if (!data.marca || !data.modelo || !data.ano) {
        output.textContent = 'La fuente pública no pudo identificar completamente este VIN. No se inventaron datos.';
        return;
      }
      output.textContent = 'NHTSA vPIC: ' + data.marca + ' ' + data.modelo + ' (' + data.ano + '). Información orientativa; confirma la versión chilena.';
      const manual = document.getElementById('diag-form');
      manual.elements.make.value = data.marca;
      manual.elements.model.value = data.modelo;
      manual.elements.year.value = data.ano;
    } catch (err) {
      output.textContent = err.name === 'AbortError' ? 'Tiempo de respuesta agotado.' : (err.message || 'Error de consulta VIN.');
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
    }
  });
  if (!BASE) setState('Modo demostración: consulta automática deshabilitada hasta conectar una API autorizada.');
})();
