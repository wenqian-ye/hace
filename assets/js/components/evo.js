(function () {
  'use strict';
  const HC = window.HC;
  const SWEEP = 2600, STAGGER = 150, LABEL_DELAY = 90;
  const PX = 2;
  const at = (pts, r) => { let y = pts[0][1]; for (const p of pts) { if (p[0] > r) break; y = p[1]; } return y; };
  const last = s => s.points[s.points.length - 1][1];

  const CSS = `
#viz-evo .evo-grid{display:grid;column-gap:var(--gutter);row-gap:22px}
#viz-evo .evo-cell{min-width:0}
#viz-evo .evo-cell svg{display:block;width:100%;height:auto;overflow:visible;touch-action:pan-y}
#viz-evo svg *{pointer-events:none}
#viz-evo .evo-hit{pointer-events:all;fill:transparent;stroke:none;outline:none;cursor:crosshair}
#viz-evo .evo-hit:focus-visible{stroke:var(--ink-2);stroke-width:1;stroke-dasharray:2 3}
#viz-evo .evo-s{fill:none;stroke-linejoin:round;stroke-linecap:round;transition:opacity .2s}
#viz-evo .evo-frozen{fill:none;stroke:var(--m-base)}
#viz-evo .evo-flab{fill:var(--m-base-label);font-size:11.5px}
#viz-evo .evo-end{fill:var(--m-hace);font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round;opacity:0;transform:translateX(-6px);transition:opacity .5s,transform .5s}
#viz-evo .evo-end.on{opacity:1;transform:none}
#viz-evo svg .dim{opacity:.12!important}
#viz-evo svg .off{opacity:0!important}
#viz-evo .evo-end:not(.on){opacity:0!important}
#viz-evo .evo-cur{opacity:0;transition:opacity .12s}
#viz-evo .evo-cur.on{opacity:1}
#viz-evo .evo-cur line{stroke:var(--ink-2);stroke-width:1;stroke-dasharray:3 3}
#viz-evo .evo-cur circle{stroke:var(--paper);stroke-width:1.5}
#viz-evo .evo-dom{font:700 14px/1.35 var(--sans);color:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 10px}
#viz-evo .evo-dom span{font-weight:400;color:var(--fig-sub);margin-left:7px;font-size:12.5px}
#viz-evo .evo-top .hc-legend{flex:1 1 0;min-width:0}
#viz-evo .hc-legend button[data-m="HACE"] span:last-child{font-weight:700;color:var(--m-hace)}
#viz-evo .evo-replay svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#viz-evo .hc-tip{min-width:170px}
#viz-evo .evo-tip-h{font-weight:650;color:var(--ink)}
#viz-evo .evo-tip-s{color:var(--fig-sub);font-size:12px;margin-bottom:4px}
#viz-evo .evo-row{display:grid;grid-template-columns:14px 1fr;align-items:center;column-gap:8px;font-variant-numeric:tabular-nums}
#viz-evo .evo-row i{display:block;width:13px;height:2px;border-radius:1px}
#viz-evo .evo-row.h{color:var(--m-hace);font-weight:700}
#viz-evo .evo-row.h i{height:3.5px}
#viz-evo .instant *{transition:none!important}
`;

  HC.register('evo', function (host, api) {
    if (!document.querySelector('style[data-hc="evo"]')) {
      HC.h('style', { 'data-hc': 'evo' }, document.head).textContent = CSS;
    }
    const F = api.data.fig3;
    if (!F || !F.panels || !F.panels.length) return {};
    const hidden = api.hidden || (api.hidden = new Set());
    const order = F.legend_order, fz = F.frozen_style;
    const W = Math.max(300, host.clientWidth);
    const cols = W >= 720 ? 3 : 1, GAP = cols > 1 ? parseFloat(HC.css('--gutter')) || 32 : 0;
    const PW = cols > 1 ? (W - GAP * 2) / 3 : W;
    const m = { l: 68, r: 0, t: 4, b: 48 }, ih = cols > 1 ? 220 : 210, PH = m.t + ih + m.b;
    const root = HC.h('div', { class: 'evo' }, host);
    const top = HC.h('div', { class: 'hc-top evo-top' }, root);
    const grid = HC.h('div', { class: 'evo-grid', style: { gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` } }, root);
    const tip = HC.tooltip(host);
    let owner = null;

    function buildPanel(p) {
      const series = p.series;
      const xmax = Math.max(...series.map(s => s.points[s.points.length - 1][0]));
      const finals = series.map(s => [s.method, last(s)]).sort((a, b) => b[1] - a[1]);
      const aria = `${p.title}, ${p.subtitle}. ${p.ylabel}, a selection score, by ${p.xlabel.toLowerCase()}, 0 to ${xmax}, ` +
        `above a dashed line for the ${fz.label.toLowerCase()}. Final order: ${finals.map(f => f[0]).join(', ')}.`;
      const cell = HC.h('div', { class: 'evo-cell', style: `--c:var(--d-${p.id})` }, grid);
      const dom = HC.h('div', { class: 'evo-dom' }, cell);
      dom.appendChild(document.createTextNode(p.title));
      HC.h('span', {}, dom).textContent = p.subtitle;
      const fr = HC.frame(cell, PW, PH, m, aria);
      const g = fr.g, iw = fr.iw;

      const x = HC.linear(p.xlim[0], p.xlim[1], 0, iw), y = HC.linear(p.ylim[0], p.ylim[1], ih, 0);
      const d = Math.max(...p.yticks.map(v => (String(v).split('.')[1] || '').length));
      HC.axisY(g, y, { ticks: p.yticks, fmt: v => v.toFixed(d), size: 4, grid: [0, iw], label: p.ylabel, labelDx: -56 });
      HC.axisX(g, x, { y: ih, ticks: p.xticks, fmt: v => String(v), size: 4, label: p.xlabel, labelDy: 38 });

      HC.el('line', { class: 'evo-frozen', x1: 0, x2: iw, y1: y(p.frozen), y2: y(p.frozen), 'stroke-width': fz.width * PX,
        'stroke-dasharray': fz.dash.map(v => (v * PX).toFixed(1)).join(' ') }, g);
      HC.text(g, x(xmax), y(p.frozen) - 4, fz.label, { class: 'evo-flab', 'text-anchor': 'end' });

      const rv = HC.clipReveal(fr.defs, iw, ih);
      const sg = HC.el('g', { 'clip-path': rv.url }, g);
      series.forEach(s => HC.el('path', { class: 'evo-s', 'data-m': s.method, d: HC.linePath(s.points, x, y),
        stroke: HC.color(s.method), 'stroke-width': (s.width * PX).toFixed(2) }, sg));
      const H = series.find(s => s.method === 'HACE') || series[series.length - 1];
      const end = HC.text(g, x(xmax), y(last(H)) - 7, H.method, { class: 'evo-end', 'data-m': H.method, 'text-anchor': 'end' });

      const cur = HC.el('g', { class: 'evo-cur' }, g);
      const cl = HC.el('line', { y1: 0, y2: ih }, cur);
      const dots = series.map(s => HC.el('circle', { r: s.method === 'HACE' ? 4 : 3, fill: HC.color(s.method), 'data-m': s.method }, cur));
      const hit = HC.el('rect', { class: 'evo-hit', x: 0, y: 0, width: iw, height: ih, tabindex: 0, role: 'slider', 'aria-valuemin': 0, 'aria-valuemax': xmax, 'aria-orientation': 'horizontal',
        'aria-label': `${p.title}: methods ordered by ${p.ylabel} per round, arrow keys change the round` }, g);
      wire(p, { x, y, iw, xmax, cur, cl, dots, hit });
      return { svg: fr.svg, rv, end };
    }

    function wire(p, o) {
      const { x, y, iw, xmax, cur, cl, dots, hit } = o;
      let r = null, viaPtr = false;
      const show = (round, clientY) => {
        r = Math.max(0, Math.min(xmax, round));
        const px = x(r);
        cl.setAttribute('x1', px); cl.setAttribute('x2', px);
        p.series.forEach((s, k) => {
          dots[k].setAttribute('cx', px); dots[k].setAttribute('cy', y(at(s.points, r)).toFixed(2));
          dots[k].style.display = hidden.has(s.method) ? 'none' : '';
        });
        cur.classList.add('on');
        const rows = order.map(k => p.series.find(s => s.method === k)).filter(s => s && !hidden.has(s.method))
          .map(s => [s.method, at(s.points, r)]).sort((a, b) => b[1] - a[1]);
        const html = `<div class="evo-tip-h">Round ${r}</div><div class="evo-tip-s">Selection score, highest first</div>` + rows.map(([k]) =>
          `<div class="evo-row${k === 'HACE' ? ' h' : ''}"><i style="background:${HC.color(k)}"></i><span>${k}</span></div>`).join('');
        hit.setAttribute('aria-valuenow', r);
        hit.setAttribute('aria-valuetext', `Round ${r}, highest first: ` + rows.map(q => q[0]).join(', '));
        const b = hit.getBoundingClientRect(), s = b.width / iw;
        owner = hit;
        tip.show(b.left + px * s, clientY === undefined ? b.top + 12 : clientY, html);
      };
      const hide = () => { cur.classList.remove('on'); if (owner === hit) { owner = null; tip.hide(); } };
      const fromEvent = e => {
        const b = hit.getBoundingClientRect();
        show(Math.round(x.inv((e.clientX - b.left) * iw / b.width)), e.clientY);
      };
      hit.addEventListener('pointerdown', e => { viaPtr = true; fromEvent(e); });
      hit.addEventListener('pointermove', fromEvent);
      hit.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
      hit.addEventListener('focus', () => { if (!viaPtr) show(r === null ? xmax : r); viaPtr = false; });
      hit.addEventListener('blur', () => { viaPtr = false; hide(); });
      hit.addEventListener('keydown', e => {
        const base = r === null ? xmax : r;
        const next = { ArrowLeft: base - 1, ArrowRight: base + 1, Home: 0, End: xmax }[e.key];
        if (next === undefined) { if (e.key === 'Escape') hide(); return; }
        e.preventDefault();
        show(next);
      });
    }

    const panels = F.panels.map(buildPanel);

    const marks = () => root.querySelectorAll('svg [data-m]');
    const applyHidden = () => marks().forEach(n => n.classList.toggle('off', hidden.has(n.getAttribute('data-m'))));
    const fade = k => { if (hidden.has(k)) k = null; marks().forEach(n => n.classList.toggle('dim', !!k && n.getAttribute('data-m') !== k)); };
    const box = HC.legend(top, order.map(k => ({ key: k, label: k, color: HC.color(k), on: !hidden.has(k) })), {
      onToggle: (k, on) => { if (on) hidden.delete(k); else hidden.add(k); applyHidden(); fade(null); },
    });
    Array.from(box.children).forEach((b, i) => {
      const k = order[i];
      b.setAttribute('data-m', k);
      if (k === 'HACE') b.firstChild.classList.add('hace');
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') fade(k); });
      b.addEventListener('focus', () => { if (b.matches(':focus-visible')) fade(k); });
      b.addEventListener('pointerleave', () => fade(null));
      b.addEventListener('blur', () => fade(null));
    });
    applyHidden();
    let replay = null;
    if (!HC.REDUCED) {
      replay = HC.h('button', { type: 'button', class: 'hc-btn evo-replay' }, top,
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.1 8.6A5 5 0 1 0 4.6 4.3"/><path d="M4.3 1.6v2.9h2.9"/></svg>Replay');
    }
    let run = 0, watchers = [];
    const stopWatch = () => { watchers.forEach(io => io.disconnect()); watchers = []; };
    function watch(node, fn) {
      if (!('IntersectionObserver' in window)) { fn(); return; }
      const io = new IntersectionObserver(es => es.forEach(e => {
        const span = Math.min(e.boundingClientRect.height, e.rootBounds ? e.rootBounds.height : innerHeight) || 1;
        if (e.isIntersecting && e.intersectionRect.height >= 0.35 * span - 1) { io.disconnect(); fn(); }
      }), { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
      io.observe(node);
      watchers.push(io);
    }
    async function sweep(P, gen, delay) {
      await HC.wait(delay);
      if (gen !== run) return;
      await HC.tween(SWEEP, t => { if (gen === run) P.rv.set(t); }, HC.ease.inOut);
      if (gen !== run) return;
      await HC.wait(LABEL_DELAY);
      if (gen === run) P.end.classList.add('on');
    }
    function play(instant) {
      const gen = ++run;
      stopWatch();
      if (instant || HC.REDUCED) {
        root.classList.add('instant');
        panels.forEach(P => { P.rv.set(1); P.end.classList.add('on'); });
        requestAnimationFrame(() => requestAnimationFrame(() => { if (gen === run) root.classList.remove('instant'); }));
        return;
      }
      root.classList.remove('instant');
      panels.forEach(P => { P.end.classList.remove('on'); P.rv.set(0); });
      if (cols > 1) panels.forEach((P, i) => sweep(P, gen, i * STAGGER));
      else panels.forEach(P => watch(P.svg, () => sweep(P, gen, 0)));
    }
    if (replay) replay.addEventListener('click', () => play(false));
    return { play, destroy() { run++; stopWatch(); } };
  });
})();
