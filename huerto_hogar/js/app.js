/* =========================================
   MÓDULO DE AUTH (usa tu auth.js)
========================================= */
import { getUser, isLogged, logout } from './auth.js';

/* Pinta Login/Salir + saludo en el header */
function paintAuthUI(){
  const u = getUser();
  const hello = document.getElementById('helloUser');
  const loginL = document.getElementById('loginLink');
  const logoutL = document.getElementById('logoutLink');

  if (u){
    if (hello) hello.textContent = `Hola, ${u.name}`;
    if (loginL) loginL.style.display = 'none';
    if (logoutL){ 
      logoutL.style.display = 'inline';
      logoutL.onclick = (e)=>{ e.preventDefault(); logout(); paintAuthUI(); };
    }
  }else{
    if (hello) hello.textContent = '';
    if (loginL) loginL.style.display = 'inline';
    if (logoutL) logoutL.style.display = 'none';
  }
}

/* =========================================
   Utils
========================================= */
const $  = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>[...el.querySelectorAll(s)];
function fmtCLP(n){ try{ return Number(n).toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}); }catch{ return `$${n}`; } }

/* =========================================
   Carrito (LocalStorage)
========================================= */
const CART_KEY = 'hh_cart_v1';
const SHIPPING_FLAT = 3000;
const FREE_SHIP_OVER = 30000;

function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch{ return []; }
}
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); }
function cartCount(){ return loadCart().reduce((s,i)=>s+i.qty,0); }
function updateCartBadge(){
  const b = $('#cartCount') || $('#cartBadge');
  const val = String(cartCount());
  if (b) b.textContent = val;
  // sincroniza badge del menú móvil si existe
  const mm = $('#mmCartCount');
  if (mm) mm.textContent = val;
}
function addToCart(id, qty=1){
  const cart = loadCart();
  const i = cart.findIndex(x=>x.id===id);
  const q = Math.max(1, qty|0);
  if (i>=0) cart[i].qty += q; else cart.push({id, qty:q});
  saveCart(cart); updateCartBadge(); toast('Agregado al carrito');
}
function removeFromCart(id){
  saveCart(loadCart().filter(x=>x.id!==id)); updateCartBadge();
}
function setCartQty(id, qty){
  const q = Math.max(1, qty|0);
  const cart = loadCart();
  const i = cart.findIndex(x=>x.id===id);
  if (i>=0){ cart[i].qty = q; saveCart(cart); updateCartBadge(); }
}
function clearCart(){ localStorage.removeItem(CART_KEY); updateCartBadge(); }

/* =========================================
   Render de Carrito (si existe #cartPage o #cartView)
========================================= */
function renderCartPage(){
  const root = $('#cartPage') || $('#cartView');
  if (!root) return;

  const cart = loadCart();
  const getProd = (id)=>{
    if (typeof CATALOG !== 'undefined'){
      const p = CATALOG.find(x=>x.id===id);
      if (p) return p;
    }
    return { id, name:id, img:'', price:0 };
  };

  // Vacío
  if (!cart.length){
    root.innerHTML = `<div class="cart-wrap">
      <div class="cart-table"><table><tbody>
        <tr><td style="padding:1rem;text-align:center">Tu carrito está vacío. <a href="index.html#frutas">Volver al catálogo</a></td></tr>
      </tbody></table></div>
    </div>`;
    return;
  }

  let items = 0, subtotal = 0;
  const rows = cart.map(it=>{
    const p = getProd(it.id);
    const sub = (p.price||0) * it.qty;
    items += it.qty; subtotal += sub;
    return `
      <tr data-id="${it.id}">
        <td class="pcell">
          <div class="pcell-inner">
            ${p.img ? `<img src="${p.img}" alt="${p.name}">` : ''}
            <div class="pinfo">
              <div class="name">${p.name || it.id}</div>
              ${p.unit ? `<div class="unit">${p.unit}</div>`:''}
            </div>
          </div>
        </td>
        <td class="num">${fmtCLP(p.price||0)}</td>
        <td class="num">
          <div class="qty mini-qty">
            <button type="button" class="qbtn" data-d="-1">-</button>
            <input type="number" class="qinput" value="${it.qty}" min="1">
            <button type="button" class="qbtn" data-d="1">+</button>
          </div>
        </td>
        <td class="num">${fmtCLP(sub)}</td>
        <td class="num"><button class="del" title="Quitar">×</button></td>
      </tr>
    `;
  }).join('');

  const shipping = subtotal >= FREE_SHIP_OVER ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  root.innerHTML = `
    <div class="cart-wrap">
      <div class="cart-table">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th class="num">Precio</th>
              <th class="num">Cantidad</th>
              <th class="num">Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="cartRows">${rows}</tbody>
        </table>
      </div>

      <aside class="cart-summary">
        <div class="line"><span>Items</span> <strong id="sumItems">${items}</strong></div>
        <div class="line"><span>Subtotal</span> <strong id="sumSubtotal">${fmtCLP(subtotal)}</strong></div>
        <div class="line"><span>Despacho</span> <strong id="sumShipping">${shipping===0?'Gratis':fmtCLP(shipping)}</strong></div>
        <div class="line total"><span>Total</span> <strong id="sumTotal">${fmtCLP(total)}</strong></div>
        <div class="cart-actions">
          <button id="btnEmpty" class="btn-secondary">Vaciar</button>
          <a href="index.html#frutas" class="btn-primary">Continuar compra</a>
        </div>
      </aside>
    </div>
  `;

  const rowsEl = $('#cartRows', root);
  rowsEl?.addEventListener('click', (e)=>{
    const row = e.target.closest('tr[data-id]');
    if (!row) return; const id = row.dataset.id;

    if (e.target.classList.contains('qbtn')){
      const d = parseInt(e.target.dataset.d,10);
      const input = row.querySelector('.qinput');
      const newV = Math.max(1, (parseInt(input.value,10)||1) + d);
      input.value = newV; setCartQty(id, newV); renderCartPage();
    }
    if (e.target.classList.contains('del')){
      removeFromCart(id); renderCartPage();
    }
  });
  rowsEl?.addEventListener('change', (e)=>{
    const input = e.target.closest('.qinput'); if (!input) return;
    const row = e.target.closest('tr[data-id]'); const id = row.dataset.id;
    const val = Math.max(1, parseInt(input.value,10)||1);
    input.value = val; setCartQty(id, val); renderCartPage();
  });

  $('#btnEmpty')?.addEventListener('click', ()=>{
    if (confirm('¿Vaciar carrito?')){ clearCart(); renderCartPage(); }
  });
}

