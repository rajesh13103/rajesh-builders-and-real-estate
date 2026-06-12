// Local storage layer + sample-data hydration
const KEYS = {
  layouts: 'ae_layouts',
  gallery: 'ae_gallery',
  testimonials: 'ae_testimonials',
  contact: 'ae_contact',
  crew: 'ae_crew',
  stats: 'ae_stats',
  homepage: 'ae_homepage',
  submissions: 'ae_submissions',
  session: 'ae_admin_session',
};

const get = (k, fb) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }
  catch { return fb; }
};
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

async function loadSample() {
  const r = await fetch('/data/sample-data.json');
  return r.json();
}

export async function hydrate() {
  if (get(KEYS.layouts)) return; // already seeded
  const s = await loadSample();
  set(KEYS.layouts, s.layouts);
  set(KEYS.gallery, s.gallery);
  set(KEYS.testimonials, s.testimonials);
  set(KEYS.contact, s.contact);
  set(KEYS.crew, s.crew);
  set(KEYS.stats, s.stats);
  set(KEYS.homepage, s.homepage);
  set(KEYS.submissions, []);
}

export const store = {
  KEYS,
  get,
  set,
  list: (k) => get(k, []),
  add: (k, item) => { const a = get(k, []); a.unshift(item); set(k, a); return item; },
  update: (k, id, patch) => {
    const a = get(k, []);
    const i = a.findIndex(x => x.id === id);
    if (i >= 0) { a[i] = { ...a[i], ...patch }; set(k, a); }
    return a[i];
  },
  remove: (k, id) => {
    const a = get(k, []).filter(x => x.id !== id);
    set(k, a); return a;
  },
  reset: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
  uid: () => 'id-' + Math.random().toString(36).slice(2, 10),
};

// XSS-safe escape helper
export const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

await hydrate();