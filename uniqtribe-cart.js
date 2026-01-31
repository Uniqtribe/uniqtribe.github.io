
<style>
/* ------------------------------
   GLOBAL
------------------------------ */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  background: #f7f7f7;
}

.cart-wrapper {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
  background: #fff;
}

/* ------------------------------
   DESKTOP CART LAYOUT
------------------------------ */
.theme-cart-table-row {
  display: grid;
  grid-template-columns: 90px 1fr 120px 120px;
  gap: 15px;
  padding: 18px 0;
  border-bottom: 1px solid #eee;
  align-items: start;
}

.theme-cart-item-image img {
  width: 80px;
  border-radius: 6px;
}

/* info column */
.theme-cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-cart-item-title {
  font-weight: 600;
}

.theme-cart-item-price {
  color: #555;
}

/* remove button */
.theme-cart-item-remove {
  margin-top: 8px;
  background: #eee;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
}

/* quantity column */
.theme-cart-item-qty {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* amount */
.theme-cart-item-amount {
  text-align: right;
  font-weight: bold;
  font-size: 16px;
}

/* pattern preview */
.custom-pattern-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-top: 6px;
}

.custom-pattern-strip canvas {
  border-radius: 4px;
}

/* ------------------------------
   MOBILE RESPONSIVE
------------------------------ */
@media (max-width: 768px) {

  .theme-cart-table-row {
    grid-template-columns: 70px 1fr;
    grid-template-rows: auto auto auto;
    gap: 10px;
  }

  .theme-cart-item-amount {
    text-align: left;
  }

  .theme-cart-item-qty {
    justify-content: flex-start;
  }

  .theme-cart-item-remove {
    width: fit-content;
  }
}
</style>
</head>

<body>

<div class="cart-wrapper">
  <!-- Zoho injects cart items here -->
  <div data-cart-items></div>
</div>

<script>
/* =========================================================
   CUSTOM PATTERN RENDERER
========================================================= */
(function () {

  const rendered = new WeakSet();

  function observeCart() {
    const cartRoot = document.querySelector('[data-cart-items]');
    if (!cartRoot) return;

    const observer = new MutationObserver(renderAll);
    observer.observe(cartRoot, { childList: true, subtree: true });

    renderAll();
  }

  function renderAll() {
    document
      .querySelectorAll('[data-cart-items] .theme-cart-table-row[data-zs-product-id]')
      .forEach(renderItem);
  }

  function renderItem(cartItem) {
    if (rendered.has(cartItem)) return;

    const patterns = [];

    cartItem.querySelectorAll('li').forEach(li => {
      const text = li.textContent.trim();
      if (!text.startsWith('selection')) return;

      try {
        patterns.push(JSON.parse(li.querySelector('span').textContent.trim()));
      } catch {}
    });

    if (!patterns.length) return;

    const ul = cartItem.querySelector('ul');
    if (ul) ul.style.display = 'none';

    cartItem.querySelectorAll('.custom-pattern-strip').forEach(e => e.remove());

    const strip = document.createElement('div');
    strip.className = 'custom-pattern-strip';

    patterns
      .sort((a, b) => a.slot - b.slot)
      .forEach(p => strip.appendChild(createCanvas(p)));

    const info = cartItem.querySelector('.theme-cart-item-info');
    if (info) info.appendChild(strip);

    rendered.add(cartItem);
  }

  function createCanvas(pattern) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 75;
    canvas.height = 75;

    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, 75, 75);

    if (!pattern.patternId) return canvas;

    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, 75, 75);
      ctx.drawImage(img, 0, 0, 75, 75);
    };

    img.src = `/pattern-proxy/${pattern.patternId}`;

    return canvas;
  }

  window.addEventListener('load', () => {
    const wait = setInterval(() => {
      if (document.querySelector('[data-cart-items]')) {
        clearInterval(wait);
        observeCart();
      }
    }, 300);
  });

})();
</script>

