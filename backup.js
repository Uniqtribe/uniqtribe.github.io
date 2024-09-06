<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

<script>
    function loadPage() {

const variantRows = document.querySelectorAll('.theme-product-varients-row');

for (let i = 0; i < variantRows.length; i++) {
    const row = variantRows[i];
    const label = row.querySelector('.theme-product-variant-label.theme-custom-field-label');
    if (label?.textContent.trim() === 'Config') {
        row.classList.add('hidden');
        break; // Exit early if only one match is needed
    }
}

// Get the inner text from the span element
const spanText = document.querySelector('.theme-custom-field-value').textContent.trim();

// Convert the text to a JSON object
let configObject;
try {
    configObject = JSON.parse(spanText);
} catch (error) {
    console.error("Invalid JSON:", error);
}
const container = document.querySelector('.theme-custom-field-main-container');

// Insert the HTML content efficiently without replacing the entire innerHTML
container.insertAdjacentHTML('afterbegin', `
<div class="customColorPickerPalette">
  <div class="theme-product-variant-label theme-custom-field-label customColorPickerPalette" data-zs-customfield-label=""> 
    Color <span class="theme-custom-mandatory-field"> * </span>
  </div>
  <div class='theme-product-varients-dynamic-selector'>
    <canvas id="canvas" style='width:250px;height:250px'></canvas>
    <div id="colorControls"></div>
    <div id="toColorSwatches"></div>
    <div class="custom-color-picker" style="display: none;" id="customColorPicker">
      <div class="sectionSelector" id="sectionSelector"></div>
      <label class="switch">
        <input type="checkbox" id="paletteToggle">
        <span class="slider"></span>
      </label>
      <div class="palette" id="palette" style="display: flex;"></div>
      <div class="palette2" id="palette2" style="display: none; flex; gap: 10px;">
        <canvas id="canvas2"></canvas>
        <div id="selectedColor"></div>
        <p id="colorCode"></p>
        <div id="arrow-controls">
          <div class="arrow-button" id="up">↑</div><br>
          <div class="arrow-button" id="left">←</div>
          <div class="arrow-button" id="down">↓</div>
          <div class="arrow-button" id="right">→</div>
        </div>
      </div>
      <div id="color-display" style='display:none'>Selected Color: None</div>
    </div>
  </div>
</div>
`);

// Cache the necessary container elements
const productDetailImageContainer = document.querySelector('.theme-product-detail-image-container');
const productDetailImage = document.querySelector('.theme-product-detail-image');

// Create a DocumentFragment to minimize reflows and repaints
const fragment = document.createDocumentFragment();

// Create canvas container
const canvasContainer = document.createElement('div');
canvasContainer.id = 'canvas-container';
fragment.appendChild(canvasContainer);

// Create image gallery container
const imageGallery = document.createElement('div');
imageGallery.id = 'image-gallery';
fragment.appendChild(imageGallery);

// Append all created elements to the DOM at once
productDetailImageContainer.appendChild(fragment);
productDetailImage.appendChild(canvasContainer);


// Cache the canvas and image elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const imgElement = document.querySelector('img[alt="base-image"]');

// Create and load the image asynchronously
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

// Use async/await for better structure
(async () => {
  try {
    // Load the image
    const img1 = await loadImage(imgElement.src);
    originalImage = img1;
    
    // Draw the image using requestAnimationFrame for optimized rendering
    requestAnimationFrame(() => drawImage(img1));
  } catch (error) {
    console.error("Image loading failed", error);
  }
})();


// Cache selectors to avoid repeated DOM queries
const imageGallery2 = document.querySelector('#image-gallery');
const displayDiv = document.querySelector('.theme-product-detail-image');
//const canvasContainer = displayDiv.querySelector('#canvas-container');

// Helper function to handle image click events
const handleImageClick = (imgElement, imageUrl) => {
    imgElement.addEventListener('click', () => {
        // Hide canvas container and remove all images in the display div
        canvasContainer.style.display = 'none';
        displayDiv.querySelectorAll('img').forEach(img => img.remove());

        // Create and append the new image
        const displayImgElement = document.createElement('img');
        displayImgElement.src = imageUrl;
        displayImgElement.alt = "Selected Image";
        displayDiv.append(displayImgElement);
    });
};

// Handle base image element
const baseImgElement = document.querySelector('img[alt="base-image"]');
imageGallery2.append(baseImgElement);

baseImgElement.addEventListener('click', () => {
    // Remove all images and show the canvas container
    displayDiv.querySelectorAll('img').forEach(img => img.remove());
    canvasContainer.style.display = 'block';
});

// Iterate over common images and set up their elements and events
configObject.commonImages.forEach(imageUrl => {
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.alt = "Common Image";

    // Append the image element to the gallery
    imageGallery.append(imgElement);

    // Attach the click handler
    handleImageClick(imgElement, imageUrl);
});


      // Cache DOM elements to reduce repeated queries
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d', {
    willReadFrequently: true
});
const paletteToggle = document.getElementById('paletteToggle');
const palette1 = document.getElementById('palette');
const palette2 = document.getElementById('palette2');
const selectedColorDiv = document.getElementById('selectedColor');
const colorCodeText = document.getElementById('colorCode');
const colorControlsContainer = document.getElementById('colorControls');
const toColorSwatchesContainer = document.getElementById('toColorSwatches');
const customColorPicker = document.getElementById('customColorPicker');

// Set up initial canvas properties
canvas2.width = 300;
canvas2.height = 150;

let isDragging = false;
let currentX = 150;
let currentY = 75;
let intervalId = null;
let originalImage = null;
let imageData = null;
let swatches = [];

