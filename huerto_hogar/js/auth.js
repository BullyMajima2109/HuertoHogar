// js/auth.js
// =========================================
// AUTH MÓDULO (ESM) para Huerto Hogar
// =========================================

const LS_USERS   = 'hh_users';
const LS_SESSION = 'hh_session';

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
  catch { return []; }
};
const saveUsers = (arr) => localStorage.setItem(LS_USERS, JSON.stringify(arr));

export function getUser(){
  try {
    const s = JSON.parse(localStorage.getItem(LS_SESSION));
    if (!s?.email) return null;
    return getUsers().find(u => u.email === s.email) || null;
  } catch {
    return null;
  }
}
export function isLogged(){ return !!getUser(); }

export function logout(){
  localStorage.removeItem(LS_SESSION);
  // opcional: redirige a home
  // location.href = 'index.html';
}

function setSession(email){
  localStorage.setItem(LS_SESSION, JSON.stringify({ email }));
}

/* =========================
   LOGIN (auto-wire si #loginForm existe)
========================= */
function initLogin(){
  const form = document.getElementById('loginForm');
  if (!form) return;

  const $ = (s) => form.querySelector(s);
  const emailEl = $('#loginEmail');
  const passEl  = $('#loginPass');
  const emailErr= document.getElementById('loginEmailErr');
  const passErr = document.getElementById('loginPassErr');
  const loginMsg= document.getElementById('loginMsg');

  // autocompletar email recordado
  const savedEmail = localStorage.getItem('email');
  if (savedEmail && emailEl && !emailEl.value) emailEl.value = savedEmail;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    emailErr && (emailErr.textContent = '');
    passErr  && (passErr.textContent  = '');
    loginMsg && (loginMsg.textContent = '');

    const email = (emailEl?.value || '').trim().toLowerCase();
    const pass  = passEl?.value || '';

    let ok = true;
    if (!email){ emailErr && (emailErr.textContent = 'Ingresa tu email'); ok = false; }
    if (!pass){  passErr  && (passErr.textContent  = 'Ingresa tu contraseña'); ok = false; }
    if (!ok) return;

    const users = getUsers();
    const u = users.find(x => x.email === email && x.password === pass);
    if (!u){
      loginMsg && (loginMsg.textContent = 'Email o contraseña incorrectos');
      return;
    }
    setSession(u.email);
    // recuerda email para próxima vez
    localStorage.setItem('email', u.email);
    location.href = 'index.html';
  });
}

/* =========================
   REGISTRO (auto-wire si #registerForm existe)
========================= */
function initRegister(){
  const form = document.getElementById('registerForm');
  if (!form) return;

  const $ = (s) => form.querySelector(s);
  const nameEl  = $('#regNombre');
  const emailEl = $('#regEmail');
  const phoneEl = $('#regPhone');
  const passEl  = $('#regPass');

  const nameErr  = document.getElementById('regNombreErr');
  const emailErr = document.getElementById('regEmailErr');
  const phoneErr = document.getElementById('regPhoneErr');
  const passErr  = document.getElementById('regPassErr');
  const regMsg   = document.getElementById('regMsg');

  const rePhoneCL = /^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/; // +56 9 1234 5678 (permisivo con espacios)

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    nameErr  && (nameErr.textContent  = '');
    emailErr && (emailErr.textContent = '');
    phoneErr && (phoneErr.textContent = '');
    passErr  && (passErr.textContent  = '');
    regMsg   && (regMsg.textContent   = '');

    const name  = (nameEl?.value  || '').trim();
    const email = (emailEl?.value || '').trim().toLowerCase();
    const phone = (phoneEl?.value || '').trim();
    const pass  = passEl?.value || '';

    let ok = true;
    if (!name){  nameErr  && (nameErr.textContent  = 'Ingresa tu nombre'); ok = false; }
    if (!email){ emailErr && (emailErr.textContent = 'Ingresa tu email'); ok = false; }
    if (!phone){ phoneErr && (phoneErr.textContent = 'Ingresa tu teléfono'); ok = false; }
    else if (!rePhoneCL.test(phone)){ phoneErr && (phoneErr.textContent='Formato esperado: +56 9 1234 5678'); ok=false; }
    if (!pass || pass.length < 6){ passErr && (passErr.textContent = 'Mínimo 6 caracteres'); ok = false; }
    if (!ok) return;

    const users = getUsers();
    if (users.some(u => u.email === email)){
      emailErr && (emailErr.textContent = 'Este email ya está registrado');
      return;
    }

    users.push({ name, email, phone, password: pass });
    saveUsers(users);

    // recordamos nombre/email para login
    localStorage.setItem('nombre', name);
    localStorage.setItem('email',  email);

    regMsg && (regMsg.textContent = 'Cuenta creada. ¡Ahora puedes iniciar sesión!');
    form.reset();

    // opcional: enviar a login tras 1s
    setTimeout(()=> location.href = 'login.html', 900);
  });
}

/* Auto init en cualquier página */
document.addEventListener('DOMContentLoaded', ()=>{
  initLogin();
  initRegister();
});
