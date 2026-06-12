import { store, esc } from './storage.js';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const login = document.getElementById('adminLogin');
const shell = document.getElementById('adminShell');
const main = document.getElementById('adminMain');

function sessionOK() { return store.get(store.KEYS.session, null)?.user === ADMIN_USER; }
function signIn() {
  store.set(store.KEYS.session, { user: ADMIN_USER, ts: Date.now() });
  login.style.display = 'none';
  shell.style.display = 'grid';
  renderTab('overview');
}
function signOut() {
  localStorage.removeItem(store.KEYS.session);
  shell.style.display = 'none';
  login.style.display = 'grid';
}

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('lgUser').value.trim();
  const p = document.getElementById('lgPass').value;
  const st = document.getElementById('lgStatus');
  if (u === ADMIN_USER && p === ADMIN_PASS) { st.textContent = 'Signed in'; st.className='form-status ok'; signIn(); }
  else { st.textContent = 'Invalid credentials'; st.className = 'form-status err'; }
});
document.getElementById('logoutBtn').addEventListener('click', signOut);

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  renderTab(t.dataset.tab);
}));

if (sessionOK()) signIn();

// ---------- Renderers ----------
function head(title, sub, btn) {
  return `<div class=\"admin-head\"><div><h2>${esc(title)}</h2><p>${esc(sub||'')}</p></div>${btn||''}</div>`;
}

function renderTab(name) {
  ({
    overview: renderOverview,
    layouts: renderLayouts,
    gallery: renderGallery,
    crew: renderCrew,
    testimonials: renderTestimonials,
    contact: renderContact,
    submissions: renderSubmissions,
  }[name] || renderOverview)();
}

function renderOverview() {
  const layouts = store.list(store.KEYS.layouts);
  const gallery = store.list(store.KEYS.gallery);
  const crew = store.list(store.KEYS.crew);
  const subs = store.list(store.KEYS.submissions);
  main.innerHTML = `
    ${head('Overview', 'A glance at your content & enquiries.')}
    <div class=\"kpi-grid\">
      <div class=\"kpi\"><small>Layouts</small><strong>${layouts.length}</strong></div>
      <div class=\"kpi\"><small>Gallery</small><strong>${gallery.length}</strong></div>
      <div class=\"kpi\"><small>Crew</small><strong>${crew.length}</strong></div>
      <div class=\"kpi\"><small>Enquiries</small><strong>${subs.length}</strong></div>
    </div>
    <h3 style=\"font-family:var(--ff-head);font-size:1.3rem;margin-bottom:16px\">Recent enquiries</h3>
    ${subsTable(subs.slice(0,5))}
  `;
}

function subsTable(subs) {
  if (!subs.length) return '<p style=\"color:var(--silver)\">No enquiries yet.</p>';
  return `<table class=\"tbl\"><thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Service</th><th>Message</th></tr></thead><tbody>
    ${subs.map(s => `<tr><td>${new Date(s.created_at).toLocaleDateString()}</td><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.email)}</td><td>${esc(s.service||'-')}</td><td>${esc((s.message||'').slice(0,80))}</td></tr>`).join('')}
  </tbody></table>`;
}

function renderLayouts() {
  const items = store.list(store.KEYS.layouts);
  main.innerHTML = `
    ${head('Layouts', 'Manage your land inventory.', '<button class=\"btn btn-gold btn-sm\" id=\"addLayout\" data-testid=\"add-layout\"><i class=\"fa-solid fa-plus\"></i> Add layout</button>')}
    <table class=\"tbl\"><thead><tr><th>Image</th><th>Name</th><th>Location</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${items.map(l => `<tr><td><img class=\"thumb\" src=\"${esc(l.image)}\" alt=\"\"/></td><td>${esc(l.name)}</td><td>${esc(l.location)}</td><td>${esc(l.price)}</td><td><span class=\"status-pill ${esc(l.status)}\">${esc(l.status)}</span></td>
      <td class=\"row-actions\"><button data-edit=\"${esc(l.id)}\">Edit</button><button class=\"del\" data-del=\"${esc(l.id)}\">Delete</button></td></tr>`).join('')}
    </tbody></table>`;
  document.getElementById('addLayout').addEventListener('click', () => openLayoutEditor());
  main.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openLayoutEditor(items.find(x => x.id === b.dataset.edit))));
  main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    if (confirm('Delete this layout?')) { store.remove(store.KEYS.layouts, b.dataset.del); renderLayouts(); }
  }));
}

function drawer(title, body, onSave) {
  let d = document.getElementById('adminDrawer');
  if (!d) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class=\"admin-drawer-bg\" id=\"adminDrawerBg\"></div>
      <div class=\"admin-drawer\" id=\"adminDrawer\"></div>`);
    d = document.getElementById('adminDrawer');
  }
  const bg = document.getElementById('adminDrawerBg');
  d.innerHTML = `<div class=\"drawer-head\"><h3>${esc(title)}</h3><button class=\"drawer-close\" data-close>&times;</button></div>${body}<div style=\"margin-top:24px;display:flex;gap:10px\"><button class=\"btn btn-gold btn-sm\" id=\"drawerSave\">Save</button><button class=\"btn btn-ghost btn-sm\" data-close>Cancel</button></div>`;
  d.classList.add('open'); bg.classList.add('open');
  const close = () => { d.classList.remove('open'); bg.classList.remove('open'); };
  d.querySelectorAll('[data-close]').forEach(x => x.addEventListener('click', close));
  bg.addEventListener('click', close);
  document.getElementById('drawerSave').addEventListener('click', () => { if (onSave() !== false) close(); });
}

