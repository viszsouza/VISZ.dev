/* =========================================================
   Páginas internas: submenu de serviços e serviço pré-selecionado no contato
   ========================================================= */
(function () {
  'use strict';

  /* ---------- submenu "Serviços" (mouse, teclado e toque) ---------- */
  const item = document.querySelector('.nav__item--sub');
  if (item) {
    const btn = item.querySelector('.nav__sub-btn');
    const close = () => { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => { if (!item.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.blur(); } });
    item.addEventListener('focusin', () => btn.setAttribute('aria-expanded', 'true'));
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) btn.setAttribute('aria-expanded', 'false'); });
  }

  /* ---------- contato.html?servico=... escolhe o serviço no formulário ---------- */
  const wanted = new URLSearchParams(window.location.search).get('servico');
  const select = document.getElementById('service');
  if (wanted && select) {
    const opt = Array.from(select.options).find((o) => o.text.trim().toLowerCase() === wanted.trim().toLowerCase());
    if (opt) {
      select.value = opt.value || opt.text;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
})();

/* =========================================================
   Portfólio: filtro por segmento
   ========================================================= */
(function () {
  'use strict';
  const bar = document.querySelector('.filters');
  const grid = document.getElementById('projetos-grid');
  if (!bar || !grid) return;
  const chips = Array.from(bar.querySelectorAll('.chip'));
  const cards = Array.from(grid.querySelectorAll('.portfolio-card[data-seg]'));
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const seg = chip.dataset.seg;
      chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      cards.forEach((card) => {
        const show = seg === 'all' || card.dataset.seg === seg;
        card.hidden = !show;
        if (show) card.classList.add('is-visible'); // garante que apareça mesmo se ainda não rolou até ele
      });
    });
  });
})();
