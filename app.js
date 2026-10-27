/* =========================================================
   Sonali Showcase — clean, subtle 3D + smooth interactions
   ========================================================= */
import * as THREE from 'three';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year').textContent = new Date().getFullYear();

/* =========================================================
   Preloader
   ========================================================= */
const preloader = $('#preloader');
let started = false;
function start() {
  if (started) return;
  started = true;
  preloader.classList.add('hide');
  setTimeout(() => preloader.remove(), 700);
  heroIntro();
}
addEventListener('load', () => setTimeout(start, 350));
setTimeout(start, 3000);

/* =========================================================
   Subtle 3D globe (contained in hero card)
   ========================================================= */
function init3D() {
  const canvas = $('#webgl');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3b5bfd, 1.1); rim.position.set(-4, -2, -3); scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // Soft solid sphere (globe body)
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 48, 48),
    new THREE.MeshStandardMaterial({ color: 0xdfe7ff, roughness: 0.65, metalness: 0.05 })
  );
  group.add(globe);

  // Clean wireframe overlay
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.78, 22, 22),
    new THREE.MeshBasicMaterial({ color: 0x3b5bfd, wireframe: true, transparent: true, opacity: 0.22 })
  );
  group.add(wire);

  // Two thin orbit rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5a3, transparent: true, opacity: 0.55 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.012, 8, 120), ringMat);
  ring1.rotation.x = Math.PI / 2.1; group.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.01, 8, 120), new THREE.MeshBasicMaterial({ color: 0x3b5bfd, transparent: true, opacity: 0.4 }));
  ring2.rotation.x = Math.PI / 2.6; ring2.rotation.y = 0.5; group.add(ring2);

  // A few gentle markers on the globe
  const markers = [];
  const markerMat = new THREE.MeshStandardMaterial({ color: 0x3b5bfd, emissive: 0x3b5bfd, emissiveIntensity: 0.35, roughness: 0.4 });
  for (let i = 0; i < 7; i++) {
    const phi = Math.acos(-1 + (2 * i) / 7);
    const theta = Math.sqrt(7 * Math.PI) * phi;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), markerMat);
    m.position.setFromSphericalCoords(1.8, phi, theta);
    group.add(m); markers.push(m);
  }

  // Faint dot field (calm)
  const N = 160;
  const arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 3.4 + Math.random() * 2.4;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(p) * Math.cos(t);
    arr[i * 3 + 1] = r * Math.cos(p);
    arr[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const dots = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8fa2d8, size: 0.045, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dots);

  // Sizing
  function resize() {
    const w = canvas.clientWidth || 460, h = canvas.clientHeight || 460;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else addEventListener('resize', resize);

  // Gentle mouse parallax (scoped to card)
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const card = canvas.closest('.visual-card') || canvas;
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
  });
  card.addEventListener('mouseleave', () => { target.x = 0; target.y = 0; });

  // Render loop
  const clock = new THREE.Clock();
  let raf = 0, visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const speed = reduce ? 0 : 1;

    cur.x = lerp(cur.x, target.x, 0.06);
    cur.y = lerp(cur.y, target.y, 0.06);

    group.rotation.y = t * 0.18 * speed + cur.x;
    group.rotation.x = Math.sin(t * 0.25) * 0.12 * speed + cur.y;
    ring1.rotation.z = t * 0.25 * speed;
    ring2.rotation.z = -t * 0.2 * speed;
    dots.rotation.y = t * 0.04 * speed;
    markers.forEach((m, i) => (m.scale.setScalar(1 + Math.sin(t * 1.6 + i) * 0.18 * speed)));

    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });
}

/* =========================================================
   Hero intro (GSAP if present, else CSS)
   ========================================================= */
function heroIntro() {
  const items = ['#nav', '.hero-badge', '.hero-title .line', '.hero-sub', '.hero-actions', '.hero-trust', '.hero-visual'];
  if (!window.gsap || reduce) { $$('.reveal').forEach(n => n.classList.add('in')); return; }
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('#nav', { y: -70, opacity: 0, duration: 0.7 })
    .from('.hero-badge', { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
    .from('.hero-title .line', { y: 44, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.3')
    .from('.hero-sub', { y: 20, opacity: 0, duration: 0.5 }, '-=0.5')
    .from('.hero-actions', { y: 16, opacity: 0, duration: 0.5 }, '-=0.4')
    .from('.hero-trust', { y: 14, opacity: 0, duration: 0.5 }, '-=0.35')
    .from('.hero-visual', { scale: 0.94, opacity: 0, duration: 0.8 }, '-=0.7');
  items.length; // noop
}

/* =========================================================
   Reveal on scroll
   ========================================================= */
function initReveal() {
  const io = new IntersectionObserver((es) => {
    es.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${(i % 4) * 70}ms`;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(n => io.observe(n));
}

/* =========================================================
   Nav / progress / back-to-top / mobile menu
   ========================================================= */
function initChrome() {
  const nav = $('#nav'), toTop = $('#toTop'), bar = $('#progressBar');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', scrollY > 30);
    toTop.classList.toggle('show', scrollY > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const burger = $('#hamburger'), links = $('#navLinks');
  burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); }));

  // Smooth anchor scrolling with header offset
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + scrollY - 70;
      scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
}

/* =========================================================
   Counters (Bengali numerals)
   ========================================================= */
function initCounters() {
  const bn = (n) => n.toLocaleString('bn-BD');
  $$('[data-count]').forEach(node => {
    const target = +node.dataset.count, suffix = node.dataset.suffix || '';
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(node);
        const start = performance.now(), dur = 1500;
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          node.textContent = bn(Math.floor(eased * target)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    io.observe(node);
  });
}

/* =========================================================
   Testimonials slider
   ========================================================= */
function initTestimonials() {
  const track = $('#testiTrack'), dots = $('#testiDots');
  if (!track) return;
  const slides = $$('.testi', track);
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    if (i === 0) b.classList.add('active');
    b.setAttribute('aria-label', `Review ${i + 1}`);
    b.addEventListener('click', () => go(i));
    dots.appendChild(b);
  });
  let cur = 0, auto;
  function go(i) {
    cur = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${cur * 100}%)`;
    $$('button', dots).forEach((d, k) => d.classList.toggle('active', k === cur));
    clearInterval(auto); auto = setInterval(() => go(cur + 1), 5500);
  }
  auto = setInterval(() => go(cur + 1), 5500);
}

/* =========================================================
   Boot
   ========================================================= */
init3D();
initReveal();
initChrome();
initCounters();
initTestimonials();
