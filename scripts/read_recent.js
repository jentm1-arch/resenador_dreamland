// Se ejecuta en la ficha de Google Maps con la pestaña Reseñas abierta.
// Ordena por "Más recientes" y lee hacia atrás hasta unos 6 meses, de todas las estrellas.
// Corre en segundo plano: progreso en window.__rr y reseñas en window.__rv (solo memoria de la pestaña).
// No guarda nombres de reseñadores. Los textos no se suben al repositorio.
(()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const meses=w=>{w=(w||'').toLowerCase();const n=parseInt((w.match(/\d+/)||[1])[0]);if(/año/.test(w))return n*12;if(/mes/.test(w))return n;if(/semana/.test(w))return n/4;return 0.2};
window.__rr={done:false,n:0,err:null};window.__rv=[];
(async()=>{try{
 const sb=document.querySelector('button[aria-label*="Ordenar"]');sb&&sb.click();await sleep(900);
 const it=[...document.querySelectorAll('div,span,li')].find(e=>e.children.length===0&&e.textContent.trim()==='Más recientes');it&&it.click();await sleep(2500);
 const sc=[...document.querySelectorAll('div')].filter(d=>d.scrollHeight>d.clientHeight+200&&getComputedStyle(d).overflowY!=='visible'&&d.querySelector('[data-review-id]'))[0];
 let last=0,stall=0;
 for(let i=0;i<220;i++){
  sc.scrollTo(0,sc.scrollHeight);await sleep(2300);
  const ds=[...document.querySelectorAll('div.jftiEf[data-review-id]')];
  window.__rr.n=ds.length;
  const w=((ds[ds.length-1]||document).querySelector('.rsqaWe')||{}).textContent;
  if(meses(w)>6.5)break;
  if(ds.length===last){if(++stall>=6)break}else stall=0;
  last=ds.length;
  if(ds.length>=700)break;
 }
 [...document.querySelectorAll('button.w8nwRe')].forEach(b=>b.click());await sleep(900);
 window.__rv=[...document.querySelectorAll('div.jftiEf[data-review-id]')].map(e=>{
  const own=e.querySelector('.CDe7pd');
  const t=[...e.querySelectorAll('.wiI7pd')].filter(x=>!own||!own.contains(x))[0];
  return{s:parseInt((e.querySelector('[role="img"][aria-label*="estrella"]')||{}).ariaLabel)||null,
   m:meses(((e.querySelector('.rsqaWe')||{}).textContent||'')),own:!!own,t:((t||{}).textContent||'').replace(/\s+/g,' ').trim().slice(0,450)}
 }).filter(r=>r.m<=6.5);
 window.__rr.done=true;
}catch(e){window.__rr.err=String(e);window.__rr.done=true}})();
return 'iniciado';
})()
