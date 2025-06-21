let isDragging = false;
let selection = [];
let patternSelection;
let productVariantId;
let swatches = [];
let selectedSwatch;

    let minPaletteCount = 0;
    let recommendedPaletteCount = 0;
    let maxPaletteCount = 0;
let varientContainer = document.querySelector('.theme-product-detail-varients-container');

if (varientContainer) {
waitForImageToLoad("base-image", function() {

    console.log("Image is fully loaded. Running script...");
    // Your script here
	
    let varientContainerRows = document.createElement('div')
    varientContainerRows.className = 'theme-product-varients-row';
    let cartContainer = document.createElement('div');
    cartContainer.id = 'cartContainer';
    cartContainer.className = 'theme-product-variant';
    let cartLabelContainer = document.createElement('div');
    cartLabelContainer.id = 'cartLabelContainer';
    cartLabelContainer.className = 'theme-product-variant-label';
    cartLabelContainer.innerHTML = 'Patterns in Cart'
    let cartPatternContainer = document.createElement('div');
    cartPatternContainer.id = 'cartPatternContainer';
    cartPatternContainer.className = 'theme-product-variant-pattern';
    cartContainer.appendChild(cartLabelContainer);
    cartContainer.appendChild(cartPatternContainer);
    varientContainerRows.append(cartContainer);
    varientContainer.append(varientContainerRows);
    imgElement = document.querySelector('img[alt*="base-image"]');

    (function () {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            const fetchPromise = originalFetch.apply(this, args);
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            if (url && url.includes('/cart')) {
                return fetchPromise.then(response => {
                    const clonedResponse = response.clone();
                    clonedResponse.json().then(data => {
                        document.dispatchEvent(new CustomEvent("cartUpdated", {
                            detail: data
                        }));
                    }).catch(err => {
                        console.error("Failed to parse cart response:", err);
                    });
                    return response; // Return the original response
                });
            }
            return fetchPromise;
        };
    })();

    (function () {
        const originalXHR = window.XMLHttpRequest;

        function newXHR() {
            const realXHR = new originalXHR();

            // Declare requestMethod here
            let requestMethod = '';

            // Override the original open method to capture the method and URL
            const originalOpen = realXHR.open;
            realXHR.open = function (method, url) {
                requestMethod = method; // Save the method
                return originalOpen.apply(this, arguments);
            };

            realXHR.addEventListener('readystatechange', function () {
                if (realXHR.readyState === 4 && realXHR.status === 200) {
                    const url = realXHR.responseURL;
                    if (url.includes('/cart') && (requestMethod === 'GET' || requestMethod === 'POST')) {
                        const data = JSON.parse(realXHR.responseText);
                        document.dispatchEvent(new CustomEvent("cartUpdated", {
                            detail: data
                        }));
                    }
                    if (url.includes('/cart') && requestMethod === 'DELETE') {
                        const data = JSON.parse(realXHR.responseText);
                        document.dispatchEvent(new CustomEvent("cartDeleted", {
                            detail: data
                        }));
                    }
                }
            });
            return realXHR;
        }
        window.XMLHttpRequest = newXHR; // Override the global XMLHttpRequest
    })();

    document.addEventListener("cartUpdated", function (event) {
        cartData = event.detail.payload;
        setTimeout(() => {
            console.log("CART UPDATED");
            updateFields();
        }, 100); // Delay time (ms) can be adjusted
    });

    fetch('/storefront/api/v1/cart')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON response
        })

    variantRows = document.querySelectorAll('.theme-product-varients-row');
    let i = 0;
    patternSelection = [];
    variantRows.forEach(row => {
        let label = row.querySelector('.theme-product-variant-label.theme-custom-field-label');
        if (label?.textContent.replace("*", "").trim() === 'source') {
            source = row.querySelector('input')
            row.style.display = 'none';
        }
        if (label?.textContent.replace("*", "").trim() === 'target') {
            target = row.querySelector('input')
            row.style.display = 'none';
        }
        if (label?.textContent.replace("*", "").trim() === 'Config') {
            config = row.querySelector('span');
            configObject = JSON.parse(config.textContent.trim());
            row.style.display = 'none';
        }
		if (label?.textContent.replace("*", "").trim() === 'Basic Color Pattern') {
            basicColorConfig = row.querySelector('span');
            basicColor = JSON.parse(basicColorConfig.textContent.trim());
            row.style.display = 'none';
        }
		if (label?.textContent.replace("*", "").trim() === 'Alternate Color Pattern') {
            alternateColorConfig = row.querySelector('span');
            alternateColor = JSON.parse(basicColorConfig.textContent.trim());
            row.style.display = 'none';
        }

        if (label?.textContent.replace("*", "").trim().toLowerCase().startsWith('selection')) {
            selection[i] = row.querySelector('input');
            let obj = {};
            obj['value'] = row.querySelector('input').value;
            obj['field'] = row.querySelector('input').getAttribute('data-custom-field-id');
            patternSelection[i] = JSON.stringify(obj);
            i++;
            row.style.display = 'none';
        }
    })
/*
    const inputElement = document.querySelector('[name="qty"]');
    inputElement.disabled = true;
    if (inputElement) {
        inputElement.addEventListener('input', () => {
            console.log('Value changed by user to:', inputElement.value);
        });
        let originalValue = inputElement.value;
        Object.defineProperty(inputElement, 'value', {
            get() {
                return originalValue;
            },
            set(newValue) {
                originalValue = newValue;
                console.log('Value changed programmatically to:', newValue);
                this.setAttribute('value', newValue); // Update attribute if needed
                updateTargetValue(newValue);
            },
            configurable: true
        });
    }*/
	const inputElement = document.querySelector('[name="qty"]');
inputElement.disabled = true; // Disables user input

if (inputElement) {
    // Listen for changes made programmatically
    let originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    Object.defineProperty(inputElement, 'value', {
        get() {
            return originalDescriptor.get.call(this);
        },
        set(newValue) {
            console.log('Value changed programmatically to:', newValue);
            originalDescriptor.set.call(this, newValue);
            updateTargetValue(newValue);
        },
        configurable: true
    });

    // Monitor changes via direct user interaction
    inputElement.addEventListener('input', () => {
        console.log('Value changed by user to:', inputElement.value);
    });
}


    productVariantId = extractIdFromUrl(window.location.href);
    quantityInput = document.querySelector('[title="quantity"]');

    addLightboxEventListener();

    const container = document.querySelector('.theme-custom-field-main-container');
    container.insertAdjacentHTML('afterbegin', `
            <div class="customColorPickerPalette">
                <div class="theme-product-variant-label theme-custom-field-label customColorPickerPalette" data-zs-customfield-label=""> 
                    Color
                </div>
                <div class='theme-product-varients-dynamic-selector'>
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
<canvas id="rgbColorPicker"></canvas>
<div id="selectedColor" style='display:none'></div>
        <p id="colorCode" style='display:none'></p>
                        </div>
                        <div id="color-display" style='display:none'>Selected Color: None</div>
                    </div>
                </div>
            </div>
              <canvas id="imageCanvas" style="display: none;"></canvas>
        `);

    paletteToggle = document.getElementById('paletteToggle');
    palette1 = document.getElementById('palette');
    palette2 = document.getElementById('palette2');
    selectedColorDiv = document.getElementById('selectedColor');
    colorCodeText = document.getElementById('colorCode');
    colorControlsContainer = document.getElementById('colorControls');
    toColorSwatchesContainer = document.getElementById('toColorSwatches');
    customColorPicker = document.getElementById('customColorPicker');
    paletteContainer = document.getElementById('palette')

    const productImage = document.querySelector(".theme-product-detail-image");
    designCanvas = document.createElement('canvas')
    designCanvas.id = 'designCanvas';
    designCanvas.width = 800;
    designCanvas.height = 800;
    designCanvas.style.display = 'none';
    designCanvasCtx = designCanvas.getContext('2d');
    imgElement.onload = () => {
        designCanvasCtx.drawImage(imgElement, 0, 0);
    };
    if (imgElement.complete) {
        imgElement.onload();
    }

    // Initialize Three.js renderer, camera, and scene
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.domElement.id = 'renderedImage';
    productImage.appendChild(renderer.domElement);
    productImage.appendChild(designCanvas);
    const dpr = window.devicePixelRatio || 1;

    renderer.setSize(productImage.clientWidth * dpr, productImage.clientWidth * dpr);
    renderer.domElement.style.width = productImage.clientWidth + 'px';
    renderer.domElement.style.height = productImage.clientWidth + 'px';

    renderer.setClearColor(0xffffff);
    renderedImage = document.querySelector('#renderedImage');


    const cameraWidth = 10; // Width of the camera view
    const cameraHeight = 10; // Height of the camera view

    const camera = new THREE.OrthographicCamera(
        -cameraWidth / 2, cameraWidth / 2,
        cameraHeight / 2, -cameraHeight / 2,
        0.1, 1000
    );

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x404040));
    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 5, 150).normalize();
    scene.add(directionalLight);

    scene.add(new THREE.AmbientLight(0x404040));
    let directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(0, 0, 0).normalize();
    scene.add(directionalLight1);

    const loader = new THREE.GLTFLoader();

    loader.load(configObject.imageInfo.objectPath, function (gltf) {
        object = gltf.scene;
        scene.add(object);
        object.scale.set(0.1, 0.1, 0.1);
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.set(center.x + 1.25, center.y - 0.125, 0);
        textureLoader = new THREE.TextureLoader();

        textures = configObject.imageInfo.textures.map(textureInfo => {
            const texture = textureLoader.load(textureInfo.texturePath);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter; // Use linear mipmaps for better quality during downscaling
            return {
                texture: texture,
                objects: textureInfo.objects,
                transparent: textureInfo.transparent
            };
        });
const totalSlices = 5;

const nailSliceMap = {
  0: ['thumb', 'thumb_nail', 'Thumb_Finger'],
  1: ['index', 'index_nail', 'Index_Finger'],
  2: ['middle', 'middle_nail', 'Middle_Finger'],
  3: ['ring', 'ring_nail', 'Ring_Finger'],
  4: ['little', 'little_nail', 'Little_Finger']
};

const uploadedTexture = textureLoader.load(
  document.querySelector('#designCanvas').toDataURL('image/png'),
  function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);

    const useMultiPattern = configObject?.multipattern === true;

    object.traverse(child => {
      if (!child.isMesh) return;

      let appliedTexture = texture;
      let materialOptions = null;

      // Check if there's an override texture for this mesh
      const textureInfo = textures.find(tex => tex.objects.includes(child.name));

      if (textureInfo) {
        appliedTexture = textureInfo.texture;
        materialOptions = {
          map: appliedTexture,
          transparent: textureInfo.transparent,
          opacity: textureInfo.transparent ? 1 : undefined,
          depthWrite: !textureInfo.transparent
        };
      } else {
        // Attempt to find slice index based on mesh name keywords
        let matchedSliceIndex = null;
        const meshName = child.name.toLowerCase();

        for (const [sliceIdx, keywords] of Object.entries(nailSliceMap)) {
          if (keywords.some(keyword => meshName.includes(keyword))) {
            matchedSliceIndex = parseInt(sliceIdx);
            break;
          }
        }

        const isPatterned =
          useMultiPattern &&
          configObject.imageInfo.appliedPattern.includes(child.name) &&
          matchedSliceIndex !== null;

        if (isPatterned) {
          appliedTexture = texture.clone();
          appliedTexture.needsUpdate = true;
          appliedTexture.wrapS = THREE.RepeatWrapping;
          appliedTexture.wrapT = THREE.RepeatWrapping;

          appliedTexture.repeat.set(1 / totalSlices, 1);
          appliedTexture.offset.set(matchedSliceIndex / totalSlices, 0);

          console.log(
            `🎯 Slice ${matchedSliceIndex} applied to "${child.name}" → offset: (${appliedTexture.offset.x}, ${appliedTexture.offset.y})`
          );
        }

        materialOptions = {
          map: appliedTexture,
          transparent: true,
          opacity: 1,
          depthWrite: false
        };
      }

      // Special styling for background pattern
      if (child.name === configObject.imageInfo.backgroundPattern) {
        materialOptions.emissive = new THREE.Color(0xffffff);
        materialOptions.emissiveIntensity = 0.3;
        materialOptions.color = new THREE.Color(0xffffff);
      }

      // Assign final material
      child.material = new THREE.MeshStandardMaterial(materialOptions);
      child.material.needsUpdate = true;
    });

    console.log('Finished applying textures and slicing.');
  }
);


	/*    
        const uploadedTexture = textureLoader.load(document.querySelector('#designCanvas').toDataURL('image/png'),
            function (texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);

                object.traverse(function (child) {
                    if (child.isMesh) {
                        if (child.name === configObject.imageInfo.backgroundPattern) {
                            child.material = new THREE.MeshStandardMaterial({
                                map: texture,
                                transparent: true,
                                opacity: 1,
                                depthWrite: false,
                                emissive: new THREE.Color(0xffffff),
                                emissiveIntensity: 0.3,
                                color: new THREE.Color(0xffffff)
                            });
                        } else if (configObject.imageInfo.appliedPattern.includes(child.name)) {
                            child.material = new THREE.MeshStandardMaterial({
                                map: texture,
                                transparent: true,
                                opacity: 1,
                                depthWrite: false
                            });
                        }

                        const textureInfo = textures.find(tex => tex.objects.includes(child.name));
                        if (textureInfo) {
                            child.material = new THREE.MeshStandardMaterial({
                                map: textureInfo.texture,
                                transparent: textureInfo.transparent
                            });
                        }

                        child.material.needsUpdate = true;
                    }
                });
            });
*/
        camera.position.set(center.x, center.y, 10);
        camera.lookAt(center);

        const animate = function () {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();
        
    const img = document.querySelector('img[alt*="base-image"]');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        pixels.push([r, g, b]);
    }

    // Cluster the palette
    const { averagedColors, clusterVariances } = simpleClusterColors(palette, pixels);
    const colorFrequency = calculateColorFrequency(imageData, averagedColors);

    const normalize = (value, min, max) => (value - min) / (max - min);

    // Find min/max for frequency and variance
    const minFrequency = Math.min(...colorFrequency.map(c => c.frequency));
    const maxFrequency = Math.max(...colorFrequency.map(c => c.frequency));
    const minVariance = Math.min(...clusterVariances);
    const maxVariance = Math.max(...clusterVariances);

    const minFrequencyThreshold = 0.90; // Set threshold for high frequency (can be adjusted)
    const maxVarianceThreshold = 0.10;  // Set threshold for low variance (can be adjusted)

    const filteredColors = averagedColors.filter((color, index) => {

        const normalizedFrequency = normalize(colorFrequency[index].frequency, minFrequency, maxFrequency);
        const normalizedVariance = normalize(clusterVariances[index], minVariance, maxVariance);

        return normalizedFrequency >= minFrequencyThreshold || normalizedVariance <= maxVarianceThreshold;
    });
    maxPaletteCount = averagedColors.length;
    recommendedPaletteCount = filteredColors.length;
