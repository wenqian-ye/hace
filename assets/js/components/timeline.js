(function () {
  'use strict';
  const HC = window.HC;
  const DOM = { rec: 'rec', protein: 'prot', materials: 'mat' };
  const SWEEP = 2600, COUNT = 420;
  const r3 = v => (Math.round(v * 1000 + 1e-6) / 1000).toFixed(3);
  let stop = () => {};

  const CSS = `
#viz-timeline .tl-title{font:700 14.5px/1.3 var(--sans);color:var(--fig-title)}
#viz-timeline .tl-legend{flex:1 1 0;display:flex;flex-wrap:wrap;justify-content:flex-start;align-items:center;gap:4px 6px;min-height:32px;margin:0;font:13px/1.4 var(--sans);color:var(--ink-2)}
#viz-timeline .tl-legend button{display:inline-flex;align-items:center;gap:7px;min-height:28px;padding:0 9px;border:1px solid transparent;border-radius:999px;background:none;font:inherit;color:inherit;white-space:nowrap;cursor:pointer}
#viz-timeline .tl.narrow .tl-title{flex-basis:100%}
#viz-timeline .tl-legend button:hover,#viz-timeline .tl-legend button[aria-pressed="true"]{background:var(--hover)}
#viz-timeline .tl-legend button:focus-visible{outline:2px solid var(--ink-2);outline-offset:2px}
#viz-timeline .tl-legend svg{width:18px;height:10px;flex:none;overflow:visible}
#viz-timeline .tl-replay{margin-left:auto}
#viz-timeline .tl-replay svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#viz-timeline .tl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:var(--gutter,32px);row-gap:22px}
#viz-timeline .tl-panel{position:relative;min-width:0}
#viz-timeline .tl-panel+.tl-panel::before{content:"";position:absolute;left:calc(var(--gutter,32px)/-2);top:0;bottom:0;border-left:1px solid var(--rule)}
#viz-timeline .tl.narrow .tl-grid{grid-template-columns:minmax(0,1fr)}
#viz-timeline .tl.narrow .tl-panel+.tl-panel::before{left:0;right:0;top:-11px;bottom:auto;border-left:0;border-top:1px solid var(--rule)}
@media (pointer:coarse){#viz-timeline .tl-legend button{min-height:34px}#viz-timeline .tl-chip{min-height:32px}}
#viz-timeline .tl-dom{font:700 14px/1.35 var(--sans);color:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#viz-timeline .tl-dom span{font-weight:400;color:var(--fig-sub);margin-left:7px;font-size:12.5px}
#viz-timeline .tl-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:4px 0 0}
#viz-timeline .tl-metric{font:700 13.5px/1.3 var(--sans);color:var(--fig-title)}
#viz-timeline .tl-val{font:700 14px/1.3 var(--sans);color:var(--c);font-variant-numeric:tabular-nums;white-space:nowrap}
#viz-timeline .tl-plot{outline:none;border-radius:8px;margin:6px 0 0}
#viz-timeline .tl-plot:focus-visible{box-shadow:0 0 0 2px var(--c)}
#viz-timeline .tl-plot svg{touch-action:pan-y}
#viz-timeline .tl-axis line{stroke:var(--dot);stroke-width:1;shape-rendering:crispEdges}
#viz-timeline .tl-axis .tl-base{stroke:var(--grid)}
#viz-timeline .tl-axis text{fill:var(--tick);font-size:12px}
#viz-timeline .tl-ref{stroke:var(--grid);stroke-width:1.2;stroke-dasharray:3 4}
#viz-timeline .tl-dot{fill:var(--dot);stroke:color-mix(in srgb,var(--dot) 65%,var(--ink));stroke-width:.9;opacity:0;transform:scale(.2);transform-box:fill-box;transform-origin:center;transition:opacity .2s,transform .35s cubic-bezier(.34,1.56,.64,1)}
#viz-timeline .tl-dot.on{opacity:1;transform:none}
#viz-timeline .tl-line path{fill:none;stroke:var(--c);stroke-width:2.4;stroke-linejoin:round}
#viz-timeline .tl-init{fill:var(--paper);stroke:var(--c);stroke-width:1.7}
#viz-timeline .tl-upd{fill:var(--c);stroke:var(--paper);stroke-width:1.6;opacity:0;transform-box:fill-box;transform-origin:center}
#viz-timeline .tl-upd.on{opacity:1;animation:tl-pop .6s cubic-bezier(.34,1.56,.64,1) both}
#viz-timeline .tl-ulab{fill:var(--c);font-size:12.5px;font-weight:700;opacity:0;transition:opacity .3s .12s;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
#viz-timeline .tl-ulab.on{opacity:1}
#viz-timeline .tl-ph{opacity:0;transition:opacity .45s}
#viz-timeline .tl-ph.on{opacity:1}
#viz-timeline .tl-ph line{stroke:var(--ink-2);stroke-width:1;stroke-dasharray:2 3}
#viz-timeline .tl-ph rect{fill:var(--ink-2)}
#viz-timeline .tl-ph text{fill:var(--paper);font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums}
#viz-timeline .tl-ring{fill:none;stroke:var(--c);stroke-width:1.6;opacity:0;pointer-events:none}
#viz-timeline .tl-ring.on{opacity:1}
#viz-timeline .tl-hit{fill:transparent}
#viz-timeline .tl-chips{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px}
#viz-timeline .tl-chip{display:flex;align-items:center;gap:10px;font:13px/1.35 var(--sans);color:var(--ink-2);opacity:.4;transition:opacity .35s;border-radius:6px;outline:none;cursor:default}
#viz-timeline .tl-chip b{flex:none;min-width:40px;text-align:center;padding:3px 7px;border-radius:5px;background:var(--cs);color:var(--c);font-weight:700;font-variant-numeric:tabular-nums;transition:background .35s,color .35s}
#viz-timeline .tl-chip.on{opacity:1}
#viz-timeline .tl-chip.flash b,#viz-timeline .tl-chip:hover b,#viz-timeline .tl-chip:focus-visible b{background:var(--c);color:var(--paper)}
#viz-timeline .tl-dots,#viz-timeline .tl-line,#viz-timeline .tl-upds{transition:opacity .2s}
#viz-timeline .tl[data-focus="line"] .tl-dots,#viz-timeline .tl[data-focus="line"] .tl-upds,
#viz-timeline .tl[data-focus="dots"] .tl-line,#viz-timeline .tl[data-focus="dots"] .tl-upds,
#viz-timeline .tl[data-focus="upd"] .tl-dots,#viz-timeline .tl[data-focus="upd"] .tl-line{opacity:.15}
#viz-timeline .tl.instant *{transition:none!important;animation:none!important}
@keyframes tl-pop{0%{transform:scale(0)}60%{transform:scale(1.45)}100%{transform:scale(1)}}
`;

  HC.register('timeline', function (host, api) {
    stop();
    if (!document.querySelector('style[data-hc="timeline"]')) {
      HC.h('style', { 'data-hc': 'timeline' }, document.head).textContent = CSS;
    }
    const F = api.data.fig4;
    if (!F || !F.lower) return {};
    const titles = new Map(((api.data.fig3 || {}).panels || []).map(q => [q.id, q]));
    const sec = F.lower_section || {};
    const legendText = sec.legend || [];

    const narrow = host.clientWidth < 780;
    const root = HC.h('div', { class: 'tl' + (narrow ? ' narrow' : '') }, host);
    const tip = HC.tooltip(host);

    const top = HC.h('div', { class: 'hc-top tl-top' }, root);
    HC.h('div', { class: 'tl-title' }, top).textContent = sec.title || '';
    const leg = HC.h('div', { class: 'tl-legend' }, top);
    const glyphs = {
      line: '<line x1="0" y1="5" x2="18" y2="5" style="stroke:var(--fig-title);stroke-width:2.4"/>',
      dots: '<circle cx="9" cy="5" r="2.7" style="fill:var(--dot);stroke:color-mix(in srgb,var(--dot) 65%,var(--ink));stroke-width:.9"/>',
      upd: '<circle cx="9" cy="5" r="4.6" style="fill:var(--fig-title);stroke:var(--paper);stroke-width:1.4"/>',
    };
    let pinned = null;
    const setFocus = k => { if (k) root.dataset.focus = k; else delete root.dataset.focus; };
    ['line', 'dots', 'upd'].forEach((k, i) => {
      if (!legendText[i]) return;
      const b = HC.h('button', { type: 'button', 'aria-pressed': 'false' }, leg, '<svg viewBox="0 0 18 10" aria-hidden="true">' + glyphs[k] + '</svg>');
      HC.h('span', {}, b).textContent = legendText[i];
      b.addEventListener('mouseenter', () => setFocus(k));
      b.addEventListener('mouseleave', () => setFocus(pinned));
      b.addEventListener('click', () => {
        pinned = pinned === k ? null : k;
        leg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b && pinned === k)));
        setFocus(pinned);
      });
    });
    let replay = null;
    if (!HC.REDUCED) {
      replay = HC.h('button', { type: 'button', class: 'hc-btn tl-replay' }, top,
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.1 8.6A5 5 0 1 0 4.6 4.3"/><path d="M4.3 1.6v2.9h2.9"/></svg>Replay');
    }

    const grid = HC.h('div', { class: 'tl-grid' }, root);
    let gen = 0;
    const panels = F.lower.map(p => buildPanel(p));

    function buildPanel(p) {
      const dom = DOM[p.id] || p.id;
      const color = HC.css('--d-' + dom);
      const panel = HC.h('div', { class: 'tl-panel', style: `--c:var(--d-${dom});--cs:var(--d-${dom}-soft)` }, grid);
      const up = (F.upper || {})[p.id];
      const t3 = titles.get(dom) || (up && { title: String(up.title).replace(/^\(\w\)\s*/, ''), subtitle: up.subtitle });
      if (t3) {
        const d = HC.h('div', { class: 'tl-dom' }, panel);
        d.appendChild(document.createTextNode(t3.title));
        HC.h('span', {}, d).textContent = t3.subtitle;
      }
      const head = HC.h('div', { class: 'tl-head' }, panel);
      HC.h('span', { class: 'tl-metric' }, head).textContent = p.metric;
      const val = HC.h('span', { class: 'tl-val' }, head);

      const init = p.init;
      const rounds = p.round_scores.map(([r, v]) => ({ r, v }));
      const upAt = new Map(p.updates.map(u => [u.round, u]));

      const aria = `${t3 ? t3.title + ', ' : ''}${p.metric} per round, best recorded score ${p.init_printed} to ${p.final_printed}` +
        (p.updates.length ? `, selected updates ${p.updates.map(u => u.marker_text + ' ' + u.label).join(', ')}` : '');
      const plot = HC.h('div', { class: 'tl-plot', tabindex: '0', role: 'group',
        'aria-label': aria + '. Use the arrow keys to read each round.' }, panel);

      const pw = Math.max(200, plot.clientWidth);
      const m = { l: 14, r: 14, t: 32, b: 28 };
      const ih = Math.round(Math.max(108, Math.min(150, (pw - m.l - m.r) * 0.4)));
      const fr = HC.frame(plot, pw, ih + m.t + m.b, m, aria);
      fr.svg.setAttribute('aria-hidden', 'true');
      const g = fr.g, iw = fr.iw;
      const X = HC.linear(p.xlim[0], p.xlim[1], 0, iw);
      const vals = rounds.map(d => d.v).concat(init);
      const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1;
      const Y = HC.linear(lo - span * 0.1, hi + span * 0.06, ih, 0);
      rounds.forEach(d => { d.x = X(d.r); d.y = Y(d.v); });

      const ax = HC.el('g', { class: 'tl-axis' }, g);
      HC.el('line', { class: 'tl-base', x1: 0, x2: iw, y1: ih, y2: ih }, ax);
      p.xticks.forEach(t => {
        const isInit = t === 'init', px = X(isInit ? p.init_x : t);
        if (!isInit) HC.el('line', { x1: px, x2: px, y1: ih, y2: ih + 4 }, ax);
        HC.text(ax, px, ih + 18, String(t), { 'text-anchor': 'middle' });
      });
      const x0 = X(p.init_x);
      HC.el('line', { class: 'tl-ref', x1: x0, x2: iw, y1: Y(init), y2: Y(init) }, g);

      const dotsG = HC.el('g', { class: 'tl-dots' }, g);
      rounds.forEach(d => { d.node = HC.el('circle', { class: 'tl-dot', cx: d.x, cy: d.y, r: 2.7 }, dotsG); });
      const steps = [[p.init_x, init]];
      let best = init;
      rounds.forEach(d => { if (d.v > best) { best = d.v; steps.push([d.r, best]); } });
      steps.push([p.xlim[1], best]);
      const clip = HC.clipReveal(fr.defs, iw, ih, false);
      const lineG = HC.el('g', { class: 'tl-line' }, g);
      HC.el('path', { d: HC.stepPath(steps, X, Y), 'clip-path': clip.url }, lineG);
      HC.el('circle', { class: 'tl-init', cx: x0, cy: Y(init), r: 4.2 }, lineG);

      const updG = HC.el('g', { class: 'tl-upds' }, g);
      const ups = p.updates.map(u => {
        const d = rounds.find(q => q.r === u.round) || { r: u.round, v: u.value, x: X(u.round), y: Y(u.value) };
        const end = d.x + 34 > iw;
        return {
          u, d, on: false,
          c: HC.el('circle', { class: 'tl-upd', cx: d.x, cy: d.y, r: 5.2 }, updG),
          t: HC.text(updG, end ? d.x + 3 : d.x, d.y - 10, u.marker_text, { class: 'tl-ulab', 'text-anchor': end ? 'end' : 'middle' }),
        };
      });

      const ph = HC.el('g', { class: 'tl-ph' }, g);
      HC.el('line', { x1: 0, x2: 0, y1: -m.t + 17, y2: ih }, ph);
      const phRect = HC.el('rect', { x: -16, y: -m.t + 1, width: 32, height: 16, rx: 8 }, ph);
      const phText = HC.text(ph, 0, -m.t + 13, 'init', { 'text-anchor': 'middle' });
      const ring = HC.el('circle', { class: 'tl-ring', r: 7, cx: -50, cy: -50 }, g);
      const hit = HC.el('rect', { class: 'tl-hit', x: -m.l, y: -m.t, width: pw, height: ih + m.t + m.b }, g);

      const ul = HC.h('ul', { class: 'tl-chips' }, panel);
      ups.forEach(o => {
        o.chip = HC.h('li', { class: 'tl-chip', tabindex: '0',
          'aria-label': `Round ${o.u.round}, ${o.u.label}, best recorded selection score ${p.metric} ${r3(o.d.v)}` }, ul);
        HC.h('b', {}, o.chip).textContent = o.u.marker_text;
        HC.h('span', {}, o.chip).textContent = o.u.label;
      });

      const px0 = Math.max(x0, X(0) - 6);
      let k = 0, shown = px0, cur = -1, peak = init, from = init, disp = init, t0 = 0;
      const lastRound = p.xlim[1] - 1;
      function setHeader(s) { const t = p.init_printed + ' → ' + s; if (val.textContent !== t) val.textContent = t; }
      function reveal(px, flash) {
        shown = px;
        clip.rect.setAttribute('width', Math.max(0, px + 20));
        while (k < rounds.length && rounds[k].x <= px + 0.5) {
          const d = rounds[k++];
          d.node.classList.add('on');
          if (d.v > peak) { peak = d.v; from = disp; t0 = performance.now(); }
        }
        ups.forEach(o => {
          if (o.on || o.d.x > px + 0.5) return;
          o.on = true;
          [o.c, o.t, o.chip].forEach(n => n.classList.add('on'));
          if (flash) { o.chip.classList.add('flash'); setTimeout(() => o.chip.classList.remove('flash'), 950); }
        });
      }
      function reset() {
        k = 0; peak = from = disp = init; hide();
        rounds.forEach(d => d.node.classList.remove('on'));
        ups.forEach(o => { o.on = false; [o.c, o.t, o.chip].forEach(n => n.classList.remove('on', 'flash')); });
        reveal(px0, false);
        setHeader(p.init_printed);
      }
      function frame(t) {
        const px = px0 + t * (iw - px0);
        reveal(px, true);
        ph.setAttribute('transform', `translate(${px.toFixed(2)},0)`);
        const off = Math.min(0, iw + m.r - px - 16) + Math.max(0, 16 - m.l - px);
        phRect.setAttribute('x', -16 + off);
        phText.setAttribute('x', off);
        const r = Math.floor(X.inv(px) + 1e-6);
        phText.textContent = r < 0 ? 'init' : String(Math.min(r, lastRound));
        const q = Math.min(1, (performance.now() - t0) / COUNT);
        disp = q < 1 ? from + (peak - from) * HC.ease.out(q) : peak;
        setHeader(disp === init ? p.init_printed : r3(disp));
      }
      function done() {
        reveal(iw + 1, false);
        ph.classList.remove('on');
        setHeader(p.final_printed);
      }

      const targets = [{ init: true, r: null, v: init, x: x0, y: Y(init) }].concat(rounds);
      const html = T => {
        let s = `<b>${T.init ? 'init' : 'Round ' + T.r}</b><br>${p.metric} ${T.init ? p.init_printed : r3(T.v)}`;
        const u = !T.init && upAt.get(T.r);
        if (u) s += `<br><span style="color:${color};font-weight:600">${u.marker_text}</span> ${u.label}`;
        return s;
      };
      function show(i) {
        const T = targets[i];
        if (!T) return;
        cur = i;
        ring.setAttribute('cx', T.x); ring.setAttribute('cy', T.y); ring.classList.add('on');
        const b = fr.svg.getBoundingClientRect(), s = b.width / pw;
        tip.show(b.left + (m.l + T.x) * s, b.top + (m.t + T.y) * s, html(T));
      }
      function hide() { ring.classList.remove('on'); tip.hide(); }
      const lastShown = () => { let j = 0; targets.forEach((T, i) => { if (T.x <= shown + 0.5) j = i; }); return j; };
      function pick(e) {
        const b = fr.svg.getBoundingClientRect(), sx = (e.clientX - b.left) * pw / b.width - m.l;
        let j = -1, bd = Infinity;
        targets.forEach((T, i) => { const d = Math.abs(T.x - sx); if (T.x <= shown + 0.5 && d < bd) { bd = d; j = i; } });
        if (j >= 0) show(j);
      }
      hit.addEventListener('pointermove', pick);
      hit.addEventListener('pointerdown', pick);
      hit.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && document.activeElement !== plot) hide(); });
      plot.addEventListener('focus', () => { if (cur < 0) cur = Math.max(0, ups.length ? targets.indexOf(ups[ups.length - 1].d) : 0); if (targets[cur].x <= shown + 0.5) show(cur); });
      plot.addEventListener('blur', hide);
      plot.addEventListener('keydown', e => {
        const last = lastShown();
        let j = cur < 0 ? 0 : cur;
        if (e.key === 'ArrowRight') j = Math.min(last, j + 1);
        else if (e.key === 'ArrowLeft') j = Math.max(0, j - 1);
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = last;
        else if (e.key === 'Escape') { hide(); return; }
        else return;
        e.preventDefault();
        show(j);
      });
      ups.forEach(o => {
        const i = targets.indexOf(o.d);
        const on = () => { if (o.on && i >= 0) show(i); };
        o.chip.addEventListener('mouseenter', on);
        o.chip.addEventListener('focus', on);
        o.chip.addEventListener('mouseleave', hide);
        o.chip.addEventListener('blur', hide);
      });

      reset();
      return { reset, frame, done, ph, node: panel };
    }

    async function sweep(P, my) {
      if (my !== gen) return;
      P.ph.classList.add('on');
      await HC.tween(SWEEP, t => { if (my === gen) P.frame(t); }, HC.ease.inOut);
      if (my === gen) P.done();
    }
    let io = null;
    stop = () => { gen++; if (io) io.disconnect(); };
    function play(instant) {
      stop();
      const my = gen;
      root.classList.add('instant');
      if (instant || HC.REDUCED) { panels.forEach(P => P.done()); return; }
      panels.forEach(P => P.reset());
      void root.offsetWidth;
      root.classList.remove('instant');
      if (!narrow) { panels.forEach(P => sweep(P, my)); return; }
      io = new IntersectionObserver((es, o) => es.forEach(e => {
        if (!e.isIntersecting) return;
        o.unobserve(e.target);
        sweep(panels.find(P => P.node === e.target), my);
      }), { threshold: 0.5 });
      panels.forEach(P => io.observe(P.node));
    }
    if (replay) replay.addEventListener('click', () => play(false));
    return { play, destroy: stop };
  });
})();
