<script>
let isDragging = false;
let selection = [];
let patternSelection;
let productVariantId;
let swatches = [];
let selectedSwatch;

function loadPage() {

    let varientContainer = document.querySelector('.theme-product-detail-varients-container');

    if (varientContainer) {
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
        imgElement = document.querySelector('img[alt="base-image"]');

        (function() {
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
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

        (function() {
            const originalXHR = window.XMLHttpRequest;

            function newXHR() {
                const realXHR = new originalXHR();

                // Declare requestMethod here
                let requestMethod = '';

                // Override the original open method to capture the method and URL
                const originalOpen = realXHR.open;
                realXHR.open = function(method, url) {
                    requestMethod = method; // Save the method
                    return originalOpen.apply(this, arguments);
                };

                realXHR.addEventListener('readystatechange', function() {
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

        document.addEventListener("cartUpdated", function(event) {
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
            <div class="overlay" id="overlay">
                <div class="loader">
                    <div class="bounce"></div>
                    <div class="bounce"></div>
                    <div class="bounce"></div>
                </div>
            </div>
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

        loader.load(configObject.imageInfo.objectPath, function(gltf) {
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
            const uploadedTexture = textureLoader.load(document.querySelector('#designCanvas').toDataURL('image/png'),
                function(texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);

                    object.traverse(function(child) {
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

            camera.position.set(center.x, center.y, 10);
            camera.lookAt(center);

            const animate = function() {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();

        }, undefined, function(error) {
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
        const baseImgElement = document.querySelector('img[alt="base-image"]');
        imageGallery.append(baseImgElement);

        baseImgElement.addEventListener('click', () => {
            // Remove all images and show the canvas container
            productImage.querySelectorAll('img').forEach(img => img.remove());
            renderedImage.style.display = 'block';
        });

        configObject.commonImages.forEach(imageUrl => {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = "Common Image";

            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('image-wrapper')
            // Append the image element to the gallery
            imgWrapper.appendChild(imgElement);
            imageGallery.append(imgWrapper);

            // Attach the click handler
            handleImageClick(imgWrapper, imageUrl);
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
    }
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
}

function loadBasicField() {
    let obj = {}
    obj['selected'] = configObject.dominantColors.map(parseColor).map(rgb => rgbArrayToHex(rgb));
    obj['quantity'] = 1;
    obj['shape'] = '';
    target.value = JSON.stringify(obj);
    let object = {};
    object['source'] = configObject.dominantColors.map(parseColor).map(rgb => rgbArrayToHex(rgb));
    source.value = JSON.stringify(object);
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
    container.innerHTML = ''; // Clear existing content
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
        button.addEventListener('click', function() {
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
        button.addEventListener('click', function() {
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
        button.addEventListener('click', function() {
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
            img.addEventListener('click', function(event) {
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
    const img = new Image();
    img.src = document.querySelector('img[alt="base-image"]').src;
    img.onload = function() {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        processImageData(context, pattern);
    };
    return canvas;
}

function processImageData(context, pattern) {
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const data = imgData.data;
    const dominantColor = convertHexArrayToRgbArray(configObject.dominantColors);
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
    customContainer.style.position = 'relative';

    const overlayImage = document.createElement('img');
    overlayImage.src = 'https://uniqtribe.github.io/Custom-Palette.png'; // Replace with the path to your image
    overlayImage.alt = 'Overlay Image';
    overlayImage.className = 'overlay-image';
    customContainer.appendChild(overlayImage);
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
    swatchContainer.style.backgroundImage = generateVerticalGradient(palette);
}

function addClickEventToSwatches() {
    swatchElements = document.querySelectorAll('.colorSwatches');

    swatchElements.forEach(swatch => {

        swatch.addEventListener('click', function() {
            if (this.classList.contains('custom-color-selector')) {
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
            if (configObject.shapes.includes(option.value.toLowerCase())) {
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
            option.addEventListener('click', function() {
                selectOption(this);
            });
        });
        const preselectedValue = hiddenSelect.value;
        console.log("preselectedValue", preselectedValue)
        const initialOption = Array.from(customOptions).find(option => option.getAttribute('data-value') === preselectedValue);
        if (initialOption) {
            initialOption.classList.add('selected'); // Set initial visual selection
        }
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
            //              row.style.display = 'none';
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
    console.log("e", e);
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

    let imgElement = document.querySelector('img[alt="base-image"]');
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

    const dominantColors = configObject.dominantColors.map(parseColor);
    const colorHexMap = configObject.dominantColors.map(color => color.toLowerCase());
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
    const uploadedTexture = textureLoader.load(document.querySelector('#designCanvas').toDataURL('image/png'), function(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        object.traverse(function(child) {
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

    updateCustomColor();
    selectedSwatch = swatch;
}

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
</script>
