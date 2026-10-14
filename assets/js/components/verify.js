(function () {
  'use strict';
  const HC = window.HC;
  const K = 3;
  const SEED = 11;
  const EPS = 1e-12;
  const D = 3;

  const CANDS = [
    { shape: 'circle', rel: true }, { shape: 'square', rel: false }, { shape: 'diamond', rel: false },
    { shape: 'triangle', rel: false }, { shape: 'star', rel: true }, { shape: 'hexagon', rel: false },
    { shape: 'pentagon', rel: true },
  ];
  const SPEC = { initial: [0, 1, 2, 3, 4, 5, 6], improved: [0, 4, 1, 2, 3, 5, 6] };
  const VIEW = { shortlist: 6, wider: 7 };
  const N_REL = CANDS.filter(c => c.rel).length;

  const gain = r => 1 / Math.log2(r + 1);
  let IDCG = 0;
  for (let r = 1; r <= Math.min(K, N_REL); r++) IDCG += gain(r);
  function dcg(order) {
    let s = 0;
    for (let r = 1; r <= Math.min(K, order.length); r++) if (CANDS[order[r - 1]].rel) s += gain(r);
    return s;
  }
  const ndcg = order => dcg(order) / IDCG;
  const viewOf = st => SPEC[st.spec].slice(0, VIEW[st.view]);
  function ceiling(view) {
    const m = view.filter(c => CANDS[c].rel).length;
    let s = 0;
    for (let r = 1; r <= Math.min(K, m); r++) s += gain(r);
    return s / IDCG;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sampleOrder(rng, view) {
    const noise = () => (rng() + rng() + rng() - 1.5) * 2;
    return view.map((c, p) => ({ c, s: -p + 1.3 * noise() + (CANDS[c].rel && rng() < 0.4 ? 1 + 4.5 * rng() : 0) }))
      .sort((a, b) => b.s - a.s).map(d => d.c);
  }
  function judge(st) {
    const qS = ndcg(viewOf(st));
    const rows = st.samples.map(o => {
      const q = ndcg(o), r = q - qS;
      return { q, r: Math.abs(r) < EPS ? 0 : r, r4: (Math.round(q * 10 ** D) - Math.round(qS * 10 ** D)) / 10 ** D };
    });
    let best = -1;
    rows.forEach((d, i) => { if (d.r > 0 && (best < 0 || d.r > rows[best].r)) best = i; });
    rows.forEach((d, i) => {
      d.verdict = d.r <= 0 ? 'none' : i === best ? 'keep' : Math.abs(d.r - rows[best].r) < EPS ? 'tie' : 'notbest';
    });
    return { qS, rows, best };
  }

  const CSS = `
#viz-verify .vf-go{border-color:var(--agent);background:var(--agent);color:var(--paper)}
#viz-verify .vf-go:hover{border-color:var(--agent);filter:brightness(1.08)}
#viz-verify .vf-go svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#viz-verify .vf-grp{display:inline-flex;align-items:center;gap:8px}
#viz-verify .vf-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 18px;margin-top:8px;font:12.5px/1.45 var(--sans);color:var(--muted)}
#viz-verify .vf-key{display:flex;flex-wrap:wrap;gap:4px 14px}
#viz-verify .vf-key span{display:inline-flex;align-items:center;gap:6px}
#viz-verify .vf-key svg{width:14px;height:14px;overflow:visible}
#viz-verify .vf-note{color:var(--ink-2);flex-basis:100%;min-height:2.9em}
#viz-verify .vf-note.ceil{color:var(--specialist);font-weight:600}
#viz-verify svg text{font-family:var(--sans)}
#viz-verify .vf-h{fill:var(--muted);font-size:12px}
#viz-verify .vf-rk{fill:var(--tick);font-size:12px;font-variant-numeric:tabular-nums}
#viz-verify .vf-lab{fill:var(--agent);font-size:13px;font-weight:650}
#viz-verify .vf-lab.s{fill:var(--specialist)}
#viz-verify .vf-lab .tau{font-style:italic;font-family:var(--serif);font-size:14.5px}
#viz-verify .vf-num{fill:var(--ink);font-size:13.5px;font-variant-numeric:tabular-nums}
#viz-verify .vf-num.s{fill:var(--specialist);font-weight:650}
#viz-verify .vf-r{font-size:13.5px;font-weight:650;font-variant-numeric:tabular-nums;fill:var(--muted)}
#viz-verify .vf-r.pos{fill:var(--agent)}
#viz-verify .vf-ceil{fill:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
#viz-verify .vf-ceil.at{fill:var(--specialist);font-weight:650}
#viz-verify .vf-band{fill:var(--ink);fill-opacity:.045}
#viz-verify .vf-bandlab{fill:var(--muted);font-size:11.5px}
#viz-verify .vf-srow{fill:var(--specialist-panel);stroke:var(--specialist-line)}
#viz-verify .vf-krow{fill:var(--agent-soft);stroke:var(--agent-line);opacity:0}
#viz-verify .vf-slot{fill:var(--paper);stroke:var(--rule)}
#viz-verify .vf-tok .shp{stroke-width:1.5;stroke-linejoin:round}
#viz-verify .vf-tok.rel .shp{fill:var(--agent);stroke:var(--agent)}
#viz-verify .vf-tok.oth .shp{fill:var(--paper);stroke:var(--m-base-label)}
#viz-verify .vf-tok.ghost .shp{fill:none;stroke:var(--agent);stroke-dasharray:2.5 2}
#viz-verify .vf-div{stroke:var(--harness);stroke-width:1.2;stroke-dasharray:3 3}
#viz-verify .vf-divlab{fill:var(--harness);font-size:11.5px;font-weight:600}
#viz-verify .vf-pill rect{stroke-width:1}
#viz-verify .vf-pill text{font-size:12px;font-weight:650}
#viz-verify .vf-pill.keep rect{fill:var(--agent);stroke:var(--agent)}
#viz-verify .vf-pill.keep text{fill:var(--paper)}
#viz-verify .vf-pill.keep path{stroke:var(--paper);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
#viz-verify .vf-pill.notbest rect,#viz-verify .vf-pill.tie rect{fill:var(--agent-soft);stroke:var(--agent-line)}
#viz-verify .vf-pill.notbest text,#viz-verify .vf-pill.tie text{fill:var(--agent)}
#viz-verify .vf-pill.none rect{fill:var(--rule-2);stroke:var(--rule)}
#viz-verify .vf-pill.none text{fill:var(--ink-2)}
#viz-verify .vf-box{fill:var(--agent-panel);stroke:var(--agent-line)}
#viz-verify .vf-boxt{fill:var(--agent);font-size:13px;font-weight:650}
#viz-verify .vf-boxs{fill:var(--muted);font-size:11.5px}
#viz-verify .vf-cnt{fill:var(--agent);font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
#viz-verify .vf-fly rect{fill:var(--paper);stroke:var(--agent)}
#viz-verify .vf-hit{fill:transparent;outline:none;cursor:default}
#viz-verify .vf-hit:focus-visible{stroke:var(--title-accent);stroke-width:1.5}
#viz-verify svg .noev{pointer-events:none}
`;

  function shapePath(kind, s) {
    const poly = (n, rot, rr) => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = rot + i * 2 * Math.PI / n, r = rr ? rr[i % rr.length] : s;
        pts.push((r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2));
      }
      return 'M' + pts.join('L') + 'Z';
    };
    switch (kind) {
      case 'square': { const a = s * 0.82; return `M${-a},${-a}H${a}V${a}H${-a}Z`; }
      case 'diamond': return poly(4, -Math.PI / 2, [s * 1.12]);
      case 'circle': return `M${-s * 0.9},0A${s * 0.9},${s * 0.9} 0 1 0 ${s * 0.9},0A${s * 0.9},${s * 0.9} 0 1 0 ${-s * 0.9},0Z`;
      case 'triangle': return `M0,${-s}L${(s * 0.98).toFixed(2)},${(s * 0.72).toFixed(2)}L${(-s * 0.98).toFixed(2)},${(s * 0.72).toFixed(2)}Z`;
      case 'hexagon': return poly(6, 0, [s * 0.98]);
      case 'pentagon': return poly(5, -Math.PI / 2, [s * 0.98]);
      case 'star': return poly(10, -Math.PI / 2, [s * 1.12, s * 0.48]);
    }
    return '';
  }

  HC.register('verify', function (host, api) {
    if (!document.querySelector('style[data-hc="verify"]')) {
      HC.h('style', { 'data-hc': 'verify' }, document.head).textContent = CSS;
    }
    const st = host.__vf || (host.__vf = { spec: 'initial', view: 'shortlist', rng: mulberry32(SEED), samples: null, kept: 0, intro: false });
    if (!st.samples) st.samples = [0, 1, 2].map(() => sampleOrder(st.rng, viewOf(st)));
    let busy = false;

    const ctl = HC.h('div', { class: 'vf-ctl hc-top' }, host);
    const go = HC.h('button', { type: 'button', class: 'hc-btn vf-go' }, null,
      '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7a4.5 4.5 0 0 1 7.7-3.2L12 5.5M12 2v3.5H8.5M11.5 7a4.5 4.5 0 0 1-7.7 3.2L2 8.5M2 12V8.5h3.5"/></svg>Sample responses');
    function seg(label, cls, key, opts) {
      const g = HC.h('div', { class: 'vf-grp' }, ctl);
      HC.h('span', { id: 'vf-' + key + '-l', class: 'hc-seg-k' }, g, label);
      const s = HC.h('div', { class: 'hc-seg', style: '--c:var(--' + cls + ')', role: 'group', 'aria-labelledby': 'vf-' + key + '-l' }, g);
      return opts.map(o => {
        const b = HC.h('button', { type: 'button', 'aria-pressed': String(st[key] === o) }, s, o);
        b.addEventListener('click', () => setOpt(key, o));
        return b;
      });
    }
    const specBtns = seg('Specialist', 'specialist', 'spec', ['initial', 'improved']);
    const viewBtns = seg('Harness view', 'harness', 'view', ['shortlist', 'wider']);
    ctl.appendChild(go);
    const syncBtns = () => {
      specBtns.forEach(b => b.setAttribute('aria-pressed', String(b.textContent === st.spec)));
      viewBtns.forEach(b => b.setAttribute('aria-pressed', String(b.textContent === st.view)));
    };

    const W = Math.max(300, host.clientWidth);
    const wide = W >= 730;
    const side = W >= 950;
    const G = {};
    if (wide) {
      G.x0 = 196; G.pw = 92;
      if (side) {
        G.pitch = Math.max(38, Math.min(48, (W - G.x0 - 480) / 7));
        const end = G.x0 + 7 * G.pitch;
        G.xN = end + 84; G.xR = G.xN + 96; G.xP = G.xR + 62;
        G.box = { x: Math.max(G.xP + G.pw / 2 + 28, W - 178), w: 0 };
        G.box.w = Math.max(0, W - G.box.x);
      } else {
        G.pitch = Math.max(38, Math.min(48, (W - G.x0 - 270) / 7));
        const end = G.x0 + 7 * G.pitch;
        G.xP = W - G.pw / 2 - 2; G.xR = G.xP - G.pw / 2 - 14; G.xN = G.xR - Math.max(90, (G.xR - end) * 0.45);
      }
      G.top = 35;
      G.rowY = [G.top + 24, G.top + 82, G.top + 128, G.top + 174];
      G.lineY = G.rowY;
      G.rowH = 44;
      G.H = G.rowY[3] + 28;
      if (!side) { G.box = { x: 0, y: G.rowY[3] + G.rowH / 2 + 12, w: W, h: 44 }; G.H = G.box.y + G.box.h + 2; }
    } else {
      G.x0 = 2;
      G.pitch = Math.min(46, (W - 4) / 7);
      G.pw = 74; G.xP = W - G.pw / 2 - 1; G.xR = W - G.pw - 12; G.xN = G.xR - 70;
      G.top = 24;
      G.rowY = []; G.lineY = [];
      [0, 1, 2, 3].forEach(i => { const y0 = G.top + i * 74 + (i ? 10 : 0); G.lineY.push(y0 + 14); G.rowY.push(y0 + 46); });
      G.rowH = 30;
      G.box = { x: 0, y: G.rowY[3] + 30, w: W, h: 44 };
      G.H = G.box.y + G.box.h + 2;
    }
    G.tile = Math.min(34, G.pitch - 7);
    G.s = G.tile * 0.3;
    G.slotX = i => G.x0 + G.pitch * i + G.pitch / 2;
    G.rEnd = side ? G.xP + G.pw / 2 + 8 : W;

    const F = HC.frame(host, W, G.H, { l: 0, t: 0, r: 0, b: 0 },
      'Verification on one instance. The specialist ranking and three sampled agent rankings are scored with NDCG@' + K +
      '. The response with the largest positive contribution is kept for agent training');
    const g = F.g, t = HC.text, E = HC.el;
    const bg = E('g', { class: 'noev' }, g), mid = E('g', { class: 'noev' }, g), fg = E('g', { class: 'noev' }, g);
    const hits = E('g', {}, g), fly = E('g', { class: 'noev' }, g);
    const tl = G.slotX(0) - G.tile / 2, tr = G.slotX(K - 1) + G.tile / 2;
    const tau = (parent, x, y, i, prefix, cls) => {
      const n = t(parent, x, y, prefix, { class: 'vf-lab' + (cls || '') });
      const s = E('tspan', { class: 'tau' }, n); s.textContent = 'τ';
      const sub = E('tspan', { 'baseline-shift': 'sub', 'font-size': '11.5' }, n); sub.textContent = String(i);
      return n;
    };

    const srowY = wide ? G.rowY[0] - G.rowH / 2 : G.lineY[0] - 14;
    const srowH = wide ? G.rowH : G.rowY[0] + G.tile / 2 + 6 - srowY;
    E('rect', { class: 'vf-srow', x: 0, y: srowY, width: G.rEnd, height: srowH, rx: 9, 'fill-opacity': wide ? 1 : 0.9 }, bg);
    const krows = [1, 2, 3].map(i => {
      const y = wide ? G.rowY[i] - G.rowH / 2 + 1 : G.lineY[i] - 14;
      const hgt = wide ? G.rowH - 2 : G.rowY[i] + G.tile / 2 + 5 - y;
      return E('rect', { class: 'vf-krow', x: wide ? 124 : 0, y, width: G.rEnd - (wide ? 124 : 0), height: hgt, rx: 9 }, bg);
    });

    if (wide) {
      E('rect', { class: 'vf-band', x: tl - 5, y: G.top - 16, width: tr - tl + 10, height: G.rowY[3] + G.rowH / 2 + 4 - (G.top - 16), rx: 8 }, bg);
      t(bg, (tl + tr) / 2, G.top - 24, 'top k = ' + K, { class: 'vf-bandlab', 'text-anchor': 'middle' });
    } else {
      [0, 1, 2, 3].forEach(i => E('rect', { class: 'vf-band', x: tl - 3, y: G.rowY[i] - G.tile / 2 - 3, width: tr - tl + 6, height: G.tile + 6, rx: 6 }, bg));
    }

    const tiles = [0, 1, 2, 3].map(r => CANDS.map((_, i) =>
      E('rect', { class: 'vf-slot', x: G.slotX(i) - G.tile / 2, y: G.rowY[r] - G.tile / 2, width: G.tile, height: G.tile, rx: 6 }, bg)));
    const divX = G.x0 + G.pitch * 6;
    const divider = E('g', {}, bg);
    if (wide) E('line', { class: 'vf-div', x1: divX, x2: divX, y1: G.top - 14, y2: G.rowY[3] + G.tile / 2 + 4 }, divider);
    else G.rowY.forEach(y => E('line', { class: 'vf-div', x1: divX, x2: divX, y1: y - G.tile / 2 - 3, y2: y + G.tile / 2 + 3 }, divider));
    if (wide) t(divider, G.slotX(6), G.top - 24, 'outside view', { class: 'vf-divlab', 'text-anchor': 'middle' });

    if (wide) {
      CANDS.forEach((_, i) => { if (i < 6) t(mid, G.slotX(i), G.top - 6, String(i + 1), { class: 'vf-rk', 'text-anchor': 'middle' }); });
      const rk7 = t(mid, G.slotX(6), G.top - 6, '7', { class: 'vf-rk', 'text-anchor': 'middle' });
      G.rk7 = rk7;
      t(mid, G.x0 - 14, G.top - 6, 'Rank', { class: 'vf-h', 'text-anchor': 'end' });
      t(mid, G.xN, G.top - 6, 'NDCG@' + K, { class: 'vf-h', 'text-anchor': 'end' });
      const rh = t(mid, G.xR, G.top - 6, 'r = q', { class: 'vf-h', 'text-anchor': 'end' });
      const sup = (s, txt) => { const n = E('tspan', { 'baseline-shift': 'super', 'font-size': '11.5' }, rh); n.textContent = s; const m = E('tspan', {}, rh); m.textContent = txt; };
      sup('A', ' − q'); sup('S', '');
      t(mid, G.xP, G.top - 6, 'Verdict', { class: 'vf-h', 'text-anchor': 'middle' });
      t(mid, 12, G.rowY[0] + 4.5, 'Specialist ranking', { class: 'vf-lab s' });
      const yA = (G.rowY[1] + G.rowY[3]) / 2;
      t(mid, 12, yA - 3, 'Sampled agent', { class: 'vf-lab' });
      t(mid, 12, yA + 14, 'rankings', { class: 'vf-lab' });
      E('path', { d: `M128,${G.rowY[1] - 14}h-4V${G.rowY[3] + 14}h4`, fill: 'none', stroke: 'var(--agent-line)', 'stroke-width': 1.2 }, mid);
      [1, 2, 3].forEach(i => tau(mid, 140, G.rowY[i] + 5, i, ''));
    } else {
      t(mid, G.xN, G.top - 10, 'NDCG@' + K, { class: 'vf-h', 'text-anchor': 'end' });
      t(mid, G.xR - 22, G.top - 10, 'r', { class: 'vf-h', 'text-anchor': 'middle', 'font-style': 'italic' });
      t(mid, 12, G.lineY[0] + 4.5, 'Specialist', { class: 'vf-lab s' });
      [1, 2, 3].forEach(i => tau(mid, 12, G.lineY[i] + 4.5, i, 'Agent '));
    }
    const toks = [0, 1, 2, 3].map(r => CANDS.map((c, id) => {
      const n = E('g', { class: 'vf-tok ' + (c.rel ? 'rel' : 'oth'), opacity: 0 }, fg);
      E('path', { class: 'shp', d: shapePath(c.shape, G.s) }, n);
      n._x = G.slotX(id); n._y = G.rowY[r];
      n.setAttribute('transform', `translate(${n._x},${n._y})`);
      return n;
    }));
    const place = (n, x, y) => { n._x = x; n._y = y; n.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`); };
    const nums = [0, 1, 2, 3].map(r => t(fg, G.xN, G.lineY[r] + 4.5, '', { class: 'vf-num' + (r ? '' : ' s'), 'text-anchor': 'end' }));
    const rs = [1, 2, 3].map(r => t(fg, G.xR, G.lineY[r] + 4.5, '', { class: 'vf-r', 'text-anchor': 'end' }));
    const ceilT = t(fg, wide ? G.xP : W - 6, G.lineY[0] + 4.5, '', { class: 'vf-ceil', 'text-anchor': wide ? 'middle' : 'end' });
    const PILL = { keep: 'Keep', notbest: 'Not best', tie: 'Tie', none: 'No gain' };
    const pills = [1, 2, 3].map(r => {
      const p = E('g', { class: 'vf-pill none', opacity: 0, transform: `translate(${G.xP},${G.lineY[r]})` }, fg);
      E('rect', { x: -G.pw / 2, y: -11, width: G.pw, height: 22, rx: 11 }, p);
      p._chk = E('path', { d: 'M-21,0.5l3,3l5.5-6.5' }, p);
      p._t = t(p, 0, 4.2, '', { 'text-anchor': 'middle' });
      return p;
    });
    function setPill(p, v) {
      p.setAttribute('class', 'vf-pill ' + v);
      p._t.textContent = PILL[v];
      p._chk.style.display = v === 'keep' ? '' : 'none';
      p._t.setAttribute('x', v === 'keep' ? 6 : 0);
    }

    const cnt = E('g', {}, fg);
    let cntText, cntAnchor;
    if (side) {
      const by = G.rowY[1] - G.rowH / 2 + 1, bh = G.rowY[3] + G.rowH / 2 - 1 - by;
      E('rect', { class: 'vf-box', x: G.box.x + 0.5, y: by, width: G.box.w - 1, height: bh, rx: 10 }, cnt);
      const cx = G.box.x + G.box.w / 2;
      t(cnt, cx, by + 24, 'Kept for agent training', { class: 'vf-boxt', 'text-anchor': 'middle' });
      cntText = t(cnt, cx, by + bh / 2 + 18, '0', { class: 'vf-cnt', 'text-anchor': 'middle' });
      t(cnt, cx, by + bh - 14, 'best positive per instance', { class: 'vf-boxs', 'text-anchor': 'middle' });
      cntAnchor = { x: cx, y: by + bh / 2 + 6 };
    } else {
      const b = G.box;
      E('rect', { class: 'vf-box', x: b.x + 0.5, y: b.y, width: b.w - 1, height: b.h, rx: 10 }, cnt);
      t(cnt, 12, b.y + 19, 'Kept for agent training', { class: 'vf-boxt' });
      t(cnt, 12, b.y + 35, 'best positive per instance', { class: 'vf-boxs' });
      cntText = t(cnt, b.w - 14, b.y + 33, '0', { class: 'vf-cnt', 'text-anchor': 'end', 'font-size': 26 });
      cntAnchor = { x: b.w - 30, y: b.y + 22 };
    }
    cntText.style.transformBox = 'fill-box'; cntText.style.transformOrigin = 'center';

    const foot = HC.h('div', { class: 'vf-foot' }, host);
    const key = HC.h('div', { class: 'vf-key', 'aria-hidden': 'true' }, foot);
    const keyIcon = (rel, label) => {
      const s = HC.h('span', {}, key);
      s.innerHTML = `<svg viewBox="-7 -7 14 14"><path d="${shapePath('circle', 6)}" style="fill:${rel ? 'var(--agent)' : 'var(--paper)'};stroke:${rel ? 'var(--agent)' : 'var(--m-base-label)'};stroke-width:1.5"/></svg>`;
      HC.h('span', {}, s, label);
    };
    keyIcon(true, 'Filled: relevant candidate');
    keyIcon(false, 'Open: other candidate');
    const kb = HC.h('span', {}, key);
    kb.innerHTML = '<svg viewBox="0 0 14 14"><rect x="0" y="1" width="14" height="12" rx="3" style="fill:var(--ink);fill-opacity:.1;stroke:var(--muted);stroke-opacity:.6"/></svg>';
    HC.h('span', {}, kb, 'Ranks counted by NDCG@' + K);
    const kOut = HC.h('span', {}, key);
    kOut.innerHTML = `<svg viewBox="-7 -7 14 14"><rect x="-6.5" y="-6.5" width="13" height="13" rx="3" style="fill:none;stroke:var(--rule);stroke-dasharray:3 3"/><path d="${shapePath('circle', 4)}" style="fill:none;stroke:var(--agent);stroke-dasharray:2.5 2;stroke-width:1.3"/></svg>`;
    HC.h('span', {}, kOut, 'Dashed: outside the harness view');
    const note = HC.h('div', { class: 'vf-note', 'aria-live': 'polite' }, foot);
    if (!wide) note.style.minHeight = '4.35em';
    const tip = HC.tooltip(host);

    const dn = v => HC.fmt(v, D);
    const rStr = v => Math.abs(v) < 0.5 / 10 ** D ? dn(0) : HC.fmtSigned(v, D);
    const tauH = i => 'τ<sub>' + i + '</sub>';
    const ROWNAME = ['Specialist ranking', 'Sampled agent ranking τ1', 'Sampled agent ranking τ2', 'Sampled agent ranking τ3'];
    const ROWHTML = ['Specialist ranking'].concat([1, 2, 3].map(i => 'Sampled agent ranking ' + tauH(i)));
    let override = null;
    const orders = () => [viewOf(st)].concat(override || st.samples);
    function targets() {
      return orders().map((ord, r) => CANDS.map((_, id) => {
        const p = ord.indexOf(id);
        if (p >= 0) return { x: G.slotX(p), y: G.rowY[r], o: 1, ghost: false };
        return { x: G.slotX(6), y: G.rowY[r], o: r === 0 ? 1 : 0, ghost: r === 0 };
      }));
    }
    function chrome() {
      const short = st.view === 'shortlist';
      divider.style.opacity = short ? 1 : 0;
      if (G.rk7) G.rk7.style.opacity = short ? 0 : 1;
      tiles.forEach(row => { row[6].style.strokeDasharray = short ? '3 3' : ''; row[6].style.fill = short ? 'none' : ''; });
      syncBtns();
      kOut.style.visibility = short ? '' : 'hidden';
      const view = viewOf(st), c = ceiling(view);
      ceilT.textContent = 'Ceiling ' + dn(c);
      ceilT.classList.toggle('at', ndcg(view) >= c - EPS);
    }
    function setGhost(n, on) { n.classList.toggle('ghost', on); }
    function moveTokens(ms, rowsToMove) {
      const T = targets(), jobs = [];
      T.forEach((row, r) => {
        if (rowsToMove && rowsToMove.indexOf(r) < 0) return;
        row.forEach((d, id) => {
          const n = toks[r][id], x0 = n._x, o0 = +n.getAttribute('opacity');
          if (d.ghost) setGhost(n, true); else if (d.o) setGhost(n, false);
          jobs.push({ n, x0, dx: d.x - x0, o0, o1: d.o, y: d.y, lift: Math.max(-1, Math.min(1, (d.x - x0) / (G.pitch * 3))) });
        });
      });
      return HC.tween(ms, k => jobs.forEach(j => {
        place(j.n, j.x0 + j.dx * k, j.y + j.lift * 9 * Math.sin(Math.PI * k));
        j.n.setAttribute('opacity', (j.o0 + (j.o1 - j.o0) * k).toFixed(3));
      }), HC.ease.inOut);
    }
    function snapTokens() {
      targets().forEach((row, r) => row.forEach((d, id) => {
        const n = toks[r][id]; place(n, d.x, d.y); n.setAttribute('opacity', d.o); setGhost(n, d.ghost);
      }));
    }
    function countUp(node, from, to, ms) {
      return HC.tween(ms, k => { node.textContent = dn(from + (to - from) * k); }, HC.ease.out);
    }
    let gen = 0;
    function hideVerdicts() {
      gen++;
      pills.forEach(p => p.setAttribute('opacity', 0));
      rs.forEach(n => { n.textContent = ''; });
      [1, 2, 3].forEach(r => { nums[r].textContent = ''; });
      krows.forEach(k => k.style.opacity = 0);
      note.classList.remove('ceil');
      note.textContent = 'Scoring the fresh responses.';
    }
    const listH = ids => ids.map(i => tauH(i + 1)).join(', ').replace(/, ([^,]*)$/, ' and $1');
    function noteFor(J) {
      const view = viewOf(st), ceil = ceiling(view);
      note.classList.toggle('ceil', J.qS >= ceil - EPS);
      if (J.qS >= ceil - EPS) {
        note.textContent = 'No response can improve on the specialist within this view' +
          (st.view === 'shortlist' ? '. Additional sampling cannot recover a relevant candidate excluded from that view.' : '.');
      } else if (J.best >= 0) {
        const tied = J.rows.map((d, i) => (i === J.best || d.verdict === 'tie') ? i : -1).filter(i => i >= 0);
        note.innerHTML = tied.length > 1
          ? listH(tied) + ' tie at ' + rStr(J.rows[J.best].r4) + ', so the first one is kept.'
          : tauH(J.best + 1) + ' has the largest positive contribution, ' + rStr(J.rows[J.best].r4) + ' over the specialist’s ' +
            dn(J.qS) + ', and is kept.';
      } else note.textContent = 'No response passes verification on this instance, so none is kept.';
    }
    function labelHits(J) {
      hitRects.forEach((hr, r) => {
        const q = r ? J.rows[r - 1].q : J.qS;
        hr.setAttribute('aria-label', ROWNAME[r] + ', NDCG@' + K + ' ' + dn(q) +
          (r ? ', contribution ' + rStr(J.rows[r - 1].r4) + ', ' + PILL[J.rows[r - 1].verdict] : ''));
      });
    }
    function showR(i, d) { rs[i].textContent = rStr(d.r4); rs[i].classList.toggle('pos', d.r > 0); }
    function drawFinal() {
      const J = judge(st);
      gen++;
      chrome(); snapTokens();
      nums[0].textContent = dn(J.qS);
      J.rows.forEach((d, i) => {
        nums[i + 1].textContent = dn(d.q);
        showR(i, d);
        setPill(pills[i], d.verdict); pills[i].setAttribute('opacity', 1);
        pills[i].setAttribute('transform', `translate(${G.xP},${G.lineY[i + 1]})`);
        krows[i].style.opacity = d.verdict === 'keep' ? 0.7 : 0;
      });
      cntText.textContent = String(st.kept);
      noteFor(J); labelHits(J);
      return J;
    }
    function commit() {
      st.samples = [0, 1, 2].map(() => sampleOrder(st.rng, viewOf(st)));
      const J = judge(st);
      if (J.best >= 0) st.kept += 1;
      return J;
    }

    async function reveal(J) {
      const g0 = gen;
      labelHits(J);
      await Promise.all(J.rows.map((d, i) => countUp(nums[i + 1], 0, d.q, 520)));
      J.rows.forEach((d, i) => showR(i, d));
      for (let i = 0; i < 3; i++) {
        setPill(pills[i], J.rows[i].verdict);
        const p = pills[i], y = G.lineY[i + 1];
        HC.tween(300, k => {
          if (gen !== g0) return;
          p.setAttribute('opacity', Math.min(1, k * 1.6).toFixed(3));
          p.setAttribute('transform', `translate(${G.xP},${y}) scale(${(0.6 + 0.4 * k).toFixed(3)})`);
        }, HC.ease.back);
        await HC.wait(110);
      }
      noteFor(J);
      if (J.best < 0) return;
      await HC.wait(200);
      const kr = krows[J.best];
      await HC.tween(260, k => { if (gen === g0) kr.style.opacity = k; }, HC.ease.out);
      await flyToCounter(J.best);
      if (gen !== g0) return;
      cntText.textContent = String(st.kept);
      HC.tween(380, k => { cntText.style.transform = `scale(${(1 + 0.28 * Math.sin(Math.PI * k)).toFixed(3)})`; });
      HC.tween(500, k => { if (gen === g0) kr.style.opacity = (1 - 0.3 * k).toFixed(3); });
    }
    async function flyToCounter(i) {
      if (HC.REDUCED) return;
      const x0 = G.xP, y0 = G.lineY[i + 1], x1 = cntAnchor.x, y1 = cntAnchor.y;
      const card = E('g', { class: 'vf-fly' }, fly);
      E('rect', { x: -15, y: -9, width: 30, height: 18, rx: 4 }, card);
      [-7, 0, 7].forEach((dx, j) => E('circle', { cx: dx, cy: 0, r: 2.6, fill: st.samples[i].slice(0, K).map(c => CANDS[c].rel)[j] ? 'var(--agent)' : 'var(--rule)' }, card));
      const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - (side ? 46 : 30);
      await HC.tween(620, k => {
        const a = 1 - k, x = a * a * x0 + 2 * a * k * cx + k * k * x1, y = a * a * y0 + 2 * a * k * cy + k * k * y1;
        card.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(1 - 0.35 * k).toFixed(3)})`);
        card.setAttribute('opacity', k > 0.85 ? ((1 - k) / 0.15).toFixed(3) : 1);
      }, HC.ease.inOut);
      card.remove();
    }

    const hitRects = [0, 1, 2, 3].map(r => {
      const y = wide ? G.rowY[r] - G.rowH / 2 : G.lineY[r] - 14;
      const hgt = wide ? G.rowH : G.rowY[r] + G.tile / 2 + 5 - y;
      const x = wide ? (r ? 124 : 0) : 0;
      return E('rect', { class: 'vf-hit', x, y, width: G.rEnd - x, height: hgt, rx: 9, tabindex: 0 }, hits);
    });
    function tipHtml(r) {
      const J = judge(st), ord = orders()[r];
      let s = '<b>' + ROWHTML[r] + '</b>';
      for (let p = 1; p <= K; p++) {
        const c = CANDS[ord[p - 1]];
        s += '<br>Rank ' + p + ': ' + (c.rel ? 'relevant, 1/log<sub>2</sub>(' + (p + 1) + ') = ' + dn(gain(p)) : 'not relevant');
      }
      s += '<br>NDCG@' + K + ' = ' + dn(dcg(ord)) + ' / ' + dn(IDCG) + ' = <b>' + dn(r ? J.rows[r - 1].q : J.qS) + '</b>';
      if (r) s += '<br>r = ' + dn(J.rows[r - 1].q) + ' − ' + dn(J.qS) + ' = <b>' + rStr(J.rows[r - 1].r4) + '</b>';
      else {
        const view = viewOf(st), m = view.filter(c => CANDS[c].rel).length;
        s += '<br>The ideal ' + dn(IDCG) + ' counts all ' + N_REL + ' relevant candidates in the pool.' +
          '<br>Ceiling ' + dn(ceiling(view)) + ': the best NDCG@' + K + ' any ordering of this view can reach, with ' +
          m + ' of the ' + N_REL + ' relevant candidates in view.';
      }
      return s;
    }
    hitRects.forEach((hr, r) => {
      const ok = () => !(r && !nums[r].textContent);
      hr.addEventListener('mousemove', e => { if (ok()) tip.show(e.clientX, e.clientY, tipHtml(r)); });
      hr.addEventListener('mouseleave', () => tip.hide());
      hr.addEventListener('blur', () => tip.hide());
      const atRect = () => {
        if (!ok()) return;
        tip.show(0, 0, tipHtml(r));
        const b = hr.getBoundingClientRect(), hb = host.getBoundingClientRect(), sb = F.svg.getBoundingClientRect();
        const n = tip.node, tw = n.offsetWidth, th = n.offsetHeight;
        let y = b.bottom - hb.top + 4;
        if (y + th > hb.height - 4) y = b.top - hb.top - th - 4;
        const x = Math.min(sb.left - hb.left + (wide ? G.slotX(0) - G.tile / 2 : 0), hb.width - tw - 4);
        n.style.left = Math.max(2, x) + 'px'; n.style.top = Math.max(2, y) + 'px';
      };
      hr.addEventListener('focus', atRect);
      hr.addEventListener('click', e => { if (e.detail === 0 || e.pointerType !== 'mouse') atRect(); });
    });

    let pending = null;
    const alive = () => host.contains(F.svg);
    async function run(fn) {
      if (busy) { pending = fn; return; }
      busy = true; tip.hide();
      try { await fn(); } finally { busy = false; }
      if (pending && alive()) { const f = pending; pending = null; run(f); }
    }
    async function resample() {
      hideVerdicts();
      const J = commit();
      await moveTokens(680, [1, 2, 3]);
      await reveal(J);
    }
    function setOpt(key, val) {
      if (!played) {
        if (st[key] !== val) { st[key] = val; st.samples = [0, 1, 2].map(() => sampleOrder(st.rng, viewOf(st))); drawPre(); }
        return;
      }
      run(async () => {
        if (st[key] === val) return;
        const qOld = ndcg(viewOf(st));
        st[key] = val;
        hideVerdicts(); chrome();
        const J = commit();
        await Promise.all([moveTokens(700), countUp(nums[0], qOld, J.qS, 700)]);
        await reveal(J);
      });
    }
    go.addEventListener('click', () => played ? run(resample) : inst.play());

    async function intro(J) {
      const view = viewOf(st);
      chrome(); hideVerdicts();
      override = [0, 1, 2].map(() => view.slice());
      snapTokens();
      toks.forEach(row => row.forEach(n => n.setAttribute('opacity', 0)));
      const T = targets();
      for (let r = 0; r < 4; r++) {
        const ord = r ? view : view.concat(st.view === 'shortlist' ? [6] : []);
        ord.forEach((id, p) => {
          const n = toks[r][id], d = T[r][id];
          setTimeout(() => HC.tween(320, k => { n.setAttribute('opacity', (d.o * k).toFixed(3)); place(n, d.x, d.y - 8 * (1 - k)); }, HC.ease.out), p * 45 + r * 90);
        });
        if (r === 0) countUp(nums[0], 0, J.qS, 700);
      }
      await HC.wait(7 * 45 + 3 * 90 + 420);
      override = null;
      await moveTokens(760, [1, 2, 3]);
      await reveal(J);
    }

    let played = false;
    function drawPre() {
      chrome(); snapTokens(); hideVerdicts();
      note.textContent = '';
      toks.forEach((row, r) => { if (r) row.forEach(n => n.setAttribute('opacity', 0)); });
      nums[0].textContent = dn(ndcg(viewOf(st)));
    }
    if (st.intro) drawFinal(); else drawPre();

    const inst = {
      play(instant) {
        if (played) return;
        played = true;
        if (st.intro) { drawFinal(); return; }
        st.intro = true;
        const J = judge(st);
        if (J.best >= 0) st.kept += 1;
        if (instant || HC.REDUCED) { drawFinal(); return; }
        run(() => intro(J));
      },
    };
    return inst;
  });
})();
