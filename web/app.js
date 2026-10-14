const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('es-ES');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const MARCAS = ['Todas', 'Voltereta', 'Begin', 'One Burger'];
let DATA = null;
const state = { marca: 'Todas', local: '' };

fetch('data/locales.json', { cache: 'no-store' })
  .then(r => r.json())
  .then(d => { DATA = d; init(); })
  .catch(() => { document.querySelector('.wrap').insertAdjacentHTML('beforeend', '<p class="empty">No se pudieron cargar los datos.</p>'); });

function init() {
  $('marcas').innerHTML = MARCAS.map(m => `<button type="button" data-m="${esc(m)}" aria-pressed="${m === state.marca}">${esc(m)}</button>`).join('');
  $('marcas').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    state.marca = b.dataset.m; state.local = ''; render();
  };
  $('local').onchange = e => { state.local = e.target.value; render(); };
  $('actualizado').textContent = 'Datos actualizados el ' + new Date(DATA.actualizado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '.';
  render();
}

function selected() {
  let ls = DATA.locales.filter(l => state.marca === 'Todas' || l.marca === state.marca);
  if (state.local) ls = ls.filter(l => l.id === state.local);
  return ls;
}

function render() {
  document.querySelectorAll('#marcas button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === state.marca));
  const pool = DATA.locales.filter(l => state.marca === 'Todas' || l.marca === state.marca);
  $('local').innerHTML = '<option value="">Todos los locales' + (state.marca !== 'Todas' ? ' de ' + esc(state.marca) : '') + '</option>' +
    pool.map(l => `<option value="${l.id}" ${l.id === state.local ? 'selected' : ''}>${esc(l.local)}</option>`).join('');
  const ls = selected();
  renderScore(ls); renderKpi(ls); renderPeriodo(ls); renderPos(ls); renderNeg(ls); renderTable(pool);
}

function renderScore(ls) {
  const con = ls.filter(l => l.rating && l.total);
  const tot = con.reduce((a, l) => a + l.total, 0);
  const r = tot ? con.reduce((a, l) => a + l.rating * l.total, 0) / tot : null;
  $('rating').textContent = r ? r.toFixed(1).replace('.', ',') : 'Sin dato';
  const full = r ? Math.round(r) : 0;
  $('stars').textContent = r ? '★'.repeat(full) + '☆'.repeat(5 - full) : '';
  $('ratingMeta').textContent = r
    ? `Puntaje de Google${ls.length > 1 ? ' (media ponderada)' : ''}, ${fmt(tot)} reseñas${ls.length > 1 ? ` en ${con.length} de ${ls.length} locales con dato` : ''}.`
    : 'Este local aún no tiene dato leído.';
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; let dt = 0;
  ls.forEach(l => { if (l.dist) for (const k in d) { d[k] += l.dist[k] || 0; dt += l.dist[k] || 0; } });
  if (!dt) { $('dist').innerHTML = '<p class="empty" style="color:var(--arena);border-color:rgba(234,230,220,.3)">La distribución por estrellas aún no está leída para esta selección.</p>'; return; }
  const max = Math.max(...Object.values(d));
  $('dist').innerHTML = [5, 4, 3, 2, 1].map(k => `<div class="drow"><span>${k}★</span><div class="dtrack"><div class="dfill" style="width:${d[k] / max * 100}%"></div></div><span>${Math.round(d[k] * 100 / dt)}%</span></div>`).join('') +
    `<div class="meta" style="margin-top:4px">Distribución sobre ${fmt(dt)} reseñas${dt < (ls.reduce((a, l) => a + (l.total || 0), 0)) ? ' (solo locales con dato)' : ''}.</div>`;
}

function bars(items, cls, valFmt) {
  const max = Math.max(...items.map(i => i.v), 1);
  return items.map(i => `<div class="brow"><div class="bhead"><b>${esc(i.t)}</b><span>${valFmt(i)}</span></div><div class="btrack" title="${esc(i.t)}"><div class="bfill ${cls}" style="width:${i.v / max * 100}%"></div></div></div>`).join('');
}

function periodoTxt(rs) {
  return `últimos ${Math.max(...rs.map(l => l.reciente.meses))} meses`;
}

function sumTemas(rs, k, top = 6) {
  const m = {};
  rs.forEach(l => Object.entries(l.reciente[k]).forEach(([t, v]) => { m[t] = (m[t] || 0) + v; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, top).map(([t, v]) => ({ t: TEMAS[t] || t, v }));
}

function renderPos(ls) {
  const rs = ls.filter(l => l.reciente);
  if (rs.length) {
    const n = rs.reduce((a, l) => a + l.reciente.conTexto, 0);
    $('posHint').textContent = '';
    $('pos').innerHTML = '<div class="pos">' + bars(sumTemas(rs, 'positivos'), 'all', i => Math.round(i.v * 100 / n) + '% (' + i.v + ')') + '</div>';
    return;
  }
  $('pos').innerHTML = '<p class="empty">Reseñas de los últimos 3 meses pendientes de leer para esta selección.</p>';
}

function renderNeg(ls) {
  const rs = ls.filter(l => l.reciente);
  if (rs.length) {
    const n = rs.reduce((a, l) => a + l.reciente.conTexto, 0);
    $('negHint').textContent = '';
    const it = sumTemas(rs, 'negativos');
    const sin = rs.reduce((a, l) => a + (l.reciente.estrellas[1] + l.reciente.estrellas[2] + l.reciente.estrellas[3]) , 0);
    $('neg').innerHTML = it.length ? '<div class="neg">' + bars(it, 'all', i => Math.round(i.v * 100 / n) + '% (' + i.v + ')') + '</div>'
      : '<p class="empty">Ninguna reseña con texto de los últimos 3 meses señala aspectos a mejorar.' + (sin ? ` Hay ${sin} reseñas de 1 a 3 estrellas, pero sin comentario.` : '') + '</p>';
    return;
  }
  $('neg').innerHTML = '<p class="empty">Reseñas de los últimos 3 meses pendientes de leer para esta selección.</p>';
}

function renderTable(pool) {
  $('tabla').querySelector('tbody').innerHTML = pool.map(l => `<tr tabindex="0" data-id="${l.id}" class="${l.id === state.local ? 'on' : ''}"><td>${esc(l.local)}<br><small>${esc(l.direccion)}</small></td><td>${esc(l.marca)}</td><td class="n">${l.rating ? String(l.rating).replace('.', ',') : '–'}</td><td class="n">${l.total ? fmt(l.total) : '–'}</td></tr>`).join('');
  $('tabla').querySelectorAll('tbody tr').forEach(tr => {
    const go = () => { state.local = tr.dataset.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  });
}

const TEMAS = { ATE: 'Atención y trato del personal', RIT: 'Rapidez y esperas', RES: 'Reservas y mesa', SAB: 'Sabor y calidad de la comida', TEM: 'Temperatura de la comida', SEG: 'Seguridad alimentaria y alérgenos', CAR: 'Carta, menú y raciones', PRE: 'Precio y cuenta', AMB: 'Ambiente y decoración', LOC: 'Comodidad y limpieza del local', DEL: 'Delivery y pedidos' };



function renderKpi(ls) {
  const el = $('kpi'), M = DATA.meta;
  const rs = ls.filter(l => l.reciente);
  if (!rs.length) { el.innerHTML = '<h2>KPI del trimestre</h2><p class="empty">Lectura de reseñas recientes pendiente para esta selección.</p>'; return; }
  const n = rs.reduce((a, l) => a + l.reciente.leidas, 0);
  const suma = rs.reduce((a, l) => a + Object.entries(l.reciente.estrellas).reduce((b, [k, v]) => b + k * v, 0), 0);
  const p = suma / n;
  const estado = p < M.umbral ? ['no', 'Por debajo de la meta'] : p < M.vigilancia ? ['vig', 'Cumple, en vigilancia'] : ['ok', 'Cumple la meta'];
  const fmt1 = x => x.toFixed(2).replace('.', ',');
  const prov = n < M.minResenas ? `<span class="tag prov">Provisional: menos de ${M.minResenas} reseñas</span>` : '';
  const prev = rs.filter(l => l.previo);
  let cmp = '<span>Comparación con el periodo anterior: sin datos previos todavía.</span>';
  if (prev.length === rs.length) {
    const pn = prev.reduce((a, l) => a + l.previo.leidas, 0);
    const pp = prev.reduce((a, l) => a + l.previo.promedio * l.previo.leidas, 0) / pn;
    const d = p - pp;
    cmp = `<span>Frente a la lectura del ${new Date(prev[0].previo.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}: <b>${d >= 0 ? '+' : ''}${fmt1(d)}</b> (antes ${fmt1(pp)}, ${fmt(pn)} reseñas).</span>`;
  }
  el.innerHTML = `<h2>KPI del trimestre</h2>
    <p class="hint">Promedio de los ${periodoTxt(rs)}. Meta: ${fmt1(M.umbral)} o más.</p>
    <div class="kpi"><div class="kpinum ${estado[0]}">${fmt1(p)}<small> sobre 5</small></div>
      <div class="kpimeta"><span class="tag ${estado[0]}">${estado[1]}</span> ${prov}
        <span><b>${fmt(n)}</b> reseñas leídas${rs.length > 1 ? ` en ${rs.length} locales` : ''}${ls.length > rs.length ? ` (faltan ${ls.length - rs.length} por leer)` : ''}.</span>
        ${cmp}</div></div>`;
}

function renderPeriodo(ls) {
  const rs = ls.filter(l => l.reciente), el = $('periodo');
  if (!rs.length) { el.innerHTML = ''; return; }
  const n = rs.reduce((a, l) => a + l.reciente.conTexto, 0);
  el.innerHTML = `<p><b>Periodo:</b> ${Math.max(...rs.map(l => l.reciente.meses))} meses · <b>Reseñas con texto:</b> ${fmt(n)}</p><p class="pie">Una reseña puede mencionar varios temas, por eso los porcentajes no suman 100%.</p>`;
}
