/* =========================================================
   CART CUSTOM NAIL RENDERER (FINAL)
   ========================================================= */

const cartItemElements = document.querySelectorAll('[data-cart-item]');
const checkoutItemElements = document.querySelectorAll('[data-zs-checkout-cart-item]');

if (cartItemElements.length > 0) {
  generateTemplate(cartItemElements);
} else if (checkoutItemElements.length > 0) {
  generateTemplate(checkoutItemElements);
}

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

  // fallback background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, 75, 75);

  if (!pattern.textureId) return canvas;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = pattern.textureId;

  img.onload = () => {
    ctx.drawImage(img, 0, 0, 75, 75);

    if (typeof pattern.hue === 'number') {
      applyHueShift(ctx, pattern.hue);
    }
  };

  return canvas;
}

/* =========================================================
   HUE SHIFT (SAME LOGIC AS STUDIO)
   ========================================================= */

function applyHueShift(ctx, hue) {
  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imgData.data;

  const color = new THREE.Color();
  const hsl = {};

  for (let i = 0; i < data.length; i += 4) {
    color.setRGB(
      data[i] / 255,
      data[i + 1] / 255,
      data[i + 2] / 255
    );

    color.getHSL(hsl);

    // preserve whites / highlights
    if (hsl.l > 0.9 && hsl.s < 0.15) continue;

    hsl.h = hue / 360;
    hsl.s = 0.9;

    color.setHSL(hsl.h, hsl.s, hsl.l);

    data[i]     = color.r * 255;
    data[i + 1] = color.g * 255;
    data[i + 2] = color.b * 255;
  }

  ctx.putImageData(imgData, 0, 0);
}
