/* ===========================
   Catálogo Huerto Hogar
   =========================== */
window.CATALOG = [
  // FRUTAS
  { id:'manzana-fuji',  name:'Manzana Fuji',  unit:'1 kg',      price:1200, img:'img/manzanafuji.jpg', desc:'Manzana crujiente y dulce.', category:'frutas' },
  { id:'naranja',       name:'Naranja',       unit:'1 kg',      price:1000, img:'img/naranja.jpg',     desc:'Jugosa y fresca.', category:'frutas' },
  { id:'frutillas',     name:'Frutillas',     unit:'500 g',     price:1800, img:'img/frutilla.jpg',    desc:'Dulces y aromáticas.', category:'frutas' },
  { id:'arandanos',     name:'Arándanos',     unit:'125 g',     price:1500, img:'img/arandanos.jpeg',  desc:'Ricos en antioxidantes.', category:'frutas' },
  { id:'frambuesas',    name:'Frambuesas',    unit:'125 g',     price:1600, img:'img/frambuesa.png',   desc:'Sabor intenso.', category:'frutas' },
  { id:'mandarinas',    name:'Mandarinas',    unit:'1 kg',      price:1100, img:'img/mandarina.jpg',   desc:'Fáciles de pelar.', category:'frutas' },
  { id:'melon',         name:'Melón',         unit:'Unidad',    price:2500, img:'img/melon.jpg',       desc:'Dulce y refrescante.', category:'frutas' },
  { id:'sandia',        name:'Sandía',        unit:'Unidad',    price:3500, img:'img/sandia.jpg',      desc:'Muy jugosa.', category:'frutas' },
  { id:'uvas',          name:'Uvas',          unit:'1 bandeja', price:2000, img:'img/uva.png',         desc:'Firmes y dulces.', category:'frutas' },
  { id:'platano',       name:'Plátano',       unit:'1 kg',      price:800,  img:'img/platano.jpg',     desc:'Versátil y rendidor.', category:'frutas' },

  // VERDURAS
  { id:'zanahoria',     name:'Zanahoria',     unit:'1 kg',      price:900,  img:'img/zanahoria.jpg',   desc:'Dulce y crocante.', category:'verduras' },
  { id:'espinaca',      name:'Espinaca',      unit:'Bolsa 500 g',price:700, img:'img/espinaca.jpg',    desc:'Hojas tiernas.', category:'verduras' },
  { id:'pimientos',     name:'Pimientos',     unit:'1 kg',      price:1500, img:'img/pimientos.jpg',   desc:'Llenos de color.', category:'verduras' },

  // ORGÁNICOS
  { id:'miel-organica',   name:'Miel Orgánica',   unit:'Frasco 500 g', price:5000, img:'img/miel.jpg',   desc:'Miel pura local.', category:'organicos' },
  { id:'quinoa-organica', name:'Quinoa Orgánica', unit:'1 kg',         price:3500, img:'img/quinoa.jpg', desc:'Alto valor proteico.', category:'organicos' },

  // LÁCTEOS
  { id:'leche-entera',  name:'Leche Entera',  unit:'1 litro',   price:1200, img:'img/leche.jpg',       desc:'Ideal para desayunos.', category:'lacteos' },
];

/* Helpers */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const fmtCLP = n => n.toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 });

/* ===========================
   Render del detalle de producto
   =========================== */
function renderProductDetail(id){
  const view  = $('#productView');
  const extra = $('#productExtra');
  const bc    = $('#bcName');
  const errEl = $('#prodError');
  if (!view) return;

  if (!id) {
    view.innerHTML = `<p>Falta el parámetro <code>?id=</code> en la URL. <a href="index.html#frutas">Volver al catálogo</a></p>`;
    if (extra) extra.innerHTML = '';
    if (errEl) errEl.textContent = 'Falta ?id= en la URL.';
    return;
  }

  const prod = CATALOG.find(p => p.id === id);
  if (!prod){
    view.innerHTML = `<p>Producto <b>${id}</b> no encontrado. <a href="index.html#frutas">Volver al catálogo</a></p>`;
    if (extra) extra.innerHTML = '';
    if (errEl) errEl.textContent = `Producto "${id}" no existe en el catálogo.`;
    return;
  }

  if (errEl) errEl.textContent = '';

  document.title = `${prod.name} – Huerto Hogar`;
  if (bc) bc.textContent = prod.name;

  const bcCat = document.querySelector('.breadcrumb a[href="index.html#frutas"]');
  if (bcCat && prod.category) {
    bcCat.href = `index.html#${prod.category}`;
    bcCat.textContent = prod.category.charAt(0).toUpperCase() + prod.category.slice(1);
  }

  view.innerHTML = `
    <div class="media">
      <img src="${prod.img}" alt="${prod.name}">
    </div>
    <div class="info">
      <h1>${prod.name}</h1>
      <p class="unit">${prod.unit || ''}</p>
      <p class="price">${fmtCLP(prod.price)}</p>

      <div class="qty">
        <button type="button" data-q="-1" aria-label="Disminuir cantidad">-</button>
        <input id="qtyInput" type="number" value="1" min="1" inputmode="numeric" aria-label="Cantidad">
        <button type="button" data-q="1" aria-label="Aumentar cantidad">+</button>
      </div>

      <button class="btn-primary" id="addBtn">Agregar al carrito</button>

      <p class="desc">${prod.desc || ''}</p>
    </div>
  `;

  const qty = $('#qtyInput');
  $$('.qty button', view).forEach(b=>{
    b.addEventListener('click', ()=>{
      const d = parseInt(b.dataset.q,10);
      let v = Math.max(1, (parseInt(qty.value,10)||1) + d);
      qty.value = v;
    });
  });
  qty.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#addBtn')?.click();
    }
  });

  $('#addBtn')?.addEventListener('click', ()=>{
    const q = Math.max(1, parseInt(qty.value,10)||1);
    Cart.add(prod.id, q);
    alert(`${prod.name} x${q} agregado al carrito`);
  });

  if (extra){
    const related = CATALOG
      .filter(p => p.category === prod.category && p.id !== prod.id)
      .slice(0,6);

    extra.innerHTML = related.length ? `
      <h3>También te puede interesar</h3>
      <div class="related">
        ${related.map(r => `
          <a class="mini" href="producto.html?id=${r.id}">
            <img src="${r.img}" alt="${r.name}">
            <div class="t">${r.name}</div>
            <div class="p">${fmtCLP(r.price)}</div>
          </a>`).join('')}
      </div>` : '';
  }
}

/* ===========================
   Auto-init en producto.html
   =========================== */
document.addEventListener('DOMContentLoaded', ()=>{
  const view = document.getElementById('productView');
  if (!view) return;
  const id = new URLSearchParams(location.search).get('id') || '';
  renderProductDetail(id.trim());
});
