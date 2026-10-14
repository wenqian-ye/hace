(function () {
  'use strict';
  const HC = window.HC;
  const PANEL = { Toys: ['rec', 'SASRec', 'HR@10'], CAFA: ['prot', 'ESM-2 650M', 'NDCG'], WBM: ['mat', 'CHGNet', 'NDCG'] };
  const DELAY_PANEL = 190, DELAY_ROW = 90, DUR = 900;
  let stop = () => {};

  const CSS = `
#viz-ablation svg *{pointer-events:none}
#viz-ablation .ab-hit{pointer-events:all;fill:transparent;outline:none;cursor:default}
#viz-ablation .ab-hit.on,#viz-ablation .ab-hit:focus-visible{fill:var(--hover)}
#viz-ablation .ab-hit:focus-visible{stroke:var(--ink-2);stroke-width:1.5}
#viz-ablation .ab-title{font-size:14px;font-weight:700;fill:var(--c)}
#viz-ablation .ab-sub{fill:var(--fig-sub);font-size:12.5px}
#viz-ablation .ab-rlab{fill:var(--tick);font-size:12.5px;transition:opacity .2s;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
#viz-ablation .ab-grid line{stroke:var(--grid);stroke-width:1;shape-rendering:crispEdges}
#viz-ablation .ab-axis line{stroke:var(--dot);stroke-width:1;shape-rendering:crispEdges}
#viz-ablation .ab-axis text{fill:var(--tick);font-size:12px;font-weight:400;font-variant-numeric:tabular-nums}
#viz-ablation .ab-hace line{stroke:var(--m-hace);stroke-width:2}
#viz-ablation .ab-hace text{fill:var(--m-hace);font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums}
#viz-ablation .ab-row{transition:opacity .2s}
#viz-ablation .ab-stem{stroke:var(--m-base);stroke-width:2;stroke-linecap:round}
#viz-ablation .ab-dot{fill:var(--m-base-label);stroke:var(--paper);stroke-width:1.5}
#viz-ablation .ab-drop{fill:var(--ink-2);font-size:12.5px;font-weight:400;font-variant-numeric:tabular-nums;opacity:0;transition:opacity .35s;paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
#viz-ablation .ab-drop.on{opacity:1}
#viz-ablation .ab-row.top .ab-stem{stroke:var(--c);stroke-width:3}
#viz-ablation .ab-row.top .ab-dot{fill:var(--c)}
#viz-ablation .ab-row.top .ab-drop{fill:var(--c);font-weight:700}
#viz-ablation svg.hovering .ab-row:not(.hot){opacity:.28}
#viz-ablation svg.hovering .ab-rlab:not(.hot){opacity:.45}
#viz-ablation svg.instant *{transition:none!important}
#viz-ablation .ab-replay svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
`;

  HC.register('ablation', function (host, api) {
    stop();
    if (!document.querySelector('style[data-hc="ablation"]')) {
      HC.h('style', { 'data-hc': 'ablation' }, document.head).textContent = CSS;
    }
    const T = (api.data.paper || {}).table3;
    if (!T) return {};
    const full = T.rows.find(r => r.component === 'HACE') || T.rows[0];
    const rows = T.rows.filter(r => r !== full);
    const cols = T.columns.filter(c => full.values[c]);
    const drop = (r, c) => r.values[c].mean - full.values[c].mean;
    const worst = c => rows.reduce((a, r) => (drop(r, c) < drop(a, c) ? r : a), rows[0]);
    const W = Math.max(300, host.clientWidth);
    const wide = W >= 720;
    const aria = 'Leave-one-out ablation studies in three domains. All designed components contribute positively to the framework. ' +
      cols.map(c => `Largest drop on ${c}: ${worst(c).component}, ${HC.fmtSigned(drop(worst(c), c), 4)}.`).join(' ');
    const replay = HC.REDUCED ? null : HC.h('button', { type: 'button', class: 'hc-btn ab-replay' }, HC.h('div', { class: 'hc-top ab-top' }, host),
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.1 8.6A5 5 0 1 0 4.6 4.3"/><path d="M4.3 1.6v2.9h2.9"/></svg>Replay');
    const fr = HC.frame(host, W, 10, { l: 0, r: 0, t: 0, b: 0 }, aria);
    const svg = fr.svg, g = fr.g;
    const tip = HC.tooltip(host);

    let LW = 0;
    const labG = HC.el('g', {}, g);
    if (wide) {
      const labs = rows.map((r, i) => HC.text(labG, 0, 0, r.component, { class: 'ab-rlab', 'data-row': i, 'text-anchor': 'end' }));
      LW = Math.ceil(Math.max.apply(null, labs.map(t => t.getComputedTextLength()))) + 16;
    }
    const G = wide ? 30 : 0, GAPV = 22;
    const PW = wide ? (W - LW - 2 * G) / 3 : W;
    const TY = 14, HH = 24, HL = 22, RH = wide ? 34 : 40, AXH = 22;
    const rowsTop = HH + HL + 4;
    const rowsH = rows.length * RH;
    const axisY = rowsTop + rowsH + 6;
    const panelH = axisY + AXH;
    const H = wide ? panelH : cols.length * panelH + (cols.length - 1) * GAPV;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rowY = i => rowsTop + i * RH + (wide ? RH / 2 : RH - 13);

    if (wide) labG.querySelectorAll('text').forEach((t, i) => { t.setAttribute('x', LW - 16); t.setAttribute('y', rowY(i) + 4.5); });

    const lolli = [];
    const hits = [];
    const panelG = [];
    cols.forEach((c, j) => {
      const [dom, spec, metric] = PANEL[c] || ['rec', '', ''];
      const color = HC.css('--d-' + dom);
      const ox = wide ? LW + j * (PW + G) : 0, oy = wide ? 0 : j * (panelH + GAPV);
      const P = HC.el('g', { transform: `translate(${ox},${oy})`, style: `--c:var(--d-${dom})` }, g);
      panelG.push(P);
      const hitG = HC.el('g', {}, P);

      const t = HC.text(P, 0, TY, c, { class: 'ab-title' });
      HC.text(P, t.getComputedTextLength() + 8, TY, [spec, metric].filter(Boolean).join(' · '), { class: 'ab-sub' });

      const hv = full.values[c].mean;
      const X = HC.linear(worst(c).values[c].mean, hv, 70, PW * 0.92);
      const d0 = X.inv(0), d1 = X.inv(PW);
      const tk = n => HC.niceTicks(d0, d1, n).filter(v => X(v) >= 18 && X(v) <= PW - 18);
      let ticks = tk(wide ? 3 : 4);
      if (ticks.length < 3) ticks = tk(4);
      if (ticks.length < 3) ticks = tk(6);
      const step = ticks.length > 1 ? ticks[1] - ticks[0] : 0.01;
      const dec = Math.max(2, Math.ceil(-Math.log10(step) - 1e-9));
      if (ticks.length > 3 && X(ticks[1]) - X(ticks[0]) < 45) ticks = ticks.filter(v => Math.abs(v / (2 * step) - Math.round(v / (2 * step))) < 1e-6);
      const gridG = HC.el('g', { class: 'ab-grid' }, P);
      const ax = HC.el('g', { class: 'ab-axis' }, P);
      HC.el('line', { x1: 0, x2: PW, y1: axisY, y2: axisY }, ax);
      ticks.forEach(v => {
        HC.el('line', { x1: X(v), x2: X(v), y1: rowsTop - 4, y2: axisY }, gridG);
        HC.el('line', { x1: X(v), x2: X(v), y1: axisY, y2: axisY + 4 }, ax);
        const tl = HC.text(ax, X(v), axisY + 18, v.toFixed(dec), { 'text-anchor': 'middle' });
        const hw = (tl.getComputedTextLength() || 7 * tl.textContent.length) / 2 + 2;
        if (X(v) + hw > PW) { tl.setAttribute('x', PW); tl.setAttribute('text-anchor', 'end'); }
        else if (X(v) - hw < 0) { tl.setAttribute('x', 0); tl.setAttribute('text-anchor', 'start'); }
      });

      const xH = X(hv);
      const hg = HC.el('g', { class: 'ab-hace' }, P);
      HC.el('line', { x1: xH, x2: xH, y1: HH + HL - 4, y2: axisY }, hg);
      const ht = HC.el('text', { x: xH + 4, y: HH + HL - 9, 'text-anchor': 'end' }, hg);
      HC.el('tspan', { 'font-weight': 700 }, ht).textContent = 'HACE';
      HC.el('tspan', {}, ht).textContent = ' ' + HC.fmt(hv, 4);

      const top = worst(c);
      rows.forEach((r, i) => {
        const v = r.values[c], y = rowY(i), xV = X(v.mean), dv = drop(r, c);
        if (!wide) HC.text(P, 0, y - 15, r.component, { class: 'ab-rlab', 'data-row': i });
        const rg = HC.el('g', { class: 'ab-row' + (r === top ? ' top' : ''), 'data-row': i }, P);
        const stem = HC.el('line', { class: 'ab-stem', x1: xH, x2: xH, y1: y, y2: y }, rg);
        const dot = HC.el('circle', { class: 'ab-dot', cx: xH, cy: y, r: r === top ? 6 : 4.8 }, rg);
        const lab = HC.text(rg, xV - 10, y + 4.5, HC.fmtSigned(dv, 4), { class: 'ab-drop', 'text-anchor': 'end' });
        lolli.push({ stem, dot, lab, xH, xV, j, delay: (wide ? j * DELAY_PANEL : 0) + i * DELAY_ROW, on: false });

        const by = wide ? y - RH / 2 : y - RH + 10;
        const hx = wide ? -G / 2 : 0;
        const hit = HC.el('rect', { class: 'ab-hit', x: hx, y: by, width: wide ? Math.min(PW + G, W - ox - hx) : PW, height: RH, rx: 6,
          tabindex: 0, 'aria-label': `${r.component}, ${c} ${metric} ${HC.fmt(v.mean, 4)} ${HC.sd(v.sd, 4)}, ${HC.fmtSigned(dv, 4)} from HACE ${HC.fmt(hv, 4)}` }, hitG);
        const html = `<b>${r.component}</b><br>${c} ${metric} ${HC.fmt(v.mean, 4)} <span style="color:var(--muted)">${HC.sd(v.sd, 4)}</span>` +
          `<br><b style="color:${r === top ? color : 'inherit'}">${HC.fmtSigned(dv, 4)}</b> from HACE ${HC.fmt(hv, 4)}`;
        hits.push({ hit, i, html, x: ox + xV, y: oy + y });
      });
    });

    const mark = i => {
      svg.classList.toggle('hovering', i !== null);
      svg.querySelectorAll('[data-row]').forEach(n => n.classList.toggle('hot', +n.getAttribute('data-row') === i));
    };
    const show = o => {
      hits.forEach(h => h.hit.classList.toggle('on', h === o));
      mark(o.i);
      const b = svg.getBoundingClientRect(), s = b.width / W;
      tip.show(b.left + o.x * s, b.top + o.y * s, o.html);
    };
    const hide = () => { hits.forEach(h => h.hit.classList.remove('on')); mark(null); tip.hide(); };
    hits.forEach(o => {
      o.hit.addEventListener('pointerenter', () => show(o));
      o.hit.addEventListener('pointerdown', () => show(o));
      o.hit.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
      o.hit.addEventListener('focus', () => show(o));
      o.hit.addEventListener('blur', hide);
    });
    if (wide) labG.querySelectorAll('text').forEach((t, i) => {
      const r = HC.el('rect', { class: 'ab-hit', x: 0, y: rowY(i) - RH / 2, width: LW - 6, height: RH, rx: 6 }, labG);
      labG.insertBefore(r, labG.firstChild);
      r.addEventListener('pointerenter', () => mark(i));
      r.addEventListener('pointerleave', () => mark(null));
    });

    const total = (cols.length - 1) * DELAY_PANEL + (rows.length - 1) * DELAY_ROW + DUR;
    function frame(Tms, list) {
      (list || lolli).forEach(o => {
        const k = HC.ease.out(Math.max(0, Math.min(1, (Tms - o.delay) / DUR)));
        const x = o.xH + (o.xV - o.xH) * k;
        o.stem.setAttribute('x2', x.toFixed(2));
        o.dot.setAttribute('cx', x.toFixed(2));
        if ((k > 0.82) !== o.on) { o.on = k > 0.82; o.lab.classList.toggle('on', o.on); }
      });
    }
    frame(0);
    let live = true, io = null, run = 0;
    stop = () => { live = false; if (io) io.disconnect(); };
    const animate = list => {
      const gen = ++run;
      svg.classList.remove('instant');
      list.forEach(o => { o.gen = gen; });
      frame(0, list);
      HC.tween(total, p => live && frame(p * total, list.filter(o => o.gen === gen)), t => t);
    };
    function play(instant) {
      if (io) { io.disconnect(); io = null; }
      if (instant || HC.REDUCED) { run++; svg.classList.add('instant'); frame(total); return; }
      if (wide) { animate(lolli); return; }
      io = new IntersectionObserver((es, o) => es.forEach(e => {
        if (!e.isIntersecting) return;
        o.unobserve(e.target);
        animate(lolli.filter(l => l.j === panelG.indexOf(e.target)));
      }), { threshold: 0.4 });
      panelG.forEach(P => io.observe(P));
    }
    if (replay) replay.addEventListener('click', () => { if (io) { io.disconnect(); io = null; } animate(lolli); });
    return { play, destroy: stop };
  });
})();
