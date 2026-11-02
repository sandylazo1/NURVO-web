/* NURVO - Local maintenance, quotes and pseudonymous fleet planner.
 * No remote APIs or secret access. User-controlled localStorage for fleet only. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('service-form')) return;
  const el = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined && text !== null) item.textContent = String(text);
    if (className) item.className = className;
    return item;
  };
  const format = n => Math.round(n).toLocaleString('es-CL');
  const money = n => new Intl.NumberFormat('es-CL', {style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
  const getInt = (id,min,max) => {
    const raw = $(id).value.trim();
    if (!/^\d+$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
  };
  const metric = (label,value) => {
    const card = el('div',null,'metric');
    card.append(el('strong',value),el('span',label));
    return card;
  };
  const addMonths = (date, months) => {
    const y = date.getUTCFullYear(), m = date.getUTCMonth(), day = date.getUTCDate();
    const first = new Date(Date.UTC(y,m+months,1,12));
    const last = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();
    first.setUTCDate(Math.min(day,last));
    return first;
  };
  const localISO = date => date.toISOString().slice(0,10);
  const today = () => new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate(),12);
  const parseDay = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = new Date(value+'T12:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value ? d : null;
  };
  $('service-form').addEventListener('submit',e=>{
    e.preventDefault();
    const current=getInt('service-current',0,2000000);
    const last=getInt('service-last',0,2000000);
    const interval=getInt('service-interval',1,500000);
    const usage=$('service-usage').value.trim()?getInt('service-usage',0,50000):null;
    const months=$('service-months').value.trim()?getInt('service-months',1,120):null;
    const dateRaw=$('service-date').value;
    const lastDate=dateRaw?parseDay(dateRaw):null;
    const box=$('service-result'), metrics=$('service-metrics');
    metrics.replaceChildren();
    if(current===null||last===null||interval===null||current<last||
      ($('service-usage').value.trim()&&usage===null)||
      ($('service-months').value.trim()&&months===null)||
      (dateRaw&&(!lastDate||lastDate.getTime()>Date.now()+86400000))) {
      box.className='status-note';
      box.textContent='Revisa los kilometrajes, intervalos y fecha. El último servicio no puede superar el kilometraje actual y la fecha no puede ser futura.';
      return;
    }
    const dueKm=last+interval;
    const left=dueKm-current;
    let dateDue=null;
    if(lastDate&&months!==null) dateDue=addMonths(lastDate,months);
    const overdueDistance=left<=0;
    const overdueTime=dateDue!==null && dateDue.getTime()<=today().getTime();
    box.className='status-note'+(overdueDistance||overdueTime?'':' good');
    box.textContent=overdueDistance||overdueTime?
      'El hito declarado ya se alcanzó por kilometraje y/o fecha. Agenda evaluación profesional; no sigas una pauta supuesta.' :
      'Según los intervalos que ingresaste, aún no se alcanza el hito. Confirma que estos datos corresponden al manual y condiciones de uso.';
    metrics.append(metric('Hito de kilometraje',format(dueKm)+' km'),
      metric(left>0?'Kilómetros restantes':'Km desde hito',format(Math.abs(left))+' km'),
      metric('Fecha límite del manual',dateDue?localISO(dateDue):'Sin datos'));
    if(usage!==null&&usage>0&&left>0){
      const monthsToDue=Math.ceil(left/usage);
      metrics.append(metric('Estimación por tu uso',format(monthsToDue)+' meses'));
    }
    if((months!==null&&!lastDate)||(!months&&lastDate)) {
      box.textContent+=' Para calcular el límite temporal debes indicar tanto la última fecha como los meses del manual.';
    }
  });

  $('compare-form').addEventListener('submit',e=>{
    e.preventDefault();
    const a=getInt('offer-a-total',1,1000000000),b=getInt('offer-b-total',1,1000000000);
    const nameA=$('offer-a-name').value.trim().slice(0,70);
    const nameB=$('offer-b-name').value.trim().slice(0,70);
    const output=$('compare-result'), list=$('compare-metrics');
    list.replaceChildren();
    if(a===null||b===null||!nameA||!nameB||!$('offer-verified').checked){
      output.className='status-note';
      output.textContent='Ingresa importes positivos, dos proveedores y confirma las verificaciones pendientes.';
      return;
    }
    const diff=Math.abs(a-b);
    const less=a===b?'Ambos presupuestos tienen el mismo importe total.':
      'El importe declarado de '+(a<b?nameA:nameB)+' es menor en '+money(diff)+'.';
    output.className='status-note good';
    output.textContent=less+' El resultado solo compara importes introducidos por ti; no compara compatibilidad ni garantía.';
    list.append(metric(nameA,money(a)),metric(nameB,money(b)),metric('Diferencia',money(diff)));
  });

  const fleetKey='nurvo-anonymous-fleet-20261102';
  const ALLOWED=['particular','empresa','arriendo','publico'];
  const works=['Servicio preventivo','Frenos','Neumáticos','Inspección de seguridad','Diagnóstico especializado'];
  const sanitizeEntries=value=>{
    if(!Array.isArray(value))return [];
    return value.filter(r=>r&&typeof r==='object'&&typeof r.alias==='string'&&r.alias.length<=40&&
      /^[\p{L}\p{N} ._-]{2,40}$/u.test(r.alias)&&ALLOWED.includes(r.type)&&works.includes(r.work)&&
      Number.isSafeInteger(r.km)&&Number.isSafeInteger(r.due)&&r.km>=0&&r.due>=0&&r.km<=2000000&&r.due<=2000000).slice(0,25);
  };
  const readFleet=()=>{
    try{return sanitizeEntries(JSON.parse(localStorage.getItem(fleetKey)||'[]'));}
    catch{return [];}
  };
  let fleet=readFleet();
  const setFleet=items=>{
    try{
      localStorage.setItem(fleetKey,JSON.stringify(items));
      fleet=items;
      return true;
    }catch{return false;}
  };
  const fleetStatus=$('fleet-status');
  function renderFleet(){
    const rows=$('fleet-rows');
    rows.replaceChildren();
    const due=fleet.filter(x=>x.km>=x.due).length;
    const next=fleet.filter(x=>x.km<x.due && x.due-x.km<=1000).length;
    const metrics=$('fleet-metrics');
    metrics.replaceChildren(metric('Unidades locales',format(fleet.length)),
      metric('Hito alcanzado',format(due)),metric('Dentro de 1.000 km',format(next)));
    if(!fleet.length){
      const tr=el('tr'),cell=el('td','No hay unidades guardadas en este navegador.');
      cell.colSpan=7;tr.append(cell);rows.append(tr);
    }
    fleet.forEach((item,index)=>{
      const tr=el('tr');
      const state=item.km>=item.due?'Hito alcanzado':item.due-item.km<=1000?'Próximo':'Según datos: pendiente';
      for(const value of [item.alias,item.type,item.work,format(item.km),format(item.due),state]){
        tr.append(el('td',value));
      }
      const cell=el('td');
      const button=el('button','Eliminar');
      button.type='button';button.setAttribute('aria-label','Eliminar unidad '+item.alias);
      button.addEventListener('click',()=>{
        const nextList=fleet.filter((_,i)=>i!==index);
        if(setFleet(nextList)){
          renderFleet();fleetStatus.textContent='Unidad eliminada de este navegador.';
        }else fleetStatus.textContent='No fue posible guardar la eliminación.';
      });
      cell.append(button);tr.append(cell);rows.append(tr);
    });
  }
  $('fleet-form').addEventListener('submit',e=>{
    e.preventDefault();
    const alias=$('fleet-alias').value.trim();
    const type=$('fleet-type').value,work=$('fleet-service').value;
    const km=getInt('fleet-km',0,2000000),due=getInt('fleet-due',0,2000000);
    if(!/^[\p{L}\p{N} ._-]{2,40}$/u.test(alias)||/^(?:[A-Z]{4}[0-9]{2}|[A-Z]{2}[0-9]{4})$/i.test(alias)||
      /^[A-HJ-NPR-Z0-9]{17}$/i.test(alias)||km===null||due===null||!ALLOWED.includes(type)||!works.includes(work)||
      !$('fleet-permission').checked) {
      fleetStatus.textContent='Ingresa alias anónimo (sin VIN ni patente), kilómetros válidos y confirma la autorización.';
      return;
    }
    if(fleet.length>=25){fleetStatus.textContent='Límite de 25 unidades locales alcanzado.';return;}
    if(fleet.some(x=>x.alias.toLocaleLowerCase('es-CL')===alias.toLocaleLowerCase('es-CL'))){
      fleetStatus.textContent='Ese alias ya existe. Usa uno diferente.';return;
    }
    if(setFleet([...fleet,{alias,type,work,km,due}])){
      renderFleet();$('fleet-form').reset();
      fleetStatus.textContent='Registro anónimo guardado solo en este navegador. No hay sincronización ni validación externa.';
    }else fleetStatus.textContent='Este navegador no permitió guardar el registro local.';
  });
  const csvCell=value=>{
    let v=String(value);
    // Prevent CSV formula injection even if the file is opened with Excel.
    if(/^[=+\-@\t\r]/.test(v))v="'"+v;
    return '"'+v.replace(/"/g,'""')+'"';
  };
  $('fleet-export').addEventListener('click',()=>{
    if(!fleet.length){fleetStatus.textContent='No hay registros que exportar.';return;}
    const rows=[['alias','contexto','servicio','km_actual','km_hito','estado'],
      ...fleet.map(x=>[x.alias,x.type,x.work,x.km,x.due,x.km>=x.due?'alcanzado':'pendiente'])];
    const text='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
    const a=el('a');a.href=url;a.download='nurvo-flota-local.csv';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    fleetStatus.textContent='CSV generado en tu dispositivo. Revisa acceso y protección al compartirlo.';
  });
  $('fleet-clear').addEventListener('click',()=>{
    try{localStorage.removeItem(fleetKey);fleet=[];renderFleet();fleetStatus.textContent='Todos los registros de flota de esta herramienta fueron borrados del navegador.';}
    catch{fleetStatus.textContent='El navegador no permitió eliminar el almacenamiento local.';}
  });
  renderFleet();
})();
