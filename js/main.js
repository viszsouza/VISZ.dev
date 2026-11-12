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
    // O formulário monta a mensagem e abre o WhatsApp deste número (DDI + DDD + número).
    WHATSAPP_NUMBER: '5581985742601',
    // Endpoint PHP que grava o contato no MySQL (as credenciais ficam só no servidor, em /api/config.php).
    API_URL: 'api/contato.php',
    TERMOS_VERSAO: '2026-11'
  };

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
 
  /* ---------------- Validação com confirmação campo a campo ---------------- */
  const VALID_DDD = new Set([
    11,12,13,14,15,16,17,18,19, 21,22,24,27,28, 31,32,33,34,35,37,38,
    41,42,43,44,45,46,47,48,49, 51,53,54,55, 61,62,63,64,65,66,67,68,69,
    71,73,74,75,77,79, 81,82,83,84,85,86,87,88,89, 91,92,93,94,95,96,97,98,99
  ]);

  const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
  const DOMAIN_FIXES = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com',
    'gmail.com.br': 'gmail.com', 'gnail.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com',
    'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com', 'icloud.con': 'icloud.com', 'icoud.com': 'icloud.com'
  };

  // máscara (00) 00000-0000
  function maskPhone(value) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  // cada validador devolve '' (ok) ou a mensagem de erro específica
  const validators = {
    name: (v) => {
      const t = v.trim();
      if (!t) return 'Informe seu nome.';
      if (t.replace(/[^a-zA-ZÀ-ÿ]/g, '').length < 2) return 'Digite seu nome com pelo menos 2 letras.';
      return '';
    },
    email: (v) => {
      const t = v.trim();
      if (!t) return 'Informe seu e-mail.';
      if (!t.includes('@')) return 'Falta o @ no e-mail. Ex.: voce@empresa.com';
      if (/\.\./.test(t) || !EMAIL_RE.test(t)) return 'Esse e-mail não parece válido. Ex.: voce@empresa.com';
      return '';
    },
    phone: (v) => {
      const d = v.replace(/\D/g, '');
      if (!d) return 'Informe seu WhatsApp com DDD.';
      if (d.length < 10) return 'Faltam números. Digite o DDD + número, ex.: (81) 99999-9999';
      if (!VALID_DDD.has(parseInt(d.slice(0, 2), 10))) return 'Esse DDD não existe. Confira os dois primeiros números.';
      if (d.length === 11 && d[2] !== '9') return 'Celular com 9 dígitos começa com 9 depois do DDD.';
      if (/^(\d)\1+$/.test(d.slice(2))) return 'Esse número não parece real. Confira e tente de novo.';
      return '';
    },
    service: (v) => (v.trim() ? '' : 'Selecione uma opção.'),
    message: (v) => {
      const n = v.trim().length;
      if (!n) return 'Conte um pouco sobre o seu negócio.';
      if (n < 10) return 'Escreva um pouco mais (faltam ' + (10 - n) + ' caracteres).';
      return '';
    }
  };

  const touched = new Set();
  const emailSuggest = document.getElementById('emailSuggest');
  const messageCount = document.getElementById('message-count');

  function setFieldState(field, show) {
    const row = field.closest('.form__row');
    const err = validators[field.name] ? validators[field.name](field.value) : '';
    const msgEl = row.querySelector('.form__error');
    row.classList.toggle('has-error', show && !!err);
    row.classList.toggle('is-valid', show && !err);
    field.setAttribute('aria-invalid', show && err ? 'true' : 'false');
    if (msgEl && err) msgEl.textContent = err;
    return !err;
  }

  function updateEmailSuggestion(field) {
    if (!emailSuggest) return;
    const v = field.value.trim();
    const at = v.lastIndexOf('@');
    const fix = at > 0 ? DOMAIN_FIXES[v.slice(at + 1).toLowerCase()] : null;
    if (fix && touched.has('email')) {
      const suggestion = v.slice(0, at + 1) + fix;
      emailSuggest.textContent = 'Você quis dizer ' + suggestion + '?';
      emailSuggest.dataset.value = suggestion;
      emailSuggest.hidden = false;
    } else {
      emailSuggest.hidden = true;
    }
  }

  function updateCounter(field) {
    if (!messageCount) return;
    const n = field.value.trim().length;
    messageCount.textContent = n >= 10 ? n + ' caracteres ✓' : 'Mínimo de 10 caracteres (' + n + '/10)';
    messageCount.classList.toggle('is-ok', n >= 10);
  }

  if (form) {
    const phoneField = form.elements.phone;
    phoneField?.addEventListener('input', () => { phoneField.value = maskPhone(phoneField.value); });

    emailSuggest?.addEventListener('click', () => {
      form.elements.email.value = emailSuggest.dataset.value;
      emailSuggest.hidden = true;
      touched.add('email');
      setFieldState(form.elements.email, true);
    });

    [...form.elements].forEach((field) => {
      if (!validators[field.name]) return;
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener('blur', () => {
        touched.add(field.name);
        setFieldState(field, true);
        if (field.name === 'email') updateEmailSuggestion(field);
      });
      // depois que a pessoa saiu do campo uma vez, confirma/avisa enquanto digita
      field.addEventListener(eventName, () => {
        if (field.name === 'message') updateCounter(field);
        if (touched.has(field.name)) setFieldState(field, true);
        if (field.name === 'email') updateEmailSuggestion(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;
      [...form.elements].forEach((field) => {
        if (!validators[field.name]) return;
        touched.add(field.name);
        if (!setFieldState(field, true) && !firstInvalid) firstInvalid = field;
      });
      updateEmailSuggestion(form.elements.email);

      if (firstInvalid) {
        formStatus.textContent = 'Revise os campos destacados antes de enviar.';
        formStatus.style.color = '#ff8f8a';
        firstInvalid.focus();
        return;
      }

      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        phone: form.phone.value.trim(),
        service: form.service.value,
        message: form.message.value.trim()
      };

      // Abre o WhatsApp dentro do próprio clique de envio; se o navegador
      // bloquear a nova aba, segue na mesma aba (sem pedir nada à pessoa).
      const waLink = buildWhatsAppLink(data);
      const waWindow = window.open(waLink, '_blank');
      saveContact(data);
      if (waWindow) {
        waWindow.opener = null;
      } else {
        window.location.href = waLink;
        return;
      }

      formStatus.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta. Toque em enviar por lá para concluir ✓';
      formStatus.style.color = '#8fffb0';
      form.reset();
      touched.clear();
      form.querySelectorAll('.form__row').forEach((r) => r.classList.remove('has-error', 'is-valid'));
      form.querySelectorAll('[aria-invalid]').forEach((f) => f.setAttribute('aria-invalid', 'false'));
      if (emailSuggest) emailSuggest.hidden = true;
      if (messageCount) { messageCount.textContent = 'Mínimo de 10 caracteres'; messageCount.classList.remove('is-ok'); }
    });
  }

  /* ---------------- Origem do contato (UTM e site de origem) ---------------- */
  const pageLoadedAt = Date.now();

  function getAttribution() {
    const KEY = 'visz_origem';
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) { /* navegação privada */ }
    const params = new URLSearchParams(window.location.search);
    const utm = Object.assign({}, saved.utm);
    ['source', 'medium', 'campaign', 'term', 'content'].forEach((k) => {
      const v = params.get('utm_' + k);
      if (v) utm[k] = v.slice(0, 100);
    });
    const external = document.referrer && !document.referrer.includes(window.location.host);
    const referrer = saved.referrer !== undefined ? saved.referrer : (external ? document.referrer.slice(0, 255) : '');
    const result = { utm, referrer };
    try { sessionStorage.setItem(KEY, JSON.stringify(result)); } catch (_) { /* ignora */ }
    return result;
  }
  const attribution = getAttribution();

  /* ---------------- Salva o contato no banco (em paralelo ao WhatsApp) ---------------- */
  function saveContact(data) {
    const payload = Object.assign({}, data, {
      pagina: window.location.href.split('#')[0].slice(0, 255),
      referrer: attribution.referrer,
      utm: attribution.utm,
      idioma: navigator.language || '',
      fuso: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
      tempo_ms: Date.now() - pageLoadedAt,
      aceite_termos: true,
      termos_versao: CONFIG.TERMOS_VERSAO
    });
    const send = () => fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true // termina mesmo se a página mudar para o WhatsApp
    }).then((r) => {
      return r.json().catch(() => ({})).then((body) => {
        if (r.ok && body.ok) return body;
        // aparece no Console do navegador (F12) para facilitar o diagnóstico
        console.warn('[VISZ] contato NÃO foi salvo no banco. HTTP ' + r.status + (body.erro ? ' — ' + body.erro : '') +
          '. Abra /api/teste.php no seu site para ver o que está faltando.');
        if (r.status >= 500) throw new Error('servidor');
        return body;
      });
    });
    // uma nova tentativa se a rede ou o servidor falharem; o WhatsApp nunca depende disso
    send().catch(() => setTimeout(() => send().catch(() => {}), 2500));
  }

  /* ---------------- Mensagem do WhatsApp (link direto, sem bot) ---------------- */
  function buildWhatsAppLink(data) {
    const text =
      `*Novo contato pelo site — Agência VISZ*\n\n` +
      `*Nome:* ${data.name}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Telefone:* ${data.phone}\n` +
      `*Interesse:* ${data.service}\n\n` +
      `*Mensagem:*\n${data.message}`;
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  /* ---------------- Pré-selecionar serviço ao clicar em um pacote ---------------- */
  document.querySelectorAll('.js-pick-service').forEach(btn => {
    btn.addEventListener('click', () => {
      const select = document.getElementById('service');
      const wanted = btn.dataset.service;
      if (!select || !wanted) return;
      const option = Array.from(select.options).find(o => o.text.trim() === wanted);
      if (option) {
        select.value = option.value || option.text;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

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
 