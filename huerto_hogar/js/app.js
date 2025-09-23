/* ===========================
   AUTH + UI BASE
   =========================== */

/* LocalStorage */
const LS_USERS   = 'hh_users';
const LS_SESSION = 'hh_session';

const getUsers     = () => JSON.parse(localStorage.getItem(LS_USERS) || '[]');
const saveUsers    = (arr) => localStorage.setItem(LS_USERS, JSON.stringify(arr));
const getSession   = () => JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
const setSession   = (obj) => localStorage.setItem(LS_SESSION, JSON.stringify(obj));
const clearSession = () => localStorage.removeItem(LS_SESSION);

/* ===========================
   CARRITO (LocalStorage) - con normalización de {q} -> {qty}
   =========================== */
const LS_CART = 'hh_cart';

function normalizeCart(arr){
  // convierte items legacy {id, q} a {id, qty}
  return (arr || []).map(it => {
    const qty = it.qty != null ? it.qty : (it.q != null ? it.q : 0);
    return { id: it.id, qty: Math.max(0, parseInt(qty,10)||0) };
  }).filter(it => it.id && it.qty > 0);
}

const Cart = {
  _getRaw(){ return JSON.parse(localStorage.getItem(LS_CART) || '[]'); },
  _get(){
    const norm = normalizeCart(this._getRaw());
    // si normalizamos algo, guardamos de vuelta
    if (JSON.stringify(this._getRaw()) !== JSON.stringify(norm)) {
      localStorage.setItem(LS_CART, JSON.stringify(norm));
    }
    return norm;
  },
  _set(arr){
    const norm = normalizeCart(arr);
    localStorage.setItem(LS_CART, JSON.stringify(norm));
    this.renderBadge();
  },

  count(){ return this._get().reduce((sum, it) => sum + it.qty, 0); },

  add(id, qty = 1){
    qty = Math.max(1, parseInt(qty,10) || 1);
    const cart = this._get();
    const i = cart.findIndex(it => it.id === id);
    if (i >= 0) cart[i].qty += qty;
    else cart.push({ id, qty });
    this._set(cart);
  },

  set(id, qty){
    qty = Math.max(0, parseInt(qty,10) || 0);
    const cart = this._get();
    const i = cart.findIndex(it => it.id === id);
    if (i >= 0){
      if (qty === 0) cart.splice(i,1);
      else cart[i].qty = qty;
    } else if (qty > 0){
      cart.push({ id, qty });
    }
    this._set(cart);
  },

  remove(id){
    const cart = this._get().filter(it => it.id !== id);
    this._set(cart);
  },

  clear(){
    localStorage.removeItem(LS_CART);
    this.renderBadge();
  },

  renderBadge(){
    const el = document.getElementById('cartCount');
    if (el) el.textContent = String(this.count());
  }
};

window.Cart = Cart;

/* Header auth */
function paintHeaderAuth() {
  const loginLink  = document.getElementById('loginLink');
  const logoutLink = document.getElementById('logoutLink');
  const helloUser  = document.getElementById('helloUser');
  const session = getSession();

  if (!loginLink || !logoutLink) return;

  if (session) {
    const user = getUsers().find(u => u.email === session.email);
    if (helloUser && user) helloUser.textContent = `Hola, ${user.name}`;

    loginLink.style.display  = 'none';
    logoutLink.style.display = 'inline';

    logoutLink.onclick = (e) => {
      e.preventDefault();
      clearSession();
      if (helloUser) helloUser.textContent = '';
      window.location.href = 'index.html';
    };
  } else {
    if (helloUser) helloUser.textContent = '';
    loginLink.style.display  = 'inline';
    logoutLink.style.display = 'none';
  }
}

/* Registro */
function handleRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name  = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('regPass').value;
    const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : '';

    const nameErr = document.getElementById('regNombreErr');
    const emailErr = document.getElementById('regEmailErr');
    const passErr  = document.getElementById('regPassErr');
    const regMsg   = document.getElementById('regMsg');

    if (nameErr) nameErr.textContent = '';
    if (emailErr) emailErr.textContent = '';
    if (passErr)  passErr.textContent  = '';
    if (regMsg)   regMsg.textContent   = '';

    let ok = true;
    if (!name && nameErr) { nameErr.textContent = 'Ingresa tu nombre'; ok = false; }
    if (!email && emailErr) { emailErr.textContent = 'Ingresa tu email'; ok = false; }
    if ((!pass || pass.length < 6) && passErr) { passErr.textContent = 'Mínimo 6 caracteres'; ok = false; }
    if (!ok) return;

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      if (emailErr) emailErr.textContent = 'Este email ya está registrado';
      return;
    }

    users.push({ name, email, password: pass, phone });
    saveUsers(users);

    localStorage.setItem('nombre', name);
    localStorage.setItem('email', email);

    if (regMsg) regMsg.textContent = 'Cuenta creada. ¡Ahora puedes iniciar sesión!';
    form.reset();
  });
}