function field(label, name, value = '', type = 'text') {
  return `<label style=\"display:block;margin-bottom:14px\"><span style=\"font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--silver);display:block;margin-bottom:6px\">${esc(label)}</span><input class=\"d-input\" name=\"${name}\" type=\"${type}\" value=\"${esc(value)}\" style=\"width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid var(--line-soft);color:var(--white);border-radius:6px;font-family:inherit\"/></label>`;
}
function textarea(label, name, value = '') {
  return `<label style=\"display:block;margin-bottom:14px\"><span style=\"font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--silver);display:block;margin-bottom:6px\">${esc(label)}</span><textarea class=\"d-input\" name=\"${name}\" rows=\"3\" style=\"width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid var(--line-soft);color:var(--white);border-radius:6px;font-family:inherit\">${esc(value)}</textarea></label>`;
}
function select(label, name, opts, value) {
  return `<label style=\"display:block;margin-bottom:14px\"><span style=\"font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--silver);display:block;margin-bottom:6px\">${esc(label)}</span><select class=\"d-input\" name=\"${name}\" style=\"width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid var(--line-soft);color:var(--white);border-radius:6px;font-family:inherit\">${opts.map(o => `<option value=\"${o}\" ${o===value?'selected':''}>${o}</option>`).join('')}</select></label>`;
}

function openLayoutEditor(item) {
  const isNew = !item;
  const i = item || { id: store.uid(), status: 'available' };
  const body = `
    ${field('Name','name',i.name)}
    ${field('Location','location',i.location)}
    ${field('Price','price',i.price)}
    ${field('Area','area',i.area)}
    ${field('Plots','plots',i.plots,'number')}
    ${select('Status','status',['available','limited','upcoming','sold'],i.status)}
    ${field('Image URL','image',i.image)}
    ${textarea('Description','description',i.description||'')}
    ${field('Google Maps URL','maps',i.maps||'')}`;
  drawer(isNew ? 'Add layout' : 'Edit layout', body, () => {
    const vals = {}; document.querySelectorAll('#adminDrawer .d-input').forEach(el => vals[el.name] = el.value);
    const payload = { ...i, ...vals, plots: parseInt(vals.plots,10)||0 };
    if (isNew) store.add(store.KEYS.layouts, payload);
    else store.update(store.KEYS.layouts, i.id, payload);
    renderLayouts();
  });
}