// Toggle palette visibility based on checkbox state
paletteToggle.addEventListener('change', () => {
    const showPalette2 = paletteToggle.checked;
    palette1.style.display = showPalette2 ? 'none' : 'flex';
    palette2.style.display = showPalette2 ? 'flex' : 'none';
});



        const colors = [{
                "name": "Black",
                "hex": "#000000"
            }, {
                "name": "DarkSlateGray",
                "hex": "#2f4f4f"
            }, {
                "name": "SlateGray",
                "hex": "#708090"
            }, {
                "name": "LightSlateGray",
                "hex": "#778899"
            }, {
                "name": "Gray",
                "hex": "#808080"
            }, {
                "name": "DimGray",
                "hex": "#696969"
            }, {
                "name": "DarkGray",
                "hex": "#a9a9a9"
            }, {
                "name": "Silver",
                "hex": "#c0c0c0"
            }, {
                "name": "LightGray",
                "hex": "#d3d3d3"
            }, {
                "name": "Gainsboro",
                "hex": "#dcdcdc"
            },

            {
                "name": "MistyRose",
                "hex": "#ffe4e1"
            }, {
                "name": "LavenderBlush",
                "hex": "#fff0f5"
            }, {
                "name": "Linen",
                "hex": "#faf0e6"
            }, {
                "name": "AntiqueWhite",
                "hex": "#faebd7"
            }, {
                "name": "Ivory",
                "hex": "#fffff0"
            }, {
                "name": "FloralWhite",
                "hex": "#fffaf0"
            }, {
                "name": "OldLace",
                "hex": "#fdf5e6"
            }, {
                "name": "Beige",
                "hex": "#f5f5dc"
            }, {
                "name": "Seashell",
                "hex": "#fff5ee"
            }, {
                "name": "WhiteSmoke",
                "hex": "#f5f5f5"
            }, {
                "name": "GhostWhite",
                "hex": "#f8f8ff"
            }, {
                "name": "AliceBlue",
                "hex": "#f0f8ff"
            }, {
                "name": "Azure",
                "hex": "#f0ffff"
            }, {
                "name": "MintCream",
                "hex": "#f5fffa"
            }, {
                "name": "Honeydew",
                "hex": "#f0fff0"
            }, {
                "name": "Snow",
                "hex": "#fffafa"
            }, {
                "name": "White",
                "hex": "#ffffff"
            },

            {
                "name": "Maroon",
                "hex": "#800000"
            }, {
                "name": "Brown",
                "hex": "#a52a2a"
            }, {
                "name": "Sienna",
                "hex": "#a0522d"
            }, {
                "name": "SaddleBrown",
                "hex": "#8b4513"
            }, {
                "name": "Olive",
                "hex": "#808000"
            }, {
                "name": "Chocolate",
                "hex": "#d2691e"
            }, {
                "name": "Peru",
                "hex": "#cd853f"
            }, {
                "name": "DarkGoldenrod",
                "hex": "#b8860b"
            }, {
                "name": "Goldenrod",
                "hex": "#daa520"
            }, {
                "name": "SandyBrown",
                "hex": "#f4a460"
            }, {
                "name": "RosyBrown",
                "hex": "#bc8f8f"
            }, {
                "name": "Tan",
                "hex": "#d2b48c"
            }, {
                "name": "Burlywood",
                "hex": "#deb887"
            }, {
                "name": "Wheat",
                "hex": "#f5deb3"
            }, {
                "name": "NavajoWhite",
                "hex": "#ffdead"
            }, {
                "name": "Bisque",
                "hex": "#ffe4c4"
            }, {
                "name": "BlanchedAlmond",
                "hex": "#ffebcd"
            }, {
                "name": "CornSilk",
                "hex": "#fff8dc"
            },


            {
                "name": "MidnightBlue",
                "hex": "#191970"
            }, {
                "name": "Navy",
                "hex": "#000080"
            }, {
                "name": "DarkBlue",
                "hex": "#00008b"
            }, {
                "name": "MediumBlue",
                "hex": "#0000cd"
            }, {
                "name": "Blue",
                "hex": "#0000FF"
            }, {
                "name": "RoyalBlue",
                "hex": "#4169e1"
            }, {
                "name": "DodgerBlue",
                "hex": "#1e90ff"
            }, {
                "name": "DeepSkyBlue",
                "hex": "#00bfff"
            }, {
                "name": "CornFlowerBlue",
                "hex": "#6495ed"
            }, {
                "name": "SkyBlue",
                "hex": "#87ceeb"
            }, {
                "name": "LightSkyBlue",
                "hex": "#87cefa"
            }, {
                "name": "PowderBlue",
                "hex": "#b0e0e6"
            }, {
                "name": "LightBlue",
                "hex": "#add8e6"
            }, {
                "name": "LightSteelBlue",
                "hex": "#b0c4de"
            }, {
                "name": "SteelBlue",
                "hex": "#4682b4"
            }, {
                "name": "CadetBlue",
                "hex": "#5f9ea0"
            },

            {
                "name": "DarkTurquoise",
                "hex": "#00ced1"
            }, {
                "name": "MediumTurquoise",
                "hex": "#48d1cc"
            }, {
                "name": "Turquoise",
                "hex": "#40e0d0"
            }, {
                "name": "Aquamarine",
                "hex": "#7fffd4"
            }, {
                "name": "PaleTurquoise",
                "hex": "#afeeee"
            }, {
                "name": "LightCyan",
                "hex": "#e0ffff"
            }, {
                "name": "Aqua",
                "hex": "#00ffff"
            },

            {
                "name": "Teal",
                "hex": "#008080"
            }, {
                "name": "DarkCyan",
                "hex": "#008b8b"
            }, {
                "name": "LightSeaGreen",
                "hex": "#20b2aa"
            }, {
                "name": "DarkSeaGreen",
                "hex": "#8fbc8f"
            }, {
                "name": "MediumAquamarine",
                "hex": "#66cdaa"
            }, {
                "name": "DarkOliveGreen",
                "hex": "#556b2f"
            }, {
                "name": "OliveDrab",
                "hex": "#6b8e23"
            }, {
                "name": "YellowGreen",
                "hex": "#9acd32"
            }, {
                "name": "DarkGreen",
                "hex": "#006400"
            }, {
                "name": "Green",
                "hex": "#008000"
            }, {
                "name": "ForestGreen",
                "hex": "#228b22"
            }, {
                "name": "SeaGreen",
                "hex": "#2e8b57"
            }, {
                "name": "MediumSeaGreen",
                "hex": "#3cb371"
            }, {
                "name": "SpringGreen",
                "hex": "#00ff7f"
            }, {
                "name": "MediumSpringGreen",
                "hex": "#00fa9a"
            }, {
                "name": "LightGreen",
                "hex": "#90ee90"
            }, {
                "name": "PaleGreen",
                "hex": "#98fb98"
            }, {
                "name": "LimeGreen",
                "hex": "#32cd32"
            }, {
                "name": "Lime",
                "hex": "#00FF00"
            }, {
                "name": "Lawngreen",
                "hex": "#7cfc00"
            }, {
                "name": "Chartreuse",
                "hex": "#7fff00"
            }, {
                "name": "GreenYellow",
                "hex": "#adff2f"
            },

            {
                "name": "DarkKhaki",
                "hex": "#bdb76b"
            }, {
                "name": "Khaki",
                "hex": "#f0e68c"
            }, {
                "name": "PaleGoldenRod",
                "hex": "#eee8aa"
            }, {
                "name": "PeachPuff",
                "hex": "#ffdab9"
            }, {
                "name": "Moccasin",
                "hex": "#ffe4b5"
            }, {
                "name": "PapayaWhip",
                "hex": "#ffefd5"
            }, {
                "name": "LightGoldenrodYellow",
                "hex": "#fafad2"
            }, {
                "name": "LemonChiffon",
                "hex": "#fffacd"
            }, {
                "name": "LightYellow",
                "hex": "#ffffe0"
            }, {
                "name": "Yellow",
                "hex": "#ffff00"
            }, {
                "name": "Gold",
                "hex": "#ffd700"
            },

            {
                "name": "OrangeRed",
                "hex": "#ff4500"
            }, {
                "name": "Tomato",
                "hex": "#ff6347"
            }, {
                "name": "Coral",
                "hex": "#ff7f50"
            }, {
                "name": "DarkOrange",
                "hex": "#ff8c00"
            }, {
                "name": "Orange",
                "hex": "#ffa500"
            },

            {
                "name": "DarkRed",
                "hex": "#8b0000"
            }, {
                "name": "Firebrick",
                "hex": "#b22222"
            }, {
                "name": "Red",
                "hex": "#ff0000"
            }, {
                "name": "Crimson",
                "hex": "#dc143c"
            }, {
                "name": "IndianRed",
                "hex": "#cd5c5c"
            }, {
                "name": "LightCoral",
                "hex": "#f08080"
            }, {
                "name": "DarkSalmon",
                "hex": "#e9967a"
            }, {
                "name": "Salmon",
                "hex": "#fa8072"
            }, {
                "name": "LightSalmon",
                "hex": "#ffa07a"
            },

            {
                "name": "Indigo",
                "hex": "#4b0082"
            }, {
                "name": "DarkSlateBlue",
                "hex": "#483d8b"
            }, {
                "name": "SlateBlue",
                "hex": "#6a5acd"
            }, {
                "name": "MediumSlateBlue",
                "hex": "#7b68ee"
            }, {
                "name": "MediumPurple",
                "hex": "#9370db"
            }, {
                "name": "Purple",
                "hex": "#800080"
            }, {
                "name": "DarkMagenta",
                "hex": "#8b008b"
            }, {
                "name": "BlueViolet",
                "hex": "#8a2be2"
            }, {
                "name": "DarkViolet",
                "hex": "#9400d3"
            }, {
                "name": "DarkOrchid",
                "hex": "#9932cc"
            }, {
                "name": "MediumOrchid",
                "hex": "#ba55d3"
            }, {
                "name": "Fuchsia",
                "hex": "#FF00FF"
            }, {
                "name": "Violet",
                "hex": "#ee82ee"
            }, {
                "name": "Orchid",
                "hex": "#da70d6"
            }, {
                "name": "Plum",
                "hex": "#dda0dd"
            }, {
                "name": "Thistle",
                "hex": "#d8bfd8"
            }, {
                "name": "Lavender",
                "hex": "#e6e6fa"
            },

            {
                "name": "MediumVioletRed",
                "hex": "#c71585"
            }, {
                "name": "PaleVioletRed",
                "hex": "#db7093"
            }, {
                "name": "DeepPink",
                "hex": "#ff1493"
            }, {
                "name": "HotPink",
                "hex": "#ff69b4"
            }, {
                "name": "LightPink",
                "hex": "#ffb6c1"
            }, {
                "name": "Pink",
                "hex": "#ffc0cb"
            },
        ]


        let paletteContainer = document.getElementById('palette');
        let selectedSwatch = null;
        let swatchOrder = [];
