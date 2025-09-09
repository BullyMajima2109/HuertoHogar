/* =========================================================
   PERSISTENCIA (LocalStorage) + AUTENTICACIÓN
   ========================================================= */
const LS_USERS   = 'hh_users';   // [{name,email,password}]
const LS_SESSION = 'hh_session'; // {email}

const getUsers     = () => JSON.parse(localStorage.getItem(LS_USERS) || '[]');
const saveUsers    = (arr) => localStorage.setItem(LS_USERS, JSON.stringify(arr));
const getSession   = () => JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
const setSession   = (obj) => localStorage.setItem(LS_SESSION, JSON.stringify(obj));
const clearSession = () => localStorage.removeItem(LS_SESSION);

/* Pinta estado de auth en el header (Login/Salir + saludo) */
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

/* Registro (solo activa si existe el formulario en la página) */
function handleRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;

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

    users.push({ name, email, password: pass });
    saveUsers(users);

    // Persistencia tipo “ejemplo del profe”
    localStorage.setItem('nombre', name);
    localStorage.setItem('email', email);

    if (regMsg) regMsg.textContent = 'Cuenta creada. ¡Ahora puedes iniciar sesión!';
    form.reset();
  });
}

/* Login (solo activa si existe el formulario en la página) */
function handleLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  // Autocompletar email si quedó guardado (ejemplo del profe)
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

/* =========================================================
   HERO SLIDER (autoplay + flechas + dots + pausa hover)
   ========================================================= */
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

  // Dots
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

  // Controles
  if (next) next.addEventListener('click', () => { stop(); nextSlide(); start(); });
  if (prev) prev.addEventListener('click', () => { stop(); prevSlide(); start(); });

  // Auto
  let timer;
  function start() { timer = setInterval(nextSlide, 5000); }
  function stop()  { clearInterval(timer); }

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);

  // Arranque
  show(idx);
  start();
}

/* =========================================================
   CARRUSELES DE SECCIÓN (cards)
   - flechas prev/next
   - dots por página
   - autoplay + pausa hover
   ========================================================= */
function initSectionCarousels() {
  const wraps = document.querySelectorAll('.slider-wrap');
  wraps.forEach((wrap) => {
    if (wrap.dataset.inited) return;
    wrap.dataset.inited = '1';

    const track = wrap.querySelector('.track');
    const prev  = wrap.querySelector('.prev');
    const next  = wrap.querySelector('.next');
    if (!track) return;

    // Dots box después del carrusel
    const dotsBox = document.createElement('div');
    dotsBox.className = 'slider-dots';
    wrap.after(dotsBox);

    let pages = 1;
    let current = 0;
    let dots = [];

    function computePages() {
      // Número de "pantallas" según ancho visible vs contenido
      pages = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth));
      // reconstruir dots
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

    // Botones
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

    // Sync dots on scroll
    track.addEventListener('scroll', updateDots);

    // ResizeObserver o fallback
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(computePages);
      ro.observe(track);
    } else {
      window.addEventListener('resize', computePages);
    }
    computePages();

    // Autoplay por páginas
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

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Auth
  paintHeaderAuth();
  handleRegister();
  handleLogin();

  // UI sliders
  initHeroSlider();
  initSectionCarousels();
});
