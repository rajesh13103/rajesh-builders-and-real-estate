import { store, esc } from './storage.js';

// loader
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 600);
});

// nav
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
document.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 30), { passive: true });
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger?.classList.remove('open'); navLinks.classList.remove('open');
}));

// back to top
const backTop = document.getElementById('backTop');
document.addEventListener('scroll', () => backTop?.classList.toggle('show', window.scrollY > 400), { passive: true });
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// year
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

// hydrate contact in footer
const contact = store.get(store.KEYS.contact, {});
if (contact) {
  const setText = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
  setText('footer-phone', contact.phone);
  setText('footer-email', contact.email);
  setText('footer-address', contact.address);
}

// homepage: featured layouts (first 3 available/limited)
const featuredGrid = document.getElementById('featuredGrid');
if (featuredGrid) {
  const layouts = store.list(store.KEYS.layouts)
    .filter(l => l.status !== 'sold')
    .slice(0, 3);
  featuredGrid.innerHTML = layouts.map(l => layoutCard(l)).join('');
  featuredGrid.querySelectorAll('.layout-card').forEach(c => c.classList.add('reveal', 'fade-up') || c.setAttribute('data-anim','fade-up'));
}

function statusLabel(s) {
  return { available:'Available', sold:'Sold Out', limited:'Limited', upcoming:'Upcoming' }[s] || s;
}

export function layoutCard(l) {
  const s = l.status || 'available';
  return `
  <article class=\"layout-card reveal\" data-anim=\"fade-up\" data-testid=\"layout-card-${esc(l.id)}\">
    <div class=\"layout-img img-zoom\">
      <img loading=\"lazy\" src=\"${esc(l.image)}\" alt=\"${esc(l.name)}\" />
      <span class=\"layout-status ${s}\">${statusLabel(s)}</span>
    </div>
    <div class=\"layout-info\">
      <h3>${esc(l.name)}</h3>
      <p class=\"layout-loc\"><i class=\"fa-solid fa-location-dot\"></i> ${esc(l.location)}</p>
      <div class=\"layout-meta\">
        <div class=\"layout-price\">${esc(l.price)}<small>${esc(l.area || '')}</small></div>
        <a href=\"/layouts.html#${esc(l.id)}\" class=\"layout-cta\" data-testid=\"view-layout-${esc(l.id)}\">View <i class=\"fa-solid fa-arrow-right\"></i></a>
      </div>
    </div>
  </article>`;
}

// testimonials slider
const slider = document.getElementById('testimonialSlider');
const dots = document.getElementById('testimonialDots');
if (slider) {
  const items = store.list(store.KEYS.testimonials);
  slider.innerHTML = items.map((t, i) => `
    <div class=\"testimonial ${i===0?'active':''}\" data-i=\"${i}\">
      <div class=\"testimonial-stars\">${'★'.repeat(t.rating || 5)}</div>
      <p class=\"testimonial-text\">\"${esc(t.review)}\"</p>
      <div class=\"testimonial-author\">
        <img loading=\"lazy\" src=\"${esc(t.photo)}\" alt=\"${esc(t.name)}\" />
        <strong>${esc(t.name)}</strong>
        <small>${esc(t.project)}</small>
      </div>
    </div>`).join('');
  if (dots) {
    dots.innerHTML = items.map((_, i) => `<button class=\"${i===0?'active':''}\" data-i=\"${i}\" aria-label=\"Testimonial ${i+1}\"></button>`).join('');
    let idx = 0;
    const go = (i) => {
      idx = (i + items.length) % items.length;
      slider.querySelectorAll('.testimonial').forEach(el => el.classList.toggle('active', +el.dataset.i === idx));
      dots.querySelectorAll('button').forEach(el => el.classList.toggle('active', +el.dataset.i === idx));
    };
    dots.querySelectorAll('button').forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));
    setInterval(() => go(idx + 1), 5500);
  }
}