(function () {
  'use strict';
  const HC = window.HC;
  const BASE = 'Base', TOP = 'HACE';

  const CSS = `
#viz-rec .rec-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 22px}
#viz-rec .rec-tile{border:1px solid var(--rule);border-radius:12px;padding:14px 20px 12px;background:var(--paper);font:13.5px/1.45 var(--sans);color:var(--ink-2)}
#viz-rec .rec-num{display:block;font:700 26px/1.1 var(--sans);color:var(--m-hace);letter-spacing:-.02em;margin-bottom:6px;font-variant-numeric:tabular-nums;white-space:nowrap}
#viz-rec .rec-num small{font-size:15px;font-weight:600;color:var(--m-base-label);letter-spacing:0}
@media (max-width:720px){#viz-rec .rec-tile{padding:14px 16px 12px}}
#viz-rec .rec-top .hc-legend{flex:1 1 0;min-width:0}
#viz-rec .hc-legend button:nth-child(2) span:last-child{color:var(--m-hace);font-weight:700}
#viz-rec > svg{touch-action:manipulation}
#viz-rec > svg *{pointer-events:none}
#viz-rec .rec-hit{pointer-events:all;fill:transparent;outline:none;rx:6px}
#viz-rec .rec-hit:focus-visible{stroke:var(--ink-2);stroke-width:1.2;stroke-dasharray:3 3}
#viz-rec .rec-head{fill:var(--d-rec);font-size:14px;font-weight:700}
#viz-rec .rec-block{fill:var(--fig-title);font-size:14px;font-weight:700}
#viz-rec .rec-row{fill:var(--fig-title);font-size:13px;font-weight:600}
#viz-rec .rec-grid{stroke:var(--grid);stroke-width:1;shape-rendering:crispEdges}
#viz-rec .rec-track{stroke:var(--grid);stroke-width:1;shape-rendering:crispEdges}
#viz-rec .rec-base{stroke:var(--m-base);stroke-width:1.3;stroke-dasharray:4 3}
#viz-rec .rec-bv{fill:var(--muted);font-size:11.5px;font-variant-numeric:tabular-nums}
#viz-rec .rec-dot{stroke:var(--paper);stroke-width:1.2;transition:opacity .2s}
#viz-rec .rec-dot.top{stroke-width:1.6}
#viz-rec .rec-dot.on{stroke:var(--ink);stroke-width:1.8}
#viz-rec .rec-val{fill:var(--m-hace);font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round;transition:opacity .2s}
#viz-rec .rec-dim{opacity:.12}
#viz-rec .rec-replay svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#viz-rec .hc-tip .k{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:0}
#viz-rec .hc-tip .rel{font-weight:700;font-variant-numeric:tabular-nums}
#viz-rec .rec-tiles.stack{grid-template-columns:1fr}
`;

  const uniq = a => a.filter((v, i) => a.indexOf(v) === i);
  const clamp = t => t < 0 ? 0 : t > 1 ? 1 : t;

  function swarm(items, step) {
    const placed = [];
    items.forEach(it => {
      for (let k = 0; k < 40; k++) {
        const dy = (k % 2 ? -1 : 1) * Math.ceil(k / 2) * step;
        if (placed.every(p => Math.hypot(p.fx - it.fx, p.dy - dy) >= p.r + it.r - 2.5)) { it.dy = dy; break; }
      }
      placed.push(it);
    });
  }

  HC.register('rec', function (host, api) {
    if (!document.querySelector('style[data-hc="rec"]')) {
      HC.h('style', { 'data-hc': 'rec' }, document.head).textContent = CSS;
    }
    const P = api.data.paper || {}, T = P.table1;
    if (!T || !T.rows || !T.rows.length) return {};
    const dec = (P.decimals || {}).table1 || 4;
    const methods = T.methods.filter(m => m !== BASE);    const others = methods.filter(m => m !== TOP);
    const archs = uniq(T.rows.map(r => r.arch)), sets = uniq(T.rows.map(r => r.dataset));
    const rows = T.rows.map(r => {
      const b = r.values[BASE].mean, rel = {};
      methods.forEach(m => { rel[m] = (r.values[m].mean / b - 1) * 100; });
      return { r, ai: archs.indexOf(r.arch), di: sets.indexOf(r.dataset), rel };
    });

    const nBest = rows.filter(d => T.methods.every(m => m === TOP || d.r.values[m].mean < d.r.values[TOP].mean)).length;
    const gains = rows.map(d => d.rel[TOP]);
    const gMean = gains.reduce((a, b) => a + b, 0) / gains.length, gMin = Math.min(...gains), gMax = Math.max(...gains);
    const pct = v => v.toFixed(1) + '%';
    const tiles = HC.h('div', { class: 'rec-tiles' }, host);
    const tile = label => {
      const t = HC.h('div', { class: 'rec-tile' }, tiles);
      const n = HC.h('div', { class: 'rec-num' }, t);
      HC.h('div', { class: 'rec-lab' }, t, label);
      return n;
    };
    const tBest = tile('settings where HACE achieves the highest mean HR@10');
    const tMean = tile('average relative gain over Base across settings');
    const tRange = tile('relative gains over Base');
    function setTiles(t) {
      tBest.innerHTML = `${Math.round(nBest * t)}<small> / ${rows.length}</small>`;
      tMean.textContent = HC.fmtPct(gMean * t, 1);
      tRange.innerHTML = `${pct(gMin * t)}<small> to </small>${pct(gMax * t)}`;
    }
    setTiles(0);

    const byKey = {}, off = new Set();
    const legKeys = [BASE, TOP].concat(others);
    legKeys.forEach(k => { byKey[k] = []; });
    const top = HC.h('div', { class: 'hc-top rec-top' }, host);
    const leg = HC.legend(top, legKeys.map(k => ({ key: k, label: k, color: HC.color(k === BASE ? '--m-base-label' : k) })),
      { kind: 'dot', onToggle: (k, on) => {
        on ? off.delete(k) : off.add(k);
        byKey[k].forEach(e => { e.style.display = on ? '' : 'none'; });
        if (!on && active && active.m === k) hideTip();
      } });
    const legBtns = Array.from(leg.querySelectorAll('button'));
    legBtns[0].firstChild.className = 'base';
    legBtns[0].firstChild.style.cssText = 'color:var(--m-base)';
    legBtns[1].firstChild.classList.add('hace');
    legBtns.forEach((b, i) => {
      const k = legKeys[i];
      const dim = on => Object.keys(byKey).forEach(o => byKey[o].forEach(e => e.classList.toggle('rec-dim', on && o !== k)));
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') dim(true); });
      b.addEventListener('pointerleave', () => dim(false));
      b.addEventListener('focus', () => { if (b.matches(':focus-visible')) dim(true); });
      b.addEventListener('blur', () => dim(false));
      b.addEventListener('click', () => { if (!b.matches(':focus-visible')) dim(false); });
    });

    const W = Math.max(300, host.clientWidth);
    const wide = W >= 740;
    tiles.classList.toggle('stack', W < 700);
    const na = archs.length, nd = sets.length;
    const spans = [], cells = [], labels = [];
    let H, cw, R, RT;
    if (wide) {
      const lab = 78, gx = 28, top = 36, rh = 70, gy = 8;
      cw = (W - lab - gx * (nd - 1) - 11) / nd; R = 4.7; RT = 7;
      const bottom = top + na * rh + (na - 1) * gy;
      sets.forEach((s, di) => {
        const x = lab + di * (cw + gx);
        labels.push({ x, y: 14, s, cls: 'rec-head', anchor: 'start' });
        spans.push({ x, y1: top, y2: bottom });
      });
      archs.forEach((a, ai) => labels.push({ x: 0, y: top + ai * (rh + gy) + rh * 0.6 + 4.5, s: a, cls: 'rec-row' }));
      rows.forEach(d => cells.push({ x: lab + d.di * (cw + gx), y: top + d.ai * (rh + gy), h: rh }));
      H = bottom + 56;
    } else {
      const lab = 62, bt = 30, rh = 40, axh = 34, gb = 22;
      cw = W - lab - 11; R = 4.3; RT = 6.4;
      const bh = bt + nd * rh + axh;
      archs.forEach((a, ai) => {
        const y0 = ai * (bh + gb);
        labels.push({ x: 0, y: y0 + 14, s: a, cls: 'rec-block' });
        spans.push({ x: lab, y1: y0 + bt, y2: y0 + bt + nd * rh });
        sets.forEach((s, di) => labels.push({ x: 0, y: y0 + bt + di * rh + rh / 2 + 1, s, cls: 'rec-row' }));
      });
      rows.forEach(d => cells.push({ x: lab, y: d.ai * (bh + gb) + bt + d.di * rh, h: rh }));
      H = na * (bh + gb) - gb + 22;
    }

    const all = [].concat(...rows.map(d => methods.map(m => d.rel[m])));
    const lo = Math.min(0, ...all), hi = Math.max(0, ...all);
    const t0 = HC.niceTicks(lo, hi, 5), step = t0[1] - t0[0];
    const d1 = Math.ceil(hi / step - 1e-9) * step, d0 = lo - (d1 - lo) * 0.035;
    const x = HC.linear(d0, d1, 0, cw);
    let ticks = HC.niceTicks(d0, d1, 5);
    if (x(ticks[1]) - x(ticks[0]) < 34) ticks = HC.niceTicks(d0, d1, 3);    const tickFmt = v => v === 0 ? '0' : (v > 0 ? '+' : '−') + Math.abs(v);

    const gainTxt = gains.map(g => HC.fmtPct(g, 1));
    const aria = `HR@10 relative to Base in ${rows.length} settings (${archs.join(', ')} on ${sets.join(', ')}). ` +
      `HACE achieves the highest mean HR@10 in ${nBest} of ${rows.length} settings. Relative gains over Base range from ${pct(gMin)} to ${pct(gMax)}, averaging ${pct(gMean)} across settings.`;
    const fr = HC.frame(host, W, H, { l: 0, r: 0, t: 0, b: 0 }, aria);
    const svg = fr.svg, G = fr.g;
    svg.setAttribute('role', 'group');
    labels.forEach(l => HC.text(G, l.x, l.y, l.s, { class: l.cls, 'text-anchor': l.anchor || 'start' }));
    const ax = HC.el('g', {}, G);
    spans.forEach(sp => {
      const sg = HC.el('g', { transform: `translate(${sp.x},0)` }, ax);
      ticks.forEach(v => { if (v !== 0) HC.el('line', { class: 'rec-grid', x1: x(v), x2: x(v), y1: sp.y1, y2: sp.y2 }, sg); });
      const a = HC.axisX(sg, x, { y: sp.y2, ticks, fmt: tickFmt });
      a.firstChild.setAttribute('x1', 0); a.firstChild.setAttribute('x2', cw);
      const rule = HC.el('line', { class: 'rec-base', x1: x(0), x2: x(0), y1: sp.y1 - 3, y2: sp.y2 }, sg);
      byKey[BASE].push(rule);
    });
    HC.text(G, wide ? spans[0].x + (spans[nd - 1].x + cw - spans[0].x) / 2 : spans[0].x + cw / 2, H - 6,
      'Relative change in HR@10 from Base (%)', { class: 'hc-label', 'text-anchor': 'middle' });

    const f4 = v => v.toFixed(dec);
    const dots = [];
    rows.forEach((d, ri) => {
      const c = cells[ri], cy = c.y + c.h * (wide ? 0.6 : 0.62), x0 = c.x + x(0);
      const cg = HC.el('g', {}, G);
      const v = d.r.values;
      const label = `${d.r.arch}, ${d.r.dataset}. Base HR@10 ${f4(v[BASE].mean)}. ` +
        methods.map(m => `${m} ${f4(v[m].mean)}, ${HC.fmtPct(d.rel[m], 1)}`).join('. ') + '. Use the arrow keys to step through methods.';
      const hit = HC.el('rect', { class: 'rec-hit', x: c.x - 6, y: c.y + 1, width: cw + 12, height: c.h - 2, tabindex: 0, role: 'img', 'aria-roledescription': 'data cell', 'aria-label': label }, cg);
      if (wide) HC.text(cg, x0 + 5, c.y + 12, `Base ${f4(v[BASE].mean)}`, { class: 'rec-bv' });
      else HC.text(cg, 0, c.y + c.h / 2 + 14, f4(v[BASE].mean), { class: 'rec-bv' });
      HC.el('line', { class: 'rec-track', x1: c.x, x2: c.x + cw, y1: cy, y2: cy }, cg);
      const items = [TOP].concat(others).map(m => ({ m, d, ri, fx: x0 + x(d.rel[m]) - x(0), r: m === TOP ? RT : R, dy: 0, x0 }));
      swarm(items, R * 0.95);
      const cellDots = [];
      items.slice(1).concat(items[0]).forEach(it => {
        it.fy = cy + it.dy;
        it.el = HC.el('circle', { class: 'rec-dot' + (it.m === TOP ? ' top' : ''), cx: x0, cy: it.fy, r: it.r, fill: HC.color(it.m), opacity: 0 }, cg);
        byKey[it.m].push(it.el);
        if (it.m === TOP) {
          it.lab = HC.text(cg, it.fx + it.r + 4, it.fy + 4.5, gainTxt[ri], { class: 'rec-val', opacity: 0 });
          const w = it.lab.getComputedTextLength();
          if (it.fx - c.x + it.r + 4 + w > cw + 8) {
            it.lab.setAttribute('x', Math.min(it.fx, c.x + cw + 8 - w / 2));
            it.lab.setAttribute('y', it.fy - it.r - 7);
            it.lab.setAttribute('text-anchor', 'middle');
          }
          byKey[TOP].push(it.lab);
        }
        dots.push(it); cellDots.push(it);
      });
      cellDots.sort((a, b) => a.fx - b.fx);
      wireCell(hit, cellDots);
    });

    const tip = HC.tooltip(host);
    let active = null;
    function tipHtml(it) {
      const v = it.d.r.values;
      return `<span class="k" style="background:${HC.color(it.m)}"></span><b>${it.m}</b><br>` +
        `${it.d.r.arch} · ${it.d.r.dataset}<br>HR@10 ${f4(v[it.m].mean)} ${HC.sd(v[it.m].sd, dec)}<br>` +
        `Base ${f4(v[BASE].mean)} ${HC.sd(v[BASE].sd, dec)}<br>` +
        `<span class="rel" style="color:${HC.color(it.m === TOP ? TOP : '--ink')}">${HC.fmtPct(it.d.rel[it.m], 1)}</span> relative to Base`;
    }
    function showTip(it, cx, cy) {
      if (active && active !== it) active.el.classList.remove('on');
      active = it; it.el.classList.add('on');
      if (cx === undefined) {
        const b = svg.getBoundingClientRect(), k = b.width / W;
        cx = b.left + it.fx * k; cy = b.top + it.fy * k;
      }
      tip.show(cx, cy, tipHtml(it));
    }
    function hideTip() { if (active) active.el.classList.remove('on'); active = null; tip.hide(); }
    function nearest(e) {
      const b = svg.getBoundingClientRect(), k = W / b.width;
      const px = (e.clientX - b.left) * k, py = (e.clientY - b.top) * k;
      const lim = e.pointerType === 'touch' ? 22 : 14;
      let best = null, bd = lim;
      dots.forEach(it => {
        if (off.has(it.m)) return;
        const dd = Math.hypot(it.fx - px, it.fy - py) - (it.m === TOP ? 2 : 0);
        if (dd < bd) { bd = dd; best = it; }
      });
      return best;
    }
    const onPtr = e => { if (!played) return; const it = nearest(e); it ? showTip(it, e.clientX, e.clientY) : hideTip(); };
    svg.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') onPtr(e); });
    svg.addEventListener('pointerdown', onPtr);
    svg.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') hideTip(); });
    host.addEventListener('pointerdown', e => { if (!svg.contains(e.target)) hideTip(); });

    function wireCell(hit, list) {
      let i = list.length - 1;
      const vis = () => list.filter(it => !off.has(it.m));
      hit.addEventListener('focus', () => {
        if (!hit.matches(':focus-visible')) return;
        const l = vis(); if (!l.length) return;
        i = l.findIndex(it => it.m === TOP); if (i < 0) i = l.length - 1;
        showTip(l[i]);
      });
      hit.addEventListener('mousedown', e => e.preventDefault());      hit.addEventListener('blur', hideTip);
      hit.addEventListener('keydown', e => {
        const l = vis(); if (!l.length) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          i = (Math.min(i, l.length - 1) + (e.key === 'ArrowRight' ? 1 : l.length - 1)) % l.length;
          showTip(l[i]);
        } else if (e.key === 'Escape') hideTip();
      });
    }

    const SLIDE = 850, TOP_AT = 520, TOP_SLIDE = 760, POP = 340, ROW = wide ? 250 : 95, COL = wide ? 45 : 0;
    dots.forEach(it => {
      const order = wide ? it.d.ai * ROW + it.d.di * COL : (it.d.ai * nd + it.d.di) * ROW;
      it.t0 = order + (it.m === TOP ? TOP_AT : 0);
      it.dur = it.m === TOP ? TOP_SLIDE : SLIDE;
    });
    const TOTAL = Math.max(...dots.map(it => it.t0 + it.dur + (it.m === TOP ? POP : 0)));
    function draw(ms) {
      dots.forEach(it => {
        const t = clamp((ms - it.t0) / it.dur);
        it.el.setAttribute('cx', (it.x0 + (it.fx - it.x0) * HC.ease.inOut(t)).toFixed(2));
        it.el.setAttribute('opacity', Math.min(1, t * 4).toFixed(3));
        if (it.m === TOP) {
          const p = clamp((ms - it.t0 - it.dur) / POP);
          it.el.setAttribute('r', (it.r * (1 + 0.42 * Math.sin(Math.PI * p))).toFixed(2));
          it.lab.setAttribute('opacity', p.toFixed(3));
        }
      });
    }

    const replay = HC.REDUCED ? null : HC.h('button', { type: 'button', class: 'hc-btn rec-replay' }, top,
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.1 8.6A5 5 0 1 0 4.6 4.3"/><path d="M4.3 1.6v2.9h2.9"/></svg>Replay');
    let played = false, run = 0;
    function play(instant) {
      const me = ++run;
      hideTip();
      played = true;
      if (instant || HC.REDUCED) { draw(Infinity); setTiles(1); return; }
      draw(0); setTiles(0);
      HC.tween(1300, t => { if (me === run) setTiles(t); }, HC.ease.out);
      HC.tween(TOTAL, t => { if (me === run) draw(t * TOTAL); }, t => t);
    }
    if (replay) replay.addEventListener('click', () => play(false));
    return { play };
  });
})();