function populatePalette() {
    const fragment = document.createDocumentFragment(); // Use a document fragment to batch DOM updates

    // Populate dominant colors
    configObject.dominantColors.forEach((color, index) => {
        const sectionDiv = document.createElement('div');

        const colorDiv = document.createElement('div');
        colorDiv.style.backgroundColor = color;
        colorDiv.style.width = '25px';
        colorDiv.style.height = '25px';
        colorDiv.className = index === 0 ? 'custom-selected-color selected' : 'custom-selected-color';

        sectionDiv.appendChild(colorDiv);
        fragment.appendChild(sectionDiv);

        colorDiv.addEventListener('click', function () {
            const currentlySelected = document.querySelector('.custom-selected-color.selected');
            if (currentlySelected && currentlySelected !== colorDiv) {
                currentlySelected.classList.remove('selected');
            }
            colorDiv.classList.add('selected');

            document.querySelectorAll('.color-swatch').forEach((swatchColor) => {
                const isActive = colorDiv.style.backgroundColor === swatchColor.style.backgroundColor;
                swatchColor.className = isActive ? 'color-swatch active' : 'color-swatch';
                swatchColor.querySelector('.color-name').style.display = isActive ? 'block' : 'none';
            });

            selectColor(colorDiv.style.backgroundColor);
        });
    });

    sectionSelector.appendChild(fragment); // Append all elements in one go

    const swatchFragment = document.createDocumentFragment(); // Another fragment for swatches

    // Populate swatches
    colors.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color.hex;
        swatch.dataset.colorName = color.name;

        const nameSpan = document.createElement('div');
        nameSpan.className = 'color-name';
        nameSpan.textContent = color.name;

        swatch.appendChild(nameSpan);
        swatch.addEventListener('click', () => handleColorClick(swatch));

        swatchFragment.appendChild(swatch);
        swatchOrder.push(swatch);
    });

    // Add the color picker swatch
    const colorpicker = document.createElement('div');
    colorpicker.className = 'color-swatch custom-colors';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'color-name';
    nameSpan.textContent = 'custom';
    colorpicker.appendChild(nameSpan);

    colorpicker.addEventListener('click', () => {
        handleColorClick(colorpicker);
        openColorPicker();
    });

    swatchFragment.appendChild(colorpicker);
    swatchOrder.push(colorpicker);

    paletteContainer.appendChild(swatchFragment); // Append swatches in one go
}


      function createColorPicker() {
            const gradientH = ctx2.createLinearGradient(0, 0, canvas2.width, 0);
            gradientH.addColorStop(0, 'red');
            gradientH.addColorStop(0.16, 'orange');
            gradientH.addColorStop(0.33, 'yellow');
            gradientH.addColorStop(0.5, 'green');
            gradientH.addColorStop(0.66, 'cyan');
            gradientH.addColorStop(0.83, 'blue');
            gradientH.addColorStop(1, 'magenta');
            ctx2.fillStyle = gradientH;
            ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

            const gradientV = ctx2.createLinearGradient(0, 0, 0, canvas2.height);
            gradientV.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradientV.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
            gradientV.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
            gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx2.fillStyle = gradientV;
            ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
        }


        createColorPicker();

        canvas2.addEventListener('mousedown', startDragging);
        canvas2.addEventListener('mousemove', duringDragging);
        canvas2.addEventListener('mouseup', stopDragging);

        canvas2.addEventListener('touchstart', startDragging, { passive: true });
        canvas2.addEventListener('touchmove', duringDragging, { passive: true });
        canvas2.addEventListener('touchend', stopDragging, { passive: true });

        document.getElementById('up').addEventListener('mousedown', () => startMoving(0, -1));
        document.getElementById('down').addEventListener('mousedown', () => startMoving(0, 1));
        document.getElementById('left').addEventListener('mousedown', () => startMoving(-1, 0));
        document.getElementById('right').addEventListener('mousedown', () => startMoving(1, 0));

        document.getElementById('up').addEventListener('mouseup', stopMoving, { passive: true });
        document.getElementById('down').addEventListener('mouseup', stopMoving, { passive: true });
        document.getElementById('left').addEventListener('mouseup', stopMoving, { passive: true });
        document.getElementById('right').addEventListener('mouseup', stopMoving, { passive: true });

        document.getElementById('up').addEventListener('mouseleave', stopMoving, { passive: true });
        document.getElementById('down').addEventListener('mouseleave', stopMoving, { passive: true });
        document.getElementById('left').addEventListener('mouseleave', stopMoving, { passive: true });
        document.getElementById('right').addEventListener('mouseleave', stopMoving, { passive: true });

        function updateCustomColor() {
            const customSelectedColorsElement = document.querySelectorAll('.custom-selected-color');
            const customSelectedColorsArray = [];
            customSelectedColorsElement.forEach(s => {
                customSelectedColorsArray.push(s.style.backgroundColor);
            });

            document.querySelector('.custom-color-selector').style.backgroundImage = generateVerticalGradient(customSelectedColorsArray.map(colorObj => colorObj));

            updateColor([...new Set(document.querySelector('.custom-color-selector').style.backgroundImage.match(/rgb\((\d+, \d+, \d+)\)/g))]);
        }

        function moveSelection(dx, dy) {
            const newX = Math.round(currentX + dx);
            const newY = Math.round(currentY + dy);

            pickColor(newX, newY);
        }

        function startMoving(dx, dy) {
            moveSelection(dx, dy);
            if (intervalId) return;
            intervalId = setInterval(() => moveSelection(dx, dy), 100);
        }

       function stopMoving() {
            clearInterval(intervalId);
            intervalId = null;
        }

        function selectColor(rgb) {
            const [r, g, b] = rgb.match(/\d+/g).map(Number);

            let closestMatch = {
                x: 0,
                y: 0,
                distance: Infinity
            };

            for (let y = 0; y < canvas2.height; y++) {
                for (let x = 0; x < canvas2.width; x++) {
                    const imageData = ctx2.getImageData(x, y, 1, 1).data;

                    const distance = Math.sqrt(
                        Math.pow(imageData[0] - r, 2) +
                        Math.pow(imageData[1] - g, 2) +
                        Math.pow(imageData[2] - b, 2)
                    );

                    if (distance < closestMatch.distance) {
                        closestMatch = {
                            x,
                            y,
                            distance
                        };
                    }
                }
            }

            if (closestMatch.distance < Infinity) {
                createColorPicker();

                ctx2.beginPath();
                ctx2.arc(closestMatch.x, closestMatch.y, 5, 0, 2 * Math.PI);
                ctx2.strokeStyle = '#000';
                ctx2.lineWidth = 2;
                ctx2.stroke();
                ctx2.closePath();

                const color = `rgb(${r}, ${g}, ${b})`;
                selectedColorDiv.style.backgroundColor = color;

                currentX = closestMatch.x;
                currentY = closestMatch.y;
            }
        }



        function pickColor(x, y) {
            x = Math.round(x);
            y = Math.round(y);

            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x >= canvas2.width) x = canvas2.width - 1;
            if (y >= canvas2.height) y = canvas2.height - 1;

            createColorPicker();

            const imageData = ctx2.getImageData(x, y, 1, 1).data;
            const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;

            selectedColorDiv.style.backgroundColor = color;

            ctx2.beginPath();
            ctx2.arc(x, y, 5, 0, 2 * Math.PI);
            ctx2.strokeStyle = '#000';
            ctx2.lineWidth = 2;
            ctx2.stroke();
            ctx2.closePath();

            currentX = x;
            currentY = y;

            const selectedDiv = document.querySelector('.sectionSelector .custom-selected-color.selected');
            if (selectedDiv) {
                selectedDiv.style.backgroundColor = color;
            }

            document.querySelectorAll('.color-swatch').forEach((swatchColor) => {
                if (color === swatchColor.style.backgroundColor) {
                    swatchColor.className = 'color-swatch active';
                    swatchColor.querySelector('.color-name').style.display = 'block';
                } else {
                    swatchColor.className = 'color-swatch';
                    swatchColor.querySelector('.color-name').style.display = 'none';
                }
            });

            updateCustomColor();
        }

        function startDragging(event) {
            isDragging = true;
            updateSelection(event);
        }

        function stopMoving() {
            clearInterval(intervalId);
            intervalId = null;
        }

        function duringDragging(event) {
            if (isDragging) {
                updateSelection(event);
            }
        }

       function updateSelection(event) {
            const rect = canvas2.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            pickColor(x, y);



        }

        function stopDragging() {
            isDragging = false;
        }

        function openColorPicker() {
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.style.display = 'none';

            document.body.appendChild(colorInput);

            colorInput.click();

            colorInput.addEventListener('input', function(event) {
                const selectedColor = event.target.value;

                addColorToPalette(selectedColor);

                document.body.removeChild(colorInput);
            });
        }



        function addColorToPalette(color) {
            const paletteContainer = document.getElementById('paletteContainer');
            const newColorDiv = document.createElement('div');
            newColorDiv.className = 'color-swatch';
            newColorDiv.style.backgroundColor = color;
            paletteContainer.appendChild(newColorDiv);
        }

        function handleColorClick(swatch) {

            if (selectedSwatch && selectedSwatch !== swatch) {}

            const allSwatches = document.querySelectorAll('.color-swatch');
            allSwatches.forEach(s => {
                s.classList.remove('active');
                const colorNameElement = s.querySelector('.color-name');
                if (colorNameElement) {
                    colorNameElement.style.display = 'none';
                }
            });

            swatch.classList.add('active');

            document.getElementById('color-display').textContent = `Selected Color: ${swatch.dataset.colorName}`;

            swatch.querySelector('.color-name').style.display = 'block';


            const swatchColor = swatch.style.backgroundColor;
            const selectedDiv = document.querySelector('.sectionSelector .custom-selected-color.selected');
            if (selectedDiv) {
                selectedDiv.style.backgroundColor = swatchColor;
            }
            selectColor(swatchColor);

            updateCustomColor();
            selectedSwatch = swatch;


        }

       function moveSwatchToOriginal(swatch) {
            const originalIndex = swatchOrder.indexOf(swatch);

            paletteContainer.removeChild(swatch);

            paletteContainer.insertBefore(swatch, paletteContainer.children[originalIndex]);

            swatch.classList.remove('active');
            swatch.querySelector('.color-name').style.display = 'none';
        }

        function updateColorFromInput(input) {
            const color = input.value;
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.colorName = 'Custom Color';

            const nameSpan = document.createElement('div');
            nameSpan.className = 'color-name';
            nameSpan.textContent = 'Custom Color';

            swatch.appendChild(nameSpan);
            swatch.addEventListener('click', () => handleColorClick(swatch));
            paletteContainer.appendChild(swatch);

            swatchOrder.push(swatch);
        }

        populatePalette();


        function generateControls() {
            const sourceColors = configObject.dominantColors;
            const paletteColors = configObject.suggestedColors;

            colorControlsContainer.innerHTML = '';
            toColorSwatchesContainer.innerHTML = '';

            const sourceContainer = document.createElement('div');
            sourceContainer.className = 'colorSwatches selected';
            sourceContainer.id = `swatches-0`;

            sourceContainer.style.backgroundImage = generateVerticalGradient(sourceColors.map(colorObj => colorObj));
            toColorSwatchesContainer.appendChild(sourceContainer);
            paletteColors.forEach((palette, paletteIndex) => {
                const swatchContainer = document.createElement('div');
                swatchContainer.className = 'colorSwatches';
                swatchContainer.id = `swatches-${(paletteIndex + 1)}`;

                swatchContainer.style.backgroundImage = generateVerticalGradient(sourceColors.map(colorObj => colorObj.baseColor));
                toColorSwatchesContainer.appendChild(swatchContainer);

                swatches.push(swatchContainer);
            });

            const customContainer = document.createElement('div');
            customContainer.className = 'colorSwatches custom-color-selector';
            customContainer.id = `swatches-${(paletteColors.length + 1)}`;
            customContainer.style.backgroundImage = generateVerticalGradient(sourceColors.map(colorObj => colorObj));
            customContainer.style.border = '0.5px solid black';
            toColorSwatchesContainer.appendChild(customContainer);

            paletteColors.forEach((palette, index) => {
                populateSwatchesForIndex(index, palette.colorCombination);
            });

            addClickEventToSwatches();
        }

       function generateVerticalGradient(colors, isCustom = false) {
            const segmentSize = 100 / colors.length;
            const gradientSegments = colors.map((color, index) => {
                const startPercent = index * segmentSize;
                const endPercent = (index + 1) * segmentSize;
                return `${color} ${startPercent}% ${endPercent}%`;
            }).join(', ');

            return isCustom ? `linear-gradient(to right, ${gradientSegments})` : `linear-gradient(to right, ${gradientSegments})`;
        }

        function populateSwatchesForIndex(index, palette) {
            const swatchContainer = swatches[index];
            swatchContainer.innerHTML = '';
            swatchContainer.style.backgroundImage = generateVerticalGradient(palette);
        }

       function addClickEventToSwatches() {
            const swatchElements = document.querySelectorAll('.colorSwatches');
      
            swatchElements.forEach(swatch => {
                swatch.addEventListener('click', function() {
                    if (this.classList.contains('custom-color-selector')) {
                        customColorPicker.style.display = 'block';
                    } else {
                        customColorPicker.style.display = 'none';
                    }

                    swatchElements.forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');

                    updateColor([...new Set(this.style.backgroundImage.match(/rgb\((\d+, \d+, \d+)\)/g))]);
                });
            });
        }

        function drawImage(img) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        function updateColor(changeColorArray) {
            if (imageData) {
                changeColor(changeColorArray);
            }
        }

        function rgbStringToObject(rgbString) {
            const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

            if (match) {
                const r = parseInt(match[1], 10);
                const g = parseInt(match[2], 10);
                const b = parseInt(match[3], 10);

                return {
                    r,
                    g,
                    b
                };
            } else {
                throw new Error('Invalid RGB string format');
            }
        }
