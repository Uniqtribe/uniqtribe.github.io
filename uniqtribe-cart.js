const cartItemElements = document.querySelectorAll('[data-cart-item]');
const checkoutItemElements = document.querySelectorAll('[data-zs-checkout-cart-item]');



if (cartItemElements.length > 0) {
    generateTemplate(cartItemElements);
}
else if (checkoutItemElements.length > 0) {
    generateTemplate(checkoutItemElements);
}

function generateTemplate(cartElements) {
    cartElements.forEach(cartItem => {

        /* -------------------------------
           1. Hide raw data + disable qty
        -------------------------------- */
        const ul = cartItem.querySelector('ul');
        if (ul) ul.style.display = 'none';

        cartItem.querySelectorAll('.theme-cart-qty-inc-dec').forEach(btn => {
            btn.disabled = true;
        });

        const qtyInput = cartItem.querySelector('[data-zs-quantity]');
        if (qtyInput) qtyInput.disabled = true;

        /* -------------------------------
           2. Extract source + patterns
        -------------------------------- */
        const liElements = cartItem.querySelectorAll('li');
        let source = null;
        let patternList = [];

        liElements.forEach(li => {
            const text = li.textContent.trim();

            if (text.startsWith('source:')) {
                try {
                    source = JSON.parse(li.querySelector('span').textContent.trim());
                } catch (e) {
                    source = null;
                }
            }

            if (text.startsWith('selection')) {
                patternList.push(li.querySelector('span').textContent.trim());
            }
        });

        if (!source || patternList.length === 0) return;

        /* -------------------------------
           3. Trial pack image override
        -------------------------------- */
        const link = cartItem.querySelector('.theme-cart-item-info a');
        if (link && link.textContent.includes('Trial Pack') && source.url) {
            const img = cartItem.querySelector('.theme-cart-item-img img');
            if (img) img.src = source.url;
        }

        /* -------------------------------
           4. Prevent duplicate rendering
        -------------------------------- */
        if (cartItem.querySelector('.custom-pattern-strip')) return;

        /* -------------------------------
           5. Create STRIP container
        -------------------------------- */
        const strip = document.createElement('div');
        strip.className = 'custom-pattern-strip';
        strip.style.display = 'flex';
        strip.style.gap = '8px';
        strip.style.marginTop = '10px';
        strip.style.flexWrap = 'nowrap';
        strip.style.overflowX = 'auto';

        const baseImg = cartItem.querySelector('.theme-cart-item-img img')?.src;

        /* -------------------------------
           6. Render ONE canvas per pattern
        -------------------------------- */
        patternList.forEach(pattern => {
            const canvas = createCanvas(pattern, baseImg, JSON.stringify(source));
            canvas.style.borderRadius = '6px';
            canvas.style.border = '1px solid #ddd';
            strip.appendChild(canvas);
        });

        /* -------------------------------
           7. Add summary text
        -------------------------------- */
        const summary = document.createElement('div');
        summary.style.marginTop = '6px';
        summary.style.fontSize = '13px';
        summary.style.color = '#555';
        summary.innerHTML = `
            <strong>Custom Nail Set</strong><br>
            ${patternList.length} press-on nails included
        `;

        /* -------------------------------
           8. Inject into cart UI
        -------------------------------- */
        const infoDiv = cartItem.querySelector('.theme-cart-item-info');
        if (infoDiv) {
            infoDiv.appendChild(strip);
            infoDiv.appendChild(summary);
        }
    });
}


function createCanvas(pattern, baseImage, source) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 75;
    canvas.height = 75;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high"; // You can use "low", "medium", or "high"

    const img = new Image();
    img.src = baseImage;
    img.onload = function () {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        processImageData(context, pattern, source);
    };
    return canvas;
}

function processImageData(context, pattern, source) {
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const data = imgData.data;
    const dominantColor = convertHexArrayToRgbArray(JSON.parse(source).source);
    const changeColorArray = convertHexArrayToRgbArray((JSON.parse(pattern)).selected);
    for (let j = 0; j < data.length; j += 4) {
        const [r, g, b] = [data[j], data[j + 1], data[j + 2]];
        const closestColorIndex = findClosestColorIndex(r, g, b, dominantColor);
        if (closestColorIndex !== -1) {
            const toColor = changeColorArray[closestColorIndex];
            const newColor = applyDirectionToColor(toColor, {
                r: r - dominantColor[closestColorIndex].r,
                g: g - dominantColor[closestColorIndex].g,
                b: b - dominantColor[closestColorIndex].b,
            });
            data[j] = newColor.r;
            data[j + 1] = newColor.g;
            data[j + 2] = newColor.b;
        }
    }
    context.putImageData(imgData, 0, 0);
}
function convertHexArrayToRgbArray(hexArray) {
    return hexArray.map(hex => hexToRgb(hex)); // Map hex array to RGB objects
}

function hexToRgb(hex) {
    // Remove the '#' if present
    hex = hex.replace(/^#/, '');

    // Parse the hex string to RGB values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return {
        r,
        g,
        b
    };
}

function findClosestColorIndex(r, g, b, dominantColors) {
    let closestColorIndex = -1;
    let smallestDiff = Infinity;
    dominantColors.forEach((color, index) => {
        const diff = Math.abs(r - color.r) + Math.abs(g - color.g) + Math.abs(b - color.b);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestColorIndex = index;
        }
    });
    return closestColorIndex;
}

function applyDirectionToColor(toColor, direction) {

    const newColor = {
        r: toColor.r + direction.r,
        g: toColor.g + direction.g,
        b: toColor.b + direction.b
    };
    return {
        r: Math.min(255, Math.max(0, Math.round(newColor.r))),
        g: Math.min(255, Math.max(0, Math.round(newColor.g))),
        b: Math.min(255, Math.max(0, Math.round(newColor.b)))
    };
}
