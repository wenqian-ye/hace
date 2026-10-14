(function () {
  'use strict';
  const HC = window.HC;
  const DUR = 700, ROW_STEP = 70, PANEL_STEP = 140, REGROW = 520;
  const LOWER_BETTER = new Set(['Smin', 'MAE']);
  const SUB = { Fmax: 'F<sub>max</sub>', Smin: 'S<sub>min</sub>', F1: 'F<sub>1</sub>', R2: 'R<sup>2</sup>' };
  const mk = k => SUB[k] || k;

  const CSS = `
#viz-sci summary:focus-visible{outline:2px solid var(--ink-2);outline-offset:2px}
#viz-sci .sci-replay svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
@media (max-width:380px){#viz-sci .hc-seg-k{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}}
#viz-sci .sci-grid{display:grid;column-gap:var(--gutter);row-gap:22px}
#viz-sci .sci-head{margin:0 0 10px}
#viz-sci .sci-title{font:700 14px/1.3 var(--sans);color:var(--dc)}
#viz-sci .sci-base{font:12.5px/1.4 var(--sans);color:var(--fig-sub);font-variant-numeric:tabular-nums}
#viz-sci svg *{pointer-events:none}
#viz-sci .sci-hit{pointer-events:all;fill:transparent;outline:none;cursor:default}
#viz-sci .sci-hit.on,#viz-sci .sci-hit:focus-visible{fill:var(--hover)}
#viz-sci .sci-hit:focus-visible{stroke:var(--specialist);stroke-width:1.5}
#viz-sci .sci-cat{fill:var(--tick);font-size:12.5px}
#viz-sci .sci-val{fill:var(--ink-2);font-size:12.5px;font-variant-numeric:tabular-nums;opacity:0;transition:opacity .3s;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
#viz-sci .sci-val.on{opacity:1}
#viz-sci .sci-sd{font-size:11.5px;fill:var(--muted);font-weight:400}
#viz-sci .sci-row.hace .sci-cat,#viz-sci .sci-row.hace .sci-val{fill:var(--m-hace);font-weight:700}
#viz-sci .sci-ref{stroke:var(--m-base-label);stroke-width:1.1;stroke-dasharray:4 3;opacity:.75}
#viz-sci .sci-wh{stroke-width:1.5;stroke-linecap:round}
#viz-sci .sci-dot{stroke:var(--paper);stroke-width:1.5}
#viz-sci .sci-row{transition:opacity .2s}
#viz-sci svg.hovering .sci-row:not(.hot){opacity:.32}
#viz-sci .sci-more{margin:22px 0 0;border-top:1px solid var(--rule)}
#viz-sci .sci-more summary{display:grid;grid-template-columns:12px auto 1fr;align-items:baseline;gap:2px 10px;padding:12px 2px 6px;cursor:pointer;list-style:none;font:650 14px/1.4 var(--sans);color:var(--ink)}
#viz-sci .sci-more summary::-webkit-details-marker{display:none}
#viz-sci .sci-more summary::before{content:"";width:7px;height:7px;border-right:1.6px solid var(--ink-2);border-bottom:1.6px solid var(--ink-2);transform:translateY(-2px) rotate(-45deg);transition:transform .2s;align-self:center}
@media (max-width:560px){#viz-sci .sci-more summary{grid-template-columns:12px 1fr}#viz-sci .sci-hint{grid-column:2}}
#viz-sci .sci-more[open] summary::before{transform:translateY(-3px) rotate(45deg)}
#viz-sci .sci-hint{font-weight:400;font-size:12.5px;color:var(--muted)}
#viz-sci .sci-tables{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;padding:10px 0 4px}
#viz-sci .sci-cap{font:14.5px/1.55 var(--sans);color:var(--muted);margin:0 0 6px}
#viz-sci .sci-cap b{color:var(--ink-2);font-weight:600}
#viz-sci .hc-table td,#viz-sci .hc-table th{white-space:nowrap}
#viz-sci .hc-table tr.grp th{font-weight:700;color:var(--ink);font-size:13px;border-bottom:1px solid var(--rule);padding-top:12px}
#viz-sci .hc-table th[scope=row]{font-weight:400;color:var(--ink-2);border-bottom:1px solid var(--rule-2)}
#viz-sci .hc-table th:first-child{position:sticky;left:0;z-index:1;background:var(--paper)}
#viz-sci .hc-table tr.grp th{position:static}
#viz-sci .hc-table tr.hl td,#viz-sci .hc-table tr.hl th{background:var(--hl-row)}
#viz-sci .tip-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:0}
#viz-sci .sci-scroll{display:none;font:12px/1.4 var(--sans);color:var(--muted);margin:4px 0 0}
#viz-sci .sci-tbl.over .sci-scroll{display:block}
#viz-sci .sci-tbl .table-wrap{position:relative}
#viz-sci .sci-tbl.over .table-wrap{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent)}
#viz-sci .sci-tbl.over.end .table-wrap{-webkit-mask-image:none;mask-image:none}
@media (prefers-reduced-motion:reduce){#viz-sci *,#viz-sci *::before{transition:none!important}}
#viz-sci .hc-table td b{color:var(--ink);font-weight:750}
#viz-sci .hc-table .sd{font-size:11.5px;color:var(--muted);font-weight:400;margin-left:3px}
#viz-sci .hc-table tr.hl td{font-weight:400}
#viz-sci .hc-table tr.hl th{color:var(--m-hace);font-weight:700}
`;

  HC.register('sci', function (host, api) {
    if (!document.querySelector('style[data-hc="sci"]')) {
      HC.h('style', { 'data-hc': 'sci' }, document.head).textContent = CSS;
    }
    const P = api.data.paper || {};
    const T = P.table2;
    if (!T || !T.blocks || !T.rows) return {};
    const DEC = P.decimals && typeof P.decimals.table2 === 'number' ? P.decimals.table2 : 4;
    const f4 = v => HC.fmt(v, DEC), s4 = v => (Math.abs(v) < 5e-9 ? (0).toFixed(DEC) : HC.fmtSigned(v, DEC));
    const base = T.rows.find(r => r.method === 'Base');
    const methods = T.rows.filter(r => r.method !== 'Base');
    if (!base || !methods.length) return {};
    const nice = name => name.replace(/\s*\/\s*/, ' · ');
    const domainVar = name => /^WBM/.test(name) ? '--d-mat' : '--d-prot';
    const slotLabel = i => [...new Set(T.blocks.map(b => b.metrics[i]))].join(' / ');
    const gain = (r, b, i) => {
      const k = b.metrics[i], v = r.values[b.name][k].mean, b0 = base.values[b.name][k].mean;
      return Math.round((v - b0) * Math.pow(10, DEC)) / Math.pow(10, DEC);
    };
    let slot = api.sciSlot === 1 ? 1 : 0;

    const W = Math.max(300, host.clientWidth);
    const wide = W >= 840, GAP = wide ? parseFloat(HC.css('--gutter')) || 32 : 0;
    const PW = wide ? (W - 2 * GAP) / 3 : W;
    const ROW = 28;
    const STEP = 0.05;
    const domain = (b, i) => {
      const k = b.metrics[i];
      const vs = T.blocks.filter(o => o.metrics[i] === k).flatMap(o => T.rows.map(r => r.values[o.name][k]));
      const lo = Math.min(...vs.map(v => v.mean - v.sd)), hi = Math.max(...vs.map(v => v.mean + v.sd));
      const span = Math.max(0.10, 2.5 * (hi - lo)), c = (lo + hi) / 2;
      return [Math.floor((c - span / 2) / STEP + 1e-9) * STEP, Math.ceil((c + span / 2) / STEP - 1e-9) * STEP];
    };
    const probe = HC.el('svg', { width: 0, height: 0, style: 'position:absolute' }, host);
    const rowG = r => HC.el('g', { class: 'sci-row' + (r.method === 'HACE' ? ' hace' : '') }, probe);
    const catW = Math.max(...T.rows.map(r => HC.text(rowG(r), 0, 0, r.method, { class: 'sci-cat' }).getBBox().width));
    const m = { l: Math.ceil(catW || 78) + 10, r: 0, t: 0, b: 44 };
    const A = PW - m.l;
    T.blocks.forEach(b => [0, 1].forEach(i => {
      const [d0, d1] = domain(b, i), k = b.metrics[i];
      T.rows.forEach(r => {
        const v = r.values[b.name][k], f = (v.mean + v.sd - d0) / (d1 - d0);
        const t = HC.text(rowG(r), 0, 0, '', { class: 'sci-val' });
        t.innerHTML = `${f4(v.mean)}<tspan class="sci-sd" dx="3">${HC.sd(v.sd, DEC)}</tspan>`;
        const need = (r.method === 'HACE' ? 9 : 7) + t.getComputedTextLength() + 3;
        if (f > 0) m.r = Math.max(m.r, A - (A - need) / f);
      });
    }));
    probe.remove();
    m.r = Math.ceil(Math.max(m.r, 14));
    const ih = T.rows.length * ROW, iw = PW - m.l - m.r, PH = m.t + ih + m.b;

    const bar = HC.h('div', { class: 'hc-top sci-bar' }, host);
    HC.h('span', { class: 'hc-seg-k', id: 'sci-mlabel' }, bar, 'Metric');
    const seg = HC.h('div', { class: 'hc-seg sci-seg', role: 'group', 'aria-labelledby': 'sci-mlabel' }, bar);
    const segBtns = [0, 1].map(i => {
      const b = HC.h('button', { type: 'button', 'aria-pressed': i === slot ? 'true' : 'false' }, seg, slotLabel(i));
      b.addEventListener('click', () => setSlot(i));
      return b;
    });
    const replay = HC.REDUCED ? null : HC.h('button', { type: 'button', class: 'hc-btn sci-replay' }, bar,
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.1 8.6A5 5 0 1 0 4.6 4.3"/><path d="M4.3 1.6v2.9h2.9"/></svg>Replay');
    const grid = HC.h('div', { class: 'sci-grid' }, host);
    grid.style.gridTemplateColumns = `repeat(${wide ? 3 : 1}, minmax(0, 1fr))`;
    const tip = HC.tooltip(host);

    const scaleFor = (b, i) => {
      const [d0, d1] = domain(b, i);
      const x = HC.linear(d0, d1, 0, iw);
      x.tickVals = HC.niceTicks(d0, d1, Math.round((d1 - d0) / STEP));
      return x;
    };

    const panels = T.blocks.map((b, pi) => {
      const box = HC.h('div', { class: 'sci-panel' }, grid);
      box.style.setProperty('--dc', HC.css(domainVar(b.name)));
      const head = HC.h('div', { class: 'sci-head' }, box);
      HC.h('div', { class: 'sci-title' }, head, nice(b.name));
      const baseLine = HC.h('div', { class: 'sci-base' }, head);
      const fr = HC.frame(box, PW, PH, m, '');
      const g = fr.g;
      const gGrid = HC.el('g', { class: 'hc-grid' }, g);
      const gAxis = HC.el('g', {}, g);
      const ref = HC.el('line', { class: 'sci-ref', y1: 2, y2: ih - 2 }, g);
      const rows = T.rows.map((r, ri) => {
        const isH = r.method === 'HACE', isB = r === base;
        const cy = ri * ROW + ROW / 2, col = HC.color(r.method);
        const grp = HC.el('g', { class: 'sci-row' + (isH ? ' hace' : ''), 'data-k': r.method }, g);
        const hit = HC.el('rect', { class: 'sci-hit', x: -m.l + 4, y: ri * ROW + 1, width: PW - 8, height: ROW - 2, rx: 7, tabindex: ri ? -1 : 0 }, grp);
        HC.text(grp, -10, cy + 4.5, r.method, { class: 'sci-cat', 'text-anchor': 'end' });
        const wh = HC.el('line', { class: 'sci-wh', y1: cy, y2: cy, stroke: col }, grp);
        const dot = HC.el('circle', { class: 'sci-dot', cy, r: isH ? 5.5 : 4, fill: col }, grp);
        const val = HC.text(grp, 0, cy + 4, '', { class: 'sci-val' });
        return { r, ri, isH, isB, cy, grp, hit, wh, dot, val, delay: pi * PANEL_STEP + (ri - 1) * ROW_STEP };
      });
      return { b, pi, box, baseLine, svg: fr.svg, gGrid, gAxis, ref, rows, x: null };
    });

    let played = false, token = 0;
    function setup() {
      panels.forEach(p => {
        const x = p.x = scaleFor(p.b, slot);
        const k = p.b.metrics[slot], b0 = base.values[p.b.name][k];
        p.b0 = b0.mean;
        p.baseLine.innerHTML = `Base ${mk(k)} ${f4(b0.mean)} ${HC.sd(b0.sd, DEC)}`;
        HC.clear(p.gGrid); HC.clear(p.gAxis);
        x.tickVals.forEach(v => HC.el('line', { x1: x(v), x2: x(v), y1: 0, y2: ih }, p.gGrid));
        HC.axisX(p.gAxis, x, { y: ih + 4, ticks: x.tickVals, fmt: v => v.toFixed(2), label: k, labelDy: 36 });
        p.ref.setAttribute('x1', x(b0.mean)); p.ref.setAttribute('x2', x(b0.mean));
        p.rows.forEach(o => {
          const v = o.r.values[p.b.name][k];
          o.v = v; o.g = gain(o.r, p.b, slot);
          o.val.innerHTML = `${f4(v.mean)}<tspan class="sci-sd" dx="3">${HC.sd(v.sd, DEC)}</tspan>`;
          const gap = o.isH ? 9 : 7, tw = (o.val.getComputedTextLength() || 13 * 6.6) + 3, xr = x(v.mean + v.sd) + gap;
          const left = xr + tw > iw + m.r && x(v.mean - v.sd) - gap - tw > 0;
          o.val.setAttribute('x', (left ? x(v.mean - v.sd) - gap : xr).toFixed(2));
          o.val.setAttribute('text-anchor', left ? 'end' : 'start');
          const delta = o.isB ? 'Reference' : `Change from Base <b>${s4(o.g)}</b>`;
          o.html = `<span class="tip-dot" style="background:${HC.color(o.r.method)}"></span><b style="color:var(${o.isH ? '--m-hace' : '--ink'})">${o.r.method}</b><br>${nice(p.b.name)}<br>` +
            `${mk(k)} <b>${f4(v.mean)}</b> ${HC.sd(v.sd, DEC)}<br>${delta}`;
          o.hit.setAttribute('aria-label', `${o.r.method}, ${nice(p.b.name)}: ${k} ${f4(v.mean)} ${HC.sd(v.sd, DEC)}` +
            (o.isB ? ', reference' : `, change from Base ${s4(o.g)}`));
        });
        p.svg.setAttribute('aria-label', `${nice(p.b.name)}, ${k} means with standard deviations (arrow keys move between rows): ` +
          p.rows.map(o => `${o.r.method} ${f4(o.v.mean)}`).join(', ') + '.');
      });
      segBtns.forEach((b, i) => b.setAttribute('aria-pressed', i === slot ? 'true' : 'false'));
    }
    const clamp = v => Math.max(0, Math.min(1, v));
    function frameAt(t, stagger) {
      panels.forEach(p => p.rows.forEach(o => {
        const k = o.isB ? 1 : HC.ease.out(clamp((t - o.delay * stagger) / DUR));
        const c = p.b0 + (o.v.mean - p.b0) * k, x = p.x;
        o.dot.setAttribute('cx', x(c).toFixed(2));
        o.wh.setAttribute('x1', x(c - o.v.sd).toFixed(2));
        o.wh.setAttribute('x2', x(c + o.v.sd).toFixed(2));
        o.wh.style.opacity = k;
        const on = k > 0.85;
        if (on !== o.on) { o.on = on; o.val.classList.toggle('on', on); }
      }));
    }
    const lastDelay = Math.max(...panels.flatMap(p => p.rows.map(o => o.delay)));
    function grow(stagger) {
      const my = ++token, total = lastDelay * stagger + DUR;
      frameAt(0, stagger);
      return HC.tween(total, e => { if (my === token) frameAt(e * total, stagger); }, t => t);
    }
    function setSlot(i) {
      if (i === slot) return;
      slot = i; api.sciSlot = i;
      setup();
      tip.hide(); mark(null);
      if (!played) { frameAt(0, 1); return; }
      if (HC.REDUCED) { token++; frameAt(1e6, 1); return; }
      grow(REGROW / (lastDelay || 1) * 0.6);
    }

    const all = panels.flatMap(p => p.rows.map(o => Object.assign(o, { p })));
    function mark(o) {
      panels.forEach(p => p.svg.classList.toggle('hovering', !!o && o.p === p));
      all.forEach(r => { r.grp.classList.toggle('hot', r === o); r.hit.classList.toggle('on', r === o); });
    }
    function show(o) {
      mark(o);
      const b = o.p.svg.getBoundingClientRect(), s = b.width / PW;
      const px = m.l + o.p.x(o.v.mean + o.v.sd) + 4, py = m.t + o.cy;
      tip.show(b.left + px * s, b.top + py * s, o.html);
    }
    const hide = () => { mark(null); tip.hide(); };
    all.forEach(o => {
      o.hit.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(o); });
      o.hit.addEventListener('click', () => show(o));
      o.hit.addEventListener('pointercancel', hide);
      o.hit.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
      o.hit.addEventListener('focus', () => { o.p.rows.forEach(r => r.hit.setAttribute('tabindex', r === o ? 0 : -1)); show(o); });
      o.hit.addEventListener('keydown', e => {
        const n = o.p.rows.length, j = { ArrowDown: o.ri + 1, ArrowRight: o.ri + 1, ArrowUp: o.ri - 1, ArrowLeft: o.ri - 1, Home: 0, End: n - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        o.p.rows[Math.max(0, Math.min(n - 1, j))].hit.focus();
      });
      o.hit.addEventListener('blur', hide);
    });
    if (replay) replay.addEventListener('click', () => { played = true; tip.hide(); mark(null); grow(1); });

    const decOf = (tbl, k) => {
      const d = (P.decimals || {})[tbl];
      return typeof d === 'number' ? d : d && typeof d[k] === 'number' ? d[k] : d && typeof d.default === 'number' ? d.default : 4;
    };
    const num = (v, d) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
    const head = k => mk(k) + (LOWER_BETTER.has(k) ? ' ↓' : ' ↑');
    function rowsHtml(tbl, metrics, rows) {
      const best = {};
      metrics.forEach(k => {
        const d = decOf(tbl, k), vs = rows.map(r => +r.values[k].mean.toFixed(d));
        best[k] = LOWER_BETTER.has(k) ? Math.min(...vs) : Math.max(...vs);
      });
      return rows.map(r => `<tr${r.method === 'HACE' ? ' class="hl"' : ''}><th scope="row">${r.method}</th>` + metrics.map(k => {
        const d = decOf(tbl, k), v = r.values[k], b = +v.mean.toFixed(d) === best[k];
        return `<td class="num">${b ? '<b>' : ''}${num(v.mean, d)}${b ? '</b>' : ''}<span class="sd">${HC.sd(v.sd, d)}</span></td>`;
      }).join('') + '</tr>').join('');
    }
    function table(tbl, metrics, bodies) {
      const cap = (P.captions || {})[tbl] || '';
      const n = tbl.replace(/\D+/g, '');
      return `<div class="sci-tbl"><p class="sci-cap"><b>Table ${n}</b> ${cap}</p><div class="table-wrap"><table class="hc-table">` +
        `<thead><tr><th>Method</th>${metrics.map(k => `<th class="num">${head(k)}</th>`).join('')}</tr></thead>` +
        bodies.map(([label, rows]) => `<tbody>${label ? `<tr class="grp"><th scope="rowgroup" colspan="${metrics.length + 1}">${label}</th></tr>` : ''}${rowsHtml(tbl, metrics, rows)}</tbody>`).join('') +
        '</table></div><p class="sci-scroll">Scroll sideways for more metrics</p></div>';
    }
    const T5 = P.table5, T6 = P.table6;
    if (T5 && T6) {
      const det = HC.h('details', { class: 'sci-more' }, host);
      if (api.sciOpen) det.open = true;
      const hint = () => det.querySelectorAll('.sci-tbl').forEach(t => {
        const w = t.querySelector('.table-wrap');
        t.classList.toggle('over', w.scrollWidth > w.clientWidth + 1);
        t.classList.toggle('end', w.scrollLeft + w.clientWidth >= w.scrollWidth - 2);
      });
      det.addEventListener('toggle', () => { api.sciOpen = det.open; hint(); });
      HC.h('summary', {}, det, '<span>Full scientific metrics</span><span class="sci-hint">Tables 5 and 6, means ± sd over three seeds, best mean per column in bold</span>');
      HC.h('div', { class: 'sci-tables' }, det,
        table('table5', T5.metrics, Object.keys(T5.blocks).map(k => [k, T5.blocks[k]])) +
        table('table6', T6.metrics, [['', T6.rows]]));
      det.querySelectorAll('.table-wrap').forEach(w => w.addEventListener('scroll', hint, { passive: true }));
      if (det.open) requestAnimationFrame(hint);
    }

    setup();
    frameAt(0, 1);
    return {
      play(instant) {
        played = true;
        if (instant || HC.REDUCED) { token++; frameAt(1e6, 1); return; }
        grow(1);
      },
    };
  });
})();
