AOS.init({ duration:680, once:true, offset:55 });

  /* ===== GTM chargé uniquement après consentement (RGPD) ===== */
  function loadGTM() {
    if (window._gtmLoaded) return;
    window._gtmLoaded = true;
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-P2KH5L74');
  }


  /* ===== ONGLETS LÉGAUX ===== */
  function showLegal(btn, panel) {
    document.querySelectorAll('.legal-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.legal-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('legal-' + panel).classList.add('active');
    btn.classList.add('active');
  }

  /* ===== COOKIES (consentement avant tout traceur) ===== */
  function acceptCookies()  { document.getElementById('cookie-banner').style.display='none'; localStorage.setItem('ic_cookies','accepted'); loadGTM(); }
  function refuseCookies()  { document.getElementById('cookie-banner').style.display='none'; localStorage.setItem('ic_cookies','refused'); }
  (function(){
    const c = localStorage.getItem('ic_cookies');
    if (c) document.getElementById('cookie-banner').style.display='none';
    if (c === 'accepted') loadGTM();
  })();

  /* ===== COMPTEURS ANIMÉS ===== */
  function animateCounters() {
    document.querySelectorAll('.num[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const format = el.dataset.format;
      const duration = 1800, step = 16;
      const steps = duration / step;
      let current = 0;
      const increment = target / steps;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
          el.classList.add('pulsing');
        }
        const val = Math.floor(current);
        const formatted = format === 'space'
          ? val.toLocaleString('fr-FR').replace(/ /g, ' ')
          : val;
        el.textContent = formatted + suffix;
      }, step);
    });
  }

  /* ===== HEADER COMPACT AU SCROLL ===== */
  (function() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var scrollY = window.pageYOffset || document.documentElement.scrollTop;
          if (scrollY > 320 && !header.classList.contains('scrolled')) {
            header.classList.add('scrolled');
          } else if (scrollY < 60 && header.classList.contains('scrolled')) {
            header.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ===== EFFET TILT 3D PREMIUM (desktop uniquement) ===== */
  (function() {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (x*7).toFixed(2) + 'deg) rotateX(' + (-y*7).toFixed(2) + 'deg) translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  })();

  /* ===== PARTICULES DORÉES DU HERO ===== */
  (function() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, parts = [];
    function resize() {
      const hero = canvas.parentElement;
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    function init() {
      parts = [];
      const n = Math.min(42, Math.floor(W / 32));
      for (let i = 0; i < n; i++) {
        parts.push({
          x: Math.random()*W, y: Math.random()*H,
          r: Math.random()*2.2 + 0.6,
          vx: (Math.random()-0.5)*0.25, vy: -(Math.random()*0.35 + 0.08),
          a: Math.random()*0.55 + 0.15
        });
      }
    }
    function draw() {
      ctx.clearRect(0,0,W,H);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random()*W; }
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(207,169,74,' + p.a + ')';
        ctx.shadowColor = 'rgba(227,190,94,0.8)';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    window.addEventListener('resize', () => { resize(); init(); }, { passive:true });
  })();

  /* ===== INIT ===== */
  setTimeout(animateCounters, 600);
