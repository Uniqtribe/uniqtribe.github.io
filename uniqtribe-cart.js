/* =========================================================
   CART CUSTOM NAIL RENDERER — FINAL STABLE VERSION
   ========================================================= */

(function () {

  /* ---------------------------------------------------------
     1️⃣ WAIT FOR ZOHO CART DOM (POLLING – REQUIRED)
  --------------------------------------------------------- */
  window.addEventListener("load", () => {
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;

      const cartItems = document.querySelectorAll(
        '[data-cart-items] .theme-cart-table-row[data-zs-product-id]'
      );

      console.log("🛒 Cart poll", attempts, "items:", cartItems.length);

      if (cartItems.length > 0) {
        clearInterval(timer);
        generateTemplate(cartItems);
      }

      if (attempts > 25) {
        clearInterval(timer);
        console.error("❌ Cart items never appeared");
      }
    }, 300);
  });

  /* ---------------------------------------------------------
     2️⃣ MAIN RENDER FUNCTION
  --------------------------------------------------------- */
  function generateTemplate(cartElements) {
    console.log("🔥 generateTemplate running on", cartElements.length, "items");

    cartElements.forEach(cartItem => {

      /* Hide raw custom data */
      const ul = cartItem.querySelector('ul');
      if (ul) ul.style.display = 'none';

      cartItem.querySelectorAll('.theme-cart-qty-inc-dec').forEach(btn => {
        btn.disabled = true;
      });

      const qtyInput = cartItem.querySelector('[data-zs-quantity]');
      if (qtyInput) qtyInput.disabled = true;

      /* --------------------------------
         Extract selection JSON
      -------------------------------- */
      const liElements = cartItem.querySelectorAll('li');
      const patterns = [];

      liElements.forEach(li => {
        const text = li.textContent.trim();
        if (!text.startsWith('selection')) return;

        try {
          const obj = JSON.parse(li.querySelector('span').textContent.trim());
          patterns.push(obj);
        } catch (e) {
          console.error("❌ Invalid JSON", e);
        }
      });

      if (!patterns.length) {
        console.warn("⚠️ No patterns found");
        return;
      }

      /* Prevent duplicate render */
      if (cartItem.querySelector('.custom-pattern-strip')) return;

      /* --------------------------------
         Create strip
      -------------------------------- */
      const strip = document.createElement('div');
      strip.className = 'custom-pattern-strip';
      strip.style.display = 'flex';
      strip.style.gap = '8px';
      strip.style.marginTop = '10px';
      strip.style.overflowX = 'auto';
      strip.style.flexWrap = 'nowrap';

      /* --------------------------------
         Render canvases
      -------------------------------- */
      patterns
        .sort((a, b) => a.slot - b.slot)
        .forEach(pattern => {
          const canvas = createNailCanvas(pattern);
          strip.appendChild(canvas);
        });

      /* --------------------------------
         Summary
      -------------------------------- */
      const summary = document.createElement('div');
      summary.style.marginTop = '6px';
      summary.style.fontSize = '13px';
      summary.style.color = '#555';
      summary.innerHTML = `
        <strong>Custom Nail Set</strong><br>
        ${patterns.length} press-on nails included
      `;

      const infoDiv = cartItem.querySelector('.theme-cart-item-info');
      if (infoDiv) {
        infoDiv.appendChild(strip);
        infoDiv.appendChild(summary);
      }
    });
  }

  /* ---------------------------------------------------------
     3️⃣ CANVAS RENDERER
  --------------------------------------------------------- */
  function createNailCanvas(pattern) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 75;
    canvas.height = 75;

    // placeholder
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, 75, 75);

    console.log("🎨 Pattern:", pattern);

    if (!pattern.textureId) return canvas;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      console.log("✅ IMAGE LOADED:", img.src);
      ctx.clearRect(0, 0, 75, 75);
      ctx.drawImage(img, 0, 0, 75, 75);

      if (typeof pattern.hue === 'number') {
        applyHueShift(ctx, pattern.hue);
      }
    };

    img.onerror = e => {
      console.error("❌ IMAGE FAILED:", pattern.textureId, e);
    };

    console.log("🌐 setting src:", pattern.textureId);
    img.src = pattern.textureId;

    return canvas;
  }

  /* ---------------------------------------------------------
     4️⃣ PURE CANVAS HUE SHIFT
  --------------------------------------------------------- */
  function applyHueShift(ctx, hueDeg) {
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const hsl = rgbToHsl(r, g, b);

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

})();
