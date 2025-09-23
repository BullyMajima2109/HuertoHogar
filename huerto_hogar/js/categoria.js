// js/categoria.js
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const fmtCLP = n => Number(n||0).toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});

// Mapea el título bonito
const pretty = {
  ofertas: 'Ofertas',
  frutas: 'Frutas',
  verduras: 'Verduras',
  organicos: 'Orgánicos',
  lacteos: 'Lácteos'
};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const cat = (params.get('cat') || '').toLowerCase();

  const titleEl = $('#catTitle');
  const track   = $('#catTrack');
  const empty   = $('#catEmpty');

  if (!window.CATALOG || !Array.isArray(CATALOG)) {
    titleEl.textContent = 'Catálogo';
    empty.style.display = 'block';
    empty.textContent = 'No se pudo cargar el catálogo.';
    return;
  }

  titleEl.textContent = pretty[cat] || 'Catálogo';

  let items = [];
  if (cat === 'ofertas') {
    // productos con flag offer:true
    items = CATALOG.filter(p => p.offer === true);
  } else if (['frutas','verduras','organicos','lacteos'].includes(cat)) {
    items = CATALOG.filter(p => p.category === cat);
  } else {
    // sin categoría válida: muestra todo como fallback
    items = [...CATALOG];
  }

  if (!items.length) {
    track.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'No hay productos en esta categoría.';
    return;
  }

  empty.style.display = 'none';
  track.innerHTML = items.map(p => `
    <article class="card">
      <a href="producto.html?id=${p.id}">
        <div class="card-img"><img src="${p.img}" alt="${p.name}"></div>
        <h4 class="title">${p.name}</h4>
        ${p.unit ? `<p>${p.unit}</p>` : ``}
        <p>${fmtCLP(p.price)}${p.unit?.includes('kg') ? ' /kg':''}</p>
      </a>
      <button class="btn-add" data-add-to-cart data-id="${p.id}" data-qty="1">Agregar</button>
    </article>
  `).join('');
});
