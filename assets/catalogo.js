/* NURVO public catalogue: read-only, no API tokens or customer data. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('catalog-products')) return;
  const root = $('catalog-products');
  const status = $('catalog-status');
  const count = $('catalog-count');
  const condition = $('catalog-condition');
  const search = $('catalog-search');
  const button = $('catalog-reload');
  const create = (tag, content, className) => {
    const e = document.createElement(tag);
    if (content !== undefined && content !== null) e.textContent = String(content);
    if (className) e.className = className;
    return e;
  };
  let products = [];
  function showStatus(message, level = '') {
    status.textContent = message;
    status.className = 'status-note' + (level === 'good' ? ' good' : '');
  }
  function empty(message) {
    root.replaceChildren(create('div', message, 'empty-catalog'));
    count.textContent = 'Sin productos comercialmente publicados en esta consulta.';
  }
  function baseUrl() {
    const raw = String(window.NURVO_API_BASE_URL || '').trim();
    if (!raw) return null;
    try {
      const url = new URL(raw);
      const local = ['localhost', '127.0.0.1'].includes(url.hostname);
      if (url.username || url.password || url.search || url.hash ||
          !(url.protocol === 'https:' || (local && url.protocol === 'http:'))) return null;
      return url.origin + url.pathname.replace(/\/+$/, '');
    } catch { return null; }
  }
  const currency = value => new Intl.NumberFormat('es-CL',{
    style:'currency',currency:'CLP',maximumFractionDigits:0
  }).format(value);
  const safeHttps = raw => {
    try {
      const url = new URL(String(raw));
      if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return url.href;
    } catch { /* Invalid or unsafe provider link */ }
    return null;
  };
  function render() {
    root.replaceChildren();
    const q = search.value.trim().toLocaleLowerCase('es-CL').slice(0,70);
    const requested = condition.value;
    const results = products.filter(p =>
      (!requested || p.condition === requested) &&
      [p.title,p.sku,p.brand,p.oem_reference].some(x=>String(x||'').toLocaleLowerCase('es-CL').includes(q))
    );
    if (!results.length) {
      empty(products.length ?
        'No hay fichas que coincidan con los filtros. Los precios y existencias nunca se estiman.' :
        'No hay repuestos publicados por proveedores autorizados. Puedes preparar una solicitud sin precio ficticio.');
      return;
    }
    for(const p of results) {
      const card=create('article',null,'catalog-card');
      const heading=create('h3',p.title || 'Ficha de repuesto');
      const meta=create('p','SKU '+p.sku+' · '+p.condition,'catalog-meta');
      const cost=create('p',currency(p.price_clp),'catalog-price');
      const stock=create('p','Existencias declaradas: '+p.stock_qty+' · sin reserva','catalog-stock');
      const brand=create('p','Marca declarada: '+(p.brand||'No informada'));
      const oem=create('p','Referencia OEM: '+(p.oem_reference||'No informada'));
      const fitment=create('p','Aplicación informada: '+(p.fitment_note||'Sin compatibilidad verificada'));
      const warranty=create('p','Garantía informada: '+p.warranty_summary);
      const stamp = p.updated_at ? new Date(p.updated_at) : null;
      const when = stamp && Number.isFinite(stamp.getTime()) ?
        stamp.toLocaleString('es-CL',{dateStyle:'medium',timeStyle:'short'}) : 'No disponible';
      const date=create('small','Última declaración: '+when+' · revisión interna de publicación, no certificación');
      card.append(meta,heading,cost,stock,brand,oem,fitment,warranty,date);
      const safe=safeHttps(p.source_url);
      if(safe) {
        const link=create('a','Revisar fuente aportada por proveedor','catalog-source');
        link.href=safe;link.target='_blank';link.rel='noopener noreferrer nofollow';
        card.append(link);
      }
      const caution=create('p','No se garantiza procedencia, stock, originalidad ni compatibilidad por mostrar este anuncio.','catalog-caution');
      card.append(caution);
      root.append(card);
    }
    count.textContent = results.length + ' fichas publicadas y declaradas por proveedores; pueden cambiar sin aviso.';
  }
  async function fetchJson(url, signal) {
    const response = await fetch(url,{signal,headers:{Accept:'application/json'},credentials:'omit',cache:'no-store'});
    if(!response.ok) throw new Error('El backend no respondió a la consulta ('+response.status+').');
    return response.json();
  }
  async function refresh(){
    products=[];
    empty('Consultando las ofertas publicadas, si existe backend comercial autorizado…');
    const api=baseUrl();
    if(!api) {
      showStatus('Sin backend comercial configurado. NURVO todavía no puede consultar precios ni stock de proveedores. No hay ofertas de demostración.');
      empty('Catálogo sin API conectada. Explora categorías o prepara una cotización directamente con un proveedor.');
      return;
    }
    button.disabled=true;
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),12000);
    try {
      const capabilities=await fetchJson(api+'/api/marketplace/status',controller.signal);
      if(!capabilities.enabled){
        showStatus('El marketplace está deshabilitado o no tiene proveedores habilitados. No se mostrarán productos ficticios.');
        empty('Aún no existen ofertas comerciales accesibles desde esta plataforma.');
        return;
      }
      const data=await fetchJson(api+'/api/marketplace/products?limit=50',controller.signal);
      if(!Array.isArray(data.results)) throw new Error('La fuente comercial devolvió un formato inválido.');
      products=data.results.filter(p=>p && p.review_state==='published' &&
        Number.isSafeInteger(p.price_clp) && p.price_clp>0 &&
        Number.isSafeInteger(p.stock_qty) && p.stock_qty>=0 &&
        typeof p.title==='string' && typeof p.sku==='string' &&
        ['genuino','oes','alternativo','remanufacturado','usado'].includes(p.condition));
      showStatus(products.length ?
        'Fichas publicadas obtenidas del backend. Precio, stock, condición y procedencia son declaraciones del proveedor, no verificaciones oficiales.' :
        'El backend está disponible, pero no hay publicaciones comerciales aprobadas.','good');
      render();
    }catch(error){
      showStatus('No fue posible consultar el catálogo comercial. No se asume que existan productos o proveedores. '+(error?.name==='AbortError'?'Tiempo de consulta excedido.':'Revisa la disponibilidad del backend.'));
      empty('Consulta externa no disponible. Puedes pedir una cotización manual y verificarla directamente.');
    }finally{
      clearTimeout(timeout);button.disabled=false;
    }
  }
  condition.addEventListener('change',render);
  search.addEventListener('input',render);
  button.addEventListener('click',refresh);
  refresh();
})();