function changeColor(changeColorArray) {
    if (!originalImage) return;

    // Draw the original image on the canvas
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Precompute the parsed dominant colors and their RGB values
    const dominantColors = configObject.dominantColors.map(parseColor);

    // Precompute the color hex map and the RGB differences for each color
    const colorHexMap = configObject.dominantColors.map(color => color.toLowerCase());
    const colorDiffMap = dominantColors.map(color => ({
        r: Math.abs(255 - color.r),
        g: Math.abs(255 - color.g),
        b: Math.abs(255 - color.b)
    }));

    const dataLength = data.length;

    for (let i = 0; i < dataLength; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];

        let closestColorIndex = -1;
        let smallestDiff = Infinity;

        // Use a more efficient loop to find the closest color
        for (let j = 0; j < dominantColors.length; j++) {
            const diff = Math.abs(r - dominantColors[j].r) +
                         Math.abs(g - dominantColors[j].g) +
                         Math.abs(b - dominantColors[j].b);

            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestColorIndex = j;
            }
        }

        if (closestColorIndex !== -1) {
            const closestColorHex = colorHexMap[closestColorIndex];
            const toColor = rgbStringToObject(changeColorArray[closestColorIndex]);

            // Calculate the color direction once
            const direction = {
                r: r - dominantColors[closestColorIndex].r,
                g: g - dominantColors[closestColorIndex].g,
                b: b - dominantColors[closestColorIndex].b,
            };

            // Apply the direction to the new color
            const newColor = applyDirectionToColor(toColor, direction);
            data[i] = newColor.r;
            data[i + 1] = newColor.g;
            data[i + 2] = newColor.b;
        }
    }

    // Apply the updated image data back to the canvas
    ctx.putImageData(imgData, 0, 0);
    textureChange();
}

        function colorMatches(currentColor, closestColor) {
            return currentColor.r === closestColor.r &&
                currentColor.g === closestColor.g &&
                currentColor.b === closestColor.b;
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

        function parseColor(colorStr) {
            const r = parseInt(colorStr.substr(1, 2), 16);
            const g = parseInt(colorStr.substr(3, 2), 16);
            const b = parseInt(colorStr.substr(5, 2), 16);
            return {
                r,
                g,
                b
            };
        }

        function hexToRgb(hex) {
            hex = hex.replace(/^#/, '');

            let r, g, b;
            if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else if (hex.length === 3) {
                r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
                g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
                b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
            } else {
                throw new Error('Invalid HEX color format');
            }

            return {
                r,
                g,
                b
            };
        }
function parseRgbString(rgbString) {
    const match = rgbString.match(/\d+/g);
    return {
        r: parseInt(match[0]),
        g: parseInt(match[1]),
        b: parseInt(match[2])
    };
}
        function rgbToHex(color) {
            const r = color.r;
            const g = color.g;
            const b = color.b;
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        }


        generateControls();


        let uploadedFilename = 'screenshot';

        const scene = new THREE.Scene();

        let camera = createOrthographicCamera();
        let perspectiveCamera = createPerspectiveCamera();

        function createOrthographicCamera() {
            const aspectRatio = window.innerWidth / window.innerHeight;
            return new THREE.OrthographicCamera(-aspectRatio * 50, aspectRatio * 50, 50, -50, 0.1, 1000);
        }

        function createPerspectiveCamera() {
            return new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        }

        function setCamera(type) {
            if (type === 'perspective') {
                scene.remove(camera);
                camera = perspectiveCamera;
                perspectiveCamera.position.set(-60, 0, 60);
                perspectiveCamera.lookAt(scene.position);
            } else {
                scene.remove(camera);
                camera = createOrthographicCamera();
                camera.position.set(0, 0, 100);
                camera.lookAt(scene.position);
            }
            scene.add(camera);
        }

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.setClearColor(0xffffff);


        const pivot = new THREE.Object3D();
        scene.add(pivot);

        const textureLoader = new THREE.TextureLoader();

const textures = [];

configObject.imageInfo.textures.forEach((textureInfo, index) => {
    const texture = textureLoader.load(textureInfo.texturePath);
    textures.push(texture);
});


      //  const texture1 = textureLoader.load('https://uniqtribe.github.io/hand.jpg');

        const canvas3 = document.getElementById('canvas');
        const texture2 = new THREE.CanvasTexture(canvas3);



        let object;

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load(configObject.imageInfo.objectPath, function(gltf) {
            object = gltf.scene;

            object.traverse(function(child) {

                if (child.isMesh) {
                    if (child.name === '038F_05SET_04SHOT_3' || child.name === '038F_05SET_04SHOT_2') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: textures[0]
                        });
                    } else if (child.name === 'Rectangle_2' || child.name === 'Index_Nail' || child.name === 'Thumb_Nail' || child.name === 'Ring_Nail' || child.name === 'Little_Nail' ||
                        child.name === 'Middle_Finger' || child.name === 'Index_Nail_1' || child.name === 'Thumb_Nail_1' || child.name === 'Ring_Nail_1' || child.name === 'Little_Nail_1' || child.name === 'Middle_Nail') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: textures[0]
                        });
                    } else if (child.name === 'Rectangle') {

                        child.material = new THREE.MeshStandardMaterial({
                            map: texture2,
                            transparent: true,
                            opacity: 0.5,
                            depthWrite: false
                        });
                    }
                    child.material.needsUpdate = true;
                }

            });
            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(5, 5, 5).normalize();
            scene.add(directionalLight);

            const AmbientLight2 = new THREE.AmbientLight(0xffffff, 0.5);
            AmbientLight2.position.set(20, -20, 5).normalize();
            scene.add(AmbientLight2);

            pivot.add(object);
            textureChange();
        }, undefined, function(error) {
            console.error('Error loading GLTF file:', error);
        });

        function updateCamera() {
            const posX = parseFloat(-91);
            const posY = parseFloat(0);
            const posZ = parseFloat(60);
            const rotX = THREE.MathUtils.degToRad(parseFloat(-1));
            const rotY = THREE.MathUtils.degToRad(parseFloat(-1));
            const rotZ = THREE.MathUtils.degToRad(parseFloat(0.5));

            camera.position.set(posX, posY, posZ);
            camera.rotation.set(rotX, rotY, rotZ);
        }

        function updatePivot() {
            const posX = parseFloat(-45);
            const posY = parseFloat(32);
            const posZ = parseFloat(31);
            const rotX = THREE.MathUtils.degToRad(116);
            const rotY = THREE.MathUtils.degToRad(30);
            const rotZ = THREE.MathUtils.degToRad(6);

            pivot.position.set(posX, posY, posZ);
            pivot.rotation.set(rotX, rotY, rotZ);
        }

        function updateZoom() {
            camera.zoom = parseFloat(1.5);
            camera.updateProjectionMatrix();
        }


        function captureScreenshot() {
            updateCamera();
            updatePivot();
            updateZoom();
            renderer.render(scene, camera);
            let existingCanvas = document.getElementById('can1');
            if (existingCanvas) {
                existingCanvas.remove();
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', {
                willReadFrequently: true
            });
            canvas.width = renderer.domElement.width;
            canvas.height = renderer.domElement.height;
            canvas.setAttribute('id', 'can1');

            context.drawImage(renderer.domElement, 0, 0);

            existingCanvas = document.getElementById('can1');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            trimWhiteSpace(canvas);
        }

        function textureChange() {

            const canvas4 = document.getElementById('canvas');
            const textureURL = canvas4.toDataURL('image/png');

            const textureLoader = new THREE.TextureLoader();
            const uploadedTexture = textureLoader.load(textureURL, function(texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);

                object.traverse(function(child) {

                    if (child.isMesh && child.name === 'Rectangle') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: texture,
                            transparent: true,
                            opacity: 1,
                            depthWrite: false,
                            emissive: new THREE.Color(0xffffff),
                            emissiveIntensity: 0.4,
                            color: new THREE.Color(0xffffff)
                        });
                        child.material.needsUpdate = true;
                    } else if (child.name === 'Rectangle_2' || child.name === 'Index_Nail' || child.name === 'Thumb_Nail' || child.name === 'Ring_Nail' || child.name === 'Little_Nail' ||
                        child.name === 'Middle_Finger' || child.name === 'Index_Nail_1' || child.name === 'Thumb_Nail_1' || child.name === 'Ring_Nail_1' || child.name === 'Little_Nail_1' ||
                        child.name === 'Middle_Nail') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: texture,
                            transparent: true,
                            opacity: 1,
                            depthWrite: false
                        });
                        child.material.needsUpdate = true;
                    }
                });

                captureScreenshot();
            });