/* =========================================
   Agregado rápido (+) en relacionados, etc.
========================================= */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.quick-add,[data-add-to-cart]');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.id || btn.getAttribute('data-id');
  const qty = parseInt(btn.dataset.qty || btn.getAttribute('data-qty') || '1',10);
  if (id) addToCart(id, qty||1);
});

/* =========================================
   Sliders (hero + secciones)
========================================= */
function initHeroSlider(){
  const hero = $('.slider-hero');
  if (!hero) return;
  const slides = $$('.slide', hero);
  if (!slides.length) return;

  let i = slides.findIndex(s=>s.classList.contains('active'));
  if (i<0) i = 0;
  const show = (idx)=> slides.forEach((s,k)=> s.classList.toggle('active', k===idx));
  const next = ()=>{ i=(i+1)%slides.length; show(i); };
  const prev = ()=>{ i=(i-1+slides.length)%slides.length; show(i); };

  hero.querySelector('.hero-nav.next')?.addEventListener('click', next);
  hero.querySelector('.hero-nav.prev')?.addEventListener('click', prev);

  let timer = setInterval(next, 5000);
  hero.addEventListener('mouseenter', ()=>clearInterval(timer));
  hero.addEventListener('mouseleave', ()=> timer = setInterval(next, 5000));
}

function initSectionSliders(){
  $$('.slider-wrap').forEach(wrap=>{
    const track = $('.track', wrap);
    if (!track) return;
    const amount = Math.round(track.clientWidth*0.95) || 320;
    $('.prev', wrap)?.addEventListener('click', ()=> track.scrollBy({left:-amount,behavior:'smooth'}));
    $('.next', wrap)?.addEventListener('click', ()=> track.scrollBy({left: amount,behavior:'smooth'}));
  });
}

/* =========================================
   Toast sencillo
========================================= */
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;right:16px;bottom:16px;z-index:9999;
    background:#3F4F44;color:#fff;padding:.55rem .8rem;border-radius:10px;
    font-weight:700;box-shadow:0 10px 20px rgba(0,0,0,.25)
  `;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1200);
}

/* =========================================
   Menú hamburguesa (móvil) – unificado
========================================= */
function initMobileMenu(){
  const burger   = $('#hamburgerBtn');
  const menu     = $('#mobileMenu');
  const backdrop = $('#mobileBackdrop');

  if (!burger || !menu || !backdrop) return;

  const openMenu = ()=>{
    menu.classList.add('open');
    backdrop.hidden = false;
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-hidden','false');
    // sincroniza contador al abrir
    const val = $('#cartCount')?.textContent || '0';
    const mm  = $('#mmCartCount'); if (mm) mm.textContent = val;
  };

  const closeMenu = ()=>{
    menu.classList.remove('open');
    backdrop.hidden = true;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-hidden','true');
  };

  burger.addEventListener('click', ()=>{
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  // cierra al navegar
  menu.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if (a) closeMenu();
  });
}

/* =========================================
   INIT (único)
========================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  paintAuthUI();
  updateCartBadge();

  initHeroSlider();
  initSectionSliders();
  renderCartPage();

  initMobileMenu();

  // Agregar desde cards del índice (botón "Agregar")
  document.body.addEventListener('click', (e)=>{
    const btnAdd = e.target.closest('.btn-add');
    if (!btnAdd) return;
    const card = btnAdd.closest('.card');
    const link = card?.querySelector('a[href*="producto.html?id="]');
    if (!link) return;
    const url = new URL(link.getAttribute('href'), location.href);
    const id  = url.searchParams.get('id');
    if (!id) return;
    addToCart(id, 1);
  });
});

/* Exponer helpers si necesitas llamarlos desde otros archivos */
window.addToCart = addToCart;
window.updateCartBadge = updateCartBadge;
