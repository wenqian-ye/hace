(function () {
  'use strict';
  const HC = window.HC;
  if (!HC) return;

  const ROW = 42;
  const SPIN = 0.008;
  const ELEM = { 21: 'Sc', 27: 'Co', 81: 'Tl' };
  const RADIUS = { Co: 0.74, Sc: 0.88, Tl: 0.94 };
  const VIEW = {
    protein: { q0: [0.5015, -0.4073, -0.1614, 0.746], theta: 0, tilt: 0, pct: 0.99, pad: 2 },
    crystal: { q0: [-0.5, -0.5, -0.5, 0.5], theta: -28, tilt: 16, pct: 1, pad: 1 },
  };
  const IMG = ['assets/img/heli-red.jpg', 'assets/img/heli-blue.jpg'];
  const STILL = { protein: 'assets/img/protein-render.png', crystal: 'assets/img/crystal-render.png' };
  const STAR = 'from a separate logging run with the same configuration, seed, and data as its trajectory';
  const MOL = {};
  const scripts = {};
  const seen = {};
  let recState = 1;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const formula = s => String(s).trim().split(/\s+/).map(tok => {
    const m = /^([A-Z][a-z]?)(\d*)$/.exec(tok);
    return m ? m[1] + (m[2] === '1' ? '' : m[2].replace(/\d/g, d => String.fromCharCode(0x2080 + +d))) : tok;
  }).join('');
  function tx(tag, cls, parent, s) {
    const n = HC.h(tag, cls ? { class: cls } : null, parent);
    if (s !== undefined) n.textContent = s;
    return n;
  }

  function tipOn(node, tip, html, on, off) {
    const show = e => {
      if (on) on();
      let x, y;
      if (e && e.type !== 'focus' && e.clientX) { x = e.clientX; y = e.clientY; }
      else { const r = node.getBoundingClientRect(); x = r.left + r.width / 2; y = r.bottom; }
      tip.show(x, y, typeof html === 'function' ? html() : html);
    };
    const hide = () => { if (off) off(); tip.hide(); };
    node.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(e); });
    node.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') show(e); });
    node.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
    node.addEventListener('click', show);
    node.addEventListener('focus', show);
    node.addEventListener('blur', hide);
  }

  function card(grid, d, dom, mol, tip) {
    const c = HC.h('article', { class: `cs-card cs-${dom}` + (mol ? ' cs-molcard' : ''), style: `--c:var(--d-${dom});--cs:var(--d-${dom}-soft)` }, grid);
    const head = HC.h('div', { class: 'cs-head' }, c);
    tx('h4', 'cs-title', head, d.title);
    tx('div', 'cs-sub', head, d.subtitle);
    const k = {
      lab: HC.h('div', { class: 'cs-row cs-labs' }, c),
      media: HC.h('div', { class: 'cs-row cs-media' }, c),
      names: HC.h('div', { class: 'cs-row cs-names' }, c),
      ev: HC.h('div', { class: 'cs-ev' }, c),
    };
    tx('p', 'cs-headline', c, d.headline);
    const b = d.box || {}, round = d.package && d.package.round;
    const box = HC.h('div', { class: 'cs-box' }, c);
    const r1 = HC.h('div', { class: 'cs-box1' }, box);
    tx('span', '', r1, b.comparison);
    const tag = tx(round !== undefined ? 'button' : 'span', 'cs-rtag', r1, b.round_tag);
    if (round !== undefined) {
      const say = 'Round ' + round + (/\*$/.test(b.round_tag || '') ? ', ' + STAR : '');
      tag.type = 'button';
      tag.setAttribute('aria-label', say);
      tipOn(tag, tip, say);
    }
    const r2 = HC.h('div', { class: 'cs-box2' }, box);
    tx('span', '', r2, b.metric);
    tx('b', '', r2, b.change);
    return k;
  }
  function evHead(k, label) {
    const head = HC.h('div', { class: 'cs-evhead' }, k.ev);
    tx('span', 'cs-evlabel', head, label);
    return head;
  }

  function recCard(grid, d, tip, api) {
    const k = card(grid, d, 'rec', false, tip), p = d.package || {};
    const alts = [p.latest_purchase, p.held_out];
    (d.columns || []).forEach((col, i) => {
      tx('div', 'cs-col', k.lab, col);
      HC.h('img', { loading: 'lazy', decoding: 'async', src: IMG[i], alt: alts[i] || d.item_names[i], width: 560, height: 509 }, k.media);
      tx('div', 'cs-name', k.names, d.item_names[i]);
    });

    const A = p.top5_specialist || [], B = p.top5_specialist_plus_agent || [], K = Math.max(A.length, B.length);
    const head = evHead(k, 'Top ' + K);
    const seg = HC.h('div', { class: 'hc-seg cs-seg', role: 'group', 'aria-label': 'Ranking shown' }, head);
    const btn = ['Specialist', 'Specialist + agent'].map((s, i) => {
      const b = tx('button', '', seg, s);
      b.type = 'button';
      b.addEventListener('click', () => { api.touched = true; show(i); });
      return b;
    });
    const wrap = HC.h('div', { class: 'cs-rank' }, k.ev);
    const nums = HC.h('ol', { class: 'cs-nums', 'aria-hidden': 'true' }, wrap);
    const slots = Array.from({ length: K }, (_, i) => tx('li', '', nums, String(i + 1)));
    const ol = HC.h('ol', { class: 'cs-list' }, wrap);
    ol.style.height = K * ROW + 'px';
    const rk = i => i < 0 ? 'not in top ' + K : 'rank ' + (i + 1);
    const rows = [...new Set(A.concat(B))].map(title => {
      const it = { title, a: A.indexOf(title), b: B.indexOf(title), target: title === p.held_out };
      it.li = HC.h('li', { class: 'cs-li' + (it.target ? ' is-target' : '') }, ol);
      tx('span', 'cs-tt', it.li, title);
      if (it.target) tx('span', 'cs-sr', it.li, ', ' + d.columns[1]);
      tipOn(it.li, tip, () => `<b>${esc(title)}</b>${it.target ? '<br>' + esc(d.columns[1]) : ''}` +
        `<br>Specialist: ${rk(it.a)}<br>Specialist + agent: ${rk(it.b)}`);
      return it;
    });
    const target = rows.find(r => r.target);
    const note = HC.h('div', { class: 'cs-note', 'aria-live': 'polite' }, k.ev);

    function show(s, instant) {
      recState = s;
      if (instant) wrap.classList.add('cs-now');
      btn.forEach((b, i) => b.setAttribute('aria-pressed', String(i === s)));
      ol.setAttribute('aria-label', btn[s].textContent + ' top ' + K);
      const now = rows.map(it => {
        const cs = getComputedStyle(it.li);
        return { tf: cs.transform, y: cs.transform === 'none' ? 0 : new DOMMatrixReadOnly(cs.transform).m42, op: +cs.opacity };
      });
      const place = it => { const pos = s ? it.b : it.a; return pos < 0 ? K + rows.indexOf(it) : pos; };
      rows.slice().sort((p, q) => place(p) - place(q)).forEach(it => ol.appendChild(it.li));
      rows.forEach((it, i) => {
        it.li.style.transition = 'none';
        it.li.style.transform = now[i].tf;
        it.li.style.opacity = now[i].op;
      });
      void ol.offsetWidth;
      rows.forEach((it, i) => {
        const pos = s ? it.b : it.a, li = it.li, n = now[i];
        let delay = 100, ty;
        li.classList.remove('is-in', 'is-gone');
        if (pos >= 0) {
          ty = pos * ROW;
          if (!instant && n.op < 0.05) {
            li.style.transform = `translateY(${K * ROW}px)`;
            void li.offsetWidth;
            li.classList.add('is-in');
            delay = 240 + pos * 110;
          }
        } else {
          ty = n.y + (n.op > 0.05 ? 10 : 0);
          li.classList.add('is-gone');
        }
        li.style.transition = '';
        li.style.opacity = '';
        li.classList.toggle('is-out', pos < 0);
        li.setAttribute('aria-hidden', String(pos < 0));
        li.tabIndex = pos < 0 ? -1 : 0;
        li.style.transitionDelay = instant ? '0ms' : delay + 'ms';
        li.style.transform = `translateY(${ty}px)`;
      });
      const tp = target ? (s ? target.b : target.a) : -1;
      slots.forEach((n, i) => n.classList.toggle('is-target', i === tp));
      note.textContent = d.columns[1] + (tp < 0 ? ' not in top ' + K : ' at rank ' + (tp + 1));
      if (instant) { void wrap.offsetWidth; wrap.classList.remove('cs-now'); }
    }
    return { ev: k.ev, show, evH: K * ROW + 24 };
  }

  function slope(slot, o, tip, H) {
    const W = Math.max(240, Math.round(slot.clientWidth)), top = 24, R = o.maxRank, s = (H - top - 6) / R;
    const y = r => top + (r - 0.5) * s;
    const svg = HC.el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cs-svg', role: 'group', 'aria-label': o.aria }, slot);
    const len = (str, cls) => {
      const t = HC.text(svg, 0, 0, str, { class: cls }), w = t.getComputedTextLength() || str.length * 7;
      t.remove();
      return w;
    };
    const heads = ['Specialist', 'Specialist + agent'], wL = len(heads[0], 'cs-colhead'), wR = len(heads[1], 'cs-colhead');
    const note = o.note || [], NOTE = 'cs-lab2 cs-svgnote';
    const gut = Math.max(0, ...o.lines.map(L => len(L.key, 'cs-lab2')), ...note.map(t => len(t, NOTE)));
    const x0 = 46, x1 = Math.min(W - 9 - gut, W - wR / 2);
    const short = Math.max(0, x0 + wL / 2 + 10 + wR / 2 - x1);
    const h0 = Math.max(wL / 2, x0 - short / 2), h1 = Math.min(W - wR / 2, Math.max(x1, h0 + wL / 2 + 10 + wR / 2));

    const defs = HC.el('defs', {}, svg);
    HC.el('rect', { class: 'cs-band', x: 0, y: y(0.5), width: W, height: o.K * s, rx: 5 }, svg);
    HC.text(svg, W - 7, y(o.K + 0.5) - 6, 'top ' + o.K, { class: 'cs-bandlab', 'text-anchor': 'end' });
    [...new Set([1].concat(HC.niceTicks(1, R, 3), [R]))].forEach(r => {
      HC.el('line', { class: 'cs-gl', x1: 26, x2: x1, y1: y(r), y2: y(r) }, svg);
      HC.text(svg, 19, y(r) + 4, r, { class: 'cs-tick', 'text-anchor': 'end' });
    });
    HC.text(svg, h0, 13, heads[0], { class: 'cs-colhead', 'text-anchor': 'middle' });
    HC.text(svg, h1, 13, heads[1], { class: 'cs-colhead', 'text-anchor': 'middle' });

    const rv = HC.clipReveal(defs, x1 - x0 - 46, H);
    rv.rect.setAttribute('x', x0 - 6);
    const d = L => `M${x0},${y(L.a).toFixed(1)}L${x1},${y(L.b).toFixed(1)}`;
    const order = o.lines.slice().sort((a, b) => (b.hot - a.hot) || (b.kept - a.kept));
    const hits = HC.el('g', { 'clip-path': rv.url }, svg);
    const groups = {}, labels = [];
    order.slice().reverse().forEach(L => {
      const g = HC.el('g', { class: 'cs-ln ' + (L.hot ? 'hot' : 'kept') }, svg);
      const cg = HC.el('g', { 'clip-path': rv.url }, g);
      HC.el('path', { class: 'cs-line', d: d(L) }, cg);
      HC.el('circle', { class: 'cs-dot1', cx: x1, cy: y(L.b), r: 3.9 }, cg);
      HC.el('circle', { class: 'cs-dot0', cx: x0, cy: y(L.a), r: 3.4 }, g);
      labels.push({ g, y: y(L.b), text: L.key });
      groups[L.key] = g;
    });
    order.forEach(L => {
      const g = HC.el('g', { class: 'cs-hitg', role: 'img', tabindex: 0,
        'aria-label': `${L.key}: specialist rank ${L.a}, specialist + agent rank ${L.b}` }, hits);
      HC.el('path', { class: 'cs-hit', d: d(L) }, g);
      tipOn(g, tip, L.tip, () => focus(L.key), () => focus(null));
    });
    labels.sort((a, b) => a.y - b.y);
    const ys = labels.map(l => l.y);
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + 13.5);
    const shift = labels.reduce((t, l, i) => t + l.y - ys[i], 0) / (labels.length || 1);
    labels.forEach((l, i) => HC.text(l.g, x1 + 9, ys[i] + shift + 4, l.text, { class: 'cs-lab2' }));
    note.forEach((t, i) => HC.text(svg, x1 + 9, y(R) + 4 - (note.length - 1 - i) * 14, t, { class: NOTE }));

    const fades = [...svg.querySelectorAll('.cs-lab2')];
    function focus(key) {
      svg.classList.toggle('cs-dim', key !== null);
      Object.keys(groups).forEach(k => groups[k].classList.toggle('on', k === key));
    }
    return {
      focus,
      done() { svg.classList.add('cs-now'); rv.set(1); fades.forEach(n => n.classList.add('in')); },
      reveal() { return rv.play(1500).then(() => fades.forEach((n, i) => setTimeout(() => n.classList.add('in'), i * 90))); },
    };
  }

  function protCard(grid, d, tip) {
    const k = card(grid, d, 'prot', true, tip), p = d.package || {};
    HC.h('span', null, k.lab);
    tx('div', 'cs-col', k.lab, d.column);
    mol('protein', k.media, d.protein_label, `${d.protein_label}, predicted structure as a cartoon coloured from the N terminus (blue) to the C terminus (red). Drag or use the arrow keys to rotate.`);
    const chips = HC.h('ul', { class: 'cs-chips' }, k.media);
    const chipEls = (d.new_in_top5 || []).map(n => tx('li', 'cs-chip', chips, n));
    tx('div', 'cs-name', k.names, d.protein_label);
    HC.h('span', null, k.names);
    evHead(k, 'Rank of true terms');
    const slot = HC.h('div', { class: 'cs-chart' }, k.ev);
    const K = p.top_k, terms = p.terms || [], out = t => t.rank_specialist > K && t.rank_fused > K;
    const drawn = terms.filter(t => !out(t)), rest = terms.length - drawn.length;
    return {
      ev: k.ev,
      build(H) {
        const chart = slope(slot, {
          K, maxRank: Math.max(...drawn.map(t => Math.max(t.rank_specialist, t.rank_fused))),
          lines: drawn.map(t => ({ key: t.name, a: t.rank_specialist, b: t.rank_fused, hot: t.entered_top_k, kept: !t.entered_top_k,
            tip: `<b>${esc(t.name)}</b><br>${esc(t.go_id)}<br>Specialist rank ${t.rank_specialist}<br>Specialist + agent rank ${t.rank_fused}` })),
          note: rest ? [`${rest} other true terms`, `outside top ${K}`] : null,
          aria: `Ranks of the true terms of ${d.protein_label}, specialist then specialist + agent: ` +
            drawn.map(t => `${t.name} ${t.rank_specialist} to ${t.rank_fused}`).join(', ') +
            (rest ? `. ${rest} other true terms stay outside the top ${K}.` : ''),
        }, tip, H);
        chipEls.forEach(ch => {
          ch.addEventListener('pointerenter', () => chart.focus(ch.textContent));
          ch.addEventListener('pointerleave', () => chart.focus(null));
        });
        return chart;
      },
    };
  }

  function matCard(grid, d, tip) {
    const k = card(grid, d, 'mat', true, tip), p = d.package || {};
    const phases = (p.stable_phases || []).map(ph => ({ key: formula(ph.formula), a: ph.rank_specialist, b: ph.rank_fused, hot: ph.entered_top_k }));
    HC.h('span', null, k.lab);
    tx('div', 'cs-col', k.lab, d.column);
    const m = mol('crystal', k.media, d.structure_label, `${d.structure_label} crystal structure, a two by two by one supercell with its cell outlined. Drag or use the arrow keys to rotate.`);
    const chips = HC.h('ul', { class: 'cs-chips' }, k.media);
    const chipEls = (d.stable_phases || []).map(sp => {
      const ph = phases.find(q => q.key === sp.formula);
      const li = HC.h('li', { class: 'cs-chip cs-chip2' + (ph && ph.hot ? '' : ' is-neutral') }, chips);
      tx('b', '', li, sp.formula);
      tx('span', '', li, sp.note);
      li.dataset.key = sp.formula;
      return li;
    });
    tx('div', 'cs-name', k.names, d.structure_label);
    m.legend = HC.h('div', { class: 'cs-elems' }, k.names);
    if (window.HACE_STRUCT) drawLegend(m);
    evHead(k, 'Rank of stable phases');
    const slot = HC.h('div', { class: 'cs-chart' }, k.ev);
    phases.forEach(ph => {
      ph.kept = !ph.hot;
      ph.tip = `<b>${esc(ph.key)}</b><br>Specialist rank ${ph.a}<br>Specialist + agent rank ${ph.b}`;
    });
    return {
      ev: k.ev,
      build(H) {
        const chart = slope(slot, {
          K: p.top_k, maxRank: Math.max(...phases.map(q => Math.max(q.a, q.b))), lines: phases,
          aria: `Ranks of the ${phases.length} stable phases in ${p.chemical_system || ''}, specialist then specialist + agent: ` +
            phases.slice().sort((q, r) => r.hot - q.hot).map(q => `${q.key} ${q.a} to ${q.b}`).join(', '),
        }, tip, H);
        chipEls.forEach(ch => {
          ch.addEventListener('pointerenter', () => chart.focus(ch.dataset.key));
          ch.addEventListener('pointerleave', () => chart.focus(null));
        });
        return chart;
      },
    };
  }
  function drawLegend(m) {
    const C = window.HACE_STRUCT && window.HACE_STRUCT.crystal;
    if (!C || !m.legend || m.legend.childNodes.length) return;
    m.legend.setAttribute('aria-hidden', 'true');
    String(C.formula).split(/\s+/).map(t => t.replace(/\d+$/, '')).forEach(el => {
      const it = HC.h('span', { class: 'cs-el' }, m.legend);
      HC.h('i', { style: `background:${C.colors[el]}` }, it);
      it.appendChild(document.createTextNode(el));
    });
  }

  function load(src) {
    return scripts[src] || (scripts[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res;
      s.onerror = () => rej(new Error('could not load ' + src));
      document.head.appendChild(s);
    }));
  }
  let glOK;
  function webgl() {
    if (glOK === undefined) {
      try {
        const g = document.createElement('canvas').getContext('webgl');
        glOK = !!g;
        const lose = g && g.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      } catch (e) { glOK = false; }
    }
    return glOK;
  }
  const qmul = (a, b) => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  const qax = (x, y, z, deg) => { const t = deg * Math.PI / 360, s = Math.sin(t); return [x * s, y * s, z * s, Math.cos(t)]; };
  function qrot(q, x, y, z) {
    const tx = 2 * (q[1] * z - q[2] * y), ty = 2 * (q[2] * x - q[0] * z), tz = 2 * (q[0] * y - q[1] * x);
    return [x + q[3] * tx + q[1] * tz - q[2] * ty, y + q[3] * ty + q[2] * tx - q[0] * tz, z + q[3] * tz + q[0] * ty - q[1] * tx];
  }
  const at = (cfg, theta) => qmul(qax(1, 0, 0, cfg.tilt), qmul(qax(0, 1, 0, theta), cfg.q0));
  function setQ(v, q) {
    const view = v.getView();
    for (let i = 0; i < 4; i++) view[4 + i] = q[i];
    v.setView(view);
  }
  function turn(v, dx, dy) {
    let q = qmul(qax(0, 1, 0, dx), v.getView().slice(4, 8));
    if (dy) q = qmul(qax(1, 0, 0, dy), q);
    setQ(v, q);
  }
  function fit(v, cfg, pts, c) {
    const tan = Math.tan((v.fov || 20) * Math.PI / 360);
    let d = 0;
    for (let it = 0; it < 3; it++) {
      let need = 0;
      for (let th = 0; th < 360; th += 15) {
        const q = at(cfg, th), ext = pts.map(p => {
          const r = qrot(q, p[0] - c[0], p[1] - c[1], p[2] - c[2]);
          return Math.max(Math.abs(r[0]), Math.abs(r[1])) * (d ? d / (d - r[2]) : 1);
        }).sort((a, b) => a - b);
        need = Math.max(need, ext[Math.min(ext.length - 1, Math.floor(cfg.pct * ext.length))]);
      }
      d = (need + cfg.pad) / (0.94 * tan);
    }
    return d;
  }

  function mol(key, parent, name, label) {
    let m = MOL[key];
    if (!m) {
      m = MOL[key] = { key, name, spin: !HC.REDUCED, vis: false, raf: 0 };
      m.wrap = HC.h('div', { class: 'cs-mol', tabindex: '0', role: 'application', 'aria-roledescription': '3D viewer', 'aria-label': label });
      m.poster = HC.h('img', { class: 'cs-poster', loading: 'lazy', decoding: 'async', src: STILL[key], alt: '' }, m.wrap);
      wire(m);
      const start = () => {
        if (!webgl()) {
          still(m);
          if (key === 'crystal') (window.HACE_STRUCT ? Promise.resolve() : load('assets/data/structures.js')).then(() => drawLegend(m), () => {});
          return;
        }
        const struct = window.HACE_STRUCT ? Promise.resolve() : load('assets/data/structures.js');
        struct.then(() => drawLegend(m), () => {});
        Promise.all([window.$3Dmol || load('assets/vendor/3Dmol-min.js'), struct])
          .then(() => new Promise(r => setTimeout(r, key === 'crystal' ? 40 : 0)))
          .then(() => init(m))
          .catch(() => still(m));
      };
      if ('IntersectionObserver' in window) {
        const near = new IntersectionObserver(es => {
          if (es.some(e => e.isIntersecting)) { near.disconnect(); start(); }
        }, { rootMargin: '600px 0px' });
        near.observe(m.wrap);
        new IntersectionObserver(es => { m.vis = es[es.length - 1].isIntersecting; go(m); }).observe(m.wrap);
      } else { m.vis = true; start(); }
    }
    parent.appendChild(m.wrap);
    if (m.viewer) { m.viewer.resize(); go(m); }
    return m;
  }
  function still(m) {
    if (m.viewer) return;
    m.wrap.removeAttribute('tabindex');
    m.wrap.removeAttribute('aria-roledescription');
    m.wrap.setAttribute('role', 'img');
    m.wrap.setAttribute('aria-label', m.name);
    m.wrap.classList.add('is-still');
    if (!m.wrap.querySelector('img')) HC.h('img', { loading: 'lazy', decoding: 'async', src: STILL[m.key], alt: '' }, m.wrap);
  }
  function init(m) {
    const S = window.HACE_STRUCT, G = window.$3Dmol && window.$3Dmol.GLViewer;
    if (!S || !G || !webgl()) { still(m); return; }
    if (!G.hcGuard) {
      const resize = G.prototype.resize;
      G.prototype.resize = function () {
        const c = this.container;
        return c && c.classList && c.classList.contains('cs-mol') && !(c.offsetWidth && c.offsetHeight) ? this : resize.apply(this, arguments);
      };
      G.hcGuard = true;
    }
    try {
      const v = window.$3Dmol.createViewer(m.wrap, { id: 'cs-mol-' + m.key, backgroundColor: 'white', backgroundAlpha: 0, antialias: true, nomouse: true, disableFog: true });
      if (!v) throw new Error('no viewer');
      const cfg = VIEW[m.key];
      let pts, c;
      if (m.key === 'protein') {
        v.addModel(S.protein.pdb, 'pdb');
        v.setStyle({}, { cartoon: { colorscheme: { prop: 'resi', gradient: 'roygb', min: S.protein.length, max: 1 }, arrows: true } });
        pts = v.selectedAtoms({ atom: 'CA' }).map(a => [a.x, a.y, a.z]);
        c = [0, 1, 2].map(i => pts.reduce((t, p) => t + p[i], 0) / pts.length);
      } else {
        const box = crystal(v, S.crystal);
        pts = v.selectedAtoms({}).map(a => [a.x, a.y, a.z]).concat(box.corners);
        c = box.center;
      }
      v.zoomTo();
      const view = v.getView();
      view[0] = -c[0]; view[1] = -c[1]; view[2] = -c[2];
      view[3] = (v.CAMERA_Z || 150) - fit(v, cfg, pts, c);
      v.setView(view);
      m.cfg = cfg;
      m.theta = cfg.theta;
      setQ(v, at(cfg, m.theta));
      v.render();
      m.viewer = v;
      m.wrap.classList.add('is-live');
      const poster = m.poster;
      if (poster) { m.poster = null; poster.classList.add('out'); setTimeout(() => poster.remove(), HC.REDUCED ? 0 : 500); }
      go(m);
    } catch (e) {
      console.warn('[HACE] cases: 3D view unavailable, using the still render', e);
      HC.clear(m.wrap);
      still(m);
    }
  }
  function crystal(v, C) {
    const M = C.cell, n = C.supercell || [1, 1, 1];
    const cart = f => [0, 1, 2].map(j => f[0] * M[0][j] + f[1] * M[1][j] + f[2] * M[2][j]);
    const atoms = [];
    for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) for (let k = 0; k < n[2]; k++) {
      C.frac.forEach((f, a) => {
        const w = f.map(x => x - Math.floor(x));
        atoms.push(ELEM[C.Z[a]] + ' ' + cart([w[0] + i, w[1] + j, w[2] + k]).map(x => x.toFixed(4)).join(' '));
      });
    }
    v.addModel(atoms.length + '\n' + C.id + '\n' + atoms.join('\n') + '\n', 'xyz');
    Object.keys(C.colors).forEach(el => v.setStyle({ elem: el }, { sphere: { radius: RADIUS[el] || 0.6, color: C.colors[el] } }));
    const ink = HC.css('--ink-2');
    const corner = c => cart([c[0] * n[0], c[1] * n[1], c[2] * n[2]]);
    const xyz = p => ({ x: p[0], y: p[1], z: p[2] });
    for (let e = 0; e < 3; e++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const o = [0, 1, 2].filter(x => x !== e), s = [0, 0, 0];
      s[o[0]] = a; s[o[1]] = b;
      const t = s.slice(); t[e] = 1;
      v.addCylinder({ start: xyz(corner(s)), end: xyz(corner(t)), radius: 0.075, color: ink, fromCap: 1, toCap: 1 });
    }
    const corners = [];
    for (let i = 0; i < 8; i++) corners.push(corner([i & 1, (i >> 1) & 1, (i >> 2) & 1]));
    return { corners, center: corner([0.5, 0.5, 0.5]) };
  }
  function go(m) {
    if (m.raf || !m.spin || !m.vis || !m.viewer) return;
    let t0 = null;
    const step = now => {
      if (!m.spin || !m.vis || !m.wrap.isConnected) { m.raf = 0; return; }
      if (t0 === null) t0 = now;
      else if (now - t0 >= 33) { m.theta += Math.min(50, now - t0) * SPIN; setQ(m.viewer, at(m.cfg, m.theta)); t0 = now; }
      m.raf = requestAnimationFrame(step);
    };
    m.raf = requestAnimationFrame(step);
  }
  function wire(m) {
    const w = m.wrap;
    let drag = null;
    w.addEventListener('pointerdown', e => {
      if (!m.viewer || e.button > 0) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try { w.setPointerCapture(e.pointerId); } catch (err) { }
    });
    w.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      m.spin = false;
      turn(m.viewer, dx * 0.5, e.pointerType === 'touch' ? 0 : dy * 0.5);
    });
    w.addEventListener('pointerup', () => { if (drag) m.spin = false; drag = null; });
    w.addEventListener('pointercancel', () => { drag = null; });
    w.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
      if (!k || !m.viewer) return;
      e.preventDefault();
      m.spin = false;
      turn(m.viewer, k[0], k[1]);
    });
    w.addEventListener('focus', () => { m.spin = false; });
  }

  const CSS = `
#viz-cases .cs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:var(--gutter,32px)}
#viz-cases .cs-card{--ct:var(--c);display:grid;grid-row:span 7;grid-template-rows:subgrid;row-gap:0;min-width:0;position:relative;font-family:var(--sans)}
#viz-cases .cs-card+.cs-card::before{content:"";position:absolute;left:calc(var(--gutter,32px)/-2);top:2px;bottom:2px;border-left:1px solid var(--rule)}
#viz-cases.cs-one .cs-grid{grid-template-columns:minmax(0,1fr)}
#viz-cases.cs-one .cs-card{display:flex;flex-direction:column;grid-row:auto}
#viz-cases.cs-one .cs-card+.cs-card{margin-top:22px;padding-top:22px;border-top:1px solid var(--rule)}
#viz-cases.cs-one .cs-card+.cs-card::before{display:none}
#viz-cases.cs-two .cs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
#viz-cases.cs-two .cs-card:nth-child(3){grid-column:1/-1;grid-row:auto;grid-template-rows:none;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gutter,32px);margin-top:22px;padding-top:22px;border-top:1px solid var(--rule)}
#viz-cases.cs-two .cs-card:nth-child(3)>.cs-head,#viz-cases.cs-two .cs-card:nth-child(3)>.cs-headline,#viz-cases.cs-two .cs-card:nth-child(3)>.cs-box{grid-column:1/-1}
#viz-cases.cs-two .cs-card:nth-child(3)>.cs-row{grid-column:1}
#viz-cases.cs-two .cs-card:nth-child(3)>.cs-ev{grid-column:2;grid-row:2/span 3;margin-top:0;align-self:center}
#viz-cases.cs-two .cs-card:nth-child(3)::before{display:none}
#viz-cases.cs-one .cs-headline,#viz-cases.cs-one .cs-box{align-self:stretch}
#viz-cases .cs-head{margin-bottom:10px}
#viz-cases .cs-title{margin:0;font:700 14px/1.3 var(--sans);color:var(--ct);letter-spacing:-.003em}
#viz-cases .cs-sub{font:400 12.5px/1.45 var(--sans);color:var(--fig-sub)}
#viz-cases .cs-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:10px}
#viz-cases .cs-molcard .cs-row{grid-template-columns:minmax(0,47fr) minmax(0,53fr)}
#viz-cases .cs-labs{align-items:end}
#viz-cases .cs-media{align-items:center}
#viz-cases .cs-col{font:12.5px/1.3 var(--sans);color:var(--muted);text-align:center;padding-bottom:6px}
#viz-cases .cs-name{font:700 12.5px/1.3 var(--sans);color:var(--ink);text-align:center;padding-top:6px}
#viz-cases .cs-media img{display:block;width:100%;height:auto;border-radius:6px}
#viz-cases .cs-chips{list-style:none;margin:0;padding:0;display:grid;gap:10px;align-content:center}
#viz-cases .cs-chip{background:var(--cs);border:1px solid color-mix(in srgb,var(--c) 24%,var(--paper));border-radius:6px;padding:9px 6px;text-align:center;font:700 12px/1.3 var(--sans);color:var(--ct);text-wrap:balance}
#viz-cases .cs-chip2{text-align:left;padding:7px 10px}
#viz-cases .cs-chip2 b{display:block;font-size:13.5px;line-height:1.3}
#viz-cases .cs-chip2 span{display:block;font-weight:400}
#viz-cases .cs-chip.is-neutral{background:var(--hover);border-color:var(--rule);color:var(--ink)}
#viz-cases .cs-chip.is-neutral span{color:var(--muted)}
#viz-cases .cs-mol{position:relative;width:100%;aspect-ratio:1;touch-action:pan-y;border-radius:8px;outline:none;-webkit-user-select:none;user-select:none}
#viz-cases .cs-mol.is-live{cursor:grab}
#viz-cases .cs-mol.is-live:active{cursor:grabbing}
#viz-cases .cs-mol:focus-visible{box-shadow:0 0 0 2px var(--c)}
#viz-cases .cs-mol img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
#viz-cases .cs-mol .cs-poster{z-index:1;transition:opacity .45s ease}
#viz-cases .cs-mol .cs-poster.out{opacity:0}
#viz-cases .cs-elems{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding-top:6px;font:12px/1.3 var(--sans);color:var(--ink-2)}
#viz-cases .cs-el{display:inline-flex;align-items:center;gap:5px}
#viz-cases .cs-el i{width:10px;height:10px;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 22%,transparent)}
#viz-cases .cs-ev{margin-top:16px;min-width:0}
#viz-cases .cs-evhead{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;margin-bottom:6px}
#viz-cases .cs-evlabel{font:600 12.5px/1.2 var(--sans);color:var(--ink-2)}
#viz-cases .cs-rank{display:flex;gap:6px}
#viz-cases .cs-nums{flex:0 0 16px;list-style:none;margin:0;padding:0}
#viz-cases .cs-nums li{height:${ROW}px;text-align:right;font:600 12.5px/${ROW - 2}px var(--sans);font-variant-numeric:tabular-nums;color:var(--muted);transition:color .3s ease .55s}
#viz-cases .cs-nums li.is-target{color:var(--ct)}
#viz-cases .cs-list{position:relative;flex:1 1 auto;min-width:0;list-style:none;margin:0;padding:0;overflow:hidden}
#viz-cases .cs-li{position:absolute;left:0;right:0;top:0;height:${ROW - 2}px;display:flex;align-items:center;padding:0 8px;border-radius:6px;background:var(--paper);box-shadow:inset 0 -1px 0 var(--rule-2);font:12.5px/1.25 var(--sans);color:var(--ink-2);outline:none;transition:transform .62s cubic-bezier(.65,0,.35,1),opacity .36s ease;will-change:transform}
#viz-cases .cs-li.is-in{z-index:2;transition:transform .78s cubic-bezier(.2,.75,.25,1),opacity 0s}
#viz-cases .cs-li.is-gone{transition:transform .32s ease-in,opacity .26s ease-in}
#viz-cases .cs-li.is-out{opacity:0;pointer-events:none}
#viz-cases .cs-li:focus-visible{box-shadow:inset 0 0 0 1.5px var(--c)}
#viz-cases .cs-tt{flex:1 1 auto;min-width:0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
#viz-cases .cs-li.is-target{background:var(--cs);box-shadow:inset 2.5px 0 0 var(--c);color:var(--ink);font-weight:650}
#viz-cases .cs-li.is-target:focus-visible{box-shadow:inset 2.5px 0 0 var(--c),inset 0 0 0 1.5px var(--c)}
#viz-cases .cs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
#viz-cases .cs-now .cs-li,#viz-cases .cs-now .cs-nums li,#viz-cases .cs-now .cs-lab2{transition:none!important}
#viz-cases .cs-note{margin-top:8px;font:12px/16px var(--sans);color:var(--muted);white-space:nowrap}
#viz-cases .cs-headline{margin:16px 0 9px;font:700 13.5px/1.3 var(--sans);color:var(--ct);text-align:center;align-self:end}
#viz-cases .cs-box{background:var(--cs);border-radius:7px;padding:8px 11px 9px;align-self:start}
#viz-cases .cs-box1{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12px;line-height:1.4;color:var(--ink-2)}
#viz-cases .cs-box2{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:2px;font-size:12.5px;line-height:1.35;color:var(--ink)}
#viz-cases .cs-box2 b{font-size:14px;font-weight:700;color:var(--ct);white-space:nowrap}
#viz-cases .cs-rtag{font:inherit;font-size:11.5px;color:inherit;background:none;border:0;padding:4px 6px;margin:-4px -6px -4px 0;min-width:24px;min-height:24px;cursor:help;border-radius:4px;outline:none}
@media (pointer:coarse){#viz-cases .cs-rtag{min-width:32px;min-height:32px;padding:8px 6px;margin:-8px -6px -8px 0}}
#viz-cases .cs-rtag:focus-visible{box-shadow:0 0 0 2px var(--c)}
#viz-cases .cs-svg text{font-family:var(--sans)}
#viz-cases .cs-band{fill:var(--cs)}
#viz-cases .cs-bandlab{fill:var(--ct);font-size:11.5px;font-weight:600}
#viz-cases .cs-gl{stroke:var(--grid);stroke-width:1;stroke-dasharray:2 3}
#viz-cases .cs-tick{fill:var(--tick);font-size:12px;font-variant-numeric:tabular-nums}
#viz-cases .cs-colhead{fill:var(--ink-2);font-size:12px;font-weight:600}
#viz-cases .cs-ln{transition:opacity .2s;pointer-events:none}
#viz-cases .cs-dim .cs-ln:not(.on){opacity:.18}
#viz-cases .cs-line{fill:none;stroke-width:1.6;stroke-linecap:round}
#viz-cases .cs-hitg{outline:none}
#viz-cases .cs-hit{fill:none;stroke:transparent;stroke-width:12;stroke-linecap:round;pointer-events:stroke}
#viz-cases .cs-hitg:focus-visible .cs-hit{stroke:var(--ct);stroke-width:9}
#viz-cases .cs-dot0{fill:var(--paper);stroke-width:1.5}
#viz-cases .cs-dot1{stroke:var(--paper);stroke-width:1.2}
#viz-cases .kept .cs-line{stroke:var(--ink-2);stroke-width:1.8}
#viz-cases .kept .cs-dot0{stroke:var(--ink-2)}
#viz-cases .kept .cs-dot1{fill:var(--ink-2)}
#viz-cases .hot .cs-line{stroke:var(--c);stroke-width:2.2}
#viz-cases .hot .cs-dot0{stroke:var(--c)}
#viz-cases .hot .cs-dot1{fill:var(--c)}
#viz-cases .cs-lab2{font-size:11.5px;font-weight:600;opacity:0;transform:translateX(-6px);transition:opacity .5s ease,transform .5s ease}
#viz-cases .cs-lab2.in{opacity:1;transform:none}
#viz-cases .hot .cs-lab2{fill:var(--ct)}
#viz-cases .kept .cs-lab2{fill:var(--ink)}
#viz-cases .cs-svgnote{fill:var(--muted);font-weight:400}
@supports not (grid-template-rows:subgrid){#viz-cases .cs-card{display:flex;flex-direction:column}#viz-cases .cs-headline{margin-top:auto}}
@media (prefers-reduced-motion:reduce){#viz-cases .cs-li,#viz-cases .cs-lab2,#viz-cases .cs-ln,#viz-cases .cs-poster{transition:none!important}}
`;
  function style() {
    if (document.querySelector('style[data-hc="cases"]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-hc', 'cases');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  HC.register('cases', function (host, api) {
    const F = api.data.fig4 && api.data.fig4.upper;
    if (!F || !F.rec || !F.protein || !F.materials) { console.warn('[HACE] cases: HACE_DATA.fig4.upper is missing'); return {}; }
    style();
    host.classList.toggle('cs-one', host.clientWidth < 640);
    host.classList.toggle('cs-two', host.clientWidth >= 640 && host.clientWidth < 860);
    const tip = HC.tooltip(host);
    const grid = HC.h('div', { class: 'cs-grid' }, host);
    const a = recCard(grid, F.rec, tip, api);
    const pb = protCard(grid, F.protein, tip), pc = matCard(grid, F.materials, tip);
    const b = pb.build(a.evH), c = pc.build(a.evH);
    const parts = [
      ['a', a.ev, 700, () => { if (!api.touched) a.show(1); }, () => a.show(api.touched ? recState : 1, true)],
      ['b', pb.ev, 150, b.reveal, b.done],
      ['c', pc.ev, 350, c.reveal, c.done],
    ];
    a.show(api.touched ? recState : 0, true);
    parts.forEach(([key, node, ms, run, end]) => {
      if (api.played || HC.REDUCED || seen[key]) { end(); return; }
      HC.whenVisible(node, () => {
        seen[key] = true;
        HC.wait(ms).then(() => { if (node.isConnected) run(); });
      }, Math.min(0.6, 0.5 * innerHeight / Math.max(1, node.offsetHeight)));
    });
    return { play(instant) { if (instant) parts.forEach(p => p[4]()); } };
  });
})();
