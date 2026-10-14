// Se ejecuta dentro de la ficha de Google Maps de un local (pestaña Reseñas abierta).
// Devuelve puntaje, distribución, temas de Google (chips) y quejas clasificadas por reglas.
// No guarda nombres ni textos literales de reseñas.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RULES={
 'Esperas y ritmo del servicio':/esper|tard[aoé]|lent[oa]|interminab|eterno|eternidad|\b\d{2}\s*min|media hora|tiempo entre/i,
 'Reservas y espera para sentarse':/reserva|sentar|la fila|cola\b|de pie|hora y media|1 hora y|mesa (no|lista)/i,
 'Atención del personal':/camarer|atenci[oó]n|trato|maleduc|borde|impertinen|descort|olvid|ignor|desbordad|falta de personal|sin explic/i,
 'Comida fría o precocinada':/\bfr[ií][oa]s?\b|tibi|templad|precocin|obrador|microondas|recalent|congelad|prefabric/i,
 'Calidad y sabor de la comida':/insípid|sin sabor|seca\b|dura\b|duros|mala calidad|mediocre|nada del otro|comida (pésima|nefasta|regular|mala|normal|floja)|raciones (peque|escas)|chicl|flojo|regular\b/i,
 'Cocción y seguridad alimentaria':/crud[oa]|poco hech|mal estado|pelo en|intoxic|alerg|sésamo|gluten|escupir/i,
 'Precio y cobros':/\bcar[oa]s?\b|precio|suplement|sobreprecio|me cobr|nos cobr|cobraron/i,
 'Limpieza y estado del local':/limpi|suci[oa]|baños?|manten|antiguo|renov|ruido|hacía frío|sin aire/i,
 'Delivery y recogida':/domicilio|glovo|reparto|delivery|uber|envío|embalaj|a casa/i};
const meses=w=>{w=w.toLowerCase();let n=parseInt(w.match(/\d+/)||[1]);if(/año/.test(w))return n*12;if(/mes/.test(w))return n;if(/semana/.test(w))return n/4;return 0.5};
const dist={};[...document.querySelectorAll('[role="img"][aria-label*="reseñas"]')].forEach(e=>{const m=(e.ariaLabel||'').match(/^(\d)\s+estrellas?,\s*([\d.]+)\s+reseñas/);if(m)dist[m[1]]=+m[2].replace(/\./g,'')});
const rg=document.querySelector('[role="radiogroup"]');
const chips=rg?[...rg.querySelectorAll('button')].map(b=>(b.innerText||'').replace(/\n+/g,' ').trim()).filter(x=>x&&x!=='Todas'&&!/^\+\d/.test(x)):[];
const sb=document.querySelector('button[aria-label*="Ordenar"]');sb&&sb.click();await sleep(900);
const it=[...document.querySelectorAll('div,span,li')].find(e=>e.children.length===0&&e.textContent.trim()==='Valoración más baja');it&&it.click();await sleep(2500);
const sc=[...document.querySelectorAll('div')].filter(d=>d.scrollHeight>d.clientHeight+200&&getComputedStyle(d).overflowY!=='visible'&&d.querySelector('[data-review-id]'))[0];
for(let i=0;i<7;i++){sc.scrollTo(0,sc.scrollHeight);await sleep(1400);}
[...document.querySelectorAll('button.w8nwRe')].forEach(b=>b.click());await sleep(700);
const rv=[...document.querySelectorAll('div.jftiEf[data-review-id]')].map(e=>{const own=e.querySelector('.CDe7pd');const t=[...e.querySelectorAll('.wiI7pd')].filter(x=>!own||!own.contains(x))[0];return{s:parseInt((e.querySelector('[role="img"][aria-label*="estrella"]')||{}).ariaLabel)||null,w:((e.querySelector('.rsqaWe')||{}).textContent||'').replace('Fecha de edición: ',''),own:!!own,t:((t||{}).textContent||'').trim()}}).filter(r=>r.t&&r.s<=2);
window.__rv=rv.map(r=>({s:r.s,t:r.t})); // solo en memoria de la pestaña, para la prueba de modelos; no se guarda
const q={};let sinResp12=0,neg12=0;
rv.forEach(r=>{const m=meses(r.w);const rec=m<=12;if(rec){neg12++;if(!r.own)sinResp12++}Object.entries(RULES).filter(([k,x])=>x.test(r.t)).forEach(([k])=>{q[k]=q[k]||{total:0,ultimos12m:0};q[k].total++;if(rec)q[k].ultimos12m++})});
return JSON.stringify({titulo:document.title,dist,chips,muestraBajas:rv.length,bajas12m:neg12,sinRespuesta12m:sinResp12,quejas:q});
})()
