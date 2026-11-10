/* =========================================================
   ANIMAÇÕES AUTOMÁTICAS — Agência VISZ
   Complementa o main.js: escalonamento de entrada, destaque
   em loop, linha do processo guiada pelo scroll, barra de
   progresso e título do hero palavra por palavra.
   Sem dependências. Respeita prefers-reduced-motion.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Menu: destaca a seção atual (independe de movimento reduzido) ---------- */
  (function () {
    const links = Array.from(document.querySelectorAll('.nav__list a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach((l) => { const s = document.querySelector(l.getAttribute('href')); if (s) map.set(s, l); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => { l.classList.remove('is-current'); l.removeAttribute('aria-current'); });
        const l = map.get(e.target);
        if (l) { l.classList.add('is-current'); l.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    map.forEach((_, s) => io.observe(s));
  })();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 1. Título do hero palavra por palavra ---------- */
  const title = $('.hero__title');
  if (title) {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    const wrap = (node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const outer = document.createElement('span');
          outer.className = 'w';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.style.setProperty('--i', n++);
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.from(node.childNodes).forEach(wrap);
      }
    };
    Array.from(title.childNodes).forEach(wrap);
    title.classList.add('is-split');
  }

  /* ---------- 2. Entrada escalonada + variações ---------- */
  // [container, filhos, atraso (ms), colunas, variação]
  const groups = [
    ['.fronts', '.front', 120, 3, null],
    ['.packs', '.pack', 90, 3, 'zoom'],
    ['.diff-manifesto', '.diff-line', 70, 4, 'left'],
    ['.process-rail', '.process-step', 110, 6, null],
    ['.cycles', '.cycle', 160, 2, null],
    ['.trust-rules', 'li', 110, 3, null],
    ['.stats__grid', '.stat', 100, 4, null],
    ['.grid--portfolio', '.portfolio-card', 110, 3, 'zoom']
  ];

  const clearDelay = new MutationObserver((muts) => {
    muts.forEach((m) => {
      const el = m.target;
      if (el.classList.contains('is-visible') && el.style.transitionDelay) {
        // remove o atraso depois da entrada, para não atrasar transições de hover
        setTimeout(() => { el.style.transitionDelay = ''; }, 1800);
      }
    });
  });

  groups.forEach(([cSel, iSel, delay, cols, variant]) => {
    const container = $(cSel);
    if (!container) return;
    $$(iSel, container).forEach((el, i) => {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      el.style.transitionDelay = ((i % cols) * delay) + 'ms';
      if (variant && !el.dataset.anim) el.dataset.anim = variant;
      clearDelay.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  });

  const cycles = $$('.cycles .cycle');
  if (cycles[0]) cycles[0].dataset.anim = 'left';
  if (cycles[1]) cycles[1].dataset.anim = 'right';
  const eco = $('.ecosystem');
  if (eco) eco.dataset.anim = 'zoom';

  /* garante que os elementos recém-marcados também sejam revelados no scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    $$('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 3. Destaque automático em loop ---------- */
  function spotlight(container, items, interval) {
    if (!container || items.length < 2 || !('IntersectionObserver' in window)) return;
    let idx = -1, timer = null, paused = false;

    const clear = () => items.forEach((i) => i.classList.remove('is-active'));
    const step = () => {
      if (paused || document.hidden) return;
      clear();
      idx = (idx + 1) % items.length;
      items[idx].classList.add('is-active');
    };
    const start = () => { if (!timer) { step(); timer = setInterval(step, interval); } };
    const stop = () => { clearInterval(timer); timer = null; clear(); };

    // ativa quando qualquer parte do bloco cruza a faixa central da tela
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { rootMargin: '-20% 0px -20% 0px', threshold: 0 }).observe(container);

    // se a pessoa interagir, o hover natural assume
    container.addEventListener('pointerenter', () => { paused = true; clear(); });
    container.addEventListener('pointerleave', () => { paused = false; });
  }

  const fronts = $('.fronts');
  if (fronts) spotlight(fronts, $$('.front', fronts), 3200);
  const packs = $('.packs');
  if (packs) spotlight(packs, $$('.pack', packs), 2600);
  const diff = $('.diff-manifesto');
  if (diff) spotlight(diff, $$('.diff-line', diff), 2200);
  $$('.cycle__list').forEach((list, k) => {
    setTimeout(() => spotlight(list, $$('li', list), 2000), k * 700);
  });

  /* ---------- 4. Progresso de leitura, parallax e linha do processo ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const rail = $('.process-rail');
  const steps = rail ? $$('.process-step', rail) : [];

  function updateRail() {
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const vh = window.innerHeight;
    const range = Math.max(r.height * 0.9, vh * 0.4);
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / range));
    rail.style.setProperty('--p', p.toFixed(3));
    steps.forEach((s, i) => s.classList.toggle('is-done', p >= (i + 0.4) / steps.length));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
      document.documentElement.style.setProperty('--sy', Math.min(y, 1000));
      updateRail();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. Hero ao vivo: contadores das telas ---------- */
  const hero = $('.hero');
  if (hero) {
    // contadores que sobem (valores ilustrativos da simulação)
    const ticks = $$('.js-tick', hero).map((el) => ({
      el,
      value: parseInt(el.dataset.start, 10),
      min: parseInt(el.dataset.min, 10),
      max: parseInt(el.dataset.max, 10),
      ms: parseInt(el.dataset.ms, 10),
      last: 0
    }));
    const fmt = (n) => n.toLocaleString('pt-BR');
    let raf = null;
    const loop = (t) => {
      ticks.forEach((k) => {
        if (t - k.last >= k.ms) {
          k.last = t;
          k.value += k.min + Math.floor(Math.random() * (k.max - k.min + 1));
          k.el.textContent = fmt(k.value);
        }
      });
      raf = requestAnimationFrame(loop);
    };
    if (ticks.length && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
          else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }).observe(hero);
    }
  }
})();
