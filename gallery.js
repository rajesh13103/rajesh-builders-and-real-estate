import { store, esc } from './storage.js';

const grid = document.getElementById('masonry');
const chips = document.querySelectorAll('.filter-chips .chip');
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCaption');
let active = 'all';
let current = 0;
let pool = [];

function render() {
  pool = store.list(store.KEYS.gallery).filter(g => active === 'all' || g.category === active);
  grid.innerHTML = pool.map((g, i) => `
    <a class=\"masonry-item reveal\" data-anim=\"zoom-in\" data-i=\"${i}\" href=\"${esc(g.image)}\" data-testid=\"gallery-item-${esc(g.id)}\">
      <img loading=\"lazy\" src=\"${esc(g.image)}\" alt=\"${esc(g.title)}\"/>
      <span class=\"mi-title\">${esc(g.title)}</span>
    </a>`).join('');
  requestAnimationFrame(() => grid.querySelectorAll('.reveal').forEach(el => el.classList.add('in')));
  grid.querySelectorAll('.masonry-item').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); current = +a.dataset.i; openLB();
  }));
}

function openLB() {
  const item = pool[current];
  lbImg.src = item.image;
  lbImg.alt = item.title;
  lbCap.textContent = item.title;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLB() { lb.classList.remove('open'); document.body.style.overflow = ''; }
function navLB(d) { current = (current + d + pool.length) % pool.length; openLB(); }

lb.querySelector('[data-close]').addEventListener('click', closeLB);
lb.querySelector('[data-prev]').addEventListener('click', () => navLB(-1));
lb.querySelector('[data-next]').addEventListener('click', () => navLB(1));
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowLeft') navLB(-1);
  if (e.key === 'ArrowRight') navLB(1);
});

chips.forEach(c => c.addEventListener('click', () => {
  chips.forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  active = c.dataset.cat;
  render();
}));

render();