function renderGallery() {
  const items = store.list(store.KEYS.gallery);
  main.innerHTML = `${head('Gallery','Curate your visual portfolio.','<button class=\"btn btn-gold btn-sm\" id=\"addG\" data-testid=\"add-gallery\"><i class=\"fa-solid fa-plus\"></i> Add image</button>')}
    <table class=\"tbl\"><thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Actions</th></tr></thead><tbody>
    ${items.map(g => `<tr><td><img class=\"thumb\" src=\"${esc(g.image)}\" alt=\"\"/></td><td>${esc(g.title)}</td><td>${esc(g.category)}</td><td class=\"row-actions\"><button data-edit=\"${esc(g.id)}\">Edit</button><button class=\"del\" data-del=\"${esc(g.id)}\">Delete</button></td></tr>`).join('')}
    </tbody></table>`;
  document.getElementById('addG').addEventListener('click', () => openGalleryEditor());
  main.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openGalleryEditor(items.find(x => x.id === b.dataset.edit))));
  main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (confirm('Delete?')) { store.remove(store.KEYS.gallery, b.dataset.del); renderGallery(); }}));
}
function openGalleryEditor(item) {
  const isNew = !item; const i = item || { id: store.uid(), category: 'layout' };
  drawer(isNew ? 'Add image' : 'Edit image', `${field('Title','title',i.title||'')}${select('Category','category',['layout','interior','construction'],i.category)}${field('Image URL','image',i.image||'')}`, () => {
    const v = {}; document.querySelectorAll('#adminDrawer .d-input').forEach(el => v[el.name] = el.value);
    if (isNew) store.add(store.KEYS.gallery, { ...i, ...v }); else store.update(store.KEYS.gallery, i.id, v);
    renderGallery();
  });
}

function renderCrew() {
  const items = store.list(store.KEYS.crew);
  main.innerHTML = `${head('Crew','Your team is the brand.','<button class=\"btn btn-gold btn-sm\" id=\"addC\" data-testid=\"add-crew\"><i class=\"fa-solid fa-plus\"></i> Add member</button>')}
    <table class=\"tbl\"><thead><tr><th>Photo</th><th>Name</th><th>Role</th><th>Experience</th><th>Actions</th></tr></thead><tbody>
    ${items.map(c => `<tr><td><img class=\"thumb\" src=\"${esc(c.photo)}\" alt=\"\"/></td><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td>${esc(c.experience)}</td><td class=\"row-actions\"><button data-edit=\"${esc(c.id)}\">Edit</button><button class=\"del\" data-del=\"${esc(c.id)}\">Delete</button></td></tr>`).join('')}
    </tbody></table>`;
  document.getElementById('addC').addEventListener('click', () => openCrewEditor());
  main.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openCrewEditor(items.find(x => x.id === b.dataset.edit))));
  main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (confirm('Delete?')) { store.remove(store.KEYS.crew, b.dataset.del); renderCrew(); }}));
}
function openCrewEditor(item) {
  const isNew = !item; const i = item || { id: store.uid() };
  drawer(isNew ? 'Add crew member' : 'Edit member',
    `${field('Name','name',i.name||'')}${field('Role','role',i.role||'')}${field('Experience','experience',i.experience||'')}${field('Photo URL','photo',i.photo||'')}${field('Skills (comma separated)','skills',(i.skills||[]).join(', '))}`,
    () => {
      const v = {}; document.querySelectorAll('#adminDrawer .d-input').forEach(el => v[el.name] = el.value);
      v.skills = v.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (isNew) store.add(store.KEYS.crew, { ...i, ...v }); else store.update(store.KEYS.crew, i.id, v);
      renderCrew();
    });
}

function renderTestimonials() {
  const items = store.list(store.KEYS.testimonials);
  main.innerHTML = `${head('Testimonials','Words your clients have left behind.','<button class=\"btn btn-gold btn-sm\" id=\"addT\" data-testid=\"add-testimonial\"><i class=\"fa-solid fa-plus\"></i> Add</button>')}
    <table class=\"tbl\"><thead><tr><th>Name</th><th>Project</th><th>Rating</th><th>Review</th><th>Actions</th></tr></thead><tbody>
    ${items.map(t => `<tr><td>${esc(t.name)}</td><td>${esc(t.project)}</td><td>${t.rating}★</td><td>${esc((t.review||'').slice(0,80))}</td><td class=\"row-actions\"><button data-edit=\"${esc(t.id)}\">Edit</button><button class=\"del\" data-del=\"${esc(t.id)}\">Delete</button></td></tr>`).join('')}
    </tbody></table>`;
  document.getElementById('addT').addEventListener('click', () => openTestEditor());
  main.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openTestEditor(items.find(x => x.id === b.dataset.edit))));
  main.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { if (confirm('Delete?')) { store.remove(store.KEYS.testimonials, b.dataset.del); renderTestimonials(); }}));
}
function openTestEditor(item) {
  const isNew = !item; const i = item || { id: store.uid(), rating: 5 };
  drawer(isNew ? 'Add testimonial' : 'Edit',
    `${field('Name','name',i.name||'')}${field('Project','project',i.project||'')}${field('Rating (1-5)','rating',i.rating,'number')}${field('Photo URL','photo',i.photo||'')}${textarea('Review','review',i.review||'')}`,
    () => {
      const v = {}; document.querySelectorAll('#adminDrawer .d-input').forEach(el => v[el.name] = el.value);
      v.rating = Math.max(1, Math.min(5, parseInt(v.rating,10)||5));
      if (isNew) store.add(store.KEYS.testimonials, { ...i, ...v }); else store.update(store.KEYS.testimonials, i.id, v);
      renderTestimonials();
    });
}

function renderContact() {
  const c = store.get(store.KEYS.contact, {});
  main.innerHTML = `${head('Contact Information','Updates instantly across the website.')}
    <div style=\"max-width:560px\">
      ${field('Owner Name','owner',c.owner||'')}
      ${field('Phone','phone',c.phone||'')}
      ${field('WhatsApp','whatsapp',c.whatsapp||'')}
      ${field('Email','email',c.email||'')}
      ${textarea('Address','address',c.address||'')}
      <button class=\"btn btn-gold btn-sm\" id=\"saveContact\" data-testid=\"save-contact\"><i class=\"fa-solid fa-floppy-disk\"></i> Save</button>
      <p class=\"form-status\" id=\"cStatus\"></p>
    </div>`;
  // Use admin-main inputs (not drawer); reuse class for query
  main.querySelectorAll('input,textarea').forEach(el => el.classList.add('d-input'));
  document.getElementById('saveContact').addEventListener('click', () => {
    const v = {}; main.querySelectorAll('.d-input').forEach(el => v[el.name] = el.value);
    store.set(store.KEYS.contact, v);
    const s = document.getElementById('cStatus'); s.textContent = 'Saved — changes are live.'; s.className = 'form-status ok';
  });
}

function renderSubmissions() {
  const subs = store.list(store.KEYS.submissions);
  main.innerHTML = `${head('Enquiries', subs.length + ' submission(s) received.')}${subsTable(subs)}`;
}
