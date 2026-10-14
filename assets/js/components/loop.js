(function () {
  'use strict';
  const HC = window.HC;
  const VB = [5.5, 5.5, 1051, 579];
  const STEP_MS = [2000, 2800, 2300, 2300];
  const STEPS = [
    { key: 'harness', name: 'Harness', full: 'Harness optimization' },
    { key: 'specialist', name: 'Specialist', full: 'Specialist optimization' },
    { key: 'selection', name: 'Joint selection', full: 'Joint selection' },
    { key: 'agent', name: 'Agent', full: 'Agent optimization' },
  ];
  const accepts = r => r % 2 === 1;
  const VARY = [[0], [2, 3], [1], [4, 0], [3], [1, 2]];

  const CSS = `
#viz-loop{--lp-s:var(--specialist);--lp-h:var(--harness);--lp-a:var(--agent);--lp-p:var(--selection)}
#viz-loop .lp-bar{position:sticky;left:0;box-sizing:border-box;font:13px/1.3 var(--sans)}
#viz-loop .lp-end{margin-left:auto;display:flex;align-items:center;gap:14px}
#viz-loop .lp-pp[hidden]{display:none}
#viz-loop .lp-pp svg{fill:currentColor}
#viz-loop .lp-chips{display:flex;flex-wrap:wrap;gap:6px}
#viz-loop .lp-chips button{padding:0 13px 0 7px;transition:background .3s,border-color .3s,color .3s}
#viz-loop .lp-chips button i{font-style:normal;display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:var(--c);color:var(--paper);font-size:11.5px}
#viz-loop .lp-chips button[aria-pressed="true"]{border-color:var(--c);color:var(--c);background:color-mix(in srgb,var(--c) 8%,var(--paper))}
#viz-loop .lp-chips button:focus-visible,#viz-loop .lp-pp:focus-visible{outline:2px solid var(--c,var(--ink-2));outline-offset:2px}
#fig-loop{display:flex;flex-direction:column}
#fig-loop .swipe-hint{order:-1;margin:0 0 8px}
#viz-loop .lp-round{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
#viz-loop .lp-round b{color:var(--ink);font-weight:650}
#viz-loop > svg{display:block;user-select:none;-webkit-user-select:none;font-size:13.5px;fill:var(--ink-2)}
#viz-loop > svg{min-width:906px}
#viz-loop .lp-m{font-family:var(--serif)}
#viz-loop .lp-b{font-weight:700}
#viz-loop .lp-c{fill:var(--c)}
#viz-loop .lp-mut{fill:var(--muted)}
#viz-loop .lp-panel{transition:filter .55s ease;cursor:pointer}
#viz-loop .lp-panel.dim{filter:saturate(.3)}
#viz-loop .lp-panel.dim .lp-pbg{fill-opacity:.4}
#viz-loop .lp-pbg{fill:var(--cp);stroke:var(--cl);stroke-width:1;transition:stroke .4s,filter .55s}
#viz-loop .lp-panel.on .lp-pbg{stroke:var(--c);stroke-width:1.4;filter:drop-shadow(0 6px 14px color-mix(in srgb,var(--ink) 11%,transparent))}
#viz-loop .lp-title{fill:var(--c);font-size:16.5px;font-weight:700}
#viz-loop .lp-num{fill:none;stroke:var(--c);stroke-width:1.4}
#viz-loop .lp-panel.on .lp-num{fill:var(--c)}
#viz-loop .lp-numt{fill:var(--c);font-size:13.5px;font-weight:700}
#viz-loop .lp-panel.on .lp-numt{fill:var(--paper)}
#viz-loop .lp-ar{fill:none;stroke-width:1.4;stroke-linejoin:round}
#viz-loop .lp-dash{stroke-dasharray:4 3}
#viz-loop .s-s{stroke:var(--lp-s)} #viz-loop .s-h{stroke:var(--lp-h)} #viz-loop .s-a{stroke:var(--lp-a)} #viz-loop .s-p{stroke:var(--lp-p)} #viz-loop .s-r{stroke:var(--reject)} #viz-loop .s-n{stroke:var(--faint)}
#viz-loop .lp-box{fill:var(--paper);stroke:var(--c);stroke-width:1.2}
#viz-loop .lp-soft{fill:var(--cs);stroke:var(--c);stroke-width:1;stroke-opacity:.55}
#viz-loop .lp-node{transform-box:fill-box;transform-origin:center}
#viz-loop .lp-node.hot{animation:lp-pop .7s cubic-bezier(.34,1.56,.64,1)}
#viz-loop .lp-node.hot .lp-box,#viz-loop .lp-node.hot .lp-soft{stroke-width:2.2;stroke-opacity:1}
@keyframes lp-pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
#viz-loop .lp-row rect{fill:var(--specialist-soft);transition:fill .35s,stroke .35s}
#viz-loop .lp-row.cur rect{fill:var(--agent-soft)}
#viz-loop .lp-row text{fill:var(--lp-s);font-size:13.5px}
#viz-loop .lp-row.ag text{fill:var(--lp-a)}
#viz-loop .lp-row .lp-vary{opacity:0;transition:opacity .3s;fill:var(--lp-h);font-size:13.5px;font-weight:700}
#viz-loop .lp-row.vary rect{fill:var(--harness-soft);stroke:var(--lp-h);stroke-width:1.2}
#viz-loop .lp-row.vary .lp-vary{opacity:1}
#viz-loop .lp-icon{fill:none;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
#viz-loop .lp-dec .lp-acc,#viz-loop .lp-dec .lp-rej{transition:opacity .45s}
#viz-loop .lp-dec.accept .lp-rej,#viz-loop .lp-dec.reject .lp-acc{opacity:.3}
#viz-loop .lp-dec.accept .lp-acc .lp-box{stroke-width:2.2}
#viz-loop .lp-dec.reject .lp-rej .lp-box{stroke-width:2.2}
#viz-loop .lp-x{opacity:0;transition:opacity .35s}
#viz-loop .lp-dec.reject .lp-x{opacity:1}
#viz-loop .lp-tr{opacity:0;transition:opacity .4s}
#viz-loop .lp-tr.on{opacity:1}
#viz-loop .lp-tile{transition:transform .7s cubic-bezier(.45,0,.2,1)}
#viz-loop .lp-tr .lp-res{opacity:0;transition:opacity .4s}
#viz-loop .lp-tr.res .lp-res{opacity:1}
#viz-loop .lp-keep rect{fill:var(--agent-soft);opacity:0;transition:opacity .4s}
#viz-loop .lp-keep.on rect{opacity:1}
#viz-loop .lp-tok{pointer-events:none}
#viz-loop .lp-trace{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
#viz-loop .lp-tl-in{transition:transform .9s cubic-bezier(.45,0,.2,1)}
#viz-loop .lp-ent{transition:opacity .6s}
#viz-loop .lp-ent.new{opacity:0}
#viz-loop .lp-tlbox{fill:var(--paper);stroke-width:1.2}
#viz-loop .lp-ph{fill:none;stroke:var(--faint);stroke-width:1;stroke-dasharray:3 3}
#viz-loop .lp-cur{fill:var(--hover);stroke:var(--dot);stroke-width:1}
#viz-loop .lp-halo{paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){#viz-loop .lp-panel,#viz-loop .lp-tl-in,#viz-loop .lp-tile,#viz-loop .lp-ent{transition:none}#viz-loop .lp-node.hot{animation:none}}
#method ol.steps li{transition:background-color .45s,box-shadow .45s,border-color .45s}
#method ol.steps li.active{border-color:color-mix(in srgb,var(--c) 45%,var(--rule));box-shadow:inset 4px 0 0 var(--c);background:color-mix(in srgb,var(--c) 6%,var(--paper))}
`;
  function injectCSS() {
    if (document.querySelector('style[data-hc="loop"]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-hc', 'loop');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const el = (tag, a, p) => HC.el(tag, a, p);
  const txt = (g, x, y, s, a) => HC.text(g, x, y, s, a);

  function mt(g, x, y, src, a) {
    a = Object.assign({ 'font-size': 15 }, a || {});
    const fs = +a['font-size'];
    const t = el('text', Object.assign({ x, y }, a, { class: 'lp-m ' + (a.class || '') }), g);
    const segs = [];
    for (let i = 0; i < src.length;) {
      const c = src[i];
      if (c === '_' || c === '^') {
        let body;
        if (src[i + 1] === '{') { const j = src.indexOf('}', i); body = src.slice(i + 2, j); i = j + 1; }
        else { body = src[i + 1]; i += 2; }
        const roman = body[0] === '=';
        segs.push({ s: roman ? body.slice(1) : body, lv: c === '_' ? -1 : 1, roman });
      } else {
        let j = i; while (j < src.length && src[j] !== '_' && src[j] !== '^') j++;
        segs.push({ s: src.slice(i, j), lv: 0 }); i = j;
      }
    }
    let cur = 0, prev = null, owe = 0;
    const len = list => list.reduce((a, n) => a + (n.getComputedTextLength ? n.getComputedTextLength() : 0), 0);
    segs.forEach(sg => {
      const runs = [];
      for (const ch of sg.s) {
        if (ch === BAR && runs.length) { const r = runs[runs.length - 1]; const c = r.s.slice(-1); r.s = r.s.slice(0, -1); if (!r.s) runs.pop(); runs.push({ s: c, it: r.it, bar: true }); continue; }
        const join = ch === PR;
        const it = join && runs.length ? runs[runs.length - 1].it : (!sg.roman && /[A-Za-z\u03b1-\u03c9]/.test(ch));
        const lr = runs[runs.length - 1];
        if (lr && !lr.bar && lr.it === it) lr.s += ch;
        else runs.push({ s: ch, it });
      }
      const target = sg.lv === -1 ? 0.3 : sg.lv === 1 ? -0.42 : 0;
      const stack = prev && sg.lv && prev.lv === -sg.lv;
      const made = [];
      runs.forEach((r, k) => {
        const ts = el('tspan', {}, t);
        if (sg.lv) ts.setAttribute('font-size', Math.max(13.5, fs * 0.8).toFixed(1));
        if (k === 0 && target !== cur) { ts.setAttribute('dy', ((target - cur) * fs).toFixed(1)); cur = target; }
        if (k === 0 && stack) ts.setAttribute('dx', (-prev.w).toFixed(1));
        else if (k === 0 && owe > 0) ts.setAttribute('dx', owe.toFixed(1));
        if (r.it) ts.setAttribute('font-style', 'italic');
        if (r.bar) ts.setAttribute('text-decoration', 'overline');
        ts.textContent = r.s;
        made.push(ts);
      });
      const w = len(made);
      owe = stack ? Math.max(0, prev.w - w) : 0;
      prev = sg.lv && !stack ? { lv: sg.lv, w } : null;
    });
    if (cur) { const ts = el('tspan', { dy: (-cur * fs).toFixed(1) }, t); ts.textContent = '\u200b'; }
    return t;
  }
  function arrow(g, d, key, o) {
    o = o || {};
    return el('path', {
      d, class: `lp-ar s-${key}${o.dash ? ' lp-dash' : ''}`,
      'marker-end': o.noHead ? null : `url(#${o.ids[key]})`,
    }, g);
  }
  function markers(defs) {
    const ids = {}, col = { s: '--specialist', h: '--harness', a: '--agent', p: '--selection', r: '--reject', n: '--faint' };
    for (const k in col) {
      ids[k] = 'lpm-' + k + HC.uid();
      const m = el('marker', { id: ids[k], viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }, defs);
      el('path', { d: 'M0,0.6 L8,4 L0,7.4 Z', fill: HC.css(col[k]) }, m);
    }
    return ids;
  }
  function cards(g, x, y, w, h, n, cls, dashed) {
    const s = el('g', {}, g);
    for (let i = n - 1; i >= 0; i--) {
      el('rect', { x: x + i * 4, y: y - i * 4, width: w, height: h, rx: 3, class: cls, 'stroke-dasharray': dashed ? '3 2' : null }, s);
    }
    return s;
  }
  function robot(g, cx, cy, r, src, fill) {
    const s = el('g', {}, g);
    el('circle', { cx, cy, r, fill }, s);
    el('image', { href: src, x: cx - r, y: cy - r * 1.04, width: r * 2, height: r * 2 }, s);
    return s;
  }
  function doc(g, x, y, w, h, stroke, fill) {
    const s = el('g', { class: 'lp-icon', style: `color:${stroke}` }, g);
    el('rect', { x, y, width: w, height: h, rx: 2, fill: fill || 'none' }, s);
    for (let i = 0; i < 3; i++) el('line', { x1: x + 3, x2: x + w - 3 - (i === 2 ? w * 0.3 : 0), y1: y + 4 + i * (h - 6) / 3, y2: y + 4 + i * (h - 6) / 3 }, s);
    return s;
  }
  const TILE = [['--specialist', '--specialist-soft'], ['--harness', '--harness-soft'], ['--selection', '--selection-soft'], ['--agent', '--agent-line']];
  function tile(g, x, y, s, kind) {
    const c = HC.css(TILE[kind][0]);
    const t = el('g', { class: 'lp-tile' }, g);
    el('rect', { x, y, width: s, height: s, rx: 3, fill: HC.css(TILE[kind][1]), stroke: c, 'stroke-width': kind === 3 ? 1.5 : 1 }, t);
    const ic = el('g', { class: 'lp-icon', style: `color:${c}`, transform: `translate(${x + s / 2},${y + s / 2})` }, t);
    const q = s * 0.26;
    if (kind === 0) el('path', { d: `M${-q},${q * 0.8} L${-q * 0.3},${-q * 0.4} L${q * 0.15},${q * 0.25} L${q * 0.5},${-q * 0.1} L${q},${q * 0.8} Z` }, ic);
    if (kind === 1) el('path', { d: `M${q * 0.3},${-q} A${q},${q} 0 1 0 ${q},${q * 0.35} A${q * 0.8},${q * 0.8} 0 0 1 ${q * 0.3},${-q} Z` }, ic);
    if (kind === 2) { el('circle', { r: q }, ic); el('line', { x1: -q * 0.7, y1: q * 0.7, x2: q * 0.7, y2: -q * 0.7 }, ic); }
    if (kind === 3) {
      el('circle', { r: q * 0.45 }, ic);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; el('line', { x1: Math.cos(a) * q * 0.7, y1: Math.sin(a) * q * 0.7, x2: Math.cos(a) * q * 1.05, y2: Math.sin(a) * q * 1.05 }, ic); }
    }
    return t;
  }
  function numBadge(g, x, y, n) {
    el('circle', { cx: x, cy: y, r: 10, class: 'lp-num' }, g);
    txt(g, x, y + 4.4, String(n), { 'text-anchor': 'middle', class: 'lp-numt' });
  }
  function poly(pts) {
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    return {
      L, pts, d: pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(''),
      at(f) {
        let s = Math.max(0, Math.min(1, f)) * L;
        for (let i = 0; i < seg.length; i++) {
          if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? Math.min(1, s / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; }
          s -= seg[i];
        }
        return pts[pts.length - 1];
      },
    };
  }
  function pts(d) {
    let x = 0, y = 0;
    return d.match(/[MLHV][^MLHV]*/g).map(c => {
      const n = c.slice(1).trim().split(/[\s,]+/).map(Number);
      if (c[0] === 'H') x = n[0]; else if (c[0] === 'V') y = n[0]; else { x = n[0]; y = n[1]; }
      return [x, y];
    });
  }
  function route(els, gaps) {
    const segs = els.map(e => poly(Array.isArray(e) ? e : pts(e.getAttribute('d')))), off = [], w = segs.map(sg => Math.max(sg.L, 48));
    let L = 0;
    segs.forEach((sg, k) => { if (k) L += gaps?.[k - 1] ?? 30; off.push(L); L += w[k]; });
    const xs = segs.flatMap(sg => sg.pts.map(p => p[0]));
    return {
      x0: Math.min(...xs), x1: Math.max(...xs), sx: segs[0].pts[0][0],
      start: k => off[k] / L, end: k => (off[k] + w[k]) / L,
      at(u) {
        const s = Math.max(0, Math.min(1, u)) * L;
        let k = segs.length - 1;
        while (k > 0 && s < off[k]) k--;
        const sg = segs[k], d = Math.min(s - off[k], w[k]) * sg.L / w[k], r = Math.min(6, sg.L / 3);
        return { sg, d, p: sg.at(d / sg.L), a: Math.max(0, Math.min(1, d / r, (sg.L - d) / r)) };
      },
    };
  }

  const PR = '\u2032', BAR = '\u0304';
  const P = [
    { x: 128, y: 6, w: 372, h: 282 },
    { x: 512, y: 6, w: 544, h: 282 },
    { x: 128, y: 300, w: 456, h: 284 },
    { x: 596, y: 300, w: 460, h: 284 },
  ];
  const TITLES = ['Harness Optimization', 'Specialized Foundation Model Optimization', 'Joint Selection', 'Agent Optimization'];

  function panel(root, i) {
    const k = STEPS[i].key, p = P[i];
    const g = el('g', { class: 'lp-panel', 'data-step': i, style: `--c:var(--${k});--cs:var(--${k}-soft);--cp:var(--${k}-panel);--cl:var(--${k}-line)` }, root);
    el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: 6, class: 'lp-pbg' }, g);
    numBadge(g, p.x + 24, p.y + 25, i + 1);
    const t = txt(g, p.x + 42, p.y + 31, TITLES[i], { class: 'lp-title' });
    if (narrow && i === 1) {
      t.textContent = 'Specialized Foundation Model';
      txt(g, p.x + 42, p.y + 50, 'Optimization', { class: 'lp-title' });
    }
    return g;
  }
  let narrow = false;
  const node = (g, cls) => el('g', { class: 'lp-node' + (cls ? ' ' + cls : '') }, g);

  function buildHarness(g, R) {
    const { x, y } = P[0], cy = y + 80, ids = R.ids;
    const a = node(g);
    cards(a, x + 44, cy - 14, 30, 26, 3, 'lp-box');
    doc(a, x + 48, cy - 10, 14, 17, HC.css('--harness'));
    el('circle', { cx: x + 68, cy: cy + 8, r: 6, fill: HC.css('--paper'), stroke: HC.css('--agent'), 'stroke-width': 1.2 }, a);
    el('path', { d: `M${x + 65},${cy + 8} l2,2 l4,-4`, fill: 'none', stroke: HC.css('--agent'), 'stroke-width': 1.3 }, a);
    txt(g, x + 66, cy + 40, 'Accepted harnesses', { 'text-anchor': 'middle', 'font-size': 13.5 });
    mt(g, x + 138, cy - 9, '(H_i, J_i)', { 'text-anchor': 'middle', class: 'lp-c' });
    R.r1 = [arrow(g, `M${x + 96},${cy} H${x + 178}`, 'h', { ids })];
    const sv = node(g);
    el('rect', { x: x + 184, y: cy - 16, width: 34, height: 30, rx: 4, class: 'lp-soft' }, sv);
    const ic = el('g', { class: 'lp-icon', style: `color:${HC.css('--harness')}` }, sv);
    [[x + 193, 0.3], [x + 201, 0.7], [x + 209, 0.45]].forEach(([lx, f]) => {
      el('line', { x1: lx, x2: lx, y1: cy - 10, y2: cy + 8 }, ic);
      el('rect', { x: lx - 2.5, y: cy - 10 + f * 18 - 2.5, width: 5, height: 5, rx: 1, fill: HC.css('--paper') }, ic);
    });
    el('path', { d: `M${x + 192},${cy - 20} q9,-7 18,0`, class: 'lp-icon', style: `color:${HC.css('--harness')}`, 'marker-end': `url(#${ids.h})` }, sv);
    txt(g, x + 201, cy + 34, 'Select + vary', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 13.5 });
    R.r1.push(arrow(g, `M${x + 224},${cy} H${x + 284}`, 'h', { ids }));
    const hp = node(g);
    el('rect', { x: x + 290, y: cy - 19, width: 62, height: 38, rx: 4, class: 'lp-box' }, hp);
    mt(hp, x + 321, cy + 6, 'H' + PR, { 'text-anchor': 'middle', class: 'lp-c', 'font-size': 18 });
    R.hp = { x: x + 352, y: cy };
    R.n1 = [a, sv, hp];

    const fx = x + 18, fy = y + 136, fw = 336, rh = 23, gap = 3.5;
    el('rect', { x: fx, y: fy, width: fw, height: 5 * rh + 4 * gap + 14, rx: 4, fill: HC.css('--specialist-panel'), stroke: HC.css('--specialist-line') }, g);
    const FIELDS = ['Context and history', 'Candidate pool and shortlist', 'Candidate view', 'Model curriculum', 'Agent curriculum'];
    R.rows = FIELDS.map((f, i) => {
      const ry = fy + 7 + i * (rh + gap);
      const r = el('g', { class: 'lp-row' + (i >= 3 ? ' cur' : '') + (i === 4 ? ' ag' : '') }, g);
      el('rect', { x: fx + 7, y: ry, width: fw - 14, height: rh, rx: 3 }, r);
      fieldIcon(r, fx + 22, ry + rh / 2, i);
      txt(r, fx + 40, ry + 16, f);
      txt(r, fx + fw - 16, ry + 16, 'vary', { 'text-anchor': 'end', class: 'lp-vary' });
      return r;
    });
  }
  function fieldIcon(g, cx, cy, i) {
    const ic = el('g', { class: 'lp-icon', style: `color:${HC.css(i === 4 ? '--agent' : '--specialist')}`, transform: `translate(${cx},${cy})` }, g);
    if (i === 0) { el('rect', { x: -6, y: -6, width: 9, height: 11, rx: 1 }, ic); el('circle', { cx: 4, cy: 3, r: 3.2, fill: HC.css('--specialist-soft') }, ic); }
    if (i === 1) { el('rect', { x: -6, y: -6, width: 12, height: 12, rx: 1.5 }, ic); el('line', { x1: -3, x2: 3, y1: -2, y2: -2 }, ic); el('line', { x1: -3, x2: 3, y1: 2, y2: 2 }, ic); }
    if (i === 2) { el('rect', { x: -7, y: -5, width: 14, height: 10, rx: 1.5 }, ic); el('line', { x1: -4, x2: 0, y1: -1, y2: -1 }, ic); el('line', { x1: -4, x2: 3, y1: 2, y2: 2 }, ic); }
    if (i === 3) { el('path', { d: 'M-6,-5 h12 l-4,5 v5 l-4,-2 v-3 Z' }, ic); }
    if (i === 4) { el('rect', { x: -6, y: -6, width: 10, height: 12, rx: 1 }, ic); el('path', { d: 'M-3,-1 l2,2 l3,-3' }, ic); }
  }

  function buildSpecialist(g, R) {
    const { x, y } = P[1], cy = y + 104, cy2 = y + 216, ids = R.ids;
    const S = HC.css('--specialist'), A = HC.css('--agent'), r2 = R.r2 = [];
    txt(g, x + 530, y + 54, 'Agent-guided experience', { 'text-anchor': 'end', class: 'lp-b', style: `fill:${S}`, 'font-size': 13.5 });

    const tp = node(g);
    cards(tp, x + 20, cy - 22, 38, 42, 3, 'lp-box', true).setAttribute('style', '--c:var(--selection)');
    mt(tp, x + 39, cy + 4, 'x_i', { 'text-anchor': 'middle', style: `fill:${HC.css('--selection')}` });
    txt(g, x + 43, cy + 42, 'Task pool', { 'text-anchor': 'middle', style: `fill:${HC.css('--selection')}`, 'font-size': 13.5 });
    r2.push(arrow(g, `M${x + 68},${cy} H${x + 86}`, 's', { ids }));
    const st = node(g);
    robot(st, x + 116, cy, 27, 'assets/img/robot-specialist.png', HC.css('--specialist-soft'));
    mt(g, x + 116, cy + 46, 'S_t', { 'text-anchor': 'middle', style: `fill:${S}` });
    r2.push(arrow(g, `M${x + 146},${cy} H${x + 166}`, 's', { ids }));
    const rc = node(g);
    el('rect', { x: x + 170, y: cy - 23, width: 98, height: 46, rx: 4, class: 'lp-soft' }, rc);
    doc(rc, x + 184, cy - 12, 17, 22, S, HC.css('--paper'));
    el('circle', { cx: x + 202, cy: cy + 8, r: 5, fill: HC.css('--paper'), stroke: S, 'stroke-width': 1.1 }, rc);
    [[x + 216, 20, '--specialist'], [x + 229, 26, '--specialist'], [x + 242, 22, '--harness']].forEach(([bx, bh, c]) => {
      el('rect', { x: bx, y: cy + 11 - bh, width: 10, height: bh, rx: 1.5, fill: HC.css('--paper'), stroke: HC.css(c), 'stroke-width': 1.1 }, rc);
      el('circle', { cx: bx + 5, cy: cy + 15 - bh, r: 1.4, fill: HC.css(c) }, rc);
    });
    txt(g, x + 219, cy + 42, 'Ranked context', { 'text-anchor': 'middle', class: 'lp-b', style: `fill:${S}`, 'font-size': 13.5 });
    r2.push(arrow(g, `M${x + 272},${cy} H${x + 296}`, 'a', { ids }));
    const ag = node(g);
    robot(ag, x + 328, cy, 27, 'assets/img/robot-agent.png', HC.css('--agent-soft'));
    txt(g, x + 320, cy - 38, 'LLM agent', { 'text-anchor': 'middle', class: 'lp-b', style: `fill:${A}`, 'font-size': 13.5 });
    mt(g, x + 362, cy + 32, 'A_t', { style: `fill:${A}` });
    r2.push(arrow(g, `M${x + 360},${cy} H${x + 380}`, 'a', { ids }));
    const eo = node(g);
    [0, 1, 2].forEach(i => {
      const cx0 = x + 390 + i * 18, cy0 = cy - 20 + i * 3;
      el('rect', { x: cx0, y: cy0, width: 46, height: 34, rx: 3, fill: HC.css('--agent-soft'), stroke: A, 'stroke-width': 1 }, eo);
      for (let l = 0; l < 3; l++) el('line', { x1: cx0 + 6, x2: cx0 + 40 - l * 7, y1: cy0 + 9 + l * 7, y2: cy0 + 9 + l * 7, stroke: A, 'stroke-opacity': .6 }, eo);
    });
    el('circle', { cx: x + 396, cy: cy + 12, r: 3.5, fill: HC.css('--reject-soft'), stroke: HC.css('--reject') }, eo);
    txt(g, x + 530, cy - 32, 'Exploration outcomes', { 'text-anchor': 'end', class: 'lp-b', style: `fill:${A}`, 'font-size': 13.5 });
    r2.push(arrow(g, `M${x + 474},${cy} H${x + 504} V${cy2 - 24}`, 'a', { ids }));

    const fu = node(g);
    el('path', { d: `M${x + 486},${cy2 - 16} h36 l-13,15 v12 l-10,-4 v-8 Z`, fill: HC.css('--specialist-soft'), stroke: S, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, fu);
    mt(g, x + 468, cy2 - 18, 'H' + PR, { 'text-anchor': 'middle', style: `fill:${HC.css('--harness')}`, 'font-size': 14 });
    txt(g, x + 476, cy2 + 40, 'Experience selection', { 'text-anchor': 'middle', 'font-size': 13.5 });
    r2.push(arrow(g, `M${x + 484},${cy2} H${x + 448}`, 's', { ids }));
    const ds = node(g);
    cards(ds, x + 356, cy2 - 20, 86, 40, 3, 'lp-box', true);
    mt(ds, x + 399, cy2 + 5, 'D_S', { 'text-anchor': 'middle', style: `fill:${S}`, 'font-size': 16 });
    arrow(g, `M${x + 399},${cy2 + 36} V${cy2 + 24}`, 's', { ids });
    txt(g, x + 388, cy2 + 51, 'Task labels', { 'text-anchor': 'end', 'font-size': 13.5 });
    mt(g, x + 394, cy2 + 51, 'y_i', { style: `fill:${S}` });
    r2.push(arrow(g, `M${x + 352},${cy2} H${x + 318}`, 's', { ids }));
    const sl = node(g);
    el('rect', { x: x + 170, y: cy2 - 25, width: 144, height: 50, rx: 5, class: 'lp-soft' }, sl);
    txt(sl, x + 242, cy2 - 4, 'Supervised', { 'text-anchor': 'middle', class: 'lp-b', style: `fill:${S}`, 'font-size': 15 });
    txt(sl, x + 242, cy2 + 15, 'learning', { 'text-anchor': 'middle', class: 'lp-b', style: `fill:${S}`, 'font-size': 15 });
    r2.push(arrow(g, `M${x + 166},${cy2} H${x + 112}`, 's', { ids }));
    const sp = node(g);
    robot(sp, x + 78, cy2, 28, 'assets/img/robot-specialist.png', HC.css('--specialist-soft'));
    mt(g, x + 114, cy2 + 30, 'S' + PR, { style: `fill:${S}`, 'font-size': 17 });
    R.sp = { x: x + 78, y: cy2 + 28 };
    R.rc = { x: x + 219, y: cy - 23 };
    R.n2 = [tp, st, rc, ag, eo, fu, ds, sl, sp];
  }

  function buildSelection(g, R) {
    const { x, y } = P[2], cy = y + 84, ids = R.ids;
    const pair = (gg, cx, yy, a, b, w, hh) => {
      el('rect', { x: cx - w / 2, y: yy - hh / 2, width: w, height: hh, rx: 4, class: 'lp-box' }, gg);
      mt(gg, cx, yy + 5.5, `(${a}, ${b})`, { 'text-anchor': 'middle', class: 'lp-c', 'font-size': 15.5 });
    };
    txt(g, x + 68, y + 56, 'Current', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14.5 });
    const cu = node(g); pair(cu, x + 68, cy, 'S_t', 'H_t', 100, 36);
    txt(g, x + 218, y + 50, 'Held-out tasks', { 'text-anchor': 'middle', 'font-size': 13.5 });
    mt(g, x + 268, y + 50, 'D_{=val}', { class: 'lp-c', 'font-size': 14 });
    const pe = node(g);
    el('rect', { x: x + 160, y: cy - 25, width: 140, height: 50, rx: 4, class: 'lp-box' }, pe);
    txt(pe, x + 230, cy - 3, 'Paired evaluation', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14.5 });
    const fa = mt(pe, x + 230, cy + 16, 'Fixed A_t', { 'text-anchor': 'middle', 'font-size': 13.5 });
    fa.firstChild.removeAttribute('font-style');
    fa.firstChild.style.fontFamily = 'var(--sans)';
    txt(g, x + 390, y + 56, 'Proposal', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14.5 });
    const pr = node(g); pair(pr, x + 390, cy, 'S' + PR, 'H' + PR, 100, 36);
    arrow(g, `M${x + 118},${cy} H${x + 156}`, 'p', { ids });
    R.r3 = [arrow(g, `M${x + 340},${cy} H${x + 304}`, 'p', { ids }), arrow(g, `M${x + 230},${cy + 25} V${y + 120}`, 'p', { ids })];

    const eq = node(g);
    el('rect', { x: x + 18, y: y + 124, width: 422, height: 30, rx: 4, fill: HC.css('--selection-soft') }, eq);
    mt(eq, x + 229, y + 145, `ΔJ = J(S${PR}, H${PR}; A_t) − J(S_t, H_t; A_t)`, { 'text-anchor': 'middle', class: 'lp-c', 'font-size': 16 });

    const dec = el('g', { class: 'lp-dec' }, g);
    const cross = el('g', { class: 'lp-x' }, dec);
    txt(cross, x + 432, y + 56, '✕', { style: `fill:${HC.css('--reject')}`, 'font-size': 14, class: 'lp-b' });
    el('rect', { x: x + 18, y: y + 164, width: 308, height: 98, rx: 4, fill: HC.css('--selection-soft'), 'fill-opacity': .55 }, dec);
    const acc = el('g', { class: 'lp-acc', style: '--c:var(--agent)' }, dec);
    txt(acc, x + 32, y + 195, 'Accept if ΔJ > 0', { class: 'lp-b lp-c', 'font-size': 14.5 });
    const ab = node(acc); pair(ab, x + 254, y + 190, 'S' + PR, 'H' + PR, 100, 30);
    const rej = el('g', { class: 'lp-rej', style: '--c:var(--selection)' }, dec);
    txt(rej, x + 32, y + 243, 'Else retain current', { style: `fill:${HC.css('--reject')}`, 'font-size': 14 });
    const rb = node(rej); pair(rb, x + 254, y + 238, 'S_t', 'H_t', 100, 30);
    R.legs = [y + 238, y + 190].map(ly => arrow(g, `M${x + 304},${ly} H${x + 316} V${y + 214}`, 'p', { noHead: true }));
    R.out3 = arrow(g, `M${x + 316},${y + 214} H${x + 340}`, 'p', { ids });
    txt(g, x + 394, y + 190, 'Retained pair', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14 });
    const rp = node(g); pair(rp, x + 394, y + 214, `S${BAR}_t`, `H${BAR}_t`, 100, 36);
    R.dec = dec;
    R.n3 = [pr, pe, eq, ab, rb, rp];
    R.accY = y + 190;
    R.rp = { x: x + 444, y: y + 214 };
  }

  const ORDER = [[0, 1, 2, 3], [3, 0, 1, 2], [0, 1, 2, 3], [1, 2, 3, 0]];
  function buildAgent(g, R) {
    const { x, y } = P[3], ids = R.ids, A = HC.css('--agent');
    tile(g, x + 318, y + 15, 16, 3);
    txt(g, x + 341, y + 28, 'Relevant item', { 'font-size': 13.5, style: `fill:${A}` });
    txt(g, x + 16, y + 57, 'Model-referenced contribution', { class: 'lp-b lp-c', 'font-size': 14 });
    mt(g, x + 432, y + 57, `r_i(τ) = q^A_i(τ) − q^{S${BAR}}_i`, { 'text-anchor': 'end', style: `fill:${HC.css('--selection')}`, 'font-size': 15 });
    txt(g, x + 16, y + 77, 'Book recommendation example', { class: 'lp-c', 'font-size': 13.5, 'font-weight': 600 });
    el('rect', { x: x + 14, y: y + 86, width: 290, height: 112, rx: 4, class: 'lp-box' }, g);
    txt(g, x + 98, y + 101, 'Rank 1 → 4', { 'text-anchor': 'middle', class: 'lp-mut', 'font-size': 13.5 });
    txt(g, x + 190, y + 101, 'Contribution', { 'text-anchor': 'middle', class: 'lp-mut', 'font-size': 13.5 });
    const keep = el('g', { class: 'lp-keep' }, g);
    el('rect', { x: x + 20, y: y + 128, width: 278, height: 22, rx: 3 }, keep);
    const LBL = [`S${BAR}_t`, 'τ_1', 'τ_2', 'τ_3'];
    const RES = [null, ['r_i(τ_1) > 0', '✓ Keep'], ['r_i(τ_2) = 0', 'No gain'], ['r_i(τ_3) > 0', 'Not best']];
    R.trs = []; R.tiles = [];
    LBL.forEach((l, k) => {
      const ry = y + 108 + k * 22;
      const tr = el('g', { class: 'lp-tr' + (k === 0 ? ' on res' : '') }, g);
      mt(tr, x + 34, ry + 14, l, { 'text-anchor': 'middle', style: `fill:${HC.css(k ? '--selection' : '--specialist')}`, 'font-size': 15 });
      const tl = [0, 1, 2, 3].map(kind => {
        const t = tile(tr, x + 56, ry, 18, kind);
        t.style.transform = `translateX(${ORDER[k].indexOf(kind) * 22}px)`;
        return t;
      });
      R.tiles.push(tl);
      const res = el('g', { class: 'lp-res' }, tr);
      if (!RES[k]) txt(res, x + 147, ry + 14, 'Reference ranking', { style: `fill:${HC.css('--specialist')}`, 'font-size': 13.5 });
      else {
        mt(res, x + 147, ry + 14, RES[k][0], { 'font-size': 14, style: `fill:${A}` });
        txt(res, x + 240, ry + 14, RES[k][1], k === 1 ? { class: 'lp-b', style: `fill:${A}`, 'font-size': 13.5 } : { class: 'lp-mut', 'font-size': 13.5 });
      }
      R.trs.push(tr);
    });
    R.keep = keep;
    const r4 = R.r4 = [arrow(g, `M${x + 304},${y + 142} H${x + 316}`, 'a', { ids })];
    const bp = node(g);
    el('rect', { x: x + 318, y: y + 86, width: 128, height: 112, rx: 5, fill: HC.css('--agent-soft'), stroke: A, 'stroke-width': 1.2 }, bp);
    txt(bp, x + 382, y + 110, 'Best positive', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14.5 });
    txt(bp, x + 382, y + 128, 'per instance', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 14.5 });
    doc(bp, x + 330, y + 146, 15, 19, A, HC.css('--paper'));
    txt(bp, x + 354, y + 158, 'Curriculum', { class: 'lp-c', 'font-size': 13.5 });
    mt(bp, x + 392, y + 182, `H${BAR}_t`, { 'text-anchor': 'middle', style: `fill:${HC.css('--harness')}`, 'font-size': 15 });

    const fr = node(g);
    cards(fr, x + 20, y + 218, 96, 30, 2, 'lp-box', true).setAttribute('style', '--c:var(--selection)');
    mt(fr, x + 68, y + 238, 'τ ∼ A_t', { 'text-anchor': 'middle', style: `fill:${HC.css('--selection')}`, 'font-size': 15 });
    txt(g, x + 68, y + 266, 'Fresh rollouts', { 'text-anchor': 'middle', class: 'lp-b', style: `fill:${HC.css('--selection')}`, 'font-size': 13.5 });
    r4.unshift(arrow(g, `M${x + 68},${y + 210} V${y + 201}`, 'p', { ids }));
    r4.push(arrow(g, `M${x + 382},${y + 198} V${y + 205} H${x + 240} V${y + 210}`, 'a', { ids }));
    const rl = node(g);
    el('rect', { x: x + 150, y: y + 212, width: 180, height: 44, rx: 5, fill: HC.css('--agent-soft'), stroke: A, 'stroke-width': 1.2 }, rl);
    txt(rl, x + 240, y + 232, 'On-policy RL', { 'text-anchor': 'middle', class: 'lp-b lp-c', 'font-size': 16 });
    mt(rl, x + 240, y + 250, 'A_t → A_{t+1}', { 'text-anchor': 'middle', class: 'lp-c', 'font-size': 14 });
    mt(g, x + 240, y + 274, `(S${BAR}_t, H${BAR}_t, A_{t+1})`, { 'text-anchor': 'middle', class: 'lp-mut', 'font-size': 13.5 });
    r4.push(arrow(g, `M${x + 332},${y + 234} H${x + 368}`, 'a', { ids }));
    const ro = node(g);
    robot(ro, x + 400, y + 234, 27, 'assets/img/robot-agent.png', HC.css('--agent-soft'));
    R.n4 = [fr, bp, rl, ro];
  }

  const TL = { cx: 58, y0: 78, gh: 68, gap: 62, top: 66, show: HC.REDUCED ? 4 : 3 };
  const TL_STEP = TL.gh + TL.gap;
  function buildTimeline(svg, defs, R) {
    const g = el('g', {}, svg);
    txt(g, 6, 22, 'Coevolution', { class: 'lp-b', 'font-size': 14.5, style: 'fill:var(--heading)' });
    txt(g, 6, 40, 'timeline', { class: 'lp-b', 'font-size': 14.5, style: 'fill:var(--heading)' });
    txt(g, 6, 57, 'Joint checkpoints', { class: 'lp-mut', 'font-size': 13.5 });
    const cid = 'lpclip' + HC.uid(), gid = 'lpfade' + HC.uid();
    el('rect', { x: -4, y: TL.top, width: 124, height: VB[1] + VB[3] - TL.top }, el('clipPath', { id: cid }, defs));
    const lg = el('linearGradient', { id: gid, x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': HC.css('--paper'), 'stop-opacity': 1 }, lg);
    el('stop', { offset: 1, 'stop-color': HC.css('--paper'), 'stop-opacity': 0 }, lg);
    const clip = el('g', { 'clip-path': `url(#${cid})` }, g);
    const inner = el('g', { class: 'lp-tl-in' }, clip);
    const cur = el('rect', { x: TL.cx - 48, width: 96, height: TL.gh + 12, rx: 6, class: 'lp-cur' }, inner);
    const ph = el('g', { style: HC.REDUCED ? 'display:none' : null }, inner);
    [0, 24, 48].forEach(dy => el('rect', { x: TL.cx - 36, y: dy, width: 72, height: 22, rx: 3, class: 'lp-ph' }, ph));
    const fade = el('rect', { x: -4, y: TL.top, width: 124, height: 26, fill: `url(#${gid})`, opacity: 0 }, g);
    R.tl = { inner, cur, ph, fade, nodes: new Map() };
  }
  function tlEntry(R, n, e) {
    const g = el('g', { class: 'lp-ent' }), y = TL.y0 + n * TL_STEP, ids = R.ids;
    const box = (yy, key, sym, idx) => {
      el('rect', { x: TL.cx - 36, y: yy, width: 72, height: 22, rx: 3, class: 'lp-tlbox', stroke: HC.css('--' + key) }, g);
      mt(g, TL.cx, yy + 17, `${sym}^{(${idx})}`, { 'text-anchor': 'middle', 'font-size': 14, style: `fill:${HC.css('--' + key)}` });
    };
    box(y, 'specialist', 'S', e.s); box(y + 24, 'harness', 'H', e.s); box(y + 48, 'agent', 'A', e.a);
    if (n > 0 && e.acc !== undefined) {
      const g0 = y - TL.gap;
      arrow(g, `M${TL.cx},${g0 + 3} V${y - 4}`, e.acc ? 'n' : 'r', { ids, dash: !e.acc });
      if (e.acc) txt(g, TL.cx, g0 + 36, 'Accept', { 'text-anchor': 'middle', class: 'lp-b lp-halo', 'font-size': 13.5, style: `fill:${HC.css('--agent')}` });
      else {
        txt(g, TL.cx, g0 + 21, 'Reject', { 'text-anchor': 'middle', class: 'lp-b lp-halo', 'font-size': 13.5, style: `fill:${HC.css('--reject')}` });
        el('rect', { x: TL.cx - 38, y: g0 + 28, width: 76, height: 20, rx: 3, fill: HC.css('--reject-soft'), stroke: HC.css('--reject'), 'stroke-dasharray': '3 2' }, g);
        mt(g, TL.cx - 6, g0 + 43, `(S${PR}, H${PR})`, { 'text-anchor': 'middle', 'font-size': 13.5, style: `fill:${HC.css('--reject')}` });
        txt(g, TL.cx + 29, g0 + 42, '✕', { 'text-anchor': 'middle', 'font-size': 13.5, class: 'lp-b', style: `fill:${HC.css('--reject')}` });
      }
    }
    return g;
  }
  function renderTimeline(R, st, instant) {
    const T = R.tl, last = st.base + st.hist.length - 1;
    T.inner.style.transition = instant ? 'none' : '';
    for (const [n, g] of T.nodes) if (n < st.base) { g.remove(); T.nodes.delete(n); }
    st.hist.forEach((e, i) => {
      const n = st.base + i;
      if (T.nodes.has(n)) return;
      const g = tlEntry(R, n, e);
      T.inner.appendChild(g); T.nodes.set(n, g);
      if (!instant && !HC.REDUCED) { g.classList.add('new'); requestAnimationFrame(() => requestAnimationFrame(() => g.classList.remove('new'))); }
    });
    const off = Math.max(0, last + 1 - TL.show) * TL_STEP;
    T.inner.style.transform = `translateY(${-off}px)`;
    T.cur.setAttribute('y', TL.y0 + last * TL_STEP - 6);
    T.ph.setAttribute('transform', `translate(0,${TL.y0 + (last + 1) * TL_STEP})`);
    T.fade.setAttribute('opacity', off > 0 ? 1 : 0);
    const yn = TL.y0 + (last + (HC.REDUCED ? 0 : 1)) * TL_STEP - off + 34;
    setD(R.lnkOut, `M${P[2].x + 18},${R.accY} H118 V${yn} H100`, instant);
  }
  function setD(path, d, instant) {
    path.setAttribute('d', d);
    path.style.transition = instant || HC.REDUCED ? 'none' : 'd .9s cubic-bezier(.45,0,.2,1)';
    path.style.d = `path("${d}")`;
  }
  const paperHist = () => [{ s: 0, a: 0 }, { s: 1, a: 1, acc: true }, { s: 1, a: 2, acc: false }, { s: 2, a: 3, acc: true }];

  function buildLinks(g, R) {
    const ids = R.ids;
    R.r1.unshift(arrow(g, `M112,${P[0].y + 80} H${P[0].x + 40}`, 'h', { ids, dash: true }));
    arrow(g, `M${R.hp.x + 2},${R.hp.y} H506 V${narrow ? 68 : 60} H${R.rc.x} V${R.rc.y - 2}`, 'h', { ids, dash: true });
    R.lnkOut = arrow(g, '', 'h', { ids, dash: true });
    R.r3.unshift(arrow(g, `M${R.sp.x},${R.sp.y + 1} V${P[2].y + 84} H${P[2].x + 444}`, 's', { ids }));
    R.r4.unshift(arrow(g, `M${R.rp.x},${R.rp.y} H588 V${P[3].y + 238} H${P[3].x + 18}`, 'p', { ids }));
  }

  const T_ROW = [0, 0.3, 0.4, 0.5], TAIL = 64;
  const smooth = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };

  function applyState(R, st, instant) {
    const s = st.step, t = st.t, acc = accepts(st.round), walking = s >= 0;
    R.panels.forEach((g, i) => { g.classList.toggle('on', s === i); g.classList.toggle('dim', walking && s !== i); });
    R.chips.forEach((b, i) => b.setAttribute('aria-pressed', s === i ? 'true' : 'false'));
    R.lis.forEach((li, i) => li.classList.toggle('active', s === i));
    const lbl = walking ? `Round <b>${st.round}</b>, step ${s + 1} of 4` + (R.narrow ? `, ${STEPS[s].name}` : '') : '';
    if (R.lblHtml !== lbl) R.roundLbl.innerHTML = R.lblHtml = lbl;

    const vary = VARY[(st.round - 1) % VARY.length];
    R.rows.forEach((r, i) => r.classList.toggle('vary', s === 0 && t >= 0.3 && vary.includes(i)));
    const u = smooth(0.03, 0.9, t);
    const decided = (s === 2 && u >= R.decU[acc ? 1 : 0]) || s === 3;
    R.dec.classList.toggle('accept', decided && acc);
    R.dec.classList.toggle('reject', decided && !acc);
    R.trs.forEach((tr, k) => {
      if (!k) return;
      const on = s !== 3 || t >= T_ROW[k];
      tr.classList.toggle('on', on);
      tr.classList.toggle('res', s !== 3 || t >= T_ROW[k] + 0.08);
      R.tiles[k].forEach((tl, kind) => { tl.style.transform = `translateX(${(on ? ORDER[k] : ORDER[0]).indexOf(kind) * 22}px)`; });
    });
    R.keep.classList.toggle('on', s !== 3 || t >= 0.62);

    const show = walking && !HC.REDUCED;
    R.tok.style.display = show ? '' : 'none';
    R.trace.style.display = show ? '' : 'none';
    if (!show) { R.allNodes.forEach(n => n.classList.remove('hot')); return; }
    const key = STEPS[s].key, pl = s === 2 ? R.paths[2][acc ? 1 : 0] : R.paths[s];
    if (R.tokKey !== key + acc) {
      R.tokKey = key + acc;
      const c = HC.css('--' + key);
      R.tokCore.setAttribute('fill', c); R.tokHalo.setAttribute('fill', c);
      R.trace.setAttribute('stroke', c);
    }
    const q = pl.at(u), p = R.tokP = q.p;
    if (R.tokSeg !== q.sg) {
      R.tokSeg = q.sg;
      R.trace.setAttribute('d', q.sg.d);
      R.trace.setAttribute('stroke-dasharray', TAIL + ' ' + (q.sg.L + TAIL).toFixed(1));
    }
    R.tok.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    R.tok.setAttribute('opacity', q.a.toFixed(3));
    R.trace.setAttribute('stroke-dashoffset', (TAIL - q.d).toFixed(1));
    R.trace.setAttribute('opacity', (0.6 * q.a).toFixed(3));
    R.allNodes.forEach(n => {
      const h = R.hot.get(n);
      const f = h && (Array.isArray(h.f) ? h.f[acc ? 1 : 0] : h.f);
      const on = h && h.step === s && u >= f - 0.004 && u < f + 0.14;
      n.classList.toggle('hot', !!on && !instant);
    });
  }

  function advance(st) {
    st.t = 0;
    if (st.step < 3) { st.step++; return false; }
    const lastE = st.hist[st.hist.length - 1], acc = accepts(st.round);
    st.hist.push({ s: lastE.s + (acc ? 1 : 0), a: lastE.a + 1, acc });
    while (st.hist.length > 6) { st.hist.shift(); st.base++; }
    st.round++; st.step = 0;
    return true;
  }

  HC.register('loop', function (host, api) {
    injectCSS();
    host.setAttribute('role', 'group');
    if (host.__lpAC) host.__lpAC.abort();
    const ac = host.__lpAC = new AbortController(), sig = { signal: ac.signal };
    const label = host.getAttribute('aria-label') || 'The four steps of a HACE round';
    const st = host.__lp || (host.__lp = HC.REDUCED
      ? { round: 4, step: -1, t: 1, paused: true, hist: paperHist(), base: 0 }
      : { round: 1, step: -1, t: 0, paused: false, hist: [{ s: 0, a: 0 }], base: 0 });
    const R = {};

    const bar = HC.h('div', { class: 'lp-bar hc-top' }, host);
    bar.style.width = Math.max(280, host.clientWidth) + 'px';
    R.narrow = host.clientWidth < 600;
    narrow = R.narrow;
    const chipBox = HC.h('div', { class: 'lp-chips', role: 'group', 'aria-label': 'Show a step of the round' }, bar);
    R.chips = STEPS.map((s, i) => {
      const b = HC.h('button', { type: 'button', class: 'hc-btn', 'aria-pressed': 'false', style: `--c:var(--${s.key})`, title: s.full, 'aria-label': `Step ${i + 1}, ${s.full}` }, chipBox);
      HC.h('i', {}, b, String(i + 1)); HC.h('span', {}, b, s.name);
      b.addEventListener('click', () => jump(i));
      return b;
    });
    const end = HC.h('div', { class: 'lp-end' }, bar);
    R.roundLbl = HC.h('span', { class: 'lp-round' }, end);
    const pp = HC.h('button', { type: 'button', class: 'hc-btn lp-pp' }, end);
    if (HC.REDUCED) pp.hidden = true;
    R.lis = Array.from(document.querySelectorAll('#method ol.steps li')).slice(0, 4);

    const svg = HC.el('svg', { viewBox: VB.join(' '), role: 'img', 'aria-label': label + '. The specialist and the harness advance only when joint selection accepts the proposal, and the agent advances every round.' }, host);
    const defs = el('defs', {}, svg);
    R.ids = markers(defs);
    R.panels = [0, 1, 2, 3].map(i => panel(svg, i));
    buildHarness(R.panels[0], R);
    buildSpecialist(R.panels[1], R);
    buildSelection(R.panels[2], R);
    buildAgent(R.panels[3], R);
    buildTimeline(svg, defs, R);
    buildLinks(el('g', {}, svg), R);
    R.panels.forEach((g, i) => g.addEventListener('click', () => jump(i)));

    const sel = acc => route(R.r3.concat([pts(R.legs[acc ? 1 : 0].getAttribute('d')).concat(pts(R.out3.getAttribute('d')).slice(1))]), [30, 30, 60]);
    R.paths = [route(R.r1), route(R.r2), [sel(false), sel(true)], route(R.r4, [30, 250])];
    R.hot = new Map();
    const at = (nodes, fs, s) => nodes.forEach((n, k) => R.hot.set(n, { step: s, f: fs[k] }));
    const [p0, p1, p2, p3] = R.paths, [q0, q1] = p2, both = f => [f(q0), f(q1)];
    at(R.n1, [p0.end(0), p0.end(1), p0.end(2)], 0);
    at(R.n2, [p1.start(0)].concat([0, 1, 2, 3, 4, 5, 6, 7].map(p1.end)), 1);
    at(R.n3, [both(q => q.end(0)), both(q => q.end(1)), both(q => q.end(2)), [2, q1.start(3)], [q0.start(3), 2], both(q => q.end(3))], 2);
    at(R.n4, [p3.end(0), p3.end(2), p3.end(3), p3.end(4)], 3);
    R.decU = both(q => (q.end(2) + q.start(3)) / 2);
    R.allNodes = Array.from(R.hot.keys());
    const tg = el('g', { class: 'lp-tok' }, svg);
    R.trace = el('path', { class: 'lp-trace' }, tg);
    R.tok = el('g', {}, tg);
    R.tokHalo = el('circle', { r: 11, opacity: .2 }, R.tok);
    R.tokCore = el('circle', { r: 5.5, stroke: HC.css('--paper'), 'stroke-width': 2 }, R.tok);

    let started = api.played && !HC.REDUCED, visible = false, raf = 0, last = 0;
    const alive = () => host.contains(svg);
    const running = () => started && !st.paused && visible && !document.hidden && !HC.REDUCED;
    function tick(now) {
      raf = 0;
      if (!alive()) return;
      const dt = last ? Math.min(100, now - last) : 0; last = now;
      st.t += dt / STEP_MS[st.step];
      if (st.t >= 1 && advance(st)) renderTimeline(R, st, false);
      applyState(R, st, false);
      follow(false);
      schedule();
    }
    function schedule() {
      if (running()) { if (!raf) raf = requestAnimationFrame(tick); }
      else { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
    }
    function setPaused(p) {
      st.paused = p;
      pp.innerHTML = p
        ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5v9l8-4.5z"/></svg>Play'
        : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z"/></svg>Pause';
      schedule();
    }
    let lastTouch = 0, lastFollow = 0, lastStep = st.step;
    ['pointerdown', 'touchstart', 'wheel'].forEach(ev => host.addEventListener(ev, e => { if (!bar.contains(e.target)) lastTouch = Date.now(); }, { passive: true, signal: ac.signal }));
    function follow(force) {
      if (host.scrollWidth <= host.clientWidth + 4 || st.step < 0) return;
      const now = Date.now(), stepped = st.step !== lastStep;
      lastStep = st.step;
      if (!force && now - lastTouch < 4000) return;
      const k = svg.getBoundingClientRect().width / VB[2], X = v => (v - VB[0]) * k, sl = host.scrollLeft, cw = host.clientWidth, p = P[st.step], pl = st.step === 2 ? R.paths[2][0] : R.paths[st.step];
      const lo = X(Math.min(p.x, pl.x0 - 6)) - 8, hi = X(Math.max(p.x + p.w, pl.x1 + 6)) + 8 - cw;
      let left;
      if (hi <= lo) { if (!force && !stepped) return; left = (lo + hi) / 2; }
      else if (force || stepped) left = Math.max(lo, Math.min(hi, X(pl.sx) - cw / 2));
      else {
        if (!R.tokP || now - lastFollow < 300) return;
        const x = X(R.tokP[0]);
        if (x > sl + cw * 0.15 && x < sl + cw * 0.85) return;
        left = Math.max(lo, Math.min(hi, x - cw / 2));
      }
      if (Math.abs(left - sl) < 2) return;
      lastFollow = now;
      host.scrollTo({ left: Math.max(0, left), behavior: HC.REDUCED || Math.abs(left - sl) > cw ? 'auto' : 'smooth' });
    }
    function jump(i) {
      st.step = i;
      st.t = (HC.REDUCED || st.paused) ? 1 : 0;
      if (!HC.REDUCED && !started) { started = true; }
      applyState(R, st, HC.REDUCED || st.paused);
      follow(true);
      schedule();
    }
    pp.addEventListener('click', () => setPaused(!st.paused));
    setPaused(st.paused);

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
      visible = es[es.length - 1].isIntersecting; schedule();
    }, { threshold: 0.05 }) : null;
    if (io) io.observe(host); else visible = true;
    document.addEventListener('visibilitychange', () => schedule(), sig);
    ac.signal.addEventListener('abort', () => { if (io) io.disconnect(); if (raf) cancelAnimationFrame(raf); raf = 0; });

    renderTimeline(R, st, true);
    applyState(R, st, true);

    return {
      play(instant) {
        if (HC.REDUCED) return;
        if (!started) { started = true; if (st.step < 0) { st.step = 0; st.t = 0; } }
        applyState(R, st, !!instant);
        schedule();
      },
    };
  });
})();
