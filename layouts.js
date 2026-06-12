import { store, esc } from './storage.js';
import { layoutCard } from './main.js';

const grid = document.getElementById('layoutsGrid');
const searchInput = document.getElementById('searchInput');
const chips = document.querySelectorAll('#filterChips .chip');
const priceFilter = document.getElementById('priceFilter');
const emptyState = document.getElementById('emptyState');

let state = { q: '', status: 'all', price: 'all' };

function priceToLakhs(p) {
  // crude parse \"₹ 1.2 Cr onwards\" or \"₹ 68 L onwards\"
  const m = String(p || '').match(/([\d.]+)\s*(Cr|L)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2].toLowerCase() === 'cr' ? n * 100 : n;
}

function render() {
  const all = store.list(store.KEYS.layouts);
  const [pMin, pMax] = state.price === 'all' ? [0, 99999] : state.price.split('-').map(Number);
  const list = all.filter(l => {
    const matchQ = !state.q || (l.name + ' ' + l.location).toLowerCase().includes(state.q.toLowerCase());
    const matchS = state.status === 'all' || l.status === state.status;
    const lakhs = priceToLakhs(l.price);
    const matchP = lakhs >= pMin && lakhs <= pMax;
    return matchQ && matchS && matchP;
  });
  if (!list.length) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  grid.innerHTML = list.map(layoutCard).join('');
  // re-trigger reveal
  requestAnimationFrame(() => grid.querySelectorAll('.reveal').forEach(el => el.classList.add('in')));
  attachCardHandlers(list);
}

function attachCardHandlers(list) {
  grid.querySelectorAll('.layout-card').forEach((card, i) => {
    card.addEventListener('click', (e) => {
      // ignore explicit anchor in card
      const t = e.target.closest('a'); if (t && !t.classList.contains('layout-cta')) return;
      e.preventDefault();
      openModal(list[i]);
    });
  });
}

searchInput?.addEventListener('input', () => { state.q = searchInput.value.trim(); render(); });
chips.forEach(c => c.addEventListener('click', () => {
  chips.forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  state.status = c.dataset.filter;
  render();
}));
priceFilter?.addEventListener('change', () => { state.price = priceFilter.value; render(); });

// Modal
const modal = document.getElementById('layoutModal');
const modalContent = document.getElementById('modalContent');

function openModal(l) {
  modalContent.innerHTML = `
    <p class=\"m-loc\"><i class=\"fa-solid fa-location-dot\"></i> ${esc(l.location)}</p>
    <h2>${esc(l.name)}</h2>
    <div class=\"modal-gallery\">${(l.gallery||[l.image]).slice(0,3).map(g => `<img loading=\"lazy\" src=\"${esc(g)}\" alt=\"${esc(l.name)}\"/>`).join('')}</div>
    <p style=\"color:var(--silver);max-width:760px\">${esc(l.description)}</p>
    <div class=\"modal-specs\">
      <div><strong>${esc(l.area||'-')}</strong><small>Plot Sizes</small></div>
      <div><strong>${l.plots ?? '-'}</strong><small>Plots</small></div>
      <div><strong>${esc(l.specs?.roads||'-')}</strong><small>Roads</small></div>
      <div><strong>${esc(l.price)}</strong><small>Starting</small></div>
    </div>
    <h4>Amenities</h4>
    <div class=\"amenities\">${(l.amenities||[]).map(a => `<span>${esc(a)}</span>`).join('')}</div>
    <h4>Utilities</h4>
    <ul>
      <li><strong style=\"color:var(--gold)\">Water:</strong> ${esc(l.specs?.water||'-')}</li>
      <li><strong style=\"color:var(--gold)\">Electricity:</strong> ${esc(l.specs?.electricity||'-')}</li>
    </ul>
    <h4>Nearby</h4>
    <ul>${(l.nearby||[]).map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    <div class=\"modal-actions\">
      <a href=\"${esc(l.maps||'#')}\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-outline-gold\"><i class=\"fa-solid fa-map-location-dot\"></i> Open in Maps</a>
      <a href=\"/contact.html\" class=\"btn btn-gold\" data-testid=\"modal-contact-btn\">Enquire about ${esc(l.name)} <i class=\"fa-solid fa-arrow-right\"></i></a>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
modal?.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// initial
render();

// deep link by hash
if (location.hash) {
  const id = location.hash.slice(1);
  const item = store.list(store.KEYS.layouts).find(x => x.id === id);
  if (item) openModal(item);
}
