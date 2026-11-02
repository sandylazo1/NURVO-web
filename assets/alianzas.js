/* NURVO Partner proposal builder: local-only document, not application submission. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('partner-form')) return;
  const out = $('partner-preview'), status = $('partner-status');
  const requirements = $('partner-requirements'), form = $('partner-form');
  const buttonCopy = $('partner-copy'),buttonDownload = $('partner-download');
  const labels = {
    repuestos: 'Repuestera / distribuidor',
    taller:'Taller mecánico',
    flota:'Gestor de flota privada',
    arriendo:'Carsharing / rent-a-car / leasing',
    marca:'Marca / importador / red autorizada',
    publico:'Entidad o flota pública'
  };
  const custom = {
    repuestos:[
      'Catálogo: SKU/OEM, marca, condición real (genuino/OES/alternativo/usado/remanufacturado).',
      'Licencia para publicar precios, IVA, fecha de actualización y disponibilidad.',
      'Procedencia, factura, política de devoluciones y garantías.'
    ],
    taller:[
      'Comprobar identidad y competencia mecánica; seguridad y equipamiento.',
      'Política informada sobre repuestos aportados por el cliente, garantías y orden de trabajo.',
      'Presupuesto, mano de obra, plazos, reclamos y autorizaciones del propietario.'
    ],
    flota:[
      'Acreditar mandato del gestor, titularidad/tenencia, y acceso por empresa.',
      'Plan de mantenciones con manual por modelo, control de seguridad y SLA.',
      'Acuerdo de protección de datos, roles, reportes y retención.'
    ],
    arriendo:[
      'Convenio y autorización del operador/dueño antes de intervenir unidades.',
      'Cumplimiento de contratos de arriendo, seguros y políticas de taller.',
      'Confidencialidad sobre reservas, conductores y ubicaciones.'
    ],
    marca:[
      'Acuerdo formal de marca y autorizaciones de uso de identidad comercial.',
      'Derechos de uso de catálogos VIN/OEM, campañas recall y condiciones de garantía.',
      'Integración autorizada, SLA y protección de datos.'
    ],
    publico:[
      'Procedimiento legal de contratación y facultad de representación de la entidad.',
      'Bases de licitación, requisitos de ChileCompra, probidad y órdenes de compra.',
      'Acceso protegido a cualquier información operativa; no presumir adjudicación.'
    ]
  };
  const common = [
    'No se anuncian alianzas activas, clientes públicos, autorizaciones gubernamentales ni datos privados.',
    'Definir contraparte legal, rol de NURVO, impuestos, comisión, facturación y responsabilidades.',
    'Verificar seguridad, protección de datos, documentación técnica, garantía y seguimiento.',
    'Toda integración requiere autorización/licencia escrita y un backend separado de GitHub Pages.'
  ];
  const el = (tag,text) => {const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
  let draft='';
  function invalidate() {
    if(!draft) return;
    draft='';buttonCopy.disabled=true;buttonDownload.disabled=true;
    status.className='status-note';status.textContent='Datos modificados. Genera la propuesta otra vez.';
  }
  form.addEventListener('input',invalidate);
  form.addEventListener('change',invalidate);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const type=$('partner-type').value;
    const org=$('partner-org').value.trim().replace(/\s+/g,' ').slice(0,80)||'Por definir';
    const region=$('partner-region').value.trim().replace(/\s+/g,' ').slice(0,70)||'Por definir';
    const scope=$('partner-proposal').selectedOptions[0]?.textContent||'Por definir';
    const parts=$('partner-parts').selectedOptions[0]?.textContent||'Por definir';
    const notes=$('partner-notes').value.trim().slice(0,350);
    if(!custom[type]||!$('partner-authorized').checked){
      status.className='status-note';
      status.textContent='Selecciona un tipo válido y confirma que es una propuesta sin convenio ni envío.';
      return;
    }
    requirements.replaceChildren();
    const ul=el('ul');
    [...custom[type],...common].forEach(s=>ul.append(el('li',s)));
    requirements.append(ul);
    draft=[
      'NURVO — PROPUESTA EXPLORATORIA DE COLABORACIÓN',
      'Documento local. NO CONSTITUYE CONVENIO, OFERTA VINCULANTE NI SOLICITUD ENVIADA.',
      'Fecha: '+new Date().toLocaleDateString('es-CL'),
      'Tipo de organización: '+labels[type],
      'Nombre comercial informado: '+org,
      'Ciudad/región declarada: '+region,
      'Colaboración de interés: '+scope,
      'Política de piezas prevista: '+parts,
      'Observaciones aportadas: '+(notes||'No informadas'),
      '',
      'REQUISITOS PREVIOS:',
      ...custom[type].map((line,i)=>(i+1)+'. '+line),
      ...common.map((line,i)=>(i+custom[type].length+1)+'. '+line),
      '',
      'Responsable real, alcance contractual, términos de garantía y permisos: PENDIENTES.',
      'NURVO no ha validado esta organización, ningún precio, stock ni servicio.'
    ].join('\n');
    out.textContent=draft;
    status.className='status-note good';
    status.textContent='Propuesta preparada únicamente en tu navegador. Copia o descarga para revisión externa; no se ha enviado.';
    buttonCopy.disabled=buttonDownload.disabled=false;
  });
  buttonCopy.addEventListener('click',async()=>{
    if(!draft)return;
    try{await navigator.clipboard.writeText(draft);status.textContent='Texto copiado; continúa sin existir un convenio firmado.';}
    catch{status.textContent='La copia fue bloqueada; puedes seleccionar el texto o descargarlo.';}
  });
  buttonDownload.addEventListener('click',()=>{
    if(!draft)return;
    const url=URL.createObjectURL(new Blob([draft],{type:'text/plain;charset=utf-8'}));
    const a=el('a');a.href=url;a.download='NURVO-propuesta-alianza-borrador.txt';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
