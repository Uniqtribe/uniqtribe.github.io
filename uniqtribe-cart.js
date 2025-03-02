    const cartItemElements = document.querySelectorAll('[data-cart-item]');


    if (cartItemElements) {
        cartItemElements.forEach(cartItem => {
            const liElements = cartItem.querySelectorAll("li");
            let patternList = [];
            let source = '';
            liElements.forEach(li => {
                if (li.textContent.trim().startsWith("source:")) {
                    source = li.querySelector("span").textContent.trim();
                    cartItem.querySelector('ul').style.display = 'none';
                    cartItem.querySelectorAll('.theme-cart-qty-inc-dec').forEach(item => {
                        item.disabled = true;
                    });
                    cartItem.querySelector('[data-zs-quantity]').disabled = true;
                }
                if(li.textContent.trim().startsWith("target:") || li.textContent.trim().startsWith("selection")){
                    patternList.push(li.querySelector("span").textContent.trim());
                }
            });
            console.log("source", source);
            patternList.forEach(pattern => {
                const canvas = createCanvas(pattern, cartItem.querySelector('img[alt="base-image"]').src, source);
                cartItem.appendChild(canvas);
            });
        })
    }


function createCanvas(pattern, baseImage, source) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 150;
    canvas.height = 150;

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

function processImageData(context, pattern,source) {
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