const colorThief = new ColorThief();
    for (let i = recommendedPaletteCount; i <= maxPaletteCount; i++) {
        palette = colorThief.getPalette(imageData, i); // Extract 10 dominant colors

        const schemes = generatePalettes(palette);
        generatePaletteStructure(palette);

        /*                palette.forEach((color, index) => {
                            const colorDiv = document.createElement('div');
                            colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                            colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index]} - Frequency: ${colorFrequency[index].frequency}` ;
        
                            colorDiv.style.padding = '10px';
                            colorDiv.style.margin = '5px';
                            document.body.appendChild(colorDiv);
                        });
        */


        const paletteValues = Object.values(schemes);  // Get only the color arrays (values)

        const uniquePalettes = [];
        const removedPalettes = [];

        paletteValues.forEach((currentPalette, index) => {
            // Check if this palette is similar to any existing ones
            const isSimilar = uniquePalettes.some(existingPalette =>
                arePalettesSimilar(existingPalette, currentPalette)
            );

            if (!isSimilar) {
                uniquePalettes.push(currentPalette);
            } else {
                // Log the removed palette
                const paletteName = Object.keys(palette)[index];
                removedPalettes.push({ [paletteName]: currentPalette });
            }
        });

        // Now uniquePalettes contains only non-similar palettes
        console.log("Unique Palettes:");
        console.log(uniquePalettes);
        const { uniqueColoredPalettes, removedColoredPalettes } = removePalettesWithSimilarColors(uniquePalettes)
        console.log("Removed Palettes:");
        console.log(uniqueColoredPalettes);
        for (let i = 0; i < uniqueColoredPalettes.length; i++) {
            generatePaletteStructure(uniqueColoredPalettes[i]);
        }

    }
    }, undefined, function (error) {
        console.error('An error occurred while loading the model:', error);
    });

    const handleImageClick = (imgElement, imageUrl) => {
        imgElement.addEventListener('click', () => {
            // Hide canvas container and remove all images in the display div
            document.querySelector('#renderedImage').style.display = 'none';
            productImage.querySelectorAll('img').forEach(img => img.remove());
            // Create and append the new image
            const displayImgElement = document.createElement('img');
            displayImgElement.src = imageUrl;
            displayImgElement.alt = "Selected Image";
            displayImgElement.style.width = productImage.clientWidth + 'px'; // width in pixels
            displayImgElement.style.height = productImage.clientWidth + 'px'; // height in pixels
            productImage.append(displayImgElement);
        });
    };

    const imageGallery = document.createElement('div');
    imageGallery.id = 'image-gallery';
    document.querySelector(".theme-product-detail-image-container").appendChild(imageGallery);

    // Handle base image element
    const baseImgElement = document.querySelector('img[alt*="base-image"]');
    imageGallery.append(baseImgElement);

    baseImgElement.addEventListener('click', () => {
        // Remove all images and show the canvas container
        productImage.querySelectorAll('img').forEach(img => img.remove());
        renderedImage.style.display = 'block';
    });



   

        populatePalette();
	generateControls();
	
    
    generateCustomSelect();
    paletteToggle.addEventListener('change', () => {
        const showPalette2 = paletteToggle.checked;
        palette1.style.display = showPalette2 ? 'none' : 'flex';
        palette2.style.display = showPalette2 ? 'flex' : 'none';
    });
    createColorPicker();
if(detectDevice() === 'Mobile' || detectDevice() === 'Tablet' ){
    alterPalette();

}

		configObject.commonImages.forEach(imageUrl => {
		    const imgElement = new Image();
		    imgElement.src = imageUrl;
		    imgElement.alt = "Common Image";
		
		    imgElement.onload = () => {
		        const imgWrapper = document.createElement('div');
		        imgWrapper.classList.add('image-wrapper');
		        imgWrapper.appendChild(imgElement);
		        imageGallery.append(imgWrapper);
		
		        // Attach the click handler
		        handleImageClick(imgWrapper, imageUrl);
		    };
		
		    imgElement.onerror = (err) => {
		        console.error("Failed to load image:", imageUrl, err);
		    };
		});
	
	})
}


function updateTargetValue(newValue) {
    if (target.value) {
        let obj = JSON.parse(target.value);
        obj.quantity = newValue;
        target.value = JSON.stringify(obj);
    }
}

function updateFields() {
    loadBasicField();
    let x = 0;
    selectionValue = [];
    for (let i = 0; i < cartData.line_items.length; i++) {
        if (cartData.line_items[i].item_id === productVariantId) {
            for (let j = 0; j < cartData.line_items[i].item_custom_fields.length; j++) {
                if ((cartData.line_items[i].item_custom_fields[j].label.startsWith('target') ||
                    cartData.line_items[i].item_custom_fields[j].label.startsWith('selection')) && cartData.line_items[i].item_custom_fields[j].value_formatted != '') {
                    selectionValue[x] = JSON.parse(cartData.line_items[i].item_custom_fields[j].value_formatted);
                    x++;
                }
            }

        }
    }
    loadSelectionFieldsWithPattern();

document.querySelector('#swatches-0').click();
document.querySelector('#customSelect').querySelectorAll('div[data-value]')[0].click();
}

function loadBasicField() {
    let obj = {}
    obj['selected'] = basicColor[0].baseColor.map(rgbArrayToHexFromPattern);
    obj['quantity'] = 1;
    obj['shape'] = '';
    target.value = JSON.stringify(obj);
    let object = {};
    object['source'] = basicColor[0].baseColor.map(rgbArrayToHexFromPattern);
    source.value = JSON.stringify(object);
}
function rgbArrayToHexFromPattern(rgb) {
    return `#${((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).slice(1).toUpperCase()}`;
}
function loadSelectionFieldsWithPattern() {
    patternSelection = [];

    for (let a = 0; a < selection.length; a++) {
        selection[a].value = '';
    }
    console.log("Selection Value", selectionValue);
    for (let i = 0; i < selectionValue.length; i++) {
        for (let j = 0; j < selection.length; j++) {
            if (selection[j].value === '') {
                selection[j].value = JSON.stringify(selectionValue[i]);
                if (j === (selection.length - 1)) {
                    document.querySelector('.theme-cart-button').style.display = 'none';
                }
                break;
            } else if ((JSON.stringify(JSON.parse(selection[j].value).selected) === JSON.stringify(selectionValue[i].selected)) &&
                (JSON.stringify(JSON.parse(selection[j].value).shape) === JSON.stringify(selectionValue[i].shape))
            ) {

                let obj = JSON.parse((selection[j].value));
                obj.quantity = parseInt(obj.quantity, 10) + parseInt(selectionValue[i].quantity, 10);
                selection[j].value = JSON.stringify(obj);
                cartPatternContainer.append(JSON.stringify(obj))
                break;
            }
        }
        let x = 0;
        variantRows.forEach(row => {
            let label = row.querySelector('.theme-product-variant-label.theme-custom-field-label');
            if (label?.textContent.replace("*", "").trim().toLowerCase().startsWith('selection')) {
                if (row.querySelector('input').value != '') {
                    let obj = {};
                    obj['value'] = row.querySelector('input').value;
                    obj['field'] = row.querySelector('input').getAttribute('data-custom-field-id');
                    patternSelection[x] = JSON.stringify(obj);
                }
                x++;
            }
        })

    }
    console.log("patternSelection", patternSelection)
    printPattern(patternSelection);
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

function rgbArrayToHex({
    r,
    g,
    b
}) {
    // Convert each RGB component to hexadecimal and pad with zeroes if necessary
    const toHex = (component) => component.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function printPattern(patternSelection) {
    const container = document.querySelector('.theme-product-variant-pattern');
    if(patternSelection.length == 0){
    container.innerHTML = 'No Items in Cart'; // Clear existing content
}
else{
container.innerHTML = '';
}
    patternSelection.forEach(pattern => {
        const rowDiv = createColumnDiv(pattern);
        container.appendChild(rowDiv);
    });
    attachQuantityEventListeners();
}

function attachQuantityEventListeners() {
    const cartContainer = document.querySelector('#cartContainer');
    const decrementButtons = cartContainer.querySelectorAll('.theme-quantity-decrease');
    const incrementButtons = cartContainer.querySelectorAll('.theme-quantity-increase');
    const removeButtons = cartContainer.querySelectorAll('.remove-button');

    decrementButtons.forEach(button => {
        button.addEventListener('click', function () {
            const quantityInput = this.nextElementSibling;
            quantityInput.value = parseInt(quantityInput.value) - 1;
            let customField = quantityInput.getAttribute("customField");
            let obj = JSON.parse(document.querySelector(`[data-custom-field-id="${customField}"]`).value);
            obj.quantity = quantityInput.value;
            target.value = JSON.stringify(obj);
            setCustomSelectValue(obj.shape);
            document.querySelector(`[data-custom-field-id="${customField}"]`).value = '';
            //removeCart();
            addToCart(-1);
        });
    });

    incrementButtons.forEach(button => {
        button.addEventListener('click', function () {
            const quantityInput = this.previousElementSibling;
            quantityInput.value = parseInt(quantityInput.value) + 1;
            let customField = quantityInput.getAttribute("customField");
            let obj = JSON.parse(document.querySelector(`[data-custom-field-id="${customField}"]`).value);
            obj.quantity = quantityInput.value;
            target.value = JSON.stringify(obj);
            setCustomSelectValue(obj.shape);
            document.querySelector(`[data-custom-field-id="${customField}"]`).value = '';
            addToCart(1);
        });
    });

    removeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const spinnerDiv = event.target.closest(".theme-product-quantity-spinner");
            const customFieldInput = spinnerDiv.querySelector("input[customfield]");
            let customField = customFieldInput.getAttribute("customField");
            document.querySelector(`[data-custom-field-id="${customField}"]`).value = '';
            target.value = '';
            addToCart(-1 * parseInt(customFieldInput.value));
        });
    });
}

