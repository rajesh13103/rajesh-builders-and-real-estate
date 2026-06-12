// Reveal-on-scroll, counters, hero line reveal, cursor, scroll progress, parallax
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));

  // hero line reveals
  document.querySelectorAll('.reveal-line').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 200 + i * 120);
  });
}

function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      const dur = 1800;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => io.observe(c));
}

function initCursor() {
  if (matchMedia('(pointer:coarse)').matches) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; });
  const loop = () => { rx += (mx - rx) * .15; ry += (my - ry) * .15; ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`; requestAnimationFrame(loop); };
  loop();
  document.querySelectorAll('a, button, .layout-card, .svc-card, input, textarea, select').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / h * 100) + '%';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initParallax() {
  const els = document.querySelectorAll('.parallax');
  if (!els.length) return;
  const onScroll = () => {
    els.forEach(el => {
      const speed = parseFloat(el.dataset.speed || '0.15');
      const r = el.getBoundingClientRect();
      el.style.setProperty('--p', `${-r.top * speed}px`);
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });
}

export function initAnimations() {
  initReveal();
  initCounters();
  initCursor();
  initScrollProgress();
  initParallax();
}

initAnimations();
