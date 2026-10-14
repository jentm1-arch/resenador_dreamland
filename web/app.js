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
  $('actualizado').textContent = 'Datos actualizados el ' + new Date(DATA.actualizado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Se refrescan cada semana.';
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
  renderScore(ls); renderPos(ls); renderNeg(ls); renderTable(pool);
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

function sumTemas(rs, k, top = 6) {
  const m = {};
  rs.forEach(l => Object.entries(l.reciente[k]).forEach(([t, v]) => { m[t] = (m[t] || 0) + v; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, top).map(([t, v]) => ({ t: TEMAS[t] || t, v }));
}

function renderPos(ls) {
  const rs = ls.filter(l => l.reciente);
  if (rs.length) {
    const n = rs.reduce((a, l) => a + l.reciente.conTexto, 0);
    $('posHint').textContent = `Temas elogiados en ${fmt(n)} reseñas recientes con texto (de ${rs.length} ${rs.length === 1 ? 'local' : 'locales'}), clasificadas leyendo cada una. Porcentaje sobre reseñas con texto; una reseña puede elogiar varios temas.`;
    $('pos').innerHTML = '<div class="pos">' + bars(sumTemas(rs, 'positivos'), 'all', i => Math.round(i.v * 100 / n) + '% (' + i.v + ')') + '</div>';
    return;
  }
  $('posHint').textContent = 'Temas que Google detecta en las reseñas de toda la ficha (sin distinguir tono). Lectura de reseñas recientes pendiente para esta selección.';
  const m = {};
  ls.forEach(l => l.chips.forEach(c => { m[c.tema] = (m[c.tema] || 0) + c.menciones; }));
  const items = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, v]) => ({ t, v }));
  $('pos').innerHTML = items.length ? '<div class="pos">' + bars(items, 'all', i => fmt(i.v) + ' menciones') + '</div>'
    : '<p class="empty">Aún no hay temas leídos para esta selección.</p>';
}

function renderNeg(ls) {
  const rs = ls.filter(l => l.reciente);
  if (rs.length) {
    const n = rs.reduce((a, l) => a + l.reciente.conTexto, 0);
    $('negHint').textContent = `Temas criticados en ${fmt(n)} reseñas recientes con texto (de ${rs.length} ${rs.length === 1 ? 'local' : 'locales'}), de cualquier puntuación, clasificadas leyendo cada una. Una reseña puede tocar varios temas.`;
    $('neg').innerHTML = '<div class="neg">' + bars(sumTemas(rs, 'negativos'), 'all', i => Math.round(i.v * 100 / n) + '% (' + i.v + ')') + '</div>';
    return;
  }
  const leidos = ls.filter(l => l.leido && l.muestraBajas > 0);
  const n = leidos.reduce((a, l) => a + l.muestraBajas, 0);
  const n12 = leidos.reduce((a, l) => a + l.bajas12m, 0);
  $('negHint').textContent = n
    ? `Sobre ${fmt(n)} reseñas de 1 o 2 estrellas con texto, de ${leidos.length} ${leidos.length === 1 ? 'local leído' : 'locales leídos'} (${n12} de los últimos 12 meses). Una reseña puede tocar varios temas.`
    : 'Se leen las reseñas de 1 y 2 estrellas con texto de cada local.';
  if (!n) { $('neg').innerHTML = '<p class="empty">Lectura pendiente para esta selección.</p>'; return; }
  const m = {};
  leidos.forEach(l => Object.entries(l.quejas).forEach(([k, v]) => { m[k] = m[k] || { total: 0, u12: 0 }; m[k].total += v.total; m[k].u12 += v.ultimos12m; }));
  const items = Object.entries(m).sort((a, b) => b[1].total - a[1].total).slice(0, 8).map(([t, v]) => ({ t, v: v.total, u12: v.u12 }));
  const max = Math.max(...items.map(i => i.v), 1);
  $('neg').innerHTML = '<div class="legend"><span><i style="background:rgba(146,67,33,.35)"></i>Toda la muestra leída</span><span><i style="background:var(--terracota)"></i>De ellas, publicadas en los últimos 12 meses</span></div><div class="neg">' +
    items.map(i => `<div class="brow"><div class="bhead"><b>${esc(i.t)}</b><span>${Math.round(i.v * 100 / n)}% de las ${n} leídas, ${i.u12} en los últimos 12 meses</span></div><div class="btrack"><div class="bfill all" style="width:${i.v / max * 100}%"></div><div class="bfill rec" style="width:${i.u12 / max * 100}%"></div></div></div>`).join('') + '</div>';
}

function renderTable(pool) {
  $('tabla').querySelector('tbody').innerHTML = pool.map(l => `<tr tabindex="0" data-id="${l.id}" class="${l.id === state.local ? 'on' : ''}"><td>${esc(l.local)}<br><small>${esc(l.direccion)}</small></td><td>${esc(l.marca)}</td><td class="n">${l.rating ? String(l.rating).replace('.', ',') : '–'}</td><td class="n">${l.total ? fmt(l.total) : '–'}</td><td><span class="tag ${l.muestraBajas ? 'ok' : ''}">${l.muestraBajas ? 'Leída' : 'Pendiente'}</span></td></tr>`).join('');
  $('tabla').querySelectorAll('tbody tr').forEach(tr => {
    const go = () => { state.local = tr.dataset.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  });
}

const TEMAS = { ATE: 'Atención y trato del personal', RIT: 'Rapidez y esperas', RES: 'Reservas y mesa', SAB: 'Sabor y calidad de la comida', TEM: 'Temperatura de la comida', SEG: 'Seguridad alimentaria y alérgenos', CAR: 'Carta, menú y raciones', PRE: 'Precio y cuenta', AMB: 'Ambiente y decoración', LOC: 'Comodidad y limpieza del local', DEL: 'Delivery y pedidos' };


