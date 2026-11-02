/* NURVO marketplace toolkit: browser-only; no remote lookup, no personal-data storage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('request-form')) return;
  const node = (tag, text, cls) => {const e = document.createElement(tag); if(text != null) e.textContent = String(text); if(cls) e.className = cls; return e;};
  const parts = [
    ['Aceites y filtros','mecanica','Norma, viscosidad y especificación de motor'],
    ['Motor y distribución','mecanica','Referencia OEM y procedimiento de montaje'],
    ['Transmisión y embrague','mecanica','Versión de caja y motor'],
    ['Refrigeración y correas','mecanica','Compatibilidad técnica y refrigerante'],
    ['Frenos / ABS','seguridad','Seguridad crítica: instalación profesional'],
    ['Dirección y suspensión','seguridad','Geometría, revisión y seguridad'],
    ['Neumáticos y ruedas','seguridad','Dimensión, carga, velocidad y seguridad'],
    ['Airbags, cinturones y ADAS','seguridad','Alta criticidad; técnico autorizado y recall'],
    ['Batería y alternador','electricidad','Voltaje, capacidad y tecnología'],
    ['Sensores y diagnóstico OBD','electricidad','Diagnóstico real antes de recambiar'],
    ['Luces y señalización','electricidad','Normas y homologación aplicable'],
    ['Carrocería y pintura','carroceria','Revisión de alteraciones registrables'],
    ['Confort y multimedia','carroceria','Compatibilidad eléctrica y seguridad'],
    ['Accesorios de carga','carroceria','Dimensiones, carga y sujeción'],
    ['Baterías y alto voltaje EV','electromovilidad','Solo personal especializado'],
    ['Cargadores y conectores EV','electromovilidad','Conector, potencia y seguridad']
  ];
  function renderParts() {
    const family = $('family-filter').value;
    const query = $('part-search').value.trim().toLocaleLowerCase('es-CL');
    const list = parts.filter(p => (family === 'todos' || p[1] === family) && (p[0] + ' ' + p[2]).toLocaleLowerCase('es-CL').includes(query));
    const grid = $('part-grid');
    grid.replaceChildren();
    list.forEach(p => { const item = node('div', null, 'part-tile'); item.append(node('strong',p[0]),node('span',p[2])); grid.append(item); });
    $('part-count').textContent = list.length + ' categorías informativas; sin stock ni precio verificados.';
  }
  $('family-filter').addEventListener('change', renderParts);
  $('part-search').addEventListener('input', renderParts);
  renderParts();
  const form = $('request-form');
  const status = $('request-status');
  const preview = $('request-preview');
  let draft = '';
  const get = name => String(form.elements.namedItem(name)?.value || '').trim().replace(/\s+/g,' ');
  const addCheck = (message, risk='') => $('request-checks').append(node('div', message,'check-item ' + risk));
  function invalidate() {
    if (!draft) return;
    draft = '';
    $('copy-request').disabled = $('download-request').disabled = true;
    status.dataset.status = '';
    status.textContent = 'Solicitud modificada: genera nuevamente el borrador.';
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const make = get('brand'), model=get('model'), year=get('year'), engine=get('engine');
    const work=get('work'), part=get('part'), supplied=get('supplied'), warranty=get('warranty'), tenure=get('tenure');
    const authorized=$('authorization').checked;
    if(year && (!/^\d{4}$/.test(year) || Number(year)<1886 || Number(year)>new Date().getFullYear()+1)){
      status.textContent='Año de fabricación fuera de rango.';return;
    }
    $('request-checks').replaceChildren();
    addCheck('Antes de contratar: verificar compatibilidad por OEM, precio desglosado, IVA, stock, origen, factura, seguridad y garantía.','warn');
    if(/frenos|ABS|dirección|suspensión|alta tensión/i.test(work)) addCheck('Pieza crítica: personal calificado, inspección, homologación aplicable y documentación; no autoinstalación.','danger');
    if(/modificación|neumáticos|eléctrico/i.test(work)) addCheck('Evaluar requisitos legales, revisión técnica, seguridad y trámite de alteración cuando corresponda.','warn');
    if(supplied==='cliente') addCheck('Pieza aportada por cliente: requiere aceptación, origen y compatibilidad. El taller sigue respondiendo por su propia negligencia y deberes legales.','warn');
    if(warranty!=='vencida') addCheck('Verificar la póliza voluntaria y exigencias técnicas justificadas. No se presume pérdida automática de garantía legal por elegir taller independiente.','warn');
    if(tenure==='arriendo') addCheck('Vehículo arrendado/carsharing (Awto u otro): NO intervenir sin autorización del dueño/operador y revisar contrato y seguro.','danger');
    if(tenure==='empresa') addCheck('Flota privada: autorización del gestor, contrato de leasing, aseguradora y órdenes de servicio.','warn');
    if(tenure==='publico') addCheck('Servicio público: contratación pública, autoridad competente, orden de compra, requisitos y trazabilidad. No se presupone adjudicación.','danger');
    if(!authorized) addCheck('No se ha declarado facultad para solicitar presupuesto. Este texto NO autoriza ninguna intervención.','danger');
    draft=[
      'NURVO — BORRADOR DE SOLICITUD; NO ES COMPRA NI ORDEN DE REPARACIÓN',
      'Creado: '+new Date().toLocaleDateString('es-CL'),
      'Vehículo declarado: '+make+' '+model+' ('+(year||'año sin indicar')+')',
      'Motor/versión: '+(engine||'por verificar'),
      'Servicio: '+work,
      'Tipo de pieza: '+part,
      'Origen de pieza: '+(supplied==='cliente'?'aportada por usuario (sujeto a evaluación)':'por cotizar con taller'),
      'Garantía comercial: '+warranty+' (sin validar)',
      'Tipo de tenencia: '+tenure,
      'Facultad declarada de solicitar presupuesto: '+(authorized?'sí, no autoriza reparación':'NO CONFIRMADA'),
      '',
      'SOLICITAR AL PROVEEDOR:',
      '1. Código OEM, fabricante, compatibilidad específica, homologación y procedencia.',
      '2. Estado genuino/OES/alternativo/remanufacturado/usado con evidencia.',
      '3. Precio CLP con IVA, mano de obra, disponibilidad y vigencia.',
      '4. Garantía de producto, instalación y póliza voluntaria aplicable.',
      '5. Diagnóstico, presupuesto aprobado, plazos y documentos de entrega.',
      '6. Requisitos de modificación y autorizaciones de titular/gestor.',
      '',
      'NURVO no ha verificado vehículo, precios, pieza, stock, taller ni situación legal.'
    ].join('\n');
    preview.textContent=draft;
    status.dataset.status=authorized?'ok':'';
    status.textContent=authorized?'Borrador listo: compara y exige respuesta escrita antes de contratar.':'Borrador sin autorización confirmada: no permite encargar servicios.';
    $('copy-request').disabled=$('download-request').disabled=false;
  });
  $('copy-request').addEventListener('click', async () => {
    if(!draft)return;
    try{await navigator.clipboard.writeText(draft);status.textContent='Borrador copiado; no es cotización confirmada.';}
    catch{status.textContent='No fue posible copiar; selecciona el texto del recuadro.';}
  });
  $('download-request').addEventListener('click',()=>{
    if(!draft)return;
    const url=URL.createObjectURL(new Blob([draft],{type:'text/plain;charset=utf-8'}));
    const link=node('a');
    link.href=url;link.download='NURVO-solicitud-preliminar.txt';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  });
  $('workshop-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(!$('workshop-form').reportValidity())return;
    const city=$('workshop-location').value.trim();
    const service=$('workshop-specialty').value;
    const policy=$('workshop-policy').value;
    const link=$('workshop-link');
    link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('taller '+service+' '+city+' Chile');
    link.hidden=false;
    const questions={
      cualquiera:'Pregunta qué repuestos acepta cada taller.',
      original:'Consulta comprobantes de repuestos originales.',
      alternativo:'Consulta políticas para repuestos alternativos y su garantía.',
      cliente:'Pregunta por instalación de pieza aportada por el cliente y condiciones.'
    };
    $('workshop-status').textContent='Búsqueda externa preparada. '+questions[policy]+' NURVO no verifica la respuesta ni filtra por política real.';
  });
})();