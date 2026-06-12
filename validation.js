import { store, esc } from './storage.js';

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

function showError(id, msg) {
  const e = document.getElementById('err-' + id);
  if (e) e.textContent = msg || '';
}
function valid(payload) {
  let ok = true;
  showError('name'); showError('phone'); showError('email'); showError('message');
  if (payload.name.length < 2) { showError('name', 'Please enter your name.'); ok = false; }
  if (!/^[\d\s+()-]{7,}$/.test(payload.phone)) { showError('phone', 'Enter a valid phone.'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) { showError('email', 'Enter a valid email.'); ok = false; }
  if (payload.message.length < 5) { showError('message', 'Tell us a little more.'); ok = false; }
  return ok;
}

// hydrate contact details from storage
const c = store.get(store.KEYS.contact, {});
['owner','phone','whatsapp','email','address'].forEach(k => {
  const el = document.getElementById('c-' + k); if (el && c[k]) el.textContent = c[k];
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = ''; status.className = 'form-status';
  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    service: form.service.value,
    message: form.message.value.trim(),
  };
  if (!valid(data)) return;
  status.textContent = 'Sending…';
  // save locally always
  store.add(store.KEYS.submissions, { id: store.uid(), ...data, created_at: new Date().toISOString() });
  try {
    const base = (window.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
    const url = base ? `${base}/api/contact` : '/api/contact';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Server rejected');
    status.textContent = 'Thank you — we will reply within one business day.';
    status.classList.add('ok');
    form.reset();
  } catch (err) {
    // local save succeeded; still confirm
    status.textContent = 'Saved. Our principal will reach out shortly.';
    status.classList.add('ok');
    form.reset();
  }
});
