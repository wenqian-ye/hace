(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let uid = 0;
  const registry = new Map();

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, attrs, parent, content) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (attrs[k] === undefined || attrs[k] === null) continue;
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(n.style, attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    if (content !== undefined) { if (typeof content === 'string') n.innerHTML = content; else n.appendChild(content); }
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, s, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function css(name, node) { return getComputedStyle(node || document.documentElement).getPropertyValue(name).trim(); }

  function niceStep(span, n) {
    const raw = span / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    return (r >= 7.5 ? 10 : r >= 3.5 ? 5 : r >= 1.5 ? 2 : 1) * mag;
  }
  function niceTicks(lo, hi, n) {
    if (hi === lo) return [lo];
    const step = niceStep(hi - lo, n || 5), out = [];
    const start = Math.ceil(lo / step - 1e-9) * step;
    for (let v = start; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(12));
    return out;
  }
  function linear(d0, d1, r0, r1) {
    const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
    f.inv = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0);
    f.domain = [d0, d1]; f.range = [r0, r1];
    f.ticks = n => niceTicks(Math.min(d0, d1), Math.max(d0, d1), n);
    return f;
  }
  function logScale(d0, d1, r0, r1) {
    const a = Math.log10(d0), b = Math.log10(d1);
    const f = v => r0 + (Math.log10(v) - a) / (b - a) * (r1 - r0);
    f.inv = p => Math.pow(10, a + (p - r0) / (r1 - r0) * (b - a));
    f.domain = [d0, d1]; f.range = [r0, r1];
    return f;
  }
  function band(keys, r0, r1, padInner, padOuter) {
    const pi = padInner === undefined ? 0.2 : padInner, po = padOuter === undefined ? 0.1 : padOuter;
    const n = keys.length, step = (r1 - r0) / Math.max(1, n - pi + 2 * po), bw = step * (1 - pi);
    const f = k => r0 + step * po + keys.indexOf(k) * step;
    f.bw = bw; f.step = step; f.keys = keys;
    return f;
  }
  function extent(arr, acc) {
    let lo = Infinity, hi = -Infinity;
    for (const d of arr) { const v = acc ? acc(d) : d; if (v === null || v === undefined || Number.isNaN(v)) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
    return [lo, hi];
  }
  function pad(lo, hi, frac) { const s = (hi - lo) || Math.abs(hi) || 1; return [lo - s * frac, hi + s * frac]; }

  const fmt = (v, d) => (v === null || v === undefined || Number.isNaN(v)) ? '–' : (+v).toFixed(d === undefined ? 4 : d);
  const fmtSigned = (v, d) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d === undefined ? 4 : d);
  const fmtPct = (v, d) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d === undefined ? 1 : d) + '%';
  const sd = (s, d) => '±' + (+s).toFixed(d === undefined ? 4 : d).replace(/^0(?=\.)/, '');

  function linePath(pts, x, y) { return pts.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(2) + ',' + y(p[1]).toFixed(2)).join(''); }
  function stepPath(pts, x, y) {
    if (!pts.length) return '';
    let d = 'M' + x(pts[0][0]).toFixed(2) + ',' + y(pts[0][1]).toFixed(2);
    for (let i = 1; i < pts.length; i++) d += 'H' + x(pts[i][0]).toFixed(2) + 'V' + y(pts[i][1]).toFixed(2);
    return d;
  }

  const ease = {
    inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    out: t => 1 - Math.pow(1 - t, 3),
    back: t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };
  function tween(ms, fn, easing) {
    return new Promise(res => {
      if (REDUCED || ms <= 0) { fn(1); res(); return; }
      let t0 = null;
      const step = now => { if (t0 === null) t0 = now; const t = Math.min(1, (now - t0) / ms); fn((easing || ease.inOut)(t)); t < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));
  function whenVisible(node, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const need = threshold === undefined ? 0.28 : threshold;
    const io = new IntersectionObserver(es => es.forEach(e => {
      const span = Math.min(e.boundingClientRect.height, e.rootBounds ? e.rootBounds.height : innerHeight) || 1;
      if (e.isIntersecting && e.intersectionRect.height >= need * span - 1) { io.disconnect(); fn(); }
    }), { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    io.observe(node);
  }
  function onWidth(host, fn) {
    let last = host.clientWidth, t = 0;
    if (!('ResizeObserver' in window)) return;
    new ResizeObserver(() => {
      const w = host.clientWidth;
      if (!w || Math.abs(w - last) < 8) return;
      last = w; clearTimeout(t); t = setTimeout(() => fn(w), 140);
    }).observe(host);
  }

  function frame(host, W, H, m, label, role) {
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: role || 'img', 'aria-label': label || host.getAttribute('aria-label') || '' });
    host.appendChild(svg);
    const defs = el('defs', {}, svg);
    const g = el('g', { transform: `translate(${m.l},${m.t})` }, svg);
    return { svg, defs, g, iw: W - m.l - m.r, ih: H - m.t - m.b, W, H, m };
  }
  function clipReveal(defs, w, h, done) {
    const id = 'hcclip' + (++uid);
    const cp = el('clipPath', { id }, defs);
    const r = el('rect', { x: -20, y: -60, width: done ? w + 60 : 0, height: h + 120 }, cp);
    return {
      url: `url(#${id})`, rect: r,
      play: ms => tween(ms === undefined ? 1400 : ms, t => r.setAttribute('width', (w + 60) * t), ease.inOut),
      set: t => r.setAttribute('width', (w + 60) * t),
    };
  }
  function axisX(g, x, opt) {
    const o = Object.assign({ y: 0, ticks: null, fmt: v => v, size: 5, label: null, labelDy: 34 }, opt || {});
    const a = el('g', { class: 'hc-axis', transform: `translate(0,${o.y})` }, g);
    const [r0, r1] = x.range;
    el('line', { x1: Math.min(r0, r1), x2: Math.max(r0, r1), y1: 0, y2: 0 }, a);
    (o.ticks || (x.ticks ? x.ticks(5) : [])).forEach(v => {
      const px = x(v);
      el('line', { x1: px, x2: px, y1: 0, y2: o.size }, a);
      text(a, px, o.size + 13, o.fmt(v), { 'text-anchor': 'middle' });
    });
    if (o.label) text(a, (r0 + r1) / 2, o.labelDy, o.label, { 'text-anchor': 'middle', class: 'hc-label' });
    return a;
  }
  function axisY(g, y, opt) {
    const o = Object.assign({ x: 0, ticks: null, fmt: v => v, size: 5, label: null, grid: null, labelDx: -44 }, opt || {});
    const a = el('g', { class: 'hc-axis', transform: `translate(${o.x},0)` }, g);
    const [r0, r1] = y.range;
    const ticks = o.ticks || (y.ticks ? y.ticks(5) : []);
    if (o.grid) {
      const gg = el('g', { class: 'hc-grid' }, g);
      g.insertBefore(gg, g.firstChild);
      ticks.forEach(v => el('line', { x1: o.grid[0], x2: o.grid[1], y1: y(v), y2: y(v) }, gg));
    }
    el('line', { x1: 0, x2: 0, y1: Math.min(r0, r1), y2: Math.max(r0, r1) }, a);
    ticks.forEach(v => {
      const py = y(v);
      el('line', { x1: -o.size, x2: 0, y1: py, y2: py }, a);
      text(a, -o.size - 5, py + 4, o.fmt(v), { 'text-anchor': 'end' });
    });
    if (o.label) {
      const mid = (r0 + r1) / 2;
      text(a, o.labelDx, mid, o.label, { 'text-anchor': 'middle', class: 'hc-label', transform: `rotate(-90 ${o.labelDx} ${mid})` });
    }
    return a;
  }

  function legend(host, items, opt) {
    const o = Object.assign({ kind: 'line', onToggle: null }, opt || {});
    const box = h('div', { class: 'hc-legend' });
    items.forEach(it => {
      const b = h(o.onToggle ? 'button' : 'span', o.onToggle ? { type: 'button', 'aria-pressed': it.on === false ? 'false' : 'true' } : {}, box);
      h('span', { class: (o.kind === 'dot' ? 'dot' : 'sw') + ((it.key || it.label) === 'HACE' ? ' hace' : ''), style: { background: it.color } }, b);
      h('span', {}, b, it.label);
      if (o.onToggle) b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.onToggle(it.key, on);
      });
    });
    host.appendChild(box);
    return box;
  }
  function tooltip(host) {
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const tip = h('div', { class: 'hc-tip', 'aria-hidden': 'true' }, host);
    if (!tooltip.esc) {
      tooltip.esc = true;
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') document.querySelectorAll('.hc-tip.on').forEach(t => t.classList.remove('on'));
      });
    }
    return {
      node: tip,
      show(clientX, clientY, html) {
        tip.innerHTML = html;
        const hb = host.getBoundingClientRect();
        let x = clientX - hb.left + 14, y = clientY - hb.top + 14;
        tip.classList.add('on');
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        if (x + tw > hb.width - 4) x = clientX - hb.left - tw - 14;
        if (y + th > hb.height - 4) y = clientY - hb.top - th - 10;
        tip.style.left = Math.max(2, x) + 'px'; tip.style.top = Math.max(2, y) + 'px';
      },
      hide() { tip.classList.remove('on'); },
    };
  }

  const METHODS = ['Base', 'ReST-EM', 'Meta-Harness', 'OpenEvolve', 'DGM', 'TTT-Discover', 'HACE'];
  const METHOD_VAR = {
    'HACE': '--m-hace', 'Meta-Harness': '--m-metaharness', 'OpenEvolve': '--m-openevolve', 'ReST-EM': '--m-restem',
    'TTT-Discover': '--m-ttt', 'DGM': '--m-dgm', 'Base': '--m-base', 'Frozen specialist': '--m-base',
  };
  const color = name => css(METHOD_VAR[name] || name);

  function register(name, factory) { registry.set(name, factory); }
  function groupFocusable(host) {
    host.querySelectorAll('svg[role="img"]').forEach(svg => {
      if (!svg.querySelector('[tabindex]')) return;
      svg.setAttribute('role', 'group');
      svg.querySelectorAll('[tabindex][aria-label]:not([role])').forEach(n => n.setAttribute('role', 'img'));
    });
  }
  function mountAll() {
    const data = window.HACE_DATA || {};
    registry.forEach((factory, name) => {
      const host = document.getElementById('viz-' + name);
      if (!host) return;
      const api = { data, played: false, name };
      let inst = null;
      const build = () => {
        if (inst && inst.destroy) { try { inst.destroy(); } catch (err) { console.error(err); } }
        clear(host);
        try { inst = factory(host, api) || {}; }
        catch (err) { console.error('[HACE] figure "' + name + '" failed:', err); inst = {}; }
      };
      build();
      groupFocusable(host);
      if ('MutationObserver' in window) new MutationObserver(() => groupFocusable(host)).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'tabindex'] });
      whenVisible(host, () => { if (api.played) return; api.played = true; if (inst.play) inst.play(); });
      onWidth(host, () => { build(); if (api.played && inst.play) inst.play(true); });
    });
  }

  window.HC = {
    NS, REDUCED, el, h, text, clear, css, niceTicks, linear, logScale, band, extent, pad,
    fmt, fmtSigned, fmtPct, sd, linePath, stepPath, ease, tween, wait, whenVisible, onWidth,
    frame, clipReveal, axisX, axisY, legend, tooltip, METHODS, color, register, mountAll,
    uid: () => ++uid,
  };
})();