function extractIdFromUrl(url) {
    try {
        const parsedUrl = new URL(url); // Parse the URL
        const pathSegments = parsedUrl.pathname.split('/'); // Split the path into segments

        // Get the last segment which contains the ID
        const id = pathSegments[pathSegments.length - 1];
        return id; // Return the extracted ID
    } catch (error) {
        console.error('Invalid URL:', error);
        return null; // Return null if the URL is invalid
    }
}

function addLightboxEventListener() {
    const carousels = document.querySelectorAll('.no-lightbox');
    carousels.forEach(carousel => {
        const img = carousel.querySelector('img');
        if (img) {
            img.addEventListener('click', function (event) {
                if (this.closest('.no-lightbox')) {
                    event.stopPropagation(); // Prevent the event from bubbling up
                    event.preventDefault(); // Prevent the default action
                    return; // Exit the function
                }
            });
        }
    });
}

function createColumnDiv(pattern) {
    const rowDiv = document.createElement('div')
    rowDiv.classList.add('row');

    const columnDiv1 = document.createElement('div');
    columnDiv1.classList.add('column');
    columnDiv1.classList.add('canvas-column');
    const canvas = createCanvas(pattern);
    columnDiv1.appendChild(canvas);

    const columnDiv2 = document.createElement('div');
    columnDiv2.classList.add('column');
    columnDiv2.classList.add('shape-column');
    columnDiv2.classList.add('column');
    columnDiv2.classList.add('wideColumn');

    columnDiv2.innerHTML = "Shape :<br><br>" + JSON.parse(JSON.parse(pattern).value).shape;

    const columnDiv4 = document.createElement('div');
    columnDiv4.classList.add('column');
    columnDiv4.classList.add('shape-column');
    columnDiv4.classList.add('narrowColumn');
    columnDiv4.innerHTML = "Shape : " + JSON.parse(JSON.parse(pattern).value).shape;


    const columnDiv3 = document.createElement('div');
    columnDiv3.classList.add('column');
    columnDiv3.classList.add('quantity-column');

    const textDiv = createQuantitySpinner(pattern);
    columnDiv3.appendChild(textDiv);

    rowDiv.appendChild(columnDiv1);
    rowDiv.appendChild(columnDiv2);
    rowDiv.appendChild(columnDiv4);
    rowDiv.appendChild(columnDiv3);

    return rowDiv;
}

function createCanvas(pattern) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 150;
    canvas.height = 150;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high"; // You can use "low", "medium", or "high"
	
    const img = new Image();
    img.src = document.querySelector('img[alt*="base-image"]').src;
    img.onload = function () {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        processImageData(context, pattern);
    };
    return canvas;
}

function processImageData(context, pattern) {
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const data = imgData.data;
    const dominantColor = basicColor[0].baseColor;
    const changeColorArray = convertHexArrayToRgbArray(JSON.parse(JSON.parse(pattern).value).selected);
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

function createQuantitySpinner(pattern) {
    const textDiv = document.createElement('div');
    textDiv.className = 'theme-product-quantity-spinner';
    const decrementButton = createButton('theme-quantity-decrease', '');
    const incrementButton = createButton('theme-quantity-increase', '');
    const removeButton = createRemoveButton();
    const textInput = document.createElement('input');
    textInput.value = JSON.parse(JSON.parse(pattern).value).quantity;
    textInput.setAttribute('customField', JSON.parse(pattern).field);
    textInput.disabled = true;
    textInput.style.border = 'none';
    textInput.style.textAlign = 'center';
    textDiv.append(decrementButton, textInput, incrementButton);
    return textDiv;
}

function createButton(className, text) {
    const button = document.createElement('input');
    button.className = className;
    button.type = 'button';
    button.value = text;
    return button;
}

function createRemoveButton() {
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.textContent = 'X';
    return removeButton;
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

async function populatePalette() {
    const colors = await fetchColors(); // Fetch colors from the endpoint
    const fragment = document.createDocumentFragment();
    const swatchFragment = document.createDocumentFragment();

    basicColor[0].baseColor.forEach((color, index) => {
        const sectionDiv = document.createElement('div');
        const colorDiv = document.createElement('div');
        colorDiv.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

        colorDiv.style.width = '25px';
        colorDiv.style.height = '25px';
        colorDiv.className = index === 0 ? 'custom-selected-color selected' : 'custom-selected-color';

        sectionDiv.appendChild(colorDiv);
        fragment.appendChild(sectionDiv);
        colorDiv.addEventListener('click', () => {
            document.querySelector('.custom-selected-color.selected')?.classList.remove('selected');
            colorDiv.classList.add('selected');
            updateSwatches(colorDiv.style.backgroundColor);
        });
    });

    sectionSelector.appendChild(fragment);

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
    });

    // Add the color picker swatch
    const colorpicker = createColorPickerSwatch();
    swatchFragment.appendChild(colorpicker);
    paletteContainer.appendChild(swatchFragment);

}

function generateControls() {
    const sourceColors = basicColor[0].baseColor;
    const paletteColors = basicColor[0].alternativeColor;
    colorControlsContainer.innerHTML = '';
    toColorSwatchesContainer.innerHTML = '';
    const sourceContainer = document.createElement('div');
    sourceContainer.className = 'colorSwatches selected';
    sourceContainer.id = `swatches-0`;
    sourceContainer.style.backgroundImage = generateVerticalGradientPalette(sourceColors);
    toColorSwatchesContainer.appendChild(sourceContainer);
	if(configObject.customColor === true){
    paletteColors.forEach((palette, paletteIndex) => {
        const swatchContainer = document.createElement('div');
        swatchContainer.className = 'colorSwatches';
        swatchContainer.id = `swatches-${(paletteIndex + 1)}`;
        swatchContainer.style.backgroundImage = generateVerticalGradientPalette(sourceColors);
        toColorSwatchesContainer.appendChild(swatchContainer);

        swatches.push(swatchContainer);
    });

    const customContainer = document.createElement('div');
    customContainer.className = 'colorSwatches custom-color-selector';
    customContainer.id = `swatches-${(paletteColors.length + 1)}`;
    customContainer.style.backgroundImage = generateVerticalGradientPalette(sourceColors);
    customContainer.style.border = '0.5px solid black';
    customContainer.style.position = 'relative';

    const overlayImage = document.createElement('img');
    overlayImage.src = 'https://uniqtribe.github.io/Custom-Palette-min.png'; // Replace with the path to your image
    overlayImage.alt = 'Overlay Image';
    overlayImage.className = 'overlay-image';
    customContainer.appendChild(overlayImage);
    toColorSwatchesContainer.appendChild(customContainer);
    paletteColors.forEach((palette, index) => {
        populateSwatchesForIndex(index, palette);
    });
    addClickEventToSwatches();
}
}

function generateVerticalGradient(colors, isCustom = false) {
console.log("24");
    const segmentSize = 100 / colors.length;
    const gradientSegments = colors.map((color, index) => {
        const startPercent = index * segmentSize;
        const endPercent = (index + 1) * segmentSize;
        return `${color} ${startPercent}% ${endPercent}%`;
    }).join(', ');
console.log("25",gradientSegments);
    return isCustom ? `linear-gradient(to right, ${gradientSegments})` : `linear-gradient(to right, ${gradientSegments})`;
}

async function fetchColors() {
    try {
        const response = await fetch('https://uniqtribe.github.io/colors.json'); // Replace with your actual endpoint
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch colors:', error);
        return []; // Return an empty array in case of error
    }
}

function createColorPickerSwatch() {

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

    return colorpicker;
}

function populateSwatchesForIndex(index, palette) {
    const swatchContainer = swatches[index];
    swatchContainer.innerHTML = '';
    swatchContainer.style.backgroundImage = generateVerticalGradientPalette(palette);
}

function addClickEventToSwatches() {
    swatchElements = document.querySelectorAll('.colorSwatches');

    swatchElements.forEach(swatch => {

        swatch.addEventListener('click', function () {
            if (this.classList.contains('custom-color-selector') && configObject.customColor === true) {
                customColorPicker.style.display = 'block';
            } else {
                customColorPicker.style.display = 'none';
            }

            swatchElements.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            changeColor([...new Set(this.style.backgroundImage.match(/rgb\((\d+, \d+, \d+)\)/g))]);
        });
    });
}

function generateCustomSelect() {
    const hiddenSelect = document.querySelector('select[data-label="Shape"]');
    if (document.querySelector('#customSelectContainer')) {
        document.querySelector('#customSelectContainer').remove()
    }

    if (hiddenSelect) {
        const customSelectContainer = document.createElement('div');
        customSelectContainer.id = 'customSelectContainer';
        hiddenSelect.parentNode.insertBefore(customSelectContainer, hiddenSelect.nextSibling);

        let customSelectContent = '';
        Array.from(hiddenSelect.options).forEach((option, index) => {
            if (index === 0 && option.textContent.trim() === "Choose an option") {
                return;
            }
            if (configObject.shapes.includes(option.value)||configObject.shapes.includes(option.value.toLowerCase())) {
                customSelectContent += `
                    <div data-value="${option.value}">
                        ${option.textContent}
                    </div>
                `;
            }
        });

        customSelectContainer.innerHTML = '<div class="custom-select" id="customSelect">' + customSelectContent + '</div>';
        const customOptions = customSelectContainer.querySelectorAll('div[data-value]');

        customOptions.forEach(option => {
            option.addEventListener('click', function () {
                selectOption(this);
            });
        });
    } else {
        console.error('No select element found with data-label="Shape".');
    }
}

