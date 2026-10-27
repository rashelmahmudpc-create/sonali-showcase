/* =========================================================
   Sonali Showcase — 3D + Animations + Interactions
   ========================================================= */
import * as THREE from 'three';

/* ---------- Utilities ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const lerp = (a, b, t) => a + (b - a) * t;

$('#year').textContent = new Date().getFullYear();

/* =========================================================
   1) PRELOADER
   ========================================================= */
const preloader = $('#preloader');
let ready = false;
const hidePreloader = () => {
  if (ready) return;
  ready = true;
  preloader.classList.add('hide');
  setTimeout(() => preloader.remove(), 900);
  introAnim();
};
window.addEventListener('load', () => setTimeout(hidePreloader, 500));
setTimeout(hidePreloader, 4000);

/* =========================================================
   2) THREE.JS SCENE
   ========================================================= */
const canvas = $('#webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06060b, 0.055);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);

/* --- Lights --- */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const l1 = new THREE.PointLight(0x7c6cff, 90, 40); l1.position.set(6, 6, 6); scene.add(l1);
const l2 = new THREE.PointLight(0x00e6c3, 70, 40); l2.position.set(-7, -4, 4); scene.add(l2);
const l3 = new THREE.PointLight(0xff5f9e, 60, 40); l3.position.set(0, -8, -4); scene.add(l3);

/* --- Hero group --- */
const heroGroup = new THREE.Group();
scene.add(heroGroup);

/* Core icosahedron (glass-ish wireframe shell) */
const coreGeo = new THREE.IcosahedronGeometry(2.1, 1);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x7c6cff, metalness: 0.9, roughness: 0.15,
  emissive: 0x2a1f6b, emissiveIntensity: 0.7, flatShading: true
});
const core = new THREE.Mesh(coreGeo, coreMat);
heroGroup.add(core);

const wire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.35, 1),
  new THREE.MeshBasicMaterial({ color: 0x00e6c3, wireframe: true, transparent: true, opacity: 0.28 })
);
heroGroup.add(wire);

/* Inner glowing core */
const inner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.05, 0),
  new THREE.MeshBasicMaterial({ color: 0x00e6c3 })
);
heroGroup.add(inner);

/* Orbiting nodes */
const orbitGroup = new THREE.Group();
heroGroup.add(orbitGroup);
const nodeMats = [
  new THREE.MeshStandardMaterial({ color: 0x00e6c3, emissive: 0x00e6c3, emissiveIntensity: 0.6, roughness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0xff5f9e, emissive: 0xff5f9e, emissiveIntensity: 0.6, roughness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x7c6cff, emissive: 0x7c6cff, emissiveIntensity: 0.6, roughness: 0.3 })
];
for (let i = 0; i < 9; i++) {
  const r = 3.4 + (i % 3) * 0.5;
  const angle = (i / 9) * Math.PI * 2;
  const node = new THREE.Mesh(
    i % 3 === 0 ? new THREE.OctahedronGeometry(0.22) : new THREE.SphereGeometry(0.16, 16, 16),
    nodeMats[i % 3]
  );
  node.position.set(Math.cos(angle) * r, Math.sin(angle * 2) * 1.1, Math.sin(angle) * r);
  node.userData = { angle, r, y: node.position.y };
  orbitGroup.add(node);
}

/* Particle starfield */
const COUNT = 900;
const pos = new Float32Array(COUNT * 3);
const spread = 34;
for (let i = 0; i < COUNT; i++) {
  pos[i * 3] = (Math.random() - 0.5) * spread;
  pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
  pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 6;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
  color: 0x9aa0ff, size: 0.06, transparent: true, opacity: 0.85,
  depthWrite: false, blending: THREE.AdditiveBlending
}));
scene.add(particles);

/* Distant torus ring accent */
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(5.5, 0.02, 8, 120),
  new THREE.MeshBasicMaterial({ color: 0x7c6cff, transparent: true, opacity: 0.35 })
);
ring.rotation.x = Math.PI / 2.6;
scene.add(ring);

/* --- Mouse parallax --- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / innerHeight) * 2 - 1;
});

/* --- Scroll influence --- */
let scrollN = 0;
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  scrollN = h > 0 ? scrollY / h : 0;
}, { passive: true });

/* --- Render loop --- */
const clock = new THREE.Clock();
let frame = 0;
function animate() {
  frame = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  mouse.x = lerp(mouse.x, mouse.tx, 0.05);
  mouse.y = lerp(mouse.y, mouse.ty, 0.05);

  core.rotation.y = t * 0.25;
  core.rotation.x = t * 0.12;
  wire.rotation.y = -t * 0.18;
  wire.rotation.z = t * 0.08;
  inner.rotation.x = t * 0.6;
  inner.rotation.y = t * 0.5;
  const pulse = 1 + Math.sin(t * 2) * 0.06;
  inner.scale.setScalar(pulse);

  orbitGroup.rotation.y = t * 0.35;
  orbitGroup.children.forEach((n, i) => {
    n.position.y = n.userData.y + Math.sin(t * 1.4 + i) * 0.35;
  });

  particles.rotation.y = t * 0.02;
  ring.rotation.z = t * 0.1;

  heroGroup.position.y = Math.sin(t * 0.8) * 0.18 - scrollN * 1.2;
  heroGroup.rotation.y = scrollN * Math.PI * 0.9;

  camera.position.x = lerp(camera.position.x, mouse.x * 1.4, 0.05);
  camera.position.y = lerp(camera.position.y, -mouse.y * 1.0 + scrollN * 1.5, 0.05);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* Pause rendering when tab hidden (save battery) */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(frame);
  else animate();
});

