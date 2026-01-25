/* =========================================================
   ZOHO CART – CUSTOM NAIL RENDERER (FINAL REAL FIX)
   ========================================================= */

(function () {

  let rendered = new WeakSet();

  /* ---------------------------------------------------------
     OBSERVE CART CHANGES (MANDATORY FOR ZOHO)
  --------------------------------------------------------- */
  function observeCart() {
    const cartRoot = document.querySelector('[data-cart-items]');
    if (!cartRoot) return;

    const observer = new MutationObserver(() => {
      renderAllCartItems();
    });

    observer.observe(cartRoot, {
      childList: true,
      subtree: true
    });

    // initial render
    renderAllCartItems();
  }

  /* ---------------------------------------------------------
     FIND & RENDER ALL ITEMS
  --------------------------------------------------------- */
  function renderAllCartItems() {
    const items = document.querySelectorAll(
      '[data-cart-items] .theme-cart-table-row[data-zs-product-id]'
    );

    items.forEach(renderItem);
  }

  /* ---------------------------------------------------------
     RENDER ONE ITEM (IDEMPOTENT)
  --------------------------------------------------------- */
  function renderItem(cartItem) {
    if (rendered.has(cartItem)) return;

    const liElements = cartItem.querySelectorAll('li');
    const patterns = [];

    liElements.forEach(li => {
      if (!li.textContent.trim().startsWith('selection')) return;
      try {
        patterns.push(
          JSON.parse(li.querySelector('span').textContent.trim())
        );
      } catch {}
    });

    if (!patterns.length) return;

    // hide raw fields
    const ul = cartItem.querySelector('ul');
    if (ul) ul.style.display = 'none';

    // remove old strip if any (Zoho re-render safety)
    cartItem.querySelectorAll('.custom-pattern-strip').forEach(e => e.remove());

    const strip = document.createElement('div');
    strip.className = 'custom-pattern-strip';
    strip.style.display = 'flex';
    strip.style.gap = '8px';
    strip.style.marginTop = '10px';
    strip.style.overflowX = 'auto';

    patterns
      .sort((a, b) => a.slot - b.slot)
      .forEach(p => strip.appendChild(createCanvas(p)));

    const info = cartItem.querySelector('.theme-cart-item-info');
    if (info) info.appendChild(strip);

    rendered.add(cartItem);
  }

  /* ---------------------------------------------------------
     CANVAS DRAW
  --------------------------------------------------------- */
  function createCanvas(pattern) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.width = 75;
    c.height = 75;

    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, 75, 75);

    if (!pattern.textureId) return c;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, 75, 75);
      ctx.drawImage(img, 0, 0, 75, 75);
    };

    img.src = pattern.textureId;
    return c;
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  window.addEventListener('load', () => {
    const wait = setInterval(() => {
      if (document.querySelector('[data-cart-items]')) {
        clearInterval(wait);
        observeCart();
      }
    }, 300);
  });

})();