function createColorPicker() {
    rgbColorPicker = document.getElementById('rgbColorPicker');
    rgbColorPickerCtx = rgbColorPicker.getContext('2d', {
        willReadFrequently: true
    });
    const gradientH = rgbColorPickerCtx.createLinearGradient(0, 0, rgbColorPicker.width, 0);
    gradientH.addColorStop(0, 'red');
    gradientH.addColorStop(0.16, 'orange');
    gradientH.addColorStop(0.33, 'yellow');
    gradientH.addColorStop(0.5, 'green');
    gradientH.addColorStop(0.66, 'cyan');
    gradientH.addColorStop(0.83, 'blue');
    gradientH.addColorStop(1, 'magenta');
    rgbColorPickerCtx.fillStyle = gradientH;
    rgbColorPickerCtx.fillRect(0, 0, rgbColorPicker.width, rgbColorPicker.height);

    const gradientV = rgbColorPickerCtx.createLinearGradient(0, 0, 0, rgbColorPicker.height);
    gradientV.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientV.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradientV.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');
    rgbColorPickerCtx.fillStyle = gradientV;
    rgbColorPickerCtx.fillRect(0, 0, rgbColorPicker.width, rgbColorPicker.height);

    rgbColorPicker.addEventListener('mousedown', startDragging);
    rgbColorPicker.addEventListener('mousemove', duringDragging);
    rgbColorPicker.addEventListener('mouseup', stopDragging);

    rgbColorPicker.addEventListener('touchstart', startDragging, {
        passive: true
    });
    rgbColorPicker.addEventListener('touchmove', duringDragging, {
        passive: true
    });
    rgbColorPicker.addEventListener('touchend', stopDragging, {
        passive: true
    });

}

function startDragging(event) {
    isDragging = true;
    updateSelection(event);
}

function duringDragging(event) {
    if (isDragging) {
        updateSelection(event);
    }
}

function stopDragging() {
    isDragging = false;
}

function selectOption(element) {
    const customSelect = document.getElementById('customSelect');
    const hiddenSelect = document.querySelector('select[data-label="Shape"]');
    Array.from(customSelect.children).forEach(child => child.classList.remove('selected'));
    let obj = JSON.parse(target.value);
    obj.shape = element.getAttribute("data-value");
    target.value = JSON.stringify(obj);
    element.classList.add('selected');
    hiddenSelect.value = element.getAttribute('data-value');
    hiddenSelect.dispatchEvent(new Event('change')); // Trigger change if required elsewhere
}

function setCustomSelectValue(desiredValue) {
    const customSelect = document.getElementById('customSelect');
    const hiddenSelect = document.querySelector('select[data-label="Shape"]');
    const desiredOption = Array.from(customSelect.children).find(
        option => option.getAttribute('data-value') === desiredValue
    );

    if (desiredOption) {
        Array.from(customSelect.children).forEach(child => child.classList.remove('selected'));
        desiredOption.classList.add('selected');
        hiddenSelect.value = desiredValue;
    } else {
        console.error('Desired value not found in custom select options.');
    }
}

function addToCart(qty) {
    let custom_field_list = [];
    let totalQuantity = qty;
    variantRows.forEach(row => {
        let label = row.querySelector('.theme-product-variant-label.theme-custom-field-label');
        if (label?.textContent.replace("*", "").trim() === 'Shape') {
            let obj = {};
            shape = row.querySelector('select')
            obj['customfield_id'] = shape.getAttribute("data-custom-field-id");
            obj['label'] = 'Shape';
            obj['data_type'] = 'string';
            obj['value'] = shape.value;
            custom_field_list.push(obj);
        }
        if (label?.textContent.replace("*", "").trim() === 'source') {
            source = row.querySelector('input')
            let obj = {};
            source = row.querySelector('input')
            obj['customfield_id'] = target.getAttribute("data-custom-field-id");
            obj['label'] = 'source';
            obj['data_type'] = 'string';
            obj['value'] = source.value;
            custom_field_list.push(obj);
        }
        if (label?.textContent.replace("*", "").trim() === 'target') {
            let obj = {};
            target = row.querySelector('input')
            obj['customfield_id'] = target.getAttribute("data-custom-field-id");
            obj['label'] = 'target';
            obj['data_type'] = 'string';
            obj['value'] = target.value;
            custom_field_list.push(obj);
            //row.style.display = 'none';
        }
        if (label?.textContent.replace("*", "").trim().toLowerCase().startsWith('selection')) {
            let obj = {};
            let selectionField = row.querySelector('input')
            obj['customfield_id'] = selectionField.getAttribute("data-custom-field-id");
            obj['label'] = label?.textContent.replace("*", "").trim().toLowerCase();
            obj['data_type'] = 'string';
            obj['value'] = selectionField.value;
            if (selectionField.value != '') {
                custom_field_list.push(obj);
            }

            //row.style.display = 'none';        
        }
    })

    console.log("custom_field_list ", custom_field_list);

    const productData = {
        product_variant_id: productVariantId,
        quantity: totalQuantity,
        custom_fields: custom_field_list
    };

    // Setup the request payload
    const requestData = {
        url: "/storefront/api/v1/cart", // URL for adding items to the cart
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            ...zsUtils.getCSRFHeader() // Include CSRF token from zsUtils, if available
        },
        body: JSON.stringify(productData) // Convert productData to JSON for the request body
    };

    // Execute the POST request
    fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
    })
        .then(response => response.json()) // Parse the JSON response
        .then(data => {
            // Check if items are present in response payload
            const cartDetails = data.payload?.items || data.cart_details?.items;
            if (cartDetails) {
                const itemsCount = cartDetails.length;
                // Update cart UI or other elements with the new item count
                updateCartUI(itemsCount);
                let detail = {
                    cart: data,
                    productId: productVariantId,
                    view: window.zs_view || "store_page"
                }
                updateCartSuccess(detail);
                /*
                            // Dispatch success event
                            const successEvent = new CustomEvent("zp-event-add-to-cart-success", {
                                detail: {
                                    cart: data,
                                    productId: productData.productId,
                                    target: document.querySelector(`[data-id="${productData.productId}"]`) || null,  // Assuming a way to get the button or target element
                                    view: window.zs_view || "store_page"
                                }
                            });
                            document.dispatchEvent(successEvent);*/

            } else {
                // If there's a specific error, trigger failure event
                if (data.error && data.error.code === CONST.BOOKS_API_RESPONSE.STOREFRONT_CUSTOM_FIELD_ERROR) {
                    dispatchFailureEvent(data, productData.productId);
                } else {
                    // For other errors
                    handleErrorResponse(data);
                }
            }
        })
        .catch(error => {
            // Network or request-level error
            console.error("Network error:", error);
            dispatchFailureEvent({
                message: error.message
            }, productData.productId);
        });
}

function updateCartUI(itemsCount) {
    // Update any relevant UI with the updated cart count, etc.
    console.log(`Cart updated with ${itemsCount} items`);
}

function dispatchFailureEvent(responseData, productId) {
    const failureEvent = new CustomEvent("zp-event-add-to-cart-failure", {
        detail: {
            response: responseData,
            productId: productId,
            view: window.zs_view || "store_page"
        }
    });
    document.dispatchEvent(failureEvent);
}

function updateCartSuccess(e) {

    var cartAddSuccess = document.querySelectorAll('[data-cart-add-success="theme-cart-add-success"]')[0];
    var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
    var quickLookContainer = document.getElementById("product_quick_look");
    addClass(cartAddSuccess, 'theme-cart-success');
    removeClass(cartAddSuccess, 'theme-cart-success-remove');
    if (cartMsgFour) {
        addClass(cartAddSuccess, 'theme-cart-added-success');
        removeClass(cartAddSuccess, 'theme-cart-added-success-remove');
    }
    if (quickLookContainer && cartMsgFour) {
        closeProductQuickLook();
    }

    var nameContianer = document.querySelectorAll('[data-cart-add-success-prod-name="theme-cart-add-success-prod-name"]')[0];
    var imgContainer = document.querySelectorAll('[data-cart-add-success-prod-img="theme-cart-add-success-prod-img"]')[0];
    var countContainer = document.querySelectorAll('[ data-cart-add-success-count="theme-cart-add-success-prod-count"]')[0];

    var thumbnailImages = document.querySelectorAll('[data-thumbnail]');
    var thumbanailcontainer = document.querySelectorAll('[data-theme-thumbnail-container="theme-thumbnail-container-' + e.productId + '"]')[0];
    var detailImage = document.querySelectorAll('[data-detail-image="theme-detail-image"]')[0];

    var thumbcontainerProdId = document.querySelectorAll('[data-thumbnail-prod-id="' + e.productId + '"]')[0];

    if (thumbcontainerProdId) {
        var detailImageUrl = thumbcontainerProdId.querySelectorAll('[data-thumbnail-active]');
    }
    var firstImgUrl;
    if (thumbcontainerProdId) {
        for (iurl = 0; iurl < detailImageUrl.length; iurl++) {
            var imgUrl = detailImageUrl[iurl].getAttribute('data-thumbnail-active');
            if (iurl == 0) {
                detailImageUrl[iurl].click();
            }
        }
    }
    for (ti = 0; ti < thumbnailImages.length; ti++) {
        if (thumbnailImages[ti]) {
            thumbnailImages[ti].style.display = 'flex';
        }
    }
    if (thumbanailcontainer) {
        thumbanailcontainer.style.display = "flex";
    }

    if (thumbanailcontainer) {
        activeThumbnail();
    }

    var detail = e.detail;
    var variantId = e.productId;
    var lineItems = e.cart.payload.items
    var currentLineItem;

    //resetSelect(targetContainer);

    for (var lineItem of lineItems) {
        if (lineItem.variant_id == variantId) {
            currentLineItem = lineItem;
            break;
        }
    }
    if (nameContianer) {
        nameContianer.innerHTML = currentLineItem.name;
    }
    if (countContainer) {
        countContainer.innerHTML = lineItems.length;
    }
    if (currentLineItem.images) {
        var imageUrl = currentLineItem.images[0].url;
        var imageAlt = currentLineItem.images[0].alternate_text;
        var imageTitle = currentLineItem.images[0].title;
        if (!currentLineItem.images[0].is_placeholder_image) {
            imageUrl += "/5";
        }
        if (imgContainer) {
            imgContainer.setAttribute('src', imageUrl);
            imgContainer.setAttribute('alt', imageAlt);
            imgContainer.setAttribute('title', imageTitle);
        }
    }
}