const selectedSwatch = document.querySelector('.colorSwatches.selected');

if (selectedSwatch) {
    // Extract the gradient from the style attribute
    const gradient = selectedSwatch.style.backgroundImage;


    // Extract the RGB colors from the gradient
    const rgbColors = gradient.match(/rgb\([^)]+\)/g);

    let hexColors = rgbColors.map(rgbString => {
        const rgbObject = parseRgbString(rgbString);
        return rgbToHex(rgbObject);
    });
    hexColors = [...new Set(hexColors)];
const hexColorString = hexColors.join(', ');

const variantRows = document.querySelectorAll('.theme-custom-field-main-container .theme-product-varients-row');


// Loop through each variant row
variantRows.forEach(row => {


    // Find the label within the row
    const label = row.querySelector('.theme-product-variant-label.theme-custom-field-label');

    // Check if the label text is 'Config'
    if (label && /^Selection\s*\*?$/.test(label.textContent.trim())) {
        // Hide the entire row
        row.style.display = 'none';
row.querySelector('.theme-custom-field-input').value = hexColorString ;
    }


});

 } else {
    console.error('No swatch is selected.');
}
        }


function trimWhiteSpace(canvas) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    let top = height, bottom = 0, left = width, right = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index], g = data[index + 1], b = data[index + 2], alpha = data[index + 3];

            // Check for non-white pixels
            if (r < 255 || g < 255 || b < 255 || alpha < 255) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }

    // No trimming needed if the image is entirely white
    if (top === height || bottom === 0 || left === width || right === 0) return;

    // Calculate the new dimensions
    const newWidth = right - left + 1;
    const newHeight = bottom - top + 1;

    // Create a new canvas to hold the trimmed image
    const can2 = document.createElement('canvas');
    can2.width = newWidth;
    can2.height = newHeight;
    const context2 = can2.getContext('2d', { willReadFrequently: true });

    // Copy the trimmed image data
    context2.putImageData(context.getImageData(left, top, newWidth, newHeight), 0, 0);

    // Scale down the image to the desired size
    const can3 = document.createElement('canvas');
    can3.width = newWidth / 1.5;
    can3.height = newHeight / 1.5;
    const context3 = can3.getContext('2d', { willReadFrequently: true });
    context3.drawImage(can2, 0, 0, can3.width, can3.height);

    // Remove the existing canvas if present
    const existingCanvas = document.getElementById('textureHand');
    if (existingCanvas) existingCanvas.remove();

    // Append the new canvas to the container
    can3.setAttribute('id', 'textureHand');
    canvasContainer.appendChild(can3);
}

        function handleTextureUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            uploadedFilename = file.name.split('.').slice(0, -1).join('.');

            const reader = new FileReader();
            reader.onload = function(e) {
                const textureURL = e.target.result;

                const textureLoader = new THREE.TextureLoader();
                const uploadedTexture = textureLoader.load(textureURL, function(texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);

                    object.traverse(function(child) {
                        if (child.isMesh && child.name === 'Rectangle') {
                            child.material = new THREE.MeshStandardMaterial({
                                transparent: true,
                                opacity: 1,
                                depthWrite: false,
                                emissive: new THREE.Color(0xffffff),
                                emissiveIntensity: 0.4,
                                color: new THREE.Color(0xffffff)
                            });
                            child.material.needsUpdate = true;
                        } else if (child.name === 'Rectangle_2' || child.name === 'Index_Nail' || child.name === 'Thumb_Nail' || child.name === 'Ring_Nail' || child.name === 'Little_Nail' ||
                            child.name === 'Middle_Finger' || child.name === 'Index_Nail_1' || child.name === 'Thumb_Nail_1' || child.name === 'Ring_Nail_1' || child.name === 'Little_Nail_1' || child.name === 'Middle_Nail') {
                            child.material = new THREE.MeshStandardMaterial({
                                map: texture,
                                transparent: true,
                                opacity: 1,
                                depthWrite: false
                            });
                            child.material.needsUpdate = true;
                        }
                    });
                });
            };

            reader.readAsDataURL(file);
        }


        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
        // Function to handle selection (called on click)
    // Function to handle selection (called on click)
