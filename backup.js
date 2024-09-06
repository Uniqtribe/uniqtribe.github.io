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
            }
        ]

        let paletteContainer = document.getElementById('palette');
        let selectedSwatch = null;
        let swatchOrder = [];

        function populatePalette() {

            for (let i = 0; i < configObject.dominantColors.length; i++) {

                const sectionDiv = document.createElement('div');



                const colorDiv = document.createElement('div');
                colorDiv.style.backgroundColor = configObject.dominantColors[i];
                colorDiv.style.width = '25px';
                colorDiv.style.height = '25px';
                if (i == 0) {
                    colorDiv.className = 'custom-selected-color selected';
                } else {
                    colorDiv.className = 'custom-selected-color';
                }
                sectionDiv.appendChild(colorDiv);
                sectionSelector.appendChild(sectionDiv);

                colorDiv.addEventListener('click', function() {

                    const currentlySelected = document.querySelector('.custom-selected-color.selected');
                    if (currentlySelected) {
                        currentlySelected.classList.remove('selected');
                    }

                    colorDiv.classList.add('selected');

                    document.querySelectorAll('.color-swatch').forEach((swatchColor) => {
                        if (colorDiv.style.backgroundColor === swatchColor.style.backgroundColor) {
                            swatchColor.className = 'color-swatch active';
                            swatchColor.querySelector('.color-name').style.display = 'block';

                        } else {
                            swatchColor.className = 'color-swatch';
                            swatchColor.querySelector('.color-name').style.display = 'none';
                        }
                    })

                    selectColor(colorDiv.style.backgroundColor);


                });


            }

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

                paletteContainer.appendChild(swatch);

                swatchOrder.push(swatch);
            });


            const colorpicker = document.createElement('div');
            colorpicker.className = 'color-swatch custom-colors';
            colorpicker.onclick = function() {
                openColorPicker();
            };
            const nameSpan = document.createElement('div');
            nameSpan.className = 'color-name';
            nameSpan.textContent = 'custom';
            colorpicker.appendChild(nameSpan);
            colorpicker.addEventListener('click', () => handleColorClick(colorpicker));

            paletteContainer.appendChild(colorpicker);
            swatchOrder.push(paletteContainer);

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
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < imgData.data.length; i += 4) {
                const r = imgData.data[i];
                const g = imgData.data[i + 1];
                const b = imgData.data[i + 2];

                let closestColor = null;
                let smallestDiff = Infinity;

                for (let colorObj of configObject.dominantColors) {
                    const fromColor = parseColor(colorObj);

                    const diff = Math.abs(r - fromColor.r) + Math.abs(g - fromColor.g) + Math.abs(b - fromColor.b);

                    if (diff < smallestDiff) {
                        smallestDiff = diff;
                        closestColor = fromColor;
                    }
                }

                if (closestColor) {
                    const closestColorHex = rgbToHex(closestColor).toLowerCase();
                    const colorObj = configObject.dominantColors.find(colorObj => colorObj.toLowerCase() === closestColorHex);

                    if (colorObj) {
                        const toColorIndex = configObject.dominantColors.indexOf(colorObj);

                        const toColor = rgbStringToObject(changeColorArray[toColorIndex]);
                        const direction = {
                            r: r - closestColor.r,
                            g: g - closestColor.g,
                            b: b - closestColor.b,
                        };
                        const newColor = applyDirectionToColor(toColor, direction);
                        imgData.data[i] = newColor.r;
                        imgData.data[i + 1] = newColor.g;
                        imgData.data[i + 2] = newColor.b;
                    }
                } else if (smoothEdges) {
                    smoothImageEdges(imgData, edgeRadius);
                }
            }

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
            const context = canvas.getContext('2d', {
                willReadFrequently: true
            });
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const width = canvas.width;
            const height = canvas.height;

            let top = 0;
            let bottom = height;
            let left = 0;
            let right = width;



            for (let x = 0; x < width; x++) {

                let nonWhiteCount = 0;
                for (let y = 0; y < height; y++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const alpha = data[index + 3];

                    if (r < 255 || g < 255 || b < 255 || alpha < 255) {
                        nonWhiteCount++;
                    }
                }
                if (nonWhiteCount / height > 0.05) {

                    left = x;
                    break;
                }
            }

            for (let x = width - 1; x >= 0; x--) {
                let nonWhiteCount = 0;
                for (let y = 0; y < height; y++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const alpha = data[index + 3];

                    if (r < 255 || g < 255 || b < 255 || alpha < 255) {
                        nonWhiteCount++;
                    }
                }
                if (nonWhiteCount / height > 0.05) {
                    right = x + 1;
                    break;
                }
            }

            const newWidth = right - left;
            const newHeight = bottom - top;
            const can2 = document.createElement('canvas');
            can2.width = newWidth;
            can2.height = newHeight;
            const trimmedImageData = context.getImageData(left, top, newWidth, newHeight);
            const context2 = can2.getContext('2d', {
                willReadFrequently: true
            });
            context2.putImageData(trimmedImageData, 0, 0);

           // const canvasContainer = document.createElement('div');
           // canvasContainer.id = "canvas-container";


            const can3 = document.createElement('canvas');
            can3.width = newWidth / 1.5;
            can3.height = newHeight / 1.5;

            let existingCanvas = document.getElementById('textureHand');
            if (existingCanvas) {
                existingCanvas.remove();
            }

            const context3 = can3.getContext('2d', {
                willReadFrequently: true
            });
            context3.drawImage(can2, 0, 0, newWidth / 1.5, newHeight / 1.5);
            can3.setAttribute('id', 'textureHand');
            canvasContainer.appendChild(can3);
            //document.querySelector('.theme-product-detail-image').appendChild(canvasContainer);
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