function changeColor(changeColorArray) {
    let obj = {};
    obj['selected'] = changeColorArray.map(rgb => rgbToHex(rgb));
    obj['quantity'] = quantityInput.value;
    target.value = JSON.stringify(obj);

    let imgElement = document.querySelector('img[alt*="base-image"]');
    let imgData;

    if (imgElement.complete) {
        // Image is already loaded
        designCanvasCtx.clearRect(0, 0, 800, 800);
        designCanvasCtx.drawImage(imgElement, 0, 0, 800, 800);
    } else {
        imgElement.onload = () => {
            designCanvasCtx.clearRect(0, 0, 800, 800);
            designCanvasCtx.drawImage(imgElement, 0, 0, 800, 800);
        };
    }


    imgData = designCanvasCtx.getImageData(0, 0, 800, 800);
    data = imgData.data;

    const dominantColors = basicColor[0].baseColor;
    const colorHexMap = basicColor[0].baseColor.map(({ r, g, b }) => 
    `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`
);

    const colorDiffMap = dominantColors.map(color => ({
        r: Math.abs(255 - color.r),
        g: Math.abs(255 - color.g),
        b: Math.abs(255 - color.b)
    }));

    const dataLength = data.length;

    for (let i = 0; i < dataLength; i += 4) {
        const r = data[i],
            g = data[i + 1],
            b = data[i + 2];

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
    designCanvasCtx.putImageData(imgData, 0, 0);
    // Load uploaded texture

	/*
    const uploadedTexture = textureLoader.load(document.querySelector('#designCanvas').toDataURL('image/png'), function (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        object.traverse(function (child) {
            if (child.isMesh) {
                if (child.name === configObject.imageInfo.backgroundPattern) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 1,
                        depthWrite: false,
                        emissive: new THREE.Color(0xffffff),
                        emissiveIntensity: 0.3,
                        color: new THREE.Color(0xffffff)
                    });
                } else if (configObject.imageInfo.appliedPattern.includes(child.name)) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 1,
                        depthWrite: false
                    });
                }

                const textureInfo = textures.find(tex => tex.objects.includes(child.name));
                if (textureInfo) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: textureInfo.texture,
                        transparent: textureInfo.transparent
                    });
                }
                child.material.needsUpdate = true;
            }
        });
    });*/
const totalSlices = 5;

const nailSliceMap = {
  0: ['thumb', 'thumb_nail', 'Thumb_Finger'],
  1: ['index', 'index_nail', 'Index_Finger'],
  2: ['middle', 'middle_nail', 'Middle_Finger'],
  3: ['ring', 'ring_nail', 'Ring_Finger'],
  4: ['little', 'little_nail', 'Little_Finger']
};

const uploadedTexture = textureLoader.load(
  document.querySelector('#designCanvas').toDataURL('image/png'),
  function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);

    const useMultiPattern = configObject?.multipattern === true;

    object.traverse(child => {
      if (!child.isMesh) return;

      let appliedTexture = texture;
      let materialOptions = null;

      // Check for pre-defined texture override
      const textureInfo = textures.find(tex => tex.objects.includes(child.name));
      if (textureInfo) {
        appliedTexture = textureInfo.texture;
        materialOptions = {
          map: appliedTexture,
          transparent: textureInfo.transparent,
          opacity: textureInfo.transparent ? 1 : undefined,
          depthWrite: !textureInfo.transparent
        };
      } else {
        // Multi-slice logic only if multipattern and appliedPattern match, AND name includes nail keyword
        let matchedSliceIndex = null;
        const meshName = child.name.toLowerCase();

        for (const [sliceIdx, keywords] of Object.entries(nailSliceMap)) {
          if (keywords.some(keyword => meshName.includes(keyword))) {
            matchedSliceIndex = parseInt(sliceIdx);
            break;
          }
        }

        const isPatterned =
          useMultiPattern &&
          configObject.imageInfo.appliedPattern.includes(child.name) &&
          matchedSliceIndex !== null;

        if (isPatterned) {
          appliedTexture = texture.clone();
          appliedTexture.needsUpdate = true;
          appliedTexture.wrapS = THREE.RepeatWrapping;
          appliedTexture.wrapT = THREE.RepeatWrapping;

          appliedTexture.repeat.set(1 / totalSlices, 1);
          appliedTexture.offset.set(matchedSliceIndex / totalSlices, 0);

          console.log(
            `🎯 Slice ${matchedSliceIndex} applied to "${child.name}" → offset: (${appliedTexture.offset.x}, ${appliedTexture.offset.y})`
          );
        }

        // Normal full texture for backgroundPattern or if not multipattern
        if (child.name === configObject.imageInfo.backgroundPattern || !isPatterned) {
          appliedTexture = texture;
          appliedTexture.repeat.set(1, 1);
          appliedTexture.offset.set(0, 0);
        }

        materialOptions = {
          map: appliedTexture,
          transparent: true,
          opacity: 1,
          depthWrite: false
        };
      }

      // Special case for background pattern
      if (child.name === configObject.imageInfo.backgroundPattern) {
        materialOptions.emissive = new THREE.Color(0xffffff);
        materialOptions.emissiveIntensity = 0.3;
        materialOptions.color = new THREE.Color(0xffffff);
      }

      child.material = new THREE.MeshStandardMaterial(materialOptions);
      child.material.needsUpdate = true;
    });

    console.log('Finished applying textures and slicing.');
  }
);


const selectedElement = document.querySelector('#customSelect div[data-value].selected');
if (selectedElement) {
    selectedElement.click();
}
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    return "#" + result.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
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

function handleColorClick(swatch) {
    if (selectedSwatch && selectedSwatch !== swatch) { }

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

    updateCustomColor();
    
    selectedSwatch = swatch;
};

document.addEventListener('DOMContentLoaded', loadPage);

function updateCustomColor() {
    const customSelectedColorsElement = document.querySelectorAll('.custom-selected-color');
    const customSelectedColorsArray = [];
    customSelectedColorsElement.forEach(s => {
        customSelectedColorsArray.push(s.style.backgroundColor);
    });

    document.querySelector('.custom-color-selector').style.backgroundImage = generateVerticalGradient(customSelectedColorsArray.map(colorObj => colorObj));

    changeColor([...new Set(document.querySelector('.custom-color-selector').style.backgroundImage.match(/rgb\((\d+, \d+, \d+)\)/g))]);
}

function updateSelection(event) {
    const rect = rgbColorPicker.getBoundingClientRect(); // Get canvas bounding box
    const scaleX = rgbColorPicker.width / rect.width; // Canvas width to rendered width ratio
    const scaleY = rgbColorPicker.height / rect.height; // Canvas height to rendered height ratio
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    pickColor(x, y); // Call the function to pick the color
}

function pickColor(x, y) {

    x = Math.round(x);
    y = Math.round(y);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= rgbColorPicker.width) x = rgbColorPicker.width - 1;
    if (y >= rgbColorPicker.height) y = rgbColorPicker.height - 1;

    createColorPicker();

    const imageData = rgbColorPickerCtx.getImageData(x, y, 1, 1).data;
    const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;

    selectedColorDiv.style.backgroundColor = color;

    rgbColorPickerCtx.beginPath();
    rgbColorPickerCtx.arc(x, y, 5, 0, 2 * Math.PI);
    rgbColorPickerCtx.strokeStyle = '#000';
    rgbColorPickerCtx.lineWidth = 2;
    rgbColorPickerCtx.stroke();
    rgbColorPickerCtx.closePath();

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

function updateSwatches(selectedColor) {
    document.querySelectorAll('.color-swatch').forEach((swatchColor) => {
        const isActive = selectedColor === swatchColor.style.backgroundColor;
        swatchColor.className = isActive ? 'color-swatch active' : 'color-swatch';
        swatchColor.querySelector('.color-name').style.display = isActive ? 'block' : 'none';
    });
}
   function getColorDistance(c1, c2) {
      return Math.sqrt(
        Math.pow(c2[0] - c1[0], 2) +
        Math.pow(c2[1] - c1[1], 2) +
        Math.pow(c2[2] - c1[2], 2)
      );
    }

    // Function to calculate the frequency of colors in the image based on Color Thief's palette
    function calculateColorFrequency(image, palette) {
      const canvas = document.getElementById('imageCanvas');
      const ctx = canvas.getContext('2d');
        ctx.willReadFrequently = true;

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.putImageData(image, 0, 0);
     
      const pixel = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixelData = pixel.data;
      // Initialize an array to track pixel counts for each color in the palette
      let colorFrequency = new Array(palette.length).fill(0);

      // Loop over all the pixels in the image and assign them to the closest dominant color
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const pixelColor = [r, g, b];

        // Find the closest color from the palette
        let closestIndex = -1;
        let minDistance = Infinity;
        for (let j = 0; j < palette.length; j++) {
          const paletteColor = palette[j];
          const distance = getColorDistance(pixelColor, paletteColor);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = j;
          }
        }

        // Increment the count for the closest color
        colorFrequency[closestIndex]++;
      }

      // Calculate total pixels (considering RGB channels, each pixel is 4 bytes: RGBA)
      const totalPixels = pixelData.length / 4;

      // Return the colors with their frequency percentage
      return palette.map((color, index) => ({
        color,
        frequency: ((colorFrequency[index] / totalPixels) * 100).toFixed(2) // Percentage
      }));
    }

       function calculateClusterVariance(cluster) {
  // Calculate the average color of the cluster
  const avgColor = cluster.reduce(
    (acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    },
    [0, 0, 0]
  ).map(c => c / cluster.length);

  // Calculate the variance of the cluster by calculating the squared differences
  const variances = [0, 0, 0]; // Variances for R, G, B channels
  cluster.forEach(color => {
    for (let i = 0; i < 3; i++) {
      variances[i] += Math.pow(color[i] - avgColor[i], 2);
    }
  });

  // Calculate the average variance per channel
  const avgVariance = variances.map(v => v / cluster.length);

  // Combine the variances of the channels into a single value (root mean square)
  const clusterVariance = Math.sqrt(avgVariance.reduce((sum, v) => sum + v, 0));

  return clusterVariance;
}

function simpleClusterColors(palette) {
  const threshold = 100; // Adjust the threshold for more distinct clusters
  let clusters = [];

  // Start by assuming each color is its own cluster
  for (let i = 0; i < palette.length; i++) {
    let color = palette[i];
    let addedToCluster = false;

    // Check if this color is close to any existing cluster
    for (let cluster of clusters) {
      const clusterCenter = cluster[0]; // Take the first color as the cluster's center
      const distance = getColorDistance(color, clusterCenter);

      if (distance < threshold) {
        // If the color is close enough to a cluster, add it to that cluster
        cluster.push(color);
        addedToCluster = true;
        break;
      }
    }

    // If this color is not close to any existing cluster, create a new cluster for it
    if (!addedToCluster) {
      clusters.push([color]);
    }
  }

  // Compute the average color for each cluster
  const averagedColors = clusters.map(cluster => {
    const sumColor = cluster.reduce((acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    }, [0, 0, 0]);

    const avgColor = sumColor.map(c => Math.round(c / cluster.length));
    return avgColor;
  });

  // Calculate variance for each cluster
  const clusterVariances = clusters.map(cluster => calculateClusterVariance(cluster));

  // Return the average colors and their variance
  return { averagedColors, clusterVariances };
}

function getColorDistance(color1, color2) {
  const rDiff = color1[0] - color2[0];
  const gDiff = color1[1] - color2[1];
  const bDiff = color1[2] - color2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}
