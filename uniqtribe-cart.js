/* =========================================================
   ZOHO CART – CUSTOM NAIL RENDERER
   OPTION A: CLOUDFLARE WORKER PROXY
   ========================================================= */

(function () {

  const rendered = new WeakSet();

  /* ---------------------------------------------------------
     WAIT & OBSERVE CART (ZOHO RE-RENDERS DOM)
  --------------------------------------------------------- */
  function observeCart() {
    const cartRoot = document.querySelector('[data-cart-items]');
    if (!cartRoot) return;

    const observer = new MutationObserver(renderAllCartItems);
    observer.observe(cartRoot, { childList: true, subtree: true });

    renderAllCartItems();
  }

  /* ---------------------------------------------------------
     RENDER ALL CART ITEMS
  --------------------------------------------------------- */
  function renderAllCartItems() {
    document
      .querySelectorAll('[data-cart-items] .theme-cart-table-row[data-zs-product-id]')
      .forEach(renderItem);
  }

  /* ---------------------------------------------------------
     RENDER SINGLE ITEM (SAFE + IDEMPOTENT)
  --------------------------------------------------------- */
  function renderItem(cartItem) {
    if (rendered.has(cartItem)) return;

    const liElements = cartItem.querySelectorAll('li');
    const patterns = [];

    liElements.forEach(li => {
      const text = li.textContent.trim();
      if (!text.startsWith('selection')) return;

      try {
        patterns.push(JSON.parse(li.querySelector('span').textContent.trim()));
      } catch (e) {
        console.warn('Invalid selection JSON', e);
      }
    });

    if (!patterns.length) return;

    /* Hide raw data */
    const ul = cartItem.querySelector('ul');
    if (ul) ul.style.display = 'none';

    /* Remove previous render (Zoho safety) */
    cartItem.querySelectorAll('.custom-pattern-strip').forEach(e => e.remove());

    /* Build strip */
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
     CANVAS RENDER (USES PROXY – NO BASE64)
  --------------------------------------------------------- */
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

      if (typeof pattern.hue === 'number') {
        applyHueShift(ctx, pattern.hue);
      }
    };

    img.onerror = () => {
      console.error('❌ Proxy image failed:', pattern.patternId);
    };

    /* 🔑 SAME-ORIGIN PROXY (CSP SAFE) */
    img.src = `/pattern-proxy/${pattern.patternId}`;

    return canvas;
  }

  /* ---------------------------------------------------------
     OPTIONAL: HUE SHIFT (MATCHES STUDIO LOGIC)
  --------------------------------------------------------- */
  function applyHueShift(ctx, hueDeg) {
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const hsl = rgbToHsl(r, g, b);

      // keep highlights
      if (hsl.l > 0.9 && hsl.s < 0.15) continue;

      hsl.h = hueDeg / 360;
      hsl.s = 0.9;

      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

      data[i]     = rgb.r * 255;
      data[i + 1] = rgb.g * 255;
      data[i + 2] = rgb.b * 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    if (s === 0) return { r: l, g: l, b: l };

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3)
    };
  }

  /* ---------------------------------------------------------
     BOOTSTRAP
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