/* Login */
function handleLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  window.addEventListener('load', () => {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) {
      const input = document.getElementById('loginEmail');
      if (input && !input.value) input.value = savedEmail;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('loginPass').value;

    const emailErr = document.getElementById('loginEmailErr');
    const passErr  = document.getElementById('loginPassErr');
    const loginMsg = document.getElementById('loginMsg');

    if (emailErr) emailErr.textContent = '';
    if (passErr)  passErr.textContent  = '';
    if (loginMsg) loginMsg.textContent = '';

    let ok = true;
    if (!email && emailErr) { emailErr.textContent = 'Ingresa tu email'; ok = false; }
    if (!pass && passErr)  { passErr.textContent  = 'Ingresa tu contraseña'; ok = false; }
    if (!ok) return;

    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === pass);
    if (!user) {
      if (loginMsg) loginMsg.textContent = 'Email o contraseña incorrectos';
      return;
    }

    setSession({ email: user.email });
    window.location.href = 'index.html';
  });
}

/* Hero slider */
function initHeroSlider() {
  const hero = document.querySelector('.slider-hero[data-hero], .hero .slider-hero, [data-hero]');
  if (!hero || hero.dataset.inited) return;
  hero.dataset.inited = '1';

  const slides = hero.querySelectorAll('.slide');
  const prev   = hero.querySelector('.hero-nav.prev');
  const next   = hero.querySelector('.hero-nav.next');

  if (!slides.length) return;

  let idx = [...slides].findIndex(s => s.classList.contains('active'));
  if (idx < 0) idx = 0;

  function show(i) {
    slides.forEach(s => s.classList.remove('active'));
    slides[i].classList.add('active');
    idx = i;
    updateDots(i);
  }
  function nextSlide() { show((idx + 1) % slides.length); }
  function prevSlide() { show((idx - 1 + slides.length) % slides.length); }

  const dotsBox = document.createElement('div');
  dotsBox.className = 'dots';
  const dots = [];
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot' + (i === idx ? ' active' : '');
    b.addEventListener('click', () => { stop(); show(i); start(); });
    dotsBox.appendChild(b);
    dots.push(b);
  });
  hero.appendChild(dotsBox);

  function updateDots(i) {
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  }

  if (next) next.addEventListener('click', () => { stop(); nextSlide(); start(); });
  if (prev) prev.addEventListener('click', () => { stop(); prevSlide(); start(); });

  let timer;
  function start() { timer = setInterval(nextSlide, 5000); }
  function stop()  { clearInterval(timer); }

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);

  show(idx);
  start();
}

/* Carruseles */
function initSectionCarousels() {
  const wraps = document.querySelectorAll('.slider-wrap');
  wraps.forEach((wrap) => {
    if (wrap.dataset.inited) return;
    wrap.dataset.inited = '1';

    const track = wrap.querySelector('.track');
    const prev  = wrap.querySelector('.prev');
    const next  = wrap.querySelector('.next');
    if (!track) return;

    const dotsBox = document.createElement('div');
    dotsBox.className = 'slider-dots';
    wrap.after(dotsBox);

    let pages = 1;
    let current = 0;
    let dots = [];

    function computePages() {
      pages = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth));
      dotsBox.innerHTML = '';
      dots = [];
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dot' + (i === 0 ? ' active' : '');
        b.addEventListener('click', () => {
          stopAuto();
          goTo(i);
          startAuto();
        });
        dotsBox.appendChild(b);
        dots.push(b);
      }
      updateDots();
    }

    function updateDots() {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      current = Math.min(pages - 1, Math.max(0, i));
      dots.forEach((d, k) => d.classList.toggle('active', k === current));
    }

    function goTo(i) {
      const x = i * track.clientWidth;
      track.scrollTo({ left: x, behavior: 'smooth' });
    }

    const jump = () => track.clientWidth * 0.95;
    if (prev) prev.addEventListener('click', () => {
      stopAuto();
      track.scrollBy({ left: -jump(), behavior: 'smooth' });
      startAuto();
    });
    if (next) next.addEventListener('click', () => {
      stopAuto();
      track.scrollBy({ left:  jump(), behavior: 'smooth' });
      startAuto();
    });

    track.addEventListener('scroll', updateDots);

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(computePages);
      ro.observe(track);
    } else {
      window.addEventListener('resize', computePages);
    }
    computePages();

    let timer;
    function nextPage() {
      const n = (current + 1) % pages;
      goTo(n);
    }
    function startAuto() {
      if (pages <= 1) return;
      timer = setInterval(nextPage, 5000);
    }
    function stopAuto() { clearInterval(timer); }

    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', startAuto);
    track.addEventListener('pointerdown', stopAuto);

    startAuto();
  });
}