function calculateClusterVariance(cluster) {
  // Calculate the average color of the cluster
  const avgColor = cluster.reduce(
    (acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    },
    [0, 0, 0]
  ).map(c => c / cluster.length);

  // Calculate the variance of the cluster by calculating the squared differences
  const variances = [0, 0, 0]; // Variances for R, G, B channels
  cluster.forEach(color => {
    for (let i = 0; i < 3; i++) {
      variances[i] += Math.pow(color[i] - avgColor[i], 2);
    }
  });

  // Calculate the average variance per channel
  const avgVariance = variances.map(v => v / cluster.length);
  // Combine the variances of the channels into a single value (root mean square)
  const clusterVariance = Math.sqrt(avgVariance.reduce((sum, v) => sum + v, 0));
  return clusterVariance;
}


    function generateVerticalGradientPalette(colors, isCustom = false) {
    const segmentSize = 100 / colors.length;
    const gradientSegments = colors.map((color, index) => {
        const startPercent = index * segmentSize;
        const endPercent = (index + 1) * segmentSize;

        return `rgb(${color.r},${color.g},${color.b}) ${startPercent}% ${endPercent}%`;
    }).join(', ');

    return isCustom ? `linear-gradient(to right, ${gradientSegments})` : `linear-gradient(to right, ${gradientSegments})`;
}
function generatePalettes(palette) {
    const palettes = {
        Analogous: [],
        Complementary: [],
        Triadic: [],
        SplitComplementary: [],
        Monochromatic: [],
        Tetradic: [],
        Square: [],
        SplitTriadic: [],
        Accent: [],
        ShadesGradients: [],
        Warm: [],
        Cool: [],
        Pastel: [],
        Earthy: [],
        Neon: [],
        HighContrast: [],
        Muted: [],
        Vibrant: [],
        Gradient:[],
        Tonal:[],
        Polychromatic:[],
        Retro:[],
        Spring:[],
        Summer:[],
        Autumn:[],
        Winter:[],
        Corporate:[],
        Sporty:[],
        Minimalist:[],
        Luxury:[],
        Candy:[],
        Floral:[],
        Oceanic:[],
        Metallic:[],
        Tropical:[],
        Sunset:[],
        Galaxy:[],
        Forest:[],
        Rainbow:[],
        SciFi:[],
        Vintage:[],
        DarkMode:[],
        HighSaturation:[],
        LowSaturation:[],
        Ethnic:[],
        Industrial:[],
        NatureInspired:[],
        Solar:[],
        Aurora:[],
        Citrus:[],
        SandAndSea:[],
        Desert:[],
        Ice:[],
        Fire:[],
        JewelTone:[],
        VintageCinema:[],
        Futuristic:[],
        AutumnLeaves:[],
        WinterWonderland:[],
        SpringBlossom:[],
        SummerSky:[],
        Underwater:[],
        Coffee:[],
        Rustic:[],
        Festival:[],
        Royal:[],
        Cyberpunk:[],
        NaturesHarvest:[],
        Urban:[],
        GalaxyNight:[],
        FloralPastel:[],
        OceanSunset:[],
        Greyscale:[],
        RainbowPastel:[],
        MutedEarth:[],
        ForestTwilight:[],
        Polar:[],
        Peacock:[],
        PixelArt:[],
        GradientSpectrum:[],
        FlatUI:[],
        SciFiNeon:[],
        MetalAndStone:[],
        Weather:[],
        ComicBook:[],
        MinimalistNeutral:[],
        CandyCoated:[],
        Gothic:[],
        Garden:[],
        FrostedGlass:[],
        Painterly:[],
        ShadowAndLight:[],
        NightSky:[],
        CoralReef:[],
        Marble:[],
        Smoke:[],
        StainedGlass:[],
        MinimalEarth:[],
      
    };

    const paletteLength = palette.length;

    palette.forEach(([r, g, b], i) => {
        const [h, s, v] = rgbToHsv(r, g, b);

        // Analogous: Evenly distribute angles
        const analogousOffset = 30 * (i % 2 === 0 ? 1 : -1);
        palettes.Analogous.push(hsvToRgb((h + analogousOffset) % 360, s, v));

        // Complementary
        palettes.Complementary.push(hsvToRgb((h + 180) % 360, s, v));

        // Triadic: Use offsets spaced by 120 degrees
        const triadicOffset = 120 * ((i % 3) - 1);
        palettes.Triadic.push(hsvToRgb((h + triadicOffset + 360) % 360, s, v));

        // Split Complementary
        const splitOffset = 150 * (i % 2 === 0 ? 1 : -1);
        palettes.SplitComplementary.push(hsvToRgb((h + splitOffset) % 360, s, v));

        // Monochromatic: Lighter and darker variations
        palettes.Monochromatic.push(hsvToRgb(h, s, Math.min(v + (i + 1) * 0.1, 1)));

        // Tetradic: Use two complementary pairs
        const tetradicOffsets = [0, 180, 90, -90];
        palettes.Tetradic.push(hsvToRgb((h + tetradicOffsets[i % 4] + 360) % 360, s, v));

        // Square: Four evenly spaced
        palettes.Square.push(hsvToRgb((h + (i * 90) % 360) % 360, s, v));

        // Split Triadic
        palettes.SplitTriadic.push(hsvToRgb((h + splitOffset) % 360, s, v));

        // Accent: Alternate complementary or triadic offsets
        const accentOffset = 180 - (i % 2 === 0 ? 30 : -30);
        palettes.Accent.push(hsvToRgb((h + accentOffset) % 360, s, v));

        // Shades/Gradients
        palettes.ShadesGradients.push(hsvToRgb(h, s, v * (1 - i * 0.2)));

        // Warm and Cool
        palettes.Warm.push(hsvToRgb((h + 30) % 360, s, v)); // Warm
        palettes.Cool.push(hsvToRgb((h + 180) % 360, s, v)); // Cool

        // Pastel
        palettes.Pastel.push(hsvToRgb(h, 0.3, Math.min(v + (i + 1) * 0.2, 1)));

        // Earthy
        palettes.Earthy.push(hsvToRgb(h, s * 0.5, v * 0.7));

        // Neon
        palettes.Neon.push(hsvToRgb(h, 1, 1));

        // High Contrast
        palettes.HighContrast.push(hsvToRgb((h + 180) % 360, s, Math.max(v - 0.2, 0)));

        // Muted
        palettes.Muted.push(hsvToRgb(h, s * 0.5, v * 0.8));

        // Vibrant
        palettes.Vibrant.push(hsvToRgb(h, 1, Math.min(v + 0.3, 1)));

         // Gradient Palette: Smooth transitions between input colors.
    palettes.Gradient.push(hsvToRgb(h, s, Math.min(v + 0.3, 1)));

// Tonal Palette: Variations of brightness and saturation for each color.
palettes.Tonal.push(hsvToRgb(h, s, Math.min(v + 0.2, 1)));

// Polychromatic Palette: Multiple colors spread across the color wheel.
const polychromaticOffset = 45 * (i % 2 === 0 ? 1 : -1);
palettes.Polychromatic.push(hsvToRgb((h + polychromaticOffset) % 360, s, v));

// Retro Palette: Muted, vintage-inspired tones.
palettes.Retro.push(hsvToRgb(h, s * 0.6, Math.min(v + 0.1, 1)));

// Seasonal Palettes:
// Spring: Light pastels.
palettes.Spring.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.4, 1)));

// Summer: Warm and vivid tones.
palettes.Summer.push(hsvToRgb(h, s, Math.min(v + 0.2, 1)));

// Autumn: Earthy and deep colors.
palettes.Autumn.push(hsvToRgb(h, s * 0.7, v * 0.8));

// Winter: Cool and icy tones.
palettes.Winter.push(hsvToRgb(h, s * 0.5, Math.min(v - 0.1, 1)));

// Corporate Palette: Neutral and muted professional tones.
palettes.Corporate.push(hsvToRgb(h, s * 0.5, v * 0.6));

// Sporty Palette: Bold and energetic colors.
palettes.Sporty.push(hsvToRgb(h, s, Math.min(v + 0.5, 1)));

// Minimalist Palette: Soft, neutral, or monochromatic tones.
palettes.Minimalist.push(hsvToRgb(h, s * 0.2, Math.min(v + 0.1, 1)));

// Luxury Palette: Deep, rich tones like gold and jewels.
palettes.Luxury.push(hsvToRgb(h, s, Math.min(v + 0.4, 1)));

// Candy Palette: Bright and playful tones inspired by candy.
palettes.Candy.push(hsvToRgb(h, 1, Math.min(v + 0.6, 1)));

// Floral Palette: Pastel and vivid bloom-inspired tones.
palettes.Floral.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.2, 1)));

