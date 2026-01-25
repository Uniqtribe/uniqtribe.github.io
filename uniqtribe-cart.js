/* =========================================================
   CART CUSTOM NAIL RENDERER (FINAL)
   ========================================================= */
window.addEventListener("load", () => {
  // Zoho injects cart HTML AFTER load
  setTimeout(() => {

    const cartItemElements =
      document.querySelectorAll('[data-cart-item]');
    const checkoutItemElements =
      document.querySelectorAll('[data-zs-checkout-cart-item]');

    console.log("🛒 Cart items found:", cartItemElements.length);

    if (cartItemElements.length > 0) {
      generateTemplate(cartItemElements);
    } else if (checkoutItemElements.length > 0) {
      generateTemplate(checkoutItemElements);
    } else {
      console.warn("❌ No cart items found");
    }

  }, 800); // 🔑 THIS DELAY IS CRITICAL
});

function generateTemplate(cartElements) {
  cartElements.forEach(cartItem => {

    /* --------------------------------
       1. Hide raw custom fields
    -------------------------------- */
    const ul = cartItem.querySelector('ul');
    if (ul) ul.style.display = 'none';

    cartItem.querySelectorAll('.theme-cart-qty-inc-dec').forEach(btn => {
      btn.disabled = true;
    });

    const qtyInput = cartItem.querySelector('[data-zs-quantity]');
    if (qtyInput) qtyInput.disabled = true;

    /* --------------------------------
       2. Extract selections
    -------------------------------- */
    const liElements = cartItem.querySelectorAll('li');
    const patterns = [];

    liElements.forEach(li => {
      const text = li.textContent.trim();
      if (!text.startsWith('selection')) return;

      try {
        const json = JSON.parse(li.querySelector('span').textContent.trim());
        patterns.push(json);
      } catch (e) {
        console.warn('Invalid selection JSON', e);
      }
    });

    if (!patterns.length) return;

    /* --------------------------------
       3. Prevent duplicate rendering
    -------------------------------- */
    if (cartItem.querySelector('.custom-pattern-strip')) return;

    /* --------------------------------
       4. Create strip container
    -------------------------------- */
    const strip = document.createElement('div');
    strip.className = 'custom-pattern-strip';
    strip.style.display = 'flex';
    strip.style.gap = '8px';
    strip.style.marginTop = '10px';
    strip.style.flexWrap = 'nowrap';
    strip.style.overflowX = 'auto';

    /* --------------------------------
       5. Render canvases
    -------------------------------- */
    patterns.forEach(pattern => {
      const canvas = createNailCanvas(pattern);
      strip.appendChild(canvas);
    });

    /* --------------------------------
       6. Summary text
    -------------------------------- */
    const summary = document.createElement('div');
    summary.style.marginTop = '6px';
    summary.style.fontSize = '13px';
    summary.style.color = '#555';
    summary.innerHTML = `
      <strong>Custom Nail Set</strong><br>
      ${patterns.length} press-on nails included
    `;

    /* --------------------------------
       7. Inject into cart UI
    -------------------------------- */
    const infoDiv = cartItem.querySelector('.theme-cart-item-info');
    if (infoDiv) {
      infoDiv.appendChild(strip);
      infoDiv.appendChild(summary);
    }
  });
}

/* =========================================================
   CANVAS RENDERING
   ========================================================= */

function createNailCanvas(pattern) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 75;
  canvas.height = 75;

  // background so canvas isn't transparent
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, 75, 75);

  if (!pattern.textureId) return canvas;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    ctx.clearRect(0, 0, 75, 75);
    ctx.drawImage(img, 0, 0, 75, 75);

    if (typeof pattern.hue === 'number') {
      applyHueShift(ctx, pattern.hue);
    }
  };

  img.onerror = (e) => {
    console.error("❌ Pattern load failed:", pattern.textureId, e);
  };

  // 🔑 src MUST be last
  img.src = pattern.textureId;

  return canvas;
}


/* =========================================================
   HUE SHIFT (SAME LOGIC AS STUDIO)
   ========================================================= */

function applyHueShift(ctx, hueDeg) {
  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const hsl = rgbToHsl(r, g, b);

    // preserve whites / highlights
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

/* ---------- COLOR HELPERS ---------- */

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
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
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

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r, g, b };
}

