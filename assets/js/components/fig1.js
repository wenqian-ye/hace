(function () {
  'use strict';
  const HC = window.HC;
  const TA = 10000;
  const TB = 4000;
  const TS = 3400;
  const SLIDE = 900;
  const CYC = 3;

  const CSS = `
#viz-fig1 .f1-pill{position:absolute;top:0;right:0;z-index:2}
#viz-fig1 .f1-pill svg{fill:currentColor}
#viz-fig1 .f1-pill:focus-visible{outline:2px solid var(--specialist);outline-offset:2px}
#viz-fig1 text{font-family:var(--sans)}
#viz-fig1 .f1-title{font-size:14.5px;font-weight:700;fill:var(--fig-title)}
#viz-fig1 .f1-node{font-size:14.5px;font-weight:700;fill:var(--ink)}
#viz-fig1 .f1-cap{font-size:12.5px;fill:var(--fig-sub)}
#viz-fig1 .f1-lab{font-size:13px;fill:var(--muted)}
#viz-fig1 .f1-head{font-size:14.5px;font-weight:700}
#viz-fig1 .f1-head.n{font-size:13.5px}
#viz-fig1 .f1-sub{font-size:12.5px;fill:var(--fig-sub)}
#viz-fig1 text.f1-math{font-family:var(--serif);font-style:italic;font-size:17px}
#viz-fig1 .f1-arc{fill:none;stroke-width:1.5;stroke-linecap:round}
#viz-fig1 .f1-trail{fill:none;stroke-width:3;stroke-linecap:round;opacity:0}
#viz-fig1 .f1-net rect{fill:var(--specialist-panel);stroke:var(--specialist-line);stroke-width:1.1;transition:stroke .4s,fill .4s}
#viz-fig1 .f1-net line{stroke:var(--specialist);stroke-opacity:.26;stroke-width:.9;transition:stroke-opacity .3s}
#viz-fig1 .f1-net circle{fill:var(--paper);stroke:var(--specialist);stroke-width:1.2;transition:fill .3s}
#viz-fig1 .f1-net .on line{stroke-opacity:.75}
#viz-fig1 .f1-net .on circle{fill:var(--specialist-line)}
#viz-fig1 .f1-net.on rect{stroke:var(--specialist);fill:var(--specialist-soft)}
#viz-fig1 .f1-bot>rect{fill:var(--agent-panel);stroke:var(--agent-line);stroke-width:1.1;transition:stroke .4s,fill .4s}
#viz-fig1 .f1-bot .bar{fill:var(--paper);stroke:var(--agent);stroke-width:1.1;transition:fill .3s}
#viz-fig1 .f1-bot .tk{stroke:var(--agent-line);stroke-width:1}
#viz-fig1 .f1-bot .wire{fill:none;stroke:var(--agent);stroke-width:1}
#viz-fig1 .f1-bot .sq{fill:var(--agent-soft);stroke:var(--agent);stroke-width:1.1;transition:fill .3s}
#viz-fig1 .f1-bot .sq.on,#viz-fig1 .f1-bot .bar.on{fill:var(--agent-line)}
#viz-fig1 .f1-bot.on>rect{stroke:var(--agent);fill:var(--agent-soft)}
#viz-fig1 .f1-person circle,#viz-fig1 .f1-person path{fill:var(--rule-2);stroke:var(--muted);stroke-width:1.3;transition:fill .4s}
#viz-fig1 .f1-person.on circle,#viz-fig1 .f1-person.on path{fill:var(--rule)}
#viz-fig1 .f1-think circle{fill:var(--muted);opacity:0;transition:opacity .3s}
#viz-fig1 .f1-think circle.on{opacity:.8}
#viz-fig1 .f1-doc rect{fill:var(--paper);stroke:var(--dot);stroke-width:1}
#viz-fig1 .f1-doc line{stroke:var(--dot);stroke-width:1}
#viz-fig1 .f1-doc.sel rect{fill:var(--agent-soft);stroke:var(--agent);transition:fill .3s}
#viz-fig1 .f1-doc.sel line{stroke:var(--agent);stroke-opacity:.55}
#viz-fig1 .f1-docs.on .f1-doc.sel rect{fill:var(--agent-line)}
#viz-fig1 .f1-hbox rect{fill:var(--harness-panel);stroke:var(--harness-line);stroke-width:1;transition:stroke .4s,fill .4s}
#viz-fig1 .f1-hbox line{stroke:var(--harness-line);stroke-width:1}
#viz-fig1 .f1-hbox text{font-size:13px;fill:var(--harness)}
#viz-fig1 .f1-hbox rect.on{fill:var(--harness-soft);stroke:var(--harness)}
#viz-fig1 .f1-shp{fill:var(--paper);stroke:var(--faint);stroke-width:1.2;transition:stroke .3s}
#viz-fig1 .f1-shp.rel{fill:var(--agent);stroke:var(--agent)}
#viz-fig1 .f1-row.on .f1-shp:not(.rel){stroke:var(--specialist)}
#viz-fig1 .f1-brk{fill:none;stroke:var(--faint);stroke-width:1.1;transition:stroke .3s}
#viz-fig1 .f1-brk.on{stroke:var(--specialist)}
#viz-fig1 .f1-rbox rect{fill:var(--paper);stroke:var(--specialist-line);stroke-width:1.1;transition:fill .3s,stroke .3s}
#viz-fig1 .f1-rbox text{font-size:13.5px;fill:var(--specialist)}
#viz-fig1 .f1-rbox.on rect{fill:var(--specialist-soft);stroke:var(--specialist)}
#viz-fig1 .f1-rule{stroke:var(--rule);stroke-width:1}
#viz-fig1 .f1-sbox rect{stroke-width:1.3}
#viz-fig1 .f1-rlab{font-size:12.5px;fill:var(--muted)}
#viz-fig1 .f1-sarrow{fill:none;stroke:var(--muted);stroke-width:1.4}
#viz-fig1 .f1-dots{font-size:20px;font-weight:700;fill:var(--ink-2);letter-spacing:1px}
`;
  function injectCss() {
    if (document.querySelector('style[data-hc="fig1"]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-hc', 'fig1');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const el = (t, a, p) => HC.el(t, a, p);
  const txt = (p, x, y, s, cls, anchor) => HC.text(p, x, y, s, { class: cls, 'text-anchor': anchor || 'middle' });
  function wrapTxt(p, x, y, s, cls, maxW, lh) {
    const t = txt(p, x, y, s, cls);
    if (t.getComputedTextLength() <= maxW) return { t, extra: 0 };
    const words = s.split(' ');
    let best = 1, bestD = Infinity;
    for (let i = 1; i < words.length; i++) {
      const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (d < bestD) { bestD = d; best = i; }
    }
    t.textContent = words.slice(0, best).join(' ');
    const t2 = txt(p, x, y + lh, words.slice(best).join(' '), cls);
    return { t, t2, extra: lh };
  }

  function netGlyph(p, cx, cy, w, h) {
    const g = el('g', { class: 'f1-net' }, p);
    el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 3 }, g);
    const sizes = [3, 4, 4, 2], sp = h * 0.205, r = w >= 80 ? 3.3 : 3;
    const xs = sizes.map((_, i) => cx - w * 0.36 + i * w * 0.24);
    const ys = sizes.map(n => Array.from({ length: n }, (_, j) => cy + (j - (n - 1) / 2) * sp));
    const layers = sizes.map(() => el('g', {}, g));
    for (let i = 1; i < sizes.length; i++)
      ys[i - 1].forEach(y0 => ys[i].forEach(y1 => el('line', { x1: xs[i - 1], y1: y0, x2: xs[i], y2: y1 }, layers[i])));
    sizes.forEach((_, i) => ys[i].forEach(y => el('circle', { cx: xs[i], cy: y, r }, layers[i])));
    let last = -1;
    g.setLevel = k => {
      if (k === last) return;
      last = k;
      layers.forEach((l, i) => l.classList.toggle('on', i < k));
      g.classList.toggle('on', k > 0);
    };
    return g;
  }

  function agentGlyph(p, cx, cy, w, h) {
    const g = el('g', { class: 'f1-bot' }, p);
    el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 3 }, g);
    const bx = cx - w * 0.36, bw = w * 0.72, bh = h * 0.15;
    const bars = [cy - h * 0.33, cy - h * 0.1].map(y => {
      const b = el('rect', { class: 'bar', x: bx, y, width: bw, height: bh, rx: 1.5 }, g);
      [0.25, 0.5, 0.75].forEach(f => el('line', { class: 'tk', x1: bx + bw * f, x2: bx + bw * f, y1: y + 2, y2: y + bh - 2 }, g));
      return b;
    });
    const wy = cy + h * 0.13, sy = cy + h * 0.21, ss = h * 0.15;
    const sx = [0, 1, 2, 3].map(i => cx - w * 0.3 + i * w * 0.2);
    el('path', { class: 'wire', d: `M${sx[0]},${sy}V${wy}H${sx[3]}V${sy}` + sx.slice(1, 3).map(x => `M${x},${wy}V${sy}`).join('') }, g);
    el('line', { class: 'wire', x1: cx, x2: cx, y1: cy - h * 0.1 + bh, y2: wy }, g);
    const sqs = sx.map(x => el('rect', { class: 'sq', x: x - ss / 2, y: sy, width: ss, height: ss, rx: 1 }, g));
    const units = bars.concat(sqs);
    let last = -1;
    g.setLevel = k => {
      if (k === last) return;
      last = k;
      units.forEach((u, i) => u.classList.toggle('on', i < k));
      g.classList.toggle('on', k > 0);
    };
    g.units = units.length;
    return g;
  }

  function personGlyph(p, cx, cy, s) {
    const g = el('g', { class: 'f1-person' }, p);
    el('path', { d: `M${cx - s * .44},${cy + s * .46}v${-s * .12}a${s * .44} ${s * .34} 0 0 1 ${s * .88} 0v${s * .12}z` }, g);
    el('circle', { cx, cy: cy - s * .3, r: s * .2 }, g);
    const think = el('g', { class: 'f1-think' }, p);
    g.dots = [0, 1, 2].map(i => el('circle', { cx: cx + s * .3 + i * 7, cy: cy - s * .62 - i * 3, r: 2 + i * .4 }, think));
    return g;
  }

  function doc(p, x, y, sel) {
    const g = el('g', { class: 'f1-doc' + (sel ? ' sel' : ''), transform: `translate(${x - 5.5},${y - 7})` }, p);
    el('rect', { width: 11, height: 14, rx: 1 }, g);
    [4, 7, 10].forEach(v => el('line', { x1: 2.5, x2: 8.5, y1: v, y2: v }, g));
    return g;
  }

  function shape(p, kind, s, rel) {
    const a = { class: 'f1-shp' + (rel ? ' rel' : '') }, k = s / 2;
    if (kind === 'sq') return el('rect', Object.assign(a, { x: -k, y: -k, width: s, height: s }), p);
    if (kind === 'ci') return el('circle', Object.assign(a, { r: k + .5 }), p);
    if (kind === 'di') return el('path', Object.assign(a, { d: `M0,${-k * 1.25}L${k * 1.25},0L0,${k * 1.25}L${-k * 1.25},0Z` }), p);
    return el('path', Object.assign(a, { d: `M0,${-k * 1.15}L${k * 1.2},${k * .9}L${-k * 1.2},${k * .9}Z` }), p);
  }

  function mathLabel(p, x, y, letter, sub, color, maxW) {
    const t = el('text', { x, y, class: 'f1-math', 'text-anchor': 'middle', style: `fill:${color}` }, p);
    el('tspan', {}, t).textContent = letter;
    const s = el('tspan', { dy: 4, 'font-size': 11.5 }, t);
    s.textContent = sub;
    t.setSub = v => {
      s.textContent = v;
      t.style.fontSize = '';
      s.setAttribute('font-size', 11.5);
      const L = t.getComputedTextLength();
      if (maxW && L > maxW) {
        const k = maxW / L;
        t.style.fontSize = (17 * k).toFixed(1) + 'px';
              }
    };
    return t;
  }

  function hv(x0, y0, x1, y1, r) {
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    r = Math.min(r, Math.abs(x1 - x0), Math.abs(y1 - y0));
    return `M${x0},${y0}H${x1 - sx * r}Q${x1},${y0} ${x1},${y0 + sy * r}V${y1}`;
  }
  function vh(x0, y0, x1, y1, r) {
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    r = Math.min(r, Math.abs(x1 - x0), Math.abs(y1 - y0));
    return `M${x0},${y0}V${y1 - sy * r}Q${x0},${y1} ${x0 + sx * r},${y1}H${x1}`;
  }

  function arc(p, d, color, marker) {
    const path = el('path', { class: 'f1-arc', d, style: `stroke:${color}`, 'marker-end': marker }, p);
    const trail = el('path', { class: 'f1-trail', d, style: `stroke:${color}` }, p);
    const L = path.getTotalLength();
    return { path, trail, L };
  }

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const seg = (f, a, b) => (f < a || f > b) ? null : (f - a) / (b - a);
  const sweep = (f, a, step, n) => f < a ? 0 : Math.min(n, 1 + Math.floor((f - a) / step));
  function travel(a, mover, t, tail) {
    if (t === null) {
      if (mover.__on) { mover.style.opacity = 0; a.trail.style.opacity = 0; mover.__on = false; }
      return;
    }
    const pos = HC.ease.inOut(t) * a.L, pt = a.path.getPointAtLength(pos);
    const o = Math.min(1, t / 0.1, (1 - t) / 0.1);
    mover.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
    mover.style.opacity = o;
    a.trail.style.strokeDasharray = `${tail} ${a.L + tail}`;
    a.trail.style.strokeDashoffset = tail - pos;
    a.trail.style.opacity = 0.45 * o;
    mover.__on = true;
  }
  const toggle = (node, cls, on) => { if (node.__st !== on) { node.classList.toggle(cls, on); node.__st = on; } };

  function buildStrip(p, W, narrow, xT, mk, C) {
    const top = narrow ? 0 : 6;
    txt(p, 0, top + 38, 'Coevolution across rounds', 'f1-node', 'start');
    txt(p, 0, top + 60, 'Specialist (S), harness (H), agent (A)', 'f1-cap', 'start');
    const trackW = W - xT, yL = narrow ? 92 : top + 30, yBox = yL + 10, bh = 32;
    const step = narrow ? Math.floor((trackW - 22) / 2) : Math.min(262, Math.floor((trackW - 34) / 2)), gw = step - (narrow ? 18 : Math.round(step * 0.2)), gap = narrow ? 3 : 6;
    const bw = (gw - 2 * gap) / 3;
    const outer = el('g', { transform: `translate(${xT},0)` }, p);
    const cid = 'f1clip' + HC.uid();
    el('rect', { x: -4, y: yL - 20, width: 2 * step + 4, height: bh + 40 }, el('clipPath', { id: cid }, outer));
    const clip = el('g', { 'clip-path': `url(#${cid})` }, outer);
    const track = el('g', {}, clip);
    const parts = [['S', C.specialist, '--specialist-panel'], ['H', C.harness, '--harness-panel'], ['A', C.agent, '--agent-panel']];
    const groups = [0, 1, 2].map(i => {
      const g = el('g', { transform: `translate(${i * step},0)` }, track);
      const lab = txt(g, gw / 2, yL, '', 'f1-rlab');
      const maths = parts.map(([L, col, fill], j) => {
        const b = el('g', { class: 'f1-sbox' }, g);
        el('rect', { x: j * (bw + gap), y: yBox, width: bw, height: bh, style: `fill:var(${fill});stroke:${col}` }, b);
        return mathLabel(b, j * (bw + gap) + bw / 2, yBox + bh / 2 + 4, L, '', col, bw - 8);
      });
      const ar = el('path', { class: 'f1-sarrow', d: `M${gw + (narrow ? 5 : 12)},${yBox + bh / 2}H${step - (narrow ? 7 : 14)}`, 'marker-end': mk.muted }, g);
      return { g, lab, maths, ar };
    });
    const dots = txt(outer, 2 * step + (narrow ? 2 : 6), yBox + bh / 2 + 5, '...', 'f1-dots', 'start');
    let shown = -1;
    function label(k) {
      if (k === shown) return;
      shown = k;
      groups.forEach((gr, i) => {
        const n = k + i;
        gr.lab.textContent = n ? `Round t + ${n}` : 'Round t';
        gr.maths.forEach(m => m.setSub(n ? `t+${n}` : 't'));
      });
    }
    function place(e) {
      track.setAttribute('transform', `translate(${(-step * e).toFixed(1)},0)`);
      groups[0].g.style.opacity = 1 - e;
      groups[2].g.style.opacity = e;
      dots.style.opacity = Math.abs(1 - 2 * e);
    }
    return {
      h: narrow ? 146 : 96,
      update(c) {
        const r = Math.floor(c / TS), k = r % CYC, local = c % TS;
        const e = local > TS - SLIDE ? HC.ease.inOut((local - (TS - SLIDE)) / SLIDE) : 0;
        if (k < CYC - 1) { label(k); place(e); track.style.opacity = 1; return; }
        label(e < 0.5 ? k : 0); place(0); track.style.opacity = Math.abs(1 - 2 * e);
      },
      still() { label(0); place(0); track.style.opacity = 1; },
    };
  }

  function buildB(p, w, narrow, mk, C) {
    const dy = narrow ? 18 : 0;
    const xS = narrow ? 70 : Math.round(w * 0.2), xA = narrow ? w - 72 : Math.round(w * 0.84);
    const cx = narrow ? Math.round((xS + xA) / 2) : Math.round(w * 0.52);
    const zone = narrow ? xA - xS - 20 : Infinity;
    const gw = narrow ? 80 : 90, gh = narrow ? 58 : 64;
    if (narrow) {
      txt(p, 0, 16, '(b) Heterogeneous Agentic', 'f1-title', 'start');
      txt(p, 0, 34, 'Coevolution (HACE)', 'f1-title', 'start');
    } else txt(p, 0, 16, '(b) Heterogeneous Agentic Coevolution (HACE)', 'f1-title', 'start');
    const sup = wrapTxt(p, narrow ? cx : Math.round(w * 0.52), 128 + dy, 'Supervision from task labels', 'f1-sub', zone, 15);
    const cy = 168 + dy + sup.extra;

    const yD = 88 + dy, xDR = cx + (narrow ? 28 : Math.round(w * 0.1)), xDL = cx - (narrow ? 48 : Math.round(w * 0.1)), er = narrow ? 18 : 30;
    txt(p, cx, 52 + dy, 'Agent-guided instance selection', 'f1-head', 'middle').style.fill = C.agent;
    const s1 = arc(p, vh(xA, cy - gh / 2 - 3, xDR + 30, yD, er), C.agent, mk.agent);
    const s2 = arc(p, `M${xDR - 30},${yD}H${xDL + 30}`, C.agent, mk.agent);
    const s3 = arc(p, hv(xDL - 30, yD, xS, cy - gh / 2 - 3, er), C.agent, mk.agent);
    const gR = el('g', { class: 'f1-docs' }, p), gL = el('g', { class: 'f1-docs' }, p);
    [[1, 0, 1], [0, 1, 0]].forEach((row, r) => row.forEach((sel, i) => doc(gR, xDR + (i - 1) * 17, yD - 10 + r * 20, sel)));
    [0, 1, 2].forEach(i => doc(gL, xDL + (i - 1) * 17, yD, 1));

    const net = netGlyph(p, xS, cy, gw, gh);
    const bot = agentGlyph(p, xA, cy, gw, gh);
    txt(p, xS, cy + 58, 'Specialized', 'f1-node');
    txt(p, xS, cy + 76, 'foundation model', 'f1-node');
    txt(p, xA, cy + 67, 'LLM agent', 'f1-node');
    txt(p, xS, cy + 102, 'Supervised adaptation', 'f1-cap');
    txt(p, xA, cy + 102, 'Reinforced self-training', 'f1-cap');

    const hw = narrow ? Math.min(152, zone) : 172;
    const hy = (narrow ? cy + 136 : 184) + wrapTxt(p, cx, narrow ? cy + 136 : 184, 'Harness optimization', 'f1-node', zone, 17).extra;
    const hb = el('g', { class: 'f1-hbox' }, p);
    const hcells = [0, 1].map(i => el('rect', { x: cx - hw / 2 + i * hw / 2, y: hy + 12, width: hw / 2, height: 27 }, hb));
    el('rect', { x: cx - hw / 2, y: hy + 12, width: hw, height: 27, style: 'fill:none' }, hb);
    el('line', { x1: cx, x2: cx, y1: hy + 18, y2: hy + 33 }, hb);
    txt(hb, cx - hw / 4, hy + 30, 'Context');
    txt(hb, cx + hw / 4, hy + 30, 'Curricula');

    const ry = narrow ? hy + 72 : 304;
    const rh = wrapTxt(p, cx, ry, 'Model-referenced reward', 'f1-head' + (narrow ? ' n' : ''), zone, 16);
    [rh.t, rh.t2].forEach(t => { if (t) t.style.fill = C.specialist; });
    const yM = ry + 26 + rh.extra, yG = yM + 24, yB = (yM + yG) / 2, sp = narrow ? 17 : 21, bw = 52;
    const gB = narrow ? 11 : 13, gArr = narrow ? 16 : 24;
    const lm = txt(p, 0, yM + 4.5, 'Model', 'f1-cap', 'end'), lmW = lm.getComputedTextLength();
    const boxX = narrow ? Math.max(xA - bw / 2, xS + 16 + lmW + 14 + 3 * sp + gB + gArr) : cx + 52;
    const xb = boxX - gArr, x0 = xb - gB - 3 * sp, xl = x0 - 14;
    lm.setAttribute('x', xl);
    txt(p, xl, yG + 4.5, 'Agent', 'f1-cap', 'end');
    const labLeft = xl - lmW;
    const rowM = el('g', { class: 'f1-row' }, p), rowG = el('g', { class: 'f1-row' }, p);
    ['sq', 'di', 'ci', 'tr'].forEach((k, i) => {
      const g = el('g', { transform: `translate(${x0 + i * sp},${yM})` }, rowM);
      shape(g, k, 11, k === 'ci');
    });
    const agentItems = [['ci', 2, 0], ['sq', 0, 1], ['di', 1, 2], ['tr', 3, 3]].map(([k, a, b]) => {
      const g = el('g', {}, rowG);
      shape(g, k, 11, k === 'ci');
      return { g, a, b, lift: k === 'ci' };
    });
    const brk = el('path', { class: 'f1-brk', d: `M${xb - 5},${yM - 8}H${xb}V${yG + 8}H${xb - 5}M${xb},${yB}H${xb + 3}` }, p);
    el('path', { class: 'f1-arc', d: `M${xb + 4},${yB}H${boxX - 3}`, style: `stroke:${C.specialist}`, 'marker-end': mk.specialist }, p);
    const rb = el('g', { class: 'f1-rbox' }, p);
    el('rect', { x: boxX, y: yB - 13, width: bw, height: 26, rx: 1 }, rb);
    const rt = el('text', { x: boxX + bw / 2, y: yB + 4.5, 'text-anchor': 'middle' }, rb);
    el('tspan', { style: 'font-style:italic;font-family:var(--serif)' }, rt).textContent = 'r';
    el('tspan', {}, rt).textContent = ' > 0';
    const s4 = arc(p, vh(xS, cy + 111, labLeft - 6, yM, narrow ? 10 : 26), C.specialist, mk.specialist);
    const s5 = arc(p, narrow ? `M${xA},${yB - 14}V${cy + 111}` : hv(boxX + bw, yB, xA, cy + 111, 26), C.specialist, mk.specialist);
    const ly = yG + 34, lt = 'Relevant candidate';
    const leg = el('g', {}, p);
    const ltx = txt(leg, 0, ly + 4.5, lt, 'f1-cap', 'start');
    const lw = ltx.getComputedTextLength() + 16, lx = (x0 + 1.5 * sp) - lw / 2;
    ltx.setAttribute('x', lx + 16);
    el('circle', { class: 'f1-shp rel', cx: lx + 5, cy: ly, r: 5 }, leg);

    const dS = el('circle', { r: 4.2, style: `fill:${C.agent};opacity:0` }, p);
    const docMover = () => { const g = el('g', { style: 'opacity:0' }, p); doc(g, 0, 0, 1); return g; };
    const d2 = docMover(), d3 = docMover();
    const dR = el('circle', { r: 4.2, style: `fill:${C.specialist};opacity:0` }, p);
    const dR2 = el('circle', { r: 4.2, style: `fill:${C.specialist};opacity:0` }, p);

    function placeAgentRow(e, o) {
      agentItems.forEach(it => {
        const x = x0 + (it.a + (it.b - it.a) * e) * sp, y = yG - (it.lift ? 11 * Math.sin(Math.PI * e) : 0);
        it.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      });
      rowG.style.opacity = o;
    }
    return {
      h: narrow ? ly + 12 : 396,
      update(c) {
        const f = (c % TB) / TB;
        travel(s1, dS, seg(f, 0, 0.3), 34);
        toggle(gR, 'on', f >= 0.28 && f < 0.44);
        travel(s2, d2, seg(f, 0.4, 0.55), 20);
        toggle(gL, 'on', f >= 0.53 && f < 0.66);
        travel(s3, d3, seg(f, 0.62, 0.88), 34);
        toggle(hcells[1], 'on', f >= 0.4 && f < 0.88);
        net.setLevel(f >= 0.86 ? sweep(f, 0.86, 0.035, 4) : f < 0.08 ? 4 : 0);

        travel(s4, dR, seg(f, 0, 0.26), 34);
        toggle(rowM, 'on', f >= 0.24 && f < 0.4);
        const e = f < 0.36 ? 0 : f < 0.54 ? HC.ease.inOut((f - 0.36) / 0.18) : f < 0.96 ? 1 : 0;
        placeAgentRow(e, f >= 0.92 ? Math.abs(Math.cos(Math.PI * (f - 0.92) / 0.08)) : 1);
        toggle(brk, 'on', f >= 0.52 && f < 0.7);
        toggle(rb, 'on', f >= 0.56 && f < 0.88);
        toggle(hcells[0], 'on', f >= 0.24 && f < 0.54);
        travel(s5, dR2, seg(f, 0.62, 0.88), 34);
        bot.setLevel(f >= 0.86 ? sweep(f, 0.86, 0.022, bot.units) : f < 0.08 ? bot.units : 0);
      },
      still() {
        [[s1, dS], [s2, d2], [s3, d3], [s4, dR], [s5, dR2]].forEach(([a, m]) => travel(a, m, null));
        [gR, gL, rowM, brk, rb, hcells[0], hcells[1]].forEach(n => toggle(n, 'on', false));
        net.setLevel(0); bot.setLevel(0);
        placeAgentRow(1, 1);
      },
    };
  }

  function buildA(p, w, mk, C) {
    const xM = Math.round(w * 0.27), xR = Math.round(w * 0.75), cy = 168, mid = (xM + xR) / 2;
    txt(p, 0, 16, '(a) Human-directed optimization', 'f1-title', 'start');
    const up = arc(p, `M${xR},128C${xR},58 ${xM},58 ${xM},134`, C.faint, mk.faint);
    const lo = arc(p, `M${xM},281C${xM},352 ${xR},352 ${xR},281`, C.faint, mk.faint);
    txt(p, mid, 62, 'Training design', 'f1-lab');
    txt(p, mid, 362, 'Evaluation feedback', 'f1-lab');
    const net = netGlyph(p, xM, cy, 90, 64);
    const person = personGlyph(p, xR, cy - 4, 60);
    txt(p, xM, 226, 'Specialized', 'f1-node');
    txt(p, xM, 244, 'foundation model', 'f1-node');
    txt(p, xR, 235, 'Researcher', 'f1-node');
    txt(p, xM, 270, 'Supervised adaptation', 'f1-cap');
    txt(p, xR, 270, 'Manual revision', 'f1-cap');
    const dUp = el('circle', { r: 4.5, style: `fill:${C.muted};opacity:0` }, p);
    const dLo = el('circle', { r: 4.5, style: `fill:${C.muted};opacity:0` }, p);
    return {
      h: 368,
      update(c) {
        const f = (c % TA) / TA;
        travel(up, dUp, seg(f, 0, 0.3), 46);
        travel(lo, dLo, seg(f, 0.44, 0.74), 46);
        net.setLevel(f >= 0.29 && f < 0.6 ? sweep(f, 0.29, 0.035, 4) : 0);
        const think = f >= 0.74;
        toggle(person, 'on', think);
        person.dots.forEach((d, i) => toggle(d, 'on', think && f >= 0.76 + i * 0.05 && f < 0.985));
      },
      still() { travel(up, dUp, null); travel(lo, dLo, null); net.setLevel(0); toggle(person, 'on', false); person.dots.forEach(d => toggle(d, 'on', false)); },
    };
  }

  const ICON = {
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.8" height="9" rx=".6"/><rect x="7.2" y="1.5" width="2.8" height="9" rx=".6"/></svg>',
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z"/></svg>',
  };

  HC.register('fig1', function (host, api) {
    injectCss();
    host.setAttribute('role', 'group');
    const W = Math.max(300, host.clientWidth), narrow = W < 720;
    const colW = narrow ? Math.min(W, 420) : W, offX = Math.round((W - colW) / 2);
    const C = {};
    ['faint', 'muted', 'agent', 'specialist', 'harness'].forEach(k => { C[k] = HC.css('--' + k); });

    const label = 'Figure 1. From human-directed optimization to heterogeneous agentic coevolution. (a) In human-directed ' +
      'optimization, a researcher gives a training design to the specialized foundation model and makes manual revisions ' +
      'from evaluation feedback. (b) HACE brings together specialized foundation models and LLM agents into a shared ' +
      'learning process, where each helps determine how the other improves. Agent exploration guides instance selection ' +
      'for specialist training, while verified contributions guide response selection back for agent learning. ' +
      'Across rounds, both learners and their interaction harness evolve, creating new opportunities for reciprocal improvement.';
    const aW = narrow ? colW : Math.round(W * 0.34), gap = 36, bW = narrow ? colW : W - aW - gap;
    const svg = HC.el('svg', { role: 'img', 'aria-label': label }, host);
    const defs = HC.el('defs', {}, svg);
    const mk = {};
    Object.keys(C).forEach(k => {
      const id = 'f1m' + HC.uid();
      const m = HC.el('marker', { id, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 8, markerHeight: 8, orient: 'auto', markerUnits: 'userSpaceOnUse' }, defs);
      HC.el('path', { d: 'M0.5,0.8L7.5,4L0.5,7.2z', fill: C[k] }, m);
      mk[k] = `url(#${id})`;
    });

    const gA = HC.el('g', {}, svg), gB = HC.el('g', {}, svg), gS = HC.el('g', {}, svg);
    const A = buildA(gA, aW, mk, C);
    const B = buildB(gB, bW, narrow, mk, C);
    const yB = narrow ? A.h + 30 : 0, yS = narrow ? yB + B.h + 22 : Math.max(A.h, B.h) + 14;
    gA.setAttribute('transform', `translate(${offX},0)`);
    gB.setAttribute('transform', `translate(${narrow ? offX : aW + gap},${yB})`);
    if (!narrow) HC.el('line', { class: 'f1-rule', x1: aW + gap / 2, x2: aW + gap / 2, y1: 0, y2: Math.max(A.h, B.h) - 12 }, svg);
    else HC.el('line', { class: 'f1-rule', x1: offX, x2: offX + colW, y1: yB - 16, y2: yB - 16 }, svg);
    HC.el('line', { class: 'f1-rule', x1: offX, x2: offX + colW, y1: yS, y2: yS }, svg);
    gS.setAttribute('transform', `translate(${offX},${yS + 4})`);
    const S = buildStrip(gS, colW, narrow, narrow ? 0 : aW + gap, mk, C);
    const H = yS + 4 + S.h;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    [A, B, S].forEach(x => x.still());

    const reveals = [[gA, aW, A.h], [gB, bW, B.h], [gS, colW, S.h]].map(([g, w, h]) => {
      const r = HC.clipReveal(defs, w, h, api.played || HC.REDUCED);
      g.setAttribute('clip-path', r.url);
      return r;
    });

    let clock = 0, last = null, raf = 0, live = false, visible = false, paused = !!api.paused;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
      visible = es[es.length - 1].isIntersecting; schedule();
    }, { threshold: 0.1 }) : null;
    if (io) io.observe(host); else visible = true;
    const onVis = () => schedule();
    document.addEventListener('visibilitychange', onVis);
    function running() { return live && visible && !paused && !document.hidden; }
    function release() {
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      cancelAnimationFrame(raf);
      raf = 0;
    }
    function dead() {
      if (svg.isConnected) return false;
      release();
      return true;
    }
    function tick(now) {
      raf = 0;
      if (dead()) return;
      if (!running()) { last = null; return; }
      if (last !== null) clock += Math.min(64, now - last);
      last = now;
      A.update(clock); B.update(clock); S.update(clock);
      raf = requestAnimationFrame(tick);
    }
    function schedule() { if (dead()) return; if (running() && !raf) raf = requestAnimationFrame(tick); if (!running()) last = null; }

    let pill = null;
    if (!HC.REDUCED) {
      pill = HC.h('button', { type: 'button', class: 'hc-btn f1-pill' }, host);
      if (narrow) { pill.style.top = (yB - 2) + 'px'; pill.style.right = (W - offX - colW) + 'px'; }
      const draw = () => { pill.innerHTML = (paused ? ICON.play : ICON.pause) + `<span>${paused ? 'Play' : 'Pause'}</span>`;
        pill.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' the overview animation');
      };
      draw();
      pill.addEventListener('click', () => {
        paused = api.paused = !paused;
        draw();
        schedule();
      });
    }

    return {
      async play(instant) {
        if (HC.REDUCED) { reveals.forEach(r => r.set(1)); return; }
        if (!instant) {
          reveals[0].play(1300);
          await HC.wait(450);
          reveals[1].play(1500);
          await HC.wait(1100);
          await reveals[2].play(1000);
        } else reveals.forEach(r => r.set(1));
        live = true;
        schedule();
      },
      destroy: release,
    };
  });
})();