// Oceanic Palette: Blues, teals, and greens inspired by the sea.
palettes.Oceanic.push(hsvToRgb((h + 120) % 360, s, Math.min(v + 0.3, 1)));

 // Metallic Palette: Gold, silver, bronze, and other reflective tones.
 const metallicHues = [45, 0, 30]; // Approximate hues for gold, silver, and bronze
    palettes.Metallic.push(hsvToRgb(metallicHues[i % 3], s * 0.8, v * 0.9));

    // Tropical Palette: Vibrant and lush colors inspired by tropical flora and fauna.
    palettes.Tropical.push(hsvToRgb(h, 1, Math.min(v + 0.3, 1)));

    // Sunset Palette: Warm gradients of orange, pink, and purple.
    const sunsetOffset = 60 * (i % 3); // Gradual transitions across orange, pink, and purple
    palettes.Sunset.push(hsvToRgb((h + sunsetOffset) % 360, Math.min(s + 0.2, 1), v));

    // Galaxy Palette: Dark purples, blues, and bright star-like accents.
    const galaxyHues = [270, 240, 300]; // Purples and blues
    palettes.Galaxy.push(hsvToRgb(galaxyHues[i % 3], s, Math.min(v - 0.2 + (i % 2) * 0.4, 1)));

    // Forest Palette: Greens, browns, and natural tones of the forest.
    const forestHues = [120, 30]; // Greens and browns
    palettes.Forest.push(hsvToRgb(forestHues[i % 2], s * 0.7, v * 0.8));

    // Rainbow Palette: All colors of the spectrum.
    const rainbowStep = (360 / palette.length) * i;
    palettes.Rainbow.push(hsvToRgb(rainbowStep, 1, 1));

    // Sci-Fi Palette: Futuristic and neon-inspired, with glowing effects.
    palettes.SciFi.push(hsvToRgb(h, 1, Math.min(v + 0.5, 1)));

    // Vintage Palette: Desaturated colors inspired by old photos and posters.
    palettes.Vintage.push(hsvToRgb(h, s * 0.5, v * 0.7));

    // Dark Mode Palette: Primarily dark tones with pops of bright accents.
    if (i % 4 === 0) {
        palettes.DarkMode.push(hsvToRgb(h, s, Math.min(v + 0.5, 1))); // Bright accent
    } else {
        palettes.DarkMode.push(hsvToRgb(h, s * 0.2, v * 0.4)); // Dark tone
    }

    // High Saturation Palette: Extremely vivid and intense colors.
    palettes.HighSaturation.push(hsvToRgb(h, 1, v));

    // Low Saturation Palette: Muted, almost grayscale colors.
    palettes.LowSaturation.push(hsvToRgb(h, s * 0.2, v * 0.8));

    // Ethnic Palette: Traditional color schemes inspired by specific cultures or regions.
    const ethnicHues = [0, 60, 120, 240]; // Reds, yellows, greens, and blues
    palettes.Ethnic.push(hsvToRgb(ethnicHues[i % 4], s, v));

    // Industrial Palette: Greys, blacks, and metallic colors for a modern aesthetic.
    palettes.Industrial.push(hsvToRgb(h, s * 0.1, v * (0.5 + (i % 2) * 0.3)));

    // Nature-Inspired Palette: Earthy greens, sky blues, and natural browns.
    const natureHues = [120, 210, 30]; // Greens, blues, browns
    palettes.NatureInspired.push(hsvToRgb(natureHues[i % 3], s * 0.7, v * 0.9));

    // Solar Palette: Warm yellows, oranges, and fiery reds.
    const solarHues = [45, 30, 0]; // Yellows, oranges, reds
    palettes.Solar.push(hsvToRgb(solarHues[i % 3], s, v));

    // Aurora Palette: Shades of green, blue, and purple inspired by the northern lights.
    const auroraHues = [120, 180, 270]; // Greens, blues, purples
    palettes.Aurora.push(hsvToRgb(auroraHues[i % 3], s * 0.8, Math.min(v + 0.3, 1)));

    // Citrus Palette: Fresh, tangy yellows, oranges, and greens.
    const citrusHues = [60, 30, 120]; // Yellows, oranges, greens
    palettes.Citrus.push(hsvToRgb(citrusHues[i % 3], s, v));

    // Sand and Sea Palette: Beige, blue, and turquoise inspired by beaches.
    const sandSeaHues = [30, 210, 180]; // Beige, blue, turquoise
    palettes.SandAndSea.push(hsvToRgb(sandSeaHues[i % 3], s * 0.5, Math.min(v + 0.2, 1)));

     // Desert Palette: Warm sandy tones with orange and light brown.
     const desertHues = [30, 30]; // Oranges and browns
    palettes.Desert.push(hsvToRgb(desertHues[i % 2], s * 0.8, v * 0.9));

    // Ice Palette: Cool, frosty whites, blues, and light greys.
    const iceHues = [200, 210]; // Blues and cool tones
    palettes.Ice.push(hsvToRgb(iceHues[i % 2], s * 0.5, Math.min(v + 0.3, 1)));

    // Fire Palette: Reds, oranges, and yellows, inspired by flames.
    const fireHues = [0, 30, 60]; // Reds, oranges, yellows
    palettes.Fire.push(hsvToRgb(fireHues[i % 3], s, v));

    // Jewel Tone Palette: Rich, saturated colors like emerald, ruby, sapphire, and amethyst.
    const jewelHues = [120, 0, 240, 270]; // Emerald, ruby, sapphire, amethyst
    palettes.JewelTone.push(hsvToRgb(jewelHues[i % 4], 1, 1));

    // Vintage Cinema Palette: Sepia tones, faded blacks, and muted whites.
    palettes.VintageCinema.push(hsvToRgb(h, s * 0.5, v * 0.6));

    // Futuristic Palette: Neon greens, silvers, and bold contrasts for a tech-inspired look.
    const futuristicHues = [120, 0, 240]; // Neon greens, silvers, bold contrasts
    palettes.Futuristic.push(hsvToRgb(futuristicHues[i % 3], 1, Math.min(v + 0.5, 1)));

    // Autumn Leaves Palette: Warm reds, oranges, yellows, and browns.
    const autumnHues = [0, 30, 60, 30]; // Reds, oranges, yellows, browns
    palettes.AutumnLeaves.push(hsvToRgb(autumnHues[i % 4], s, Math.min(v + 0.3, 1)));

    // Winter Wonderland Palette: Whites, icy blues, and pale greys.
    const winterHues = [200, 210]; // Icy blues and whites
    palettes.WinterWonderland.push(hsvToRgb(winterHues[i % 2], s * 0.5, Math.min(v + 0.3, 1)));

    // Spring Blossom Palette: Soft pinks, fresh greens, and light yellows.
    const springHues = [330, 120, 60]; // Soft pinks, greens, yellows
    palettes.SpringBlossom.push(hsvToRgb(springHues[i % 3], 1, Math.min(v + 0.4, 1)));

    // Summer Sky Palette: Vivid blues, whites, and soft purples.
    const summerHues = [210, 240, 270]; // Blues, purples
    palettes.SummerSky.push(hsvToRgb(summerHues[i % 3], 1, v));

    // Underwater Palette: Deep blues, aquas, and hints of coral pink.
    const underwaterHues = [200, 190, 10]; // Blues, aquas, coral pinks
    palettes.Underwater.push(hsvToRgb(underwaterHues[i % 3], s, v));

    // Coffee Palette: Browns, tans, and cream tones, inspired by coffee.
    const coffeeHues = [30, 15, 0]; // Browns, tans, creams
    palettes.Coffee.push(hsvToRgb(coffeeHues[i % 3], s * 0.7, v * 0.8));

    // Rustic Palette: Earthy tones like olive green, terracotta, and brick red.
    const rusticHues = [120, 30, 0]; // Olive greens, terracotta, brick red
    palettes.Rustic.push(hsvToRgb(rusticHues[i % 3], s, v));

    // Festival Palette: Bright, vivid colors like hot pink, orange, and yellow.
    const festivalHues = [330, 30, 60]; // Hot pink, orange, yellow
    palettes.Festival.push(hsvToRgb(festivalHues[i % 3], 1, Math.min(v + 0.3, 1)));

    // Royal Palette: Deep purples, golds, and midnight blues.
    const royalHues = [270, 45, 240]; // Deep purples, golds, midnight blues
    palettes.Royal.push(hsvToRgb(royalHues[i % 3], 1, v));

    // Cyberpunk Palette: Neon pinks, purples, blues, and greens on dark backgrounds.
    const cyberpunkHues = [330, 240, 180, 120]; // Neon pinks, purples, greens, blues
    palettes.Cyberpunk.push(hsvToRgb(cyberpunkHues[i % 4], 1, Math.min(v + 0.5, 1)));

    // Nature’s Harvest Palette: Yellows, greens, and browns inspired by crops and fields.
    const harvestHues = [60, 120, 30]; // Yellows, greens, browns
    palettes.NaturesHarvest.push(hsvToRgb(harvestHues[i % 3], s, v));

    // Urban Palette: Greys, blacks, and concrete-inspired neutral tones.
    const urbanHues = [0, 0, 0]; // Greys, blacks
    palettes.Urban.push(hsvToRgb(urbanHues[i % 2], s * 0.3, v * 0.6));

    // Galaxy Night Palette: Deep blues, purples, and bright starry whites.
    const galaxyNightHues = [240, 270, 0]; // Deep blues, purples, whites
    palettes.GalaxyNight.push(hsvToRgb(galaxyNightHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Floral Pastel Palette: Light pinks, lavenders, and mint greens.
    const floralPastelHues = [330, 270, 120]; // Pinks, lavenders, mint greens
    palettes.FloralPastel.push(hsvToRgb(floralPastelHues[i % 3], 0.3, Math.min(v + 0.3, 1)));

    // Ocean Sunset Palette: Oranges, pinks, and deep blues fading into one another.
    const oceanSunsetHues = [30, 330, 240]; // Oranges, pinks, blues
    palettes.OceanSunset.push(hsvToRgb(oceanSunsetHues[i % 3], s, Math.min(v + 0.4, 1)));

    // Greyscale Palette: A full range of grey tones from black to white.
    palettes.Greyscale.push(hsvToRgb(h, 0, v));

    // Rainbow Pastel Palette: Softened versions of the rainbow.
    const rainbowPastelStep = (360 / palette.length) * i;
    palettes.RainbowPastel.push(hsvToRgb(rainbowPastelStep, 0.2, Math.min(v + 0.4, 1)));

    // Muted Earth Palette: Subdued greens, browns, and creams for a grounded feel.
    const mutedEarthHues = [120, 30, 60]; // Greens, browns, creams
    palettes.MutedEarth.push(hsvToRgb(mutedEarthHues[i % 3], s * 0.5, v * 0.7));

    // Forest Twilight Palette: Dark greens, blues, and hints of yellow or orange.
    const twilightHues = [120, 240, 30]; // Dark greens, blues, yellows
    palettes.ForestTwilight.push(hsvToRgb(twilightHues[i % 3], s, v));

    // Polar Palette: Bright whites and light blues with darker navy accents.
    const polarHues = [0, 210, 240]; // Whites, blues, navy
    palettes.Polar.push(hsvToRgb(polarHues[i % 3], s * 0.5, v));

    // Peacock Palette: Vibrant greens, blues, and purples inspired by peacock feathers.
    const peacockHues = [120, 200, 270]; // Greens, blues, purples
    palettes.Peacock.push(hsvToRgb(peacockHues[i % 3], s, Math.min(v + 0.2, 1)));

     // Pixel Art Palette: Limited colors with high contrast, inspired by retro games.
     const pixelArtHues = [0, 30, 210, 240]; // Primary and high-contrast tones
    palettes.PixelArt.push(hsvToRgb(pixelArtHues[i % 4], 1, v > 0.5 ? 1 : 0.5));

    // Gradient Spectrum Palette: Full gradient transitions between all colors.
    const gradientStep = (360 / palette.length) * i;
    palettes.GradientSpectrum.push(hsvToRgb(gradientStep, 1, 1));

    // Flat UI Palette: Minimalist colors for modern interface designs.
    const flatUIHues = [210, 120, 45, 15]; // Cool blues, greens, and soft oranges
    palettes.FlatUI.push(hsvToRgb(flatUIHues[i % 4], 0.6, 0.8));

    // Sci-Fi Neon Palette: Futuristic neon combinations like teal, magenta, and black.
    const sciFiHues = [180, 300, 0]; // Teal, magenta, black accents
    palettes.SciFiNeon.push(hsvToRgb(sciFiHues[i % 3], 1, v > 0.7 ? 1 : v * 0.5));

    // Metal and Stone Palette: Greys, silvers, and deep browns with metallic accents.
    palettes.MetalAndStone.push(hsvToRgb(h, 0.2, v * 0.6));

    // Weather Palette: Soft greys, whites, and blues for cloudy or rainy themes.
    const weatherHues = [210, 220, 0]; // Soft blues and greys
    palettes.Weather.push(hsvToRgb(weatherHues[i % 3], 0.3, Math.min(v + 0.4, 1)));

    // Comic Book Palette: Bright primary colors with strong contrast and bold outlines.
    const comicHues = [0, 60, 240]; // Red, yellow, blue
    palettes.ComicBook.push(hsvToRgb(comicHues[i % 3], 1, 1));

    // Minimalist Neutral Palette: Subtle greys, whites, and soft pastels.
    palettes.MinimalistNeutral.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.2, 1)));

    // Candy-Coated Palette: Bright, sugary colors like bubblegum pink and candy apple red.
    const candyHues = [330, 0, 60]; // Bubblegum pink, red, yellow
    palettes.CandyCoated.push(hsvToRgb(candyHues[i % 3], 0.9, 1));

    // Gothic Palette: Deep blacks, purples, and reds for dramatic flair.
    const gothicHues = [270, 0]; // Purples and reds
    palettes.Gothic.push(hsvToRgb(gothicHues[i % 2], s, v * 0.6));

    // Garden Palette: Greens, soft florals, and earthy browns.
    const gardenHues = [120, 90, 30]; // Greens, florals, browns
    palettes.Garden.push(hsvToRgb(gardenHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Frosted Glass Palette: Pastels with a soft translucent effect.
    palettes.FrostedGlass.push(hsvToRgb(h, s * 0.4, v * 0.8));

    // Painterly Palette: Colors mimicking brush strokes, with soft blending and vibrant hues.
    palettes.Painterly.push(hsvToRgb(h, s * 0.7, v * 0.9));

    // Shadow and Light Palette: High-contrast blacks and whites with soft in-betweens.
    palettes.ShadowAndLight.push(hsvToRgb(h, 0, v > 0.5 ? 1 : v * 0.4));

    // Night Sky Palette: Deep blues, purples, and bright stars.
    const nightSkyHues = [240, 270, 0]; // Deep blues, purples, whites
    palettes.NightSky.push(hsvToRgb(nightSkyHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Coral Reef Palette: Vibrant coral, teal, and seafoam greens.
    const coralHues = [15, 180, 160]; // Coral, teal, seafoam
    palettes.CoralReef.push(hsvToRgb(coralHues[i % 3], s, Math.min(v + 0.5, 1)));

    // Marble Palette: White, grey, and subtle veins of black or gold.
    const marbleHues = [0, 45, 0]; // Gold accents, whites, greys
    palettes.Marble.push(hsvToRgb(marbleHues[i % 3], s * 0.2, Math.min(v + 0.5, 1)));

    // Smoke Palette: Subtle greys, whites, and very light blues or purples.
    const smokeHues = [210, 220, 270]; // Greys, whites, light blues
    palettes.Smoke.push(hsvToRgb(smokeHues[i % 3], s * 0.2, v * 0.8));

    // Stained Glass Palette: Bright primary and secondary colors with dark dividing lines.
    const stainedGlassHues = [0, 60, 120, 240]; // Red, yellow, green, blue
    palettes.StainedGlass.push(hsvToRgb(stainedGlassHues[i % 4], 1, v));

    // Minimal Earth Palette: A more subdued take on earthy tones.
    const minimalEarthHues = [90, 30, 60]; // Muted greens, browns, and creams
    palettes.MinimalEarth.push(hsvToRgb(minimalEarthHues[i % 3], s * 0.5, v * 0.8));

   
    
    });

    /*
    generatePaletteStructure(palettes.Analogous);
    generatePaletteStructure(palettes.Complementary);
    generatePaletteStructure(palettes.Triadic);
    generatePaletteStructure(palettes.SplitComplementary);
    generatePaletteStructure(palettes.Tetradic);
    
    generatePaletteStructure(palettes.Square);
    generatePaletteStructure(palettes.SplitTriadic);
    generatePaletteStructure(palettes.Accent);
    generatePaletteStructure(palettes.ShadesGradients);
    generatePaletteStructure(palettes.Warm);
    generatePaletteStructure(palettes.Cool);
    generatePaletteStructure(palettes.Pastel);
    generatePaletteStructure(palettes.Earthy);
    generatePaletteStructure(palettes.Neon);
    generatePaletteStructure(palettes.HighContrast);
    generatePaletteStructure(palettes.Muted);
    generatePaletteStructure(palettes.Vibrant);
    generatePaletteStructure(palettes.Retro);
    generatePaletteStructure(palettes.Spring);
    generatePaletteStructure(palettes.Summer);
    generatePaletteStructure(palettes.Autumn);
    generatePaletteStructure(palettes.Winter);
    generatePaletteStructure(palettes.Corporate);
    generatePaletteStructure(palettes.Sporty);
    generatePaletteStructure(palettes.Minimalist);
    generatePaletteStructure(palettes.Luxury);
    generatePaletteStructure(palettes.Candy);
    generatePaletteStructure(palettes.Floral);
    generatePaletteStructure(palettes.Oceanic);
    generatePaletteStructure(palettes.Metallic);
    generatePaletteStructure(palettes.Tropical);
    generatePaletteStructure(palettes.Sunset);
    generatePaletteStructure(palettes.Galaxy);
    generatePaletteStructure(palettes.Forest);
    generatePaletteStructure(palettes.Rainbow);
    generatePaletteStructure(palettes.SciFi);
    generatePaletteStructure(palettes.Vintage);
    generatePaletteStructure(palettes.DarkMode);
    generatePaletteStructure(palettes.HighSaturation);
    generatePaletteStructure(palettes.LowSaturation);
    generatePaletteStructure(palettes.Ethnic);
    generatePaletteStructure(palettes.Industrial);
    generatePaletteStructure(palettes.NatureInspired);
    generatePaletteStructure(palettes.Solar);
    generatePaletteStructure(palettes.Aurora);
    generatePaletteStructure(palettes.Citrus);
    generatePaletteStructure(palettes.SandAndSea);   
    
    generatePaletteStructure(palettes.Desert);   
    generatePaletteStructure(palettes.Ice);   
    generatePaletteStructure(palettes.Fire);   
    generatePaletteStructure(palettes.JewelTone);   
    generatePaletteStructure(palettes.VintageCinema);   
    generatePaletteStructure(palettes.Futuristic);   
    generatePaletteStructure(palettes.AutumnLeaves);   
    generatePaletteStructure(palettes.WinterWonderland);   
    generatePaletteStructure(palettes.SpringBlossom);   
    generatePaletteStructure(palettes.SummerSky);   
    generatePaletteStructure(palettes.Underwater);   
    generatePaletteStructure(palettes.Coffee);   
    generatePaletteStructure(palettes.Rustic);   
    generatePaletteStructure(palettes.Festival);   
    generatePaletteStructure(palettes.Royal);   
    generatePaletteStructure(palettes.Cyberpunk);   
    generatePaletteStructure(palettes.NaturesHarvest);   
    generatePaletteStructure(palettes.Urban);   
    generatePaletteStructure(palettes.GalaxyNight);   
    generatePaletteStructure(palettes.FloralPastel);   
    generatePaletteStructure(palettes.OceanSunset);   
    generatePaletteStructure(palettes.Greyscale);   
    generatePaletteStructure(palettes.RainbowPastel);   
    generatePaletteStructure(palettes.MutedEarth);   
    generatePaletteStructure(palettes.ForestTwilight);   
    generatePaletteStructure(palettes.Polar);   
    generatePaletteStructure(palettes.Peacock);   

    generatePaletteStructure(palettes.PixelArt);   
    generatePaletteStructure(palettes.GradientSpectrum);   
    generatePaletteStructure(palettes.FlatUI);   
    generatePaletteStructure(palettes.SciFiNeon);   
    generatePaletteStructure(palettes.MetalAndStone);   
    generatePaletteStructure(palettes.Weather);   
    generatePaletteStructure(palettes.ComicBook);   
    generatePaletteStructure(palettes.MinimalistNeutral);   
    generatePaletteStructure(palettes.CandyCoated);   
    generatePaletteStructure(palettes.Gothic);   
    generatePaletteStructure(palettes.Garden);   
    generatePaletteStructure(palettes.FrostedGlass);   
    generatePaletteStructure(palettes.Painterly);   
    generatePaletteStructure(palettes.ShadowAndLight);   
    generatePaletteStructure(palettes.NightSky);   
    generatePaletteStructure(palettes.CoralReef);   
    generatePaletteStructure(palettes.Marble);   
    generatePaletteStructure(palettes.Smoke);   
    generatePaletteStructure(palettes.StainedGlass);   
    generatePaletteStructure(palettes.MinimalEarth);   

*/
    

    return palettes;
}


// Helper functions
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h, s, v = max;

    if (delta === 0) h = 0;
    else if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    s = max === 0 ? 0 : delta / max;

    return [h, s, v];
}

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}
function generatePaletteStructure(palette){
    const colorDiv = document.createElement('div');
                    // Construct the gradient string with the colors and positions
                    colorDiv.className = 'colorSwatches';
                    colorDiv.style.backgroundImage =generateVerticalGradientPalette(palette);
                    colorDiv.style.padding = '10px';
                    colorDiv.style.margin = '5px';
                    colorDiv.style.height = '50px'; // Adjust the height as needed for visual appeal

                    // Append the colorDiv to the document body
                    document.body.appendChild(colorDiv);
}

