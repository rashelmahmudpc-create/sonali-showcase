/* =========================================================
   Sonali Showcase — vanilla JS (NO external libraries, NO 3D)
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bn = (n) => Number(n).toLocaleString('bn-BD');

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  let started = false;
  function hidePreloader() {
    if (started) return;
    started = true;
    if (preloader) {
      preloader.classList.add('hide');
      setTimeout(() => preloader.remove(), 700);
    }
    // reveal anything still hidden
    $$('.reveal').forEach(n => n.classList.add('in'));
  }
  window.addEventListener('load', () => setTimeout(hidePreloader, 400));
  setTimeout(hidePreloader, 3000);

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  function setupReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(n => n.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = `${(i % 5) * 70}ms`;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(n => io.observe(n));
  }

  /* ---------- Counters ---------- */
  function setupCounters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;
    const run = (node) => {
      const target = +node.dataset.count;
      const suffix = node.dataset.suffix || '';
      if (reduce) { node.textContent = bn(target) + suffix; return; }
      const start = performance.now(), dur = 1600;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = bn(Math.floor(eased * target)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } });
    }, { threshold: 0.5 });
    nodes.forEach(n => io.observe(n));
  }

  /* ---------- Testimonials slider ---------- */
  function setupTestimonials() {
    const track = $('#testiTrack'), dots = $('#testiDots');
    if (!track || !dots) return;
    const slides = $$('.testi', track);
    if (!slides.length) return;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => go(i));
      dots.appendChild(b);
    });
    let cur = 0, auto;
    function go(i) {
      cur = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${cur * 100}%)`;
      $$('button', dots).forEach((d, k) => d.classList.toggle('active', k === cur));
      clearInterval(auto);
      auto = setInterval(() => go(cur + 1), 5500);
    }
    auto = setInterval(() => go(cur + 1), 5500);
  }

  /* ---------- Nav / progress / menu / back-to-top ---------- */
  function setupChrome() {
    const nav = $('#nav'), toTop = $('#toTop'), bar = $('#progressBar');
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? (scrollY / h) * 100 : 0;
      if (bar) bar.style.width = p + '%';
      if (nav) nav.classList.toggle('scrolled', scrollY > 40);
      if (toTop) toTop.classList.toggle('show', scrollY > 700);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    const burger = $('#hamburger'), links = $('#navLinks');
    if (burger && links) {
      burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
      $$('a', links).forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); }));
    }
  }

  /* ---------- Custom cursor ---------- */
  function setupCursor() {
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    if (!dot || !ring || matchMedia('(hover: none)').matches) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    (function follow() {
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    $$('a, button, .feature-card, .course, .testi').forEach(n => {
      n.addEventListener('mouseenter', () => ring.classList.add('hover'));
      n.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  /* ---------- 3D-ish tilt + pointer glow ---------- */
  function setupTilt() {
    if (reduce || matchMedia('(hover: none)').matches) return;
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`;
        card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
      });
      card.addEventListener('mouseleave', () => (card.style.transform = ''));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function setupMagnetic() {
    if (reduce || matchMedia('(hover: none)').matches) return;
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });
  }

  /* ---------- Smooth anchor scroll ---------- */
  function setupAnchors() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const t = document.getElementById(id.slice(1));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    setupReveal();
    setupCounters();
    setupTestimonials();
    setupChrome();
    setupCursor();
    setupTilt();
    setupMagnetic();
    setupAnchors();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