/* ===========================
   RENDER: Carrito (carrito.html) – robusto
   =========================== */
function renderCartPage(){
  const container = document.getElementById('cartView');
  const notice    = document.getElementById('cartNotice');
  if(!container) return; // no estamos en carrito.html

  const items = Cart._get();
  if(items.length===0){
    container.innerHTML=`<p>Tu carrito está vacío. <a href="index.html#frutas">Volver al catálogo</a></p>`;
    if (notice) notice.textContent = '';
    return;
  }

  const fmtCLP = (n) => n.toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});

  // Toma el catálogo desde window o, si no, desde un global CATALOG (fallback)
  const CAT = (typeof window !== 'undefined' && window.CATALOG)
                ? window.CATALOG
                : (typeof CATALOG !== 'undefined' ? CATALOG : null);

  if (!CAT){
    if (notice) notice.textContent = 'No se pudo cargar js/catalogo.js (revisa nombre y carpeta).';
  } else {
    if (notice) notice.textContent = '';
  }

  const getProd = (id) => {
    if (!CAT) return null;
    return CAT.find(p=>p.id===id) || null;
  };

  const rows = items.map(it=>{
    const p = getProd(it.id);
    if (p){
      return `
        <tr>
          <td><div class="row-product"><img src="${p.img}" alt="${p.name}"><span>${p.name}</span></div></td>
          <td>${fmtCLP(p.price)}</td>
          <td>${it.qty}</td>
          <td>${fmtCLP(p.price*it.qty)}</td>
        </tr>`;
    }
    // fallback si no está en el catálogo
    return `
      <tr>
        <td><div class="row-product"><div style="width:64px;height:64px;background:#f3f3f3;border-radius:8px;margin-right:.75rem;"></div><span>${it.id} (no encontrado)</span></div></td>
        <td>${fmtCLP(0)}</td>
        <td>${it.qty}</td>
        <td>${fmtCLP(0)}</td>
      </tr>`;
  }).join('');

  const subtotal = items.reduce((acc,it)=>{
    const p = getProd(it.id);
    return acc + (p ? p.price*it.qty : 0);
  },0);

  const envio = subtotal >= 30000 ? 0 : 3000;
  const total = subtotal + envio;
  const itemsCount = items.reduce((a,i)=>a+i.qty,0);

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="cart-summary">
      <p><span>Items</span><span>${itemsCount}</span></p>
      <p><span>Subtotal</span><span>${fmtCLP(subtotal)}</span></p>
      <p><span>Despacho</span><span>${envio===0?'Gratis':fmtCLP(envio)}</span></p>
      <hr />
      <p><strong>Total</strong><strong>${fmtCLP(total)}</strong></p>
      <div style="margin-top:.5rem">
        <button class="btn btn-empty" onclick="Cart.clear(); location.reload()">Vaciar</button>
        <button class="btn btn-primary" onclick="alert('Demo: continuar compra')">Continuar compra</button>
      </div>
    </div>
  `;
}


/* ===========================
   INIT + Delegados
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  paintHeaderAuth();
  handleRegister();
  handleLogin();

  initHeroSlider();
  initSectionCarousels();

  Cart.renderBadge();

  renderCartPage();

  // Agregar desde cards del índice
  document.body.addEventListener('click', (e) => {
    const btnAdd = e.target.closest('.btn-add');
    if (!btnAdd) return;

    const card = btnAdd.closest('.card');
    if (!card) return;

    const link = card.querySelector('a[href*="producto.html?id="]');
    if (!link) return;

    const url = new URL(link.getAttribute('href'), location.href);
    const id  = url.searchParams.get('id');
    if (!id) return;

    Cart.add(id, 1);
    alert('Producto agregado al carrito');
  });

  // Delegado genérico opcional
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    const id  = btn.getAttribute('data-id');
    const qty = parseInt(btn.getAttribute('data-qty') || '1', 10);
    if (id) {
      Cart.add(id, qty);
      alert('Producto agregado al carrito');
    }
  });
});

/* Fix específico carrusel #frutas */
(function () {
  const wrap = document.querySelector('#frutas .slider-wrap');
  if (!wrap) return;

  const track = wrap.querySelector('.track') || wrap.querySelector('.grid') || wrap;
  const prev = wrap.querySelector('.prev');
  const next = wrap.querySelector('.next');
  const jump = () => Math.round(track.clientWidth * 0.9);

  prev && prev.addEventListener('click', () => {
    track.scrollBy({ left: -jump(), behavior: 'smooth' });
  });

  next && next.addEventListener('click', () => {
    track.scrollBy({ left: jump(), behavior: 'smooth' });
  });
})();