function calculateEuclideanDistance(arr1, arr2) {
  const rDiff = arr1[0] - arr2[0];
  const gDiff = arr1[1] - arr2[1];
  const bDiff = arr1[2] - arr2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function arePalettesSimilar(palette1, palette2, threshold = 100) {
  // Compare all color arrays in the palettes
  for (let i = 0; i < palette1.length; i++) {
    let isColorSimilar = false;
    for (let j = 0; j < palette2.length; j++) {
      const distance = calculateEuclideanDistance(palette1[i], palette2[j]);
      if (distance <= threshold) {
        isColorSimilar = true;
        break;
      }
    }
    if (isColorSimilar) continue;
    else return false; // If any color in palette1 doesn't match palette2, return false
  }
  return true;  // All colors in palette1 are similar to palette2
}

function areColorsSimilar(color1, color2, threshold = 10) {
  const distance = calculateEuclideanDistance(color1, color2);
  return distance <= threshold;
}

function waitForImageToLoad(altText, callback) {
    var img = document.querySelector('img[alt*="' + altText + '"]');

    if (img.complete && img.naturalHeight !== 0) {
        callback(); // Image is already loaded
    } else {
        img.onload = callback; // Wait for load
    }
}


function removePalettesWithSimilarColors(palette) {
  const uniqueColoredPalettes = [];
  const removedColoredPalettes = [];

  const paletteValues = Object.values(palette);

  // Loop over each palette and check if any of its colors are similar
  paletteValues.forEach((currentPalette, index) => {
    let isPaletteRemoved = false;

    // Compare each color in the current palette with every other color in the same palette
    for (let i = 0; i < currentPalette.length; i++) {
      for (let j = i + 1; j < currentPalette.length; j++) {
        if (areColorsSimilar(currentPalette[i], currentPalette[j])) {
          isPaletteRemoved = true;
          break;
        }
      }
      if (isPaletteRemoved) break;
    }

    // If no similar colors were found, keep the palette, otherwise remove it
    if (isPaletteRemoved) {
      const paletteName = Object.keys(palette)[index];
      removedColoredPalettes.push({ [paletteName]: currentPalette });
    } else {
        uniqueColoredPalettes.push(currentPalette);
    }
  });
console.log("uniquePalettes123",uniqueColoredPalettes)
  return { uniqueColoredPalettes, removedColoredPalettes };
}




let startX = 0;
let currentIndex = 0;

function alterPalette(){
document.querySelector('#image-gallery').style.display = 'none';

const slider = document.querySelector('.theme-product-detail-image');
slider.addEventListener('touchstart', handleTouchStart, false);
slider.addEventListener('touchmove', handleTouchMove, false);
slider.addEventListener('touchend', handleTouchEnd, false);
document.querySelector('.theme-rating-review-container').prepend(document.querySelector('.customColorPickerPalette'));
}
function handleTouchStart(e) {
  isTouching = true;
  const touchStart = e.touches[0];  // Get the touch start position
  startX = touchStart.clientX;
}

// Function to handle the touch move (tracking the swipe)
function handleTouchMove(e) {
  if (!isTouching) return; // Ignore if not currently touching
  const touchMove = e.touches[0];
  const moveX = touchMove.clientX;

  // You can use moveX here to see the dragging progress (optional)
}

// Function to handle the end of the touch (when swipe is finished)
function handleTouchEnd(e) {
  if (!isTouching) return; // Ignore if not currently touching
  const touchEnd = e.changedTouches[0];
  const endX = touchEnd.clientX;

  // Detect swipe direction (left or right)
  if (startX > endX + 50) {
    // Swipe left
   // swipeDirectionText.textContent = "Swipe detected: Left";
    triggerSlide('left');
  } else if (startX < endX - 50) {
    // Swipe right
   // swipeDirectionText.textContent = "Swipe detected: Right";
    triggerSlide('right');
  }

  isTouching = false;  // Reset touch tracking
}

// Function to trigger the slide based on swipe direction
function triggerSlide(direction) {
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;

  if (direction === 'left') {
moveSelection(1);
 } else if (direction === 'right') {
moveSelection(-1);

  }

  // Apply the slide transition by changing the transform property
 // slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveSelection(direction) {
console.log("totalImages1");

const images =document.querySelector('#image-gallery').querySelectorAll('img');
const totalImages = images.length;
console.log("totalImages", totalImages);

  let newIndex = currentIndex + direction;

  // Prevent going out of bounds
  if (newIndex < 0 || newIndex >= totalImages) return;

  // Remove previous selection
  images[currentIndex].classList.remove('selected');

  // Update index
  currentIndex = newIndex;

  // Simulate click on the new image
  images[currentIndex].click();

  // Add selection highlight
  images[currentIndex].classList.add('selected');
}
