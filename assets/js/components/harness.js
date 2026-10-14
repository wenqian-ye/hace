(function () {
  'use strict';
  const HC = window.HC;
  const DOMAINS = [
    { key: 'recommendation', label: 'Recommendation', cap: 'table9', c: '--d-rec' },
    { key: 'protein', label: 'Protein function', cap: 'table10', c: '--d-prot' },
    { key: 'materials', label: 'Crystal stability', cap: 'table11', c: '--d-mat' },
  ];
  const LINKS = {
    recommendation: { top_k: /^k$/, n_history: /recent interactions/, promote_from: /leading items/, show_year: /metadata/, show_genre: /metadata/ },
    protein: { top_k: /^k$/, n_known: /known terms/, promote_from: /GO terms in specialist order/, def_chars: /definition/, show_aspect: /aspect/, show_organism: /organism/ },
    materials: { top_k: /^k$/, promote_from: /formulas in specialist order/, proto_chars: /prototype/, show_elements: /element set/, show_rank: /specialist rank/ },
  };

  const CSS = `
#viz-harness{font-family:var(--sans)}
#viz-harness .hc-top.hc-tabs{gap:6px;margin:0 0 16px}
#viz-harness .hc-tabs button{display:inline-flex;align-items:center;gap:8px;transition:background .2s,border-color .2s,color .2s}
#viz-harness .hn-dot{width:8px;height:8px;border-radius:50%;background:var(--c);flex:none}
#viz-harness .hn-stack{display:grid}
#viz-harness .hn-panel{grid-area:1/1;opacity:0;visibility:hidden;transition:opacity .32s ease,visibility 0s linear .32s}
#viz-harness .hn-panel.on{opacity:1;visibility:visible;transition:opacity .32s ease .06s,visibility 0s}
#viz-harness .hn-stack.flow .hn-panel:not(.on){display:none}
#viz-harness .hn-stack.flow .hn-panel.on{animation:hn-in .32s ease}
@keyframes hn-in{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){#viz-harness .hn-stack.flow .hn-panel.on,#viz-harness .hn-body.on{animation:none}}
#viz-harness .hn-grid{display:grid;gap:22px;align-items:start}
#viz-harness .hn-grid.two{grid-template-columns:minmax(0,43fr) minmax(0,57fr);gap:24px}
#viz-harness .hn-card{border:1px solid var(--rule);border-radius:12px;overflow:hidden;background:var(--paper);box-shadow:0 1px 3px color-mix(in srgb,var(--ink) 5%,transparent)}
#viz-harness .hn-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding:8px 12px;background:var(--ink-2);color:var(--paper)}
#viz-harness .hn-title{font:700 14px/1.35 var(--sans)}
#viz-harness .hn-tog{display:flex;width:fit-content;margin:0 0 8px}
#viz-harness .hn-body{display:none;padding:12px 14px 13px;font:13.5px/1.55 var(--sans);color:var(--ink-2);background:var(--bg)}
#viz-harness .hn-body.on{display:block;animation:hn-in .28s ease}
#viz-harness .hn-line{margin:0 0 3px}
#viz-harness .hn-head{font-weight:700;color:var(--ink);margin:9px 0 2px}
#viz-harness .hn-ph{display:inline;padding:0 5px;margin:0 1px;border-radius:5px;background:var(--harness-soft);box-shadow:inset 0 0 0 1px var(--harness-line);color:color-mix(in srgb,var(--harness) 85%,var(--ink));font-size:12.5px;-webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background .18s,color .18s,box-shadow .18s}
#viz-harness .hn-ph i{font-style:normal;opacity:.5}
#viz-harness .hn-ph.lit{background:var(--harness);color:var(--paper);box-shadow:inset 0 0 0 1px var(--harness)}
#viz-harness .hn-note{margin:0;padding:8px 14px;font:12.5px/1.5 var(--sans);color:var(--muted);background:var(--bg);border-bottom:1px solid var(--rule)}
#viz-harness .hn-right{min-width:0;overflow-x:auto}
#viz-harness .hn-table td{vertical-align:top}
#viz-harness .hn-table tbody tr{transition:background .18s,opacity .45s ease,transform .45s ease;outline:none}
#viz-harness .hn-table tbody tr.link{cursor:default}
#viz-harness .hn-table tbody tr.link.hot{background:var(--harness-panel)}
#viz-harness .hn-table tbody tr.link.hot .hn-f{color:color-mix(in srgb,var(--harness) 85%,var(--ink))}
#viz-harness .hn-f{font:12.5px/1.4 var(--mono);color:var(--ink);white-space:nowrap}
#viz-harness .hn-i{color:var(--ink);font-weight:650;font-variant-numeric:tabular-nums}
#viz-harness .hn-pills{display:flex;flex-wrap:wrap;gap:4px}
#viz-harness .hn-pill{display:inline-block;min-width:26px;text-align:center;padding:1px 7px;border-radius:999px;border:1px solid var(--rule);background:var(--paper);font:12px/1.45 var(--sans);font-variant-numeric:tabular-nums;color:var(--ink-2)}
#viz-harness .hn-pill.init{background:var(--harness-soft);border-color:var(--harness);color:color-mix(in srgb,var(--harness) 85%,var(--ink));font-weight:700}
#viz-harness .hn-table:not(.narrow) .hn-pills{flex-wrap:nowrap}
#viz-harness .hn-table:not(.narrow) td.r{min-width:150px}
#viz-harness .hn-fixed{font-style:italic;color:var(--muted)}
#viz-harness tr.fixed .hn-f,#viz-harness tr.fixed .hn-i,#viz-harness tr.fixed .hn-role{color:var(--muted)}
#viz-harness tr.fixed .hn-i{font-weight:400}
#viz-harness .hn-role{color:var(--ink-2)}
#viz-harness .hn-cap{margin:12px 0 0;max-width:none;font:14.5px/1.55 var(--sans);color:var(--muted)}
#viz-harness .hn-cap b{color:var(--ink-2);font-weight:600}
#viz-harness .hn-right.below-tog{padding-top:40px}
#viz-harness .hn-grid.two{align-items:stretch}
#viz-harness .hn-grid.two .hn-left,#viz-harness .hn-grid.two .hn-card,#viz-harness .hn-grid.two .hn-right{display:flex;flex-direction:column}
#viz-harness .hn-grid.two .hn-card,#viz-harness .hn-grid.two .hn-body,#viz-harness .hn-grid.two .hn-table{flex:1 1 auto}
#viz-harness .hn-hint{margin:6px 0 0;font:12.5px/1.4 var(--sans);color:var(--muted)}
#viz-harness .hn-pre tbody tr{opacity:0;transform:translateY(6px)}
#viz-harness .hn-table.narrow thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
#viz-harness .hn-table.narrow tbody tr{display:grid;grid-template-columns:1fr auto;column-gap:10px;padding:8px 0 9px;border-bottom:1px solid var(--rule-2)}
#viz-harness .hn-table.narrow td{display:block;border:0;padding:0}
#viz-harness .hn-table.narrow td.v,#viz-harness .hn-table.narrow td.r{grid-column:1/-1}
#viz-harness .hn-table.narrow td.v{margin:5px 0 3px}
#viz-harness .hn-table.narrow td.i::before{content:"Initial ";color:var(--muted);font-weight:400;font-size:12px}
#viz-harness .hn-table.narrow .hn-role{font-size:12.5px;color:var(--muted)}
#viz-harness.instant *{transition:none!important}
`;

  function promptBody(txt, parent) {
    const body = HC.h('div', { class: 'hn-body' }, parent);
    const chips = [];
    txt.split('\n').forEach(line => {
      const head = !/[{.:]/.test(line) && line.length < 48;
      const p = HC.h('div', { class: head ? 'hn-head' : 'hn-line' }, body);
      if (head) { p.textContent = line; return; }
      line.split(/(\{[^}]*\})/).forEach(part => {
        if (!part) return;
        if (part[0] !== '{') { p.appendChild(document.createTextNode(part)); return; }
        const inner = part.slice(1, -1);
        const c = HC.h('span', { class: 'hn-ph', 'data-ph': inner }, p);
        HC.h('i', {}, c).textContent = '{';
        c.appendChild(document.createTextNode(inner));
        HC.h('i', {}, c).textContent = '}';
        chips.push(c);
      });
    });
    return { body, chips };
  }

  const isFixed = r => !Array.isArray(r.candidate_values);

  function fieldTable(rows, links, narrow, parent, light) {
    let hot = null;
    const set = tr => {
      if (hot) hot.classList.remove('hot');
      hot = tr;
      if (tr) tr.classList.add('hot');
      light(tr ? links[tr.dataset.f] : null);
    };
    const t = HC.h('table', { class: 'hc-table hn-table' + (narrow ? ' narrow' : '') }, parent);
    const hr = HC.h('tr', {}, HC.h('thead', {}, t));
    ['Field', 'Initial', 'Candidate values', 'Role'].forEach(s => { HC.h('th', { scope: 'col' }, hr).textContent = s; });
    const tb = HC.h('tbody', {}, t);
    rows.forEach(r => {
      const re = links[r.field];
      const tr = HC.h('tr', { class: (isFixed(r) ? 'fixed' : '') + (re ? ' link' : ''), 'data-f': r.field }, tb);
      HC.h('code', { class: 'hn-f' }, HC.h('td', { class: 'f' }, tr)).textContent = r.field;
      HC.h('span', { class: 'hn-i' }, HC.h('td', { class: 'i' }, tr)).textContent = String(r.initial);
      const v = HC.h('td', { class: 'v' }, tr);
      if (isFixed(r)) HC.h('span', { class: 'hn-fixed' }, v).textContent = r.candidate_values;
      else {
        const box = HC.h('div', { class: 'hn-pills' }, v);
        r.candidate_values.forEach(c => {
          const on = String(c) === String(r.initial);
          const p = HC.h('span', { class: 'hn-pill' + (on ? ' init' : '') }, box);
          p.textContent = String(c);
          if (on) p.title = 'Initial value';
        });
      }
      HC.h('span', { class: 'hn-role' }, HC.h('td', { class: 'r' }, tr)).textContent = r.role;
      if (re) {
        tr.tabIndex = 0;
        tr.setAttribute('aria-label', `${r.field}, initial ${r.initial}. ${r.role}. Highlights the matching prompt text.`);
        const rest = () => set(tb.contains(document.activeElement) ? document.activeElement : null);
        tr.addEventListener('mouseenter', () => set(tr));
        tr.addEventListener('focus', () => set(tr));
        tr.addEventListener('click', () => set(tr));
        tr.addEventListener('mouseleave', rest);
        tr.addEventListener('blur', rest);
      }
    });
    return t;
  }

  HC.register('harness', function (host, api) {
    if (!document.querySelector('style[data-hc="harness"]')) {
      HC.h('style', { 'data-hc': 'harness' }, document.head).textContent = CSS;
    }
    const P = api.data.paper || {};
    if (!P.prompts || !P.harness_tables) return {};
    const W = Math.max(300, host.clientWidth);
    const wide = W >= 890, narrow = W < 520;
    const uid = HC.uid();
    const st = api.harnessState || (api.harnessState = { tab: 0, variant: 0 });
    const doms = DOMAINS.filter(d => P.prompts[d.key] && P.harness_tables[d.key]);

    const tabs = HC.h('div', { class: 'hc-top hc-tabs', role: 'tablist', 'aria-label': 'Harness domain' }, host);
    const stack = HC.h('div', { class: 'hn-stack' + (wide ? '' : ' flow') }, host);
    const tables = [];
    const items = doms.map(d => {
      const id = `hn${uid}-${d.key}`;
      const b = HC.h('button', { type: 'button', role: 'tab', id: id + '-tab', 'aria-controls': id, 'aria-selected': 'false', tabindex: '-1' }, tabs);
      b.style.setProperty('--c', `var(${d.c})`);
      HC.h('span', { class: 'hn-dot', 'aria-hidden': 'true' }, b);
      HC.h('span', {}, b).textContent = d.label;
      const panel = HC.h('div', { class: 'hn-panel', role: 'tabpanel', id, 'aria-labelledby': id + '-tab' }, stack);
      const grid = HC.h('div', { class: 'hn-grid' + (wide ? ' two' : '') }, panel);

      const left = HC.h('div', { class: 'hn-left' }, grid);
      const variants = [P.prompts[d.key]];
      const single = d.key === 'recommendation' && P.prompts.recommendation_single;
      if (single) variants.push(single);
      const tog = single ? HC.h('div', { class: 'hc-seg hn-tog', role: 'group', 'aria-label': 'Prompt variant' }, left) : null;
      const card = HC.h('div', { class: 'hn-card' }, left);
      const bar = HC.h('div', { class: 'hn-bar' }, card);
      const title = HC.h('div', { class: 'hn-title' }, bar);
      const note = single && single.usage_note ? HC.h('p', { class: 'hn-note' }, card) : null;
      if (note) note.textContent = single.usage_note.split('. ')[0] + '.';
      const built = variants.map(v => promptBody(v.text, card));
      const chips = built.reduce((a, x) => a.concat(x.chips), []);
      let hint = null;
      const show = j => {
        built.forEach((x, k) => { x.body.classList.toggle('on', k === j); x.body.setAttribute('aria-hidden', k === j ? 'false' : 'true'); });
        title.textContent = variants[j].title;
        if (note) note.hidden = j !== 1;
        if (hint) hint.style.visibility = built[j].chips.length ? '' : 'hidden';
      };
      if (single) {
        const btns = ['Ranking', 'Single selection'].map((s, j) => {
          const t = HC.h('button', { type: 'button', 'aria-pressed': j === st.variant ? 'true' : 'false' }, tog);
          t.textContent = s;
          t.addEventListener('click', () => { btns.forEach((x, k) => x.setAttribute('aria-pressed', k === j ? 'true' : 'false')); st.variant = j; show(j); });
          return t;
        });
      }

      const right = HC.h('div', { class: 'hn-right' + (single && wide ? ' below-tog' : '') }, grid);
      const light = re => chips.forEach(c => c.classList.toggle('lit', !!re && re.test(c.dataset.ph)));
      tables.push(fieldTable(P.harness_tables[d.key], LINKS[d.key] || {}, narrow, right, light));
      const capTxt = (P.captions || {})[d.cap];
      if (capTxt) {
        const cap = HC.h('p', { class: 'hn-cap' }, right);
        HC.h('b', {}, cap).textContent = 'Table ' + d.cap.replace(/\D/g, '') + '. ';
        cap.appendChild(document.createTextNode(capTxt));
      }
      if (Object.keys(LINKS[d.key] || {}).length) {
        hint = HC.h('p', { class: 'hn-hint' }, right);
        hint.textContent = 'Tap, hover or focus a field to highlight the prompt text it controls.';
      }
      show(single ? st.variant : 0);
      return { b, panel };
    });

    let cur = -1;
    function select(i, focus) {
      if (i === cur) return;
      cur = i; st.tab = i;
      items.forEach((it, k) => {
        const on = k === i;
        it.b.setAttribute('aria-selected', on ? 'true' : 'false');
        it.b.tabIndex = on ? 0 : -1;
        it.panel.classList.toggle('on', on);
        it.panel.inert = !on;
        it.panel.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (focus) items[i].b.focus();
    }
    items.forEach((it, i) => {
      it.b.addEventListener('click', () => select(i));
      it.b.addEventListener('keydown', e => {
        const n = items.length;
        const j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
        if (j < 0) return;
        e.preventDefault();
        select(j, true);
      });
    });
    host.classList.add('instant');
    select(Math.min(st.tab, items.length - 1));
    requestAnimationFrame(() => requestAnimationFrame(() => host.classList.remove('instant')));

    const animate = !HC.REDUCED && !api.played && host.offsetHeight < innerHeight * 3;
    if (animate) tables.forEach(t => t.classList.add('hn-pre'));
    return {
      play(instant) {
        if (instant || !animate) { tables.forEach(t => t.classList.remove('hn-pre')); return; }
        tables.forEach(t => {
          const rows = t.querySelectorAll('tbody tr');
          rows.forEach((r, k) => { r.style.transitionDelay = `0ms,${120 + 70 * k}ms,${120 + 70 * k}ms`; });
          t.classList.remove('hn-pre');
          setTimeout(() => rows.forEach(r => { r.style.transitionDelay = ''; }), 120 + 70 * rows.length + 500);
        });
      },
    };
  });
})();