function selectOption(element) {
    const customSelect = document.getElementById('customSelect');
    const hiddenSelect = document.querySelector('select[data-label="Shape"]');

    // Remove selected class from all options
    Array.from(customSelect.children).forEach(child => child.classList.remove('selected'));

    // Add selected class to the clicked option
    element.classList.add('selected');

    // Update the hidden select's value
    hiddenSelect.value = element.getAttribute('data-value');
}

function generateCustomSelect() {
    // Find the select element with the data-label="shape" attribute
    const hiddenSelect = document.querySelector('select[data-label="Shape"]');
    
    // If the select element is found, proceed with generating the custom select
    if (hiddenSelect) {
        // Create the new div container for custom select
        const customSelectContainer = document.createElement('div');
        customSelectContainer.id = 'customSelectContainer';
        
        // Insert the new div right after the hidden select element
        hiddenSelect.parentNode.insertBefore(customSelectContainer, hiddenSelect.nextSibling);

        // Initialize an empty string to build the custom select content
        let customSelectContent = '';

        // Iterate over the options in the select element
        Array.from(hiddenSelect.options).forEach((option,index)=> {

  if (index === 0 && option.textContent.trim() === "Choose an option") {
                return;
            }
 if (configObject.shapes.includes(option.value.toLowerCase())) {
        customSelectContent += `
            <div data-value="${option.value}">
                ${option.textContent}
            </div>
        `;
    }
       
        });

        // Inject the custom select content into the container
        customSelectContainer.innerHTML = '<div class="custom-select" id="customSelect">' + customSelectContent + '</div>';
        // Attach event listeners to the dynamically created options
        const customOptions = customSelectContainer.querySelectorAll('div[data-value]');
        customOptions.forEach(option => {
            option.addEventListener('click', function() {
                selectOption(this);
            });
        });
        // Optionally, trigger click on the first element to select it
        const firstOption = customSelectContainer.querySelector('div[data-value]');
        if (firstOption) firstOption.click();
    } else {
        console.error('No select element found with data-label="shape".');
    }
}

generateCustomSelect();

    }
    document.addEventListener('DOMContentLoaded', function() {
        loadPage();
    });
</script>
