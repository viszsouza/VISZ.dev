/* Página de Termos: índice aberto no desktop, recolhido no celular, e destaque da seção atual. */
(function () {
  'use strict';
  const toc = document.getElementById('legalToc');
  if (!toc) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const sync = () => { toc.open = desktop.matches; };
  sync();
  desktop.addEventListener('change', sync);

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  // no celular, fecha o índice depois de escolher uma seção
  links.forEach((a) => a.addEventListener('click', () => { if (!desktop.matches) toc.open = false; }));

  if (!('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) map.set(s, a); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
      const a = map.get(e.target);
      if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
  map.forEach((_, s) => io.observe(s));
})();
