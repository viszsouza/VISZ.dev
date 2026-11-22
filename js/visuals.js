/* =========================================================
   Cenas animadas: pausa fora da tela e contadores
   ========================================================= */
(function () {
  'use strict';
  const scenes = Array.from(document.querySelectorAll('[data-live]'));
  if (!scenes.length || !('IntersectionObserver' in window)) { scenes.forEach((s) => s.classList.add('is-live')); }
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '120px 0px', threshold: 0 });
    scenes.forEach((s) => io.observe(s));
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // contadores que sobem (valores ilustrativos das simulações)
  const ticks = Array.from(document.querySelectorAll('.v-tick')).map((el) => ({
    el, value: parseInt(el.dataset.start, 10), min: parseInt(el.dataset.min, 10),
    max: parseInt(el.dataset.max, 10), ms: parseInt(el.dataset.ms, 10), last: 0, scene: el.closest('[data-live]')
  }));
  if (!ticks.length) return;
  const fmt = (n) => n.toLocaleString('pt-BR');
  const loop = (t) => {
    ticks.forEach((k) => {
      if (k.scene && !k.scene.classList.contains('is-live')) return;
      if (t - k.last >= k.ms) {
        k.last = t;
        k.value += k.min + Math.floor(Math.random() * (k.max - k.min + 1));
        k.el.textContent = fmt(k.value);
      }
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
