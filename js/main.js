/* =========================================================
   VISZ.dev — main.js
   Sem dependências externas. Vanilla ES6.
   ========================================================= */
(() => {
  'use strict';

  /* =========================================================
     CONFIGURAÇÃO DE INTEGRAÇÕES — edite os valores abaixo
     ========================================================= */
  const CONFIG = {
    // E-mail (via EmailJS — emailjs.com, plano grátis)
    EMAILJS_PUBLIC_KEY: 'vHBeTk0_XIOY9Q5g6',
    EMAILJS_SERVICE_ID: 'service_nij8nio',
    EMAILJS_TEMPLATE_ID: 'template_l8ud0om',
    DESTINATION_EMAIL: 'contatoviszdev@gmail.com',

    // Notificação no WhatsApp: abre uma aba com a mensagem pronta,
    // endereçada ao número abaixo — o lead só confirma o envio.
    WHATSAPP_NUMBER: '5581985742601'
  };
 
  if (window.emailjs && CONFIG.EMAILJS_PUBLIC_KEY && !CONFIG.EMAILJS_PUBLIC_KEY.startsWith('COLE_')) {
    emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
  }
 
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  /* ---------------- Ano no rodapé ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
 
  /* ---------------- Header: transparente -> sólido ---------------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });
 
  /* ---------------- Menu mobile ---------------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
 
  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
 
  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }
 
  /* ---------------- Contador animado (stats) ---------------- */
  const statNumbers = document.querySelectorAll('.stat__number');
  const animateCount = (el) => {
    const staticVal = el.dataset.static;
    if (staticVal) { el.textContent = staticVal; return; }
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    if (reducedMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  };
  if ('IntersectionObserver' in window) {
    const statsIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statsIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statNumbers.forEach(el => statsIo.observe(el));
  }
 
  /* ---------------- Partículas — hero + todas as seções ---------------- */
  function initCanvas(canvas, opts) {
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height, dpr;
    let rafId;

    const cfg = Object.assign({
      count: 90,
      density: 14000,
      minR: 0.6,
      maxR: 2.2,
      speed: 0.32,
      minOpacity: 0.28,
      maxOpacity: 0.72,
      color: '250,0,0',
      connect: true,
      connectDist: 120,
      connectOpacity: 0.18,
    }, opts);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width  = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const count = Math.min(cfg.count, Math.floor((width * height) / cfg.density));
      particles = Array.from({ length: count }, () => ({
        x:  Math.random() * width,
        y:  Math.random() * height,
        r:  Math.random() * (cfg.maxR - cfg.minR) + cfg.minR,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        o:  Math.random() * (cfg.maxOpacity - cfg.minOpacity) + cfg.minOpacity,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Conexões
      if (cfg.connect) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cfg.connectDist) {
              const alpha = cfg.connectOpacity * (1 - dist / cfg.connectDist);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(${cfg.color},${alpha.toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      // Pontos
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;  if (p.x > width)  p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height)  p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cfg.color},${p.o})`;
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    // Pausar quando fora do viewport (performance)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { if (!rafId) draw(); }
        else { cancelAnimationFrame(rafId); rafId = null; }
      });
    }, { threshold: 0.01 });
    io.observe(canvas);

    resize();
    spawn();
    window.addEventListener('resize', () => { resize(); spawn(); }, { passive: true });
  }

  // Hero — canvas dedicado (mais denso, sem conexões)
  initCanvas(document.getElementById('particles'), {
    count: 110,
    density: 11000,
    minR: 0.5,
    maxR: 2.4,
    speed: 0.28,
    minOpacity: 0.32,
    maxOpacity: 0.80,
    connect: true,
    connectDist: 130,
    connectOpacity: 0.22,
  });

  // Seções — todos os .section-particles
  document.querySelectorAll('.section-particles').forEach((canvas, i) => {
    initCanvas(canvas, {
      count: 70,
      density: 16000,
      minR: 0.5,
      maxR: 1.8,
      speed: 0.20,
      minOpacity: 0.22,
      maxOpacity: 0.60,
      connect: true,
      connectDist: 100,
      connectOpacity: 0.14,
    });
  });
 
  /* ---------------- Animação de código no laptop (signature) ---------------- */
  const codeEl = document.getElementById('codeType');
  const previewBox = document.getElementById('previewBox');
  if (codeEl) {
    const lines = [
      { html: '<span class="tok-tag">&lt;header&gt;</span>', reveal: 'nav' },
      { html: '&nbsp;&nbsp;<span class="tok-tag">&lt;Logo</span> <span class="tok-attr">brand</span>=<span class="tok-str">"cliente"</span> <span class="tok-tag">/&gt;</span>' },
      { html: '<span class="tok-tag">&lt;/header&gt;</span>' },
      { html: '' },
      { html: '<span class="tok-tag">&lt;section</span> <span class="tok-attr">id</span>=<span class="tok-str">"hero"</span><span class="tok-tag">&gt;</span>', reveal: 'hero' },
      { html: '&nbsp;&nbsp;<span class="tok-tag">&lt;h1&gt;</span>Sua marca. Online.<span class="tok-tag">&lt;/h1&gt;</span>' },
      { html: '<span class="tok-tag">&lt;/section&gt;</span>' },
      { html: '' },
      { html: '<span class="tok-tag">&lt;Grid</span> <span class="tok-attr">cols</span>=<span class="tok-str">{3}</span><span class="tok-tag">&gt;</span>', reveal: 'cards' },
      { html: '&nbsp;&nbsp;<span class="tok-tag">&lt;Card /&gt;&lt;Card /&gt;&lt;Card /&gt;</span>' },
      { html: '<span class="tok-tag">&lt;/Grid&gt;</span>' },
      { html: '' },
      { html: '<span style="color:#5a5a5a">// build concluído — deploy ✓</span>' }
    ];
 
    const previewParts = {
      nav: previewBox.querySelector('.preview__nav'),
      hero: previewBox.querySelector('.preview__hero'),
      cards: previewBox.querySelector('.preview__row')
    };
    Object.values(previewParts).forEach(el => el && (el.style.opacity = '0'));
 
    let li = 0, ci = 0;
    let buffer = '';
 
    // Em telas de tablet/celular a animação roda uma única vez e para no
    // estado final; no desktop ela continua em loop como antes.
    const isCompact = window.matchMedia('(max-width: 1080px)').matches;
 
    function typeStep() {
      if (li >= lines.length) {
        if (isCompact) {
          // finaliza a exibição sem o cursor piscando e não reinicia.
          codeEl.innerHTML = buffer;
          return;
        }
        // pausa e reinicia (apenas desktop)
        setTimeout(() => {
          codeEl.innerHTML = '';
          buffer = '';
          li = 0; ci = 0;
          Object.values(previewParts).forEach(el => el && (el.style.opacity = '0'));
          typeStep();
        }, 2600);
        return;
      }
      const line = lines[li];
      const plain = line.html.replace(/<[^>]+>|&nbsp;/g, ' ');
      if (ci <= plain.length) {
        // exibe a linha completa formatada progressivamente é custoso; usamos aproximação:
        codeEl.innerHTML = buffer + line.html.slice(0, Math.ceil((ci / Math.max(plain.length,1)) * line.html.length)) + '<span class="tok-cursor"></span>';
        ci++;
        setTimeout(typeStep, reducedMotion ? 0 : 14);
      } else {
        buffer += line.html + '\n';
        if (line.reveal && previewParts[line.reveal]) {
          previewParts[line.reveal].style.transition = 'opacity .5s ease';
          previewParts[line.reveal].style.opacity = '1';
        }
        li++; ci = 0;
        setTimeout(typeStep, reducedMotion ? 0 : 90);
      }
    }
 
    if (reducedMotion) {
      codeEl.innerHTML = lines.map(l => l.html).join('\n');
      Object.values(previewParts).forEach(el => el && (el.style.opacity = '1'));
    } else {
      typeStep();
    }
  }
 
  /* ---------------- Testimonials slider ---------------- */
  const track = document.getElementById('testiTrack');
  const dotsWrap = document.getElementById('testiDots');
  const testiCount = document.getElementById('testiCount');
  const testiPrev = document.getElementById('testiPrev');
  const testiNext = document.getElementById('testiNext');
 
  if (track && dotsWrap) {
    const slides = track.children.length;
    let index = 0;
    const pad = (n) => String(n).padStart(2, '0');
 
    for (let i = 0; i < slides; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
 
    function goTo(i) {
      index = (i + slides) % slides;
      track.style.transform = `translateX(-${index * 100}%)`;
      [...dotsWrap.children].forEach((d, di) => d.classList.toggle('is-active', di === index));
      if (testiCount) testiCount.innerHTML = `${pad(index + 1)} <i>/</i> ${pad(slides)}`;
    }
 
    testiPrev?.addEventListener('click', () => { goTo(index - 1); resetTimer(); });
    testiNext?.addEventListener('click', () => { goTo(index + 1); resetTimer(); });
 
    let timer = setInterval(() => goTo(index + 1), 6000);
    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(() => goTo(index + 1), 6000);
    }
    track.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
    track.parentElement.addEventListener('mouseleave', resetTimer);
  }
 
  /* ---------------- Accordion FAQ ---------------- */
  const accordion = document.getElementById('accordion');
  if (accordion) {
    accordion.querySelectorAll('.accordion__trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
 
        accordion.querySelectorAll('.accordion__trigger').forEach(t => {
          t.setAttribute('aria-expanded', 'false');
          const p = document.getElementById(t.getAttribute('aria-controls'));
          if (p) p.style.maxHeight = null;
        });
 
        if (!isOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }
 
  /* ---------------- Validação do formulário de contato ---------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
 
  const validators = {
    name: v => v.trim().length >= 2,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: v => v.replace(/\D/g, '').length >= 10,
    service: v => v.trim().length > 0,
    message: v => v.trim().length >= 10
  };
 
  function validateField(field) {
    const row = field.closest('.form__row');
    const isValid = validators[field.name] ? validators[field.name](field.value) : true;
    row.classList.toggle('has-error', !isValid);
    return isValid;
  }
 
  if (form) {
    [...form.elements].forEach(field => {
      if (validators[field.name]) {
        field.addEventListener('blur', () => validateField(field));
      }
    });
 
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;
      [...form.elements].forEach(field => {
        if (validators[field.name] && !validateField(field)) allValid = false;
      });
 
      if (!allValid) {
        formStatus.textContent = 'Verifique os campos destacados antes de enviar.';
        formStatus.style.color = '#ff8f8a';
        return;
      }
 
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formStatus.textContent = 'Enviando...';
      formStatus.style.color = '';
      const waFallback = document.getElementById('waFallback');
      if (waFallback) waFallback.hidden = true;
 
      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
        to_email: CONFIG.DESTINATION_EMAIL
      };
 
      // Abre a notificação do WhatsApp já aqui, dentro do próprio clique
      // do usuário — é o único jeito de o navegador não bloquear o popup.
      const waLink = buildWhatsAppLink(data);
      const waWindow = window.open(waLink, '_blank');
 
      sendEmail(data)
        .then(() => {
          formStatus.textContent = 'Recebemos sua solicitação. Retornamos em até 1 dia útil ✓';
          formStatus.style.color = '#8fffb0';
          form.reset();
        })
        .catch((err) => {
          console.error('Falha ao enviar formulário:', err);
          formStatus.textContent = 'Não conseguimos enviar o e-mail agora. Tente novamente ou fale pelo WhatsApp.';
          formStatus.style.color = '#ff8f8a';
        })
        .finally(() => {
          submitBtn.disabled = false;
          // Se o navegador bloqueou o popup, deixamos um link manual visível.
          if ((!waWindow || waWindow.closed) && waFallback) {
            waFallback.href = waLink;
            waFallback.hidden = false;
          }
        });
    });
  }
 
  /* ---------------- Envio de e-mail (EmailJS) ---------------- */
  function sendEmail(data) {
    const configured = window.emailjs
      && !CONFIG.EMAILJS_SERVICE_ID.startsWith('COLE_')
      && !CONFIG.EMAILJS_TEMPLATE_ID.startsWith('COLE_')
      && !CONFIG.EMAILJS_PUBLIC_KEY.startsWith('COLE_');
 
    if (!configured) {
      // EmailJS ainda não configurado: evita travar a demo, mas avisa no console.
      console.warn('EmailJS não configurado — veja CONFIG no topo de main.js. Simulando envio.');
      return Promise.resolve();
    }
 
    return emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, data);
  }
 
  /* ---------------- Notificação no WhatsApp (link direto, sem bot) ---------------- */
  function buildWhatsAppLink(data) {
    const text =
      `Novo contato no site VISZ.dev\n` +
      `Nome: ${data.name}\n` +
      `E-mail: ${data.email}\n` +
      `Telefone: ${data.phone}\n` +
      `Serviço: ${data.service}\n` +
      `Mensagem: ${data.message}`;
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }
 
 
  /* ---------------- Botão voltar ao topo ---------------- */
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) toTop.hidden = false;
    else toTop.hidden = true;
  }, { passive: true });
  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
 
})();
 