/* =========================================================
   3) SMOOTH SCROLL (Lenis) + GSAP wiring
   ========================================================= */
let lenis = null;
if (window.Lenis) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* Anchor links -> lenis */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -70 }) : target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* =========================================================
   4) UI: nav, progress, menu, cursor, theme
   ========================================================= */
const nav = $('#nav'), toTop = $('#toTop'), progressBar = $('#progressBar');
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  nav.classList.toggle('scrolled', scrollY > 40);
  toTop.classList.toggle('show', scrollY > 700);
}, { passive: true });

toTop.addEventListener('click', () => lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' }));

const burger = $('#hamburger'), navLinks = $('#navLinks');
burger.addEventListener('click', () => { burger.classList.toggle('open'); navLinks.classList.toggle('open'); });
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); navLinks.classList.remove('open'); }));

/* Sound toggle (ambient WebAudio hum) */
let audioCtx = null, soundOn = false, osc = null, gainNode = null;
$('#soundToggle').addEventListener('click', () => {
  const btn = $('#soundToggle');
  if (!soundOn) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      osc = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = 110;
      gainNode.gain.value = 0.02;
      osc.connect(gainNode).connect(audioCtx.destination);
      osc.start();
      soundOn = true; btn.textContent = '🔊'; btn.classList.add('on');
    } catch (e) { /* ignore */ }
  } else {
    try { osc.stop(); osc.disconnect(); gainNode.disconnect(); } catch (e) {}
    soundOn = false; btn.textContent = '🔇'; btn.classList.remove('on');
  }
});

/* Custom cursor */
const dot = $('.cursor-dot'), cursorRing = $('.cursor-ring');
let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
});
(function follow() {
  rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
  cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(follow);
})();
$$('a, button, .feature-card, .course, .testi').forEach(n => {
  n.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  n.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});

/* =========================================================
   5) GSAP SCROLL ANIMATIONS
   ========================================================= */
function introAnim() {
  if (!window.gsap) { $$('.reveal').forEach(n => n.classList.add('in')); return; }
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.nav', { y: -80, opacity: 0, duration: 0.9 })
    .from('.hero-badge', { y: 30, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero-title .line', { y: 90, opacity: 0, duration: 1, stagger: 0.12 }, '-=0.4')
    .from('.hero-sub', { y: 30, opacity: 0, duration: 0.7 }, '-=0.6')
    .from('.hero-actions .btn', { y: 24, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.5')
    .from('.hero-trust', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.scroll-cue', { opacity: 0, duration: 0.6 }, '-=0.3');
  $$('.reveal').forEach(n => n.classList.add('in'));
}

function setupScrollAnimations() {
  if (!window.gsap || !window.ScrollTrigger) {
    $$('.reveal').forEach(n => n.classList.add('in'));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  $$('.reveal').forEach(el => {
    gsap.fromTo(el, { y: 44, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  gsap.utils.toArray('.feature-card').forEach((card, i) => {
    gsap.fromTo(card, { y: 60, opacity: 0, rotateX: -12 }, {
      y: 0, opacity: 1, rotateX: 0, duration: 0.8, delay: (i % 3) * 0.08,
      ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' }
    });
  });

  gsap.fromTo('.section-title', { scale: 0.94, opacity: 0.4 }, {
    scale: 1, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '.section-title', start: 'top 85%', end: 'top 45%', scrub: true }
  });
}

/* Counters */
function animateCounters() {
  $$('[data-count]').forEach(node => {
    const target = +node.dataset.count;
    const suffix = node.dataset.suffix || '';
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(node);
        const start = performance.now(), dur = 1800;
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          node.textContent = Math.floor(eased * target).toLocaleString('bn-BD') + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    io.observe(node);
  });
}

/* Testimonials slider */
function setupTestimonials() {
  const track = $('#testiTrack'), dots = $('#testiDots');
  if (!track) return;
  const slides = $$('.testi', track);
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    if (i === 0) b.classList.add('active');
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

/* 3D tilt + pointer glow on cards */
function setupTilt() {
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

/* Magnetic buttons */
function setupMagnetic() {
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

/* Boot the UI-side features */
setupScrollAnimations();
animateCounters();
setupTestimonials();
setupTilt();
setupMagnetic();

window.addEventListener('resize', () => window.ScrollTrigger && ScrollTrigger.refresh());
