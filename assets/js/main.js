(function () {
  'use strict';
  function solo() {
    const name = new URLSearchParams(location.search).get('solo');
    const host = name && document.getElementById('viz-' + name);
    const sec = host && host.closest('section');
    if (!sec) return;
    document.body.classList.add('solo');
    document.querySelectorAll('header.hero, footer, main > section').forEach(n => { if (n !== sec) n.hidden = true; });
    sec.querySelectorAll('.col > :not(.eyebrow):not(h2)').forEach(n => { n.hidden = true; });
    sec.querySelectorAll('figure').forEach(f => { if (!f.contains(host)) f.hidden = true; });
  }
  function start() {
    solo();
    window.HC.mountAll();

    document.querySelectorAll('figure.card').forEach(f => {
      f.classList.add('reveal');
      window.HC.whenVisible(f, () => f.classList.add('in'), 0.08);
    });

    document.querySelectorAll('button.copy[data-copy]').forEach(b => {
      b.addEventListener('click', async () => {
        const src = document.querySelector(b.getAttribute('data-copy'));
        if (!src) return;
        try { await navigator.clipboard.writeText(src.textContent); b.textContent = 'Copied'; }
        catch (e) {
          const r = document.createRange(); r.selectNodeContents(src);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected';
        }
        setTimeout(() => { b.textContent = 'Copy'; }, 1600);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
