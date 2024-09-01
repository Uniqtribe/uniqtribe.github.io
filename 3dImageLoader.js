
    function loadPage() {
        if (zs_view === "product") {

        let uploadedFilename = 'screenshot'; // Default filename

        // Create the scene
        const scene = new THREE.Scene();

        // Create an orthographic camera
        let camera = createOrthographicCamera();
        let perspectiveCamera = createPerspectiveCamera();

        function createOrthographicCamera() {
            const aspectRatio = window.innerWidth / window.innerHeight;
            return new THREE.OrthographicCamera(
                -aspectRatio * 50, aspectRatio * 50, 50, -50, 0.1, 1000
            );
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
                camera.position.set(0, 0, 100); // Adjust position as needed
                camera.lookAt(scene.position); // Make sure the camera is looking at the scene
            }
            scene.add(camera);
        }

        // Create a renderer
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
		
		renderer.setClearColor(0xffffff);
		
       // document.body.appendChild(renderer.domElement);

        // Create a pivot object for central rotation
        const pivot = new THREE.Object3D();
        scene.add(pivot);

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const texture1 = textureLoader.load('https://uniqtribe.github.io/hand.jpg'); // Example texture 1

	//const canvas = document.getElementById('canvas');
	//const texture2 = new THREE.CanvasTexture(canvas);

		
        const texture2 = textureLoader.load('https://uniqtribe.github.io/texture.png'); // Example texture 2

        let object; // To store the loaded GLTF object

        // Load GLTF model
      const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load('https://uniqtribe.github.io/fingers.gltf', function(gltf) {
            object = gltf.scene;

            // Traverse through all children of the loaded object
            object.traverse(function(child) {
			
                if (child.isMesh) {
                  if (child.name === '038F_05SET_04SHOT_3' ||child.name === '038F_05SET_04SHOT_2') {
						child.material = new THREE.MeshStandardMaterial({ map: texture1 });
                    } else if (child.name === 'Rectangle_2' || child.name === 'Index_Nail' || child.name === 'Thumb_Nail'|| child.name === 'Ring_Nail'|| child.name === 'Little_Nail'
					|| child.name === 'Middle_Finger'|| child.name === 'Index_Nail_1'|| child.name === 'Thumb_Nail_1'|| child.name === 'Ring_Nail_1'|| child.name === 'Little_Nail_1'|| child.name === 'Middle_Nail') {
                        child.material = new THREE.MeshStandardMaterial({ map: texture2 });
                    } else if(child.name === 'Rectangle'){
		
						child.material = new THREE.MeshStandardMaterial({ map: texture2, transparent: true,
                            opacity: 0.5,
                            depthWrite: false});
					}
                    child.material.needsUpdate = true;  // Ensure the material updates
                }
				
            });
 const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Bright white light
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);

	        const AmbientLight2 = new THREE.AmbientLight(0xffffff, 0.5); // Bright white light
        AmbientLight2.position.set(20, -20, 5).normalize();
        scene.add(AmbientLight2);
		
            pivot.add(object); // Add the loaded model to the pivot
           // updatePivot();
captureScreenshot();		// Update pivot position and rotation on load
        }, undefined, function(error) {
            console.error('Error loading GLTF file:', error);
        });

        // Update camera position and rotation from input fields
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

        // Update pivot position and rotation from input fields
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

        // Update zoom
        function updateZoom() {
            camera.zoom = parseFloat(1.5);
            camera.updateProjectionMatrix();
        }


        function captureScreenshot() {
		//document.querySelector('canvas').remove()
                     // Update camera and scene based on inputs
            updateCamera();
            updatePivot();
            updateZoom();
            renderer.render(scene, camera);
            let existingCanvas = document.getElementById('can1');
               if (existingCanvas) {
                   existingCanvas.remove();
               }
                
            // Create a canvas element for the screenshot
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d',{ willReadFrequently: true });
            canvas.width = renderer.domElement.width;
            canvas.height = renderer.domElement.height;
            canvas.setAttribute('id', 'can1');

            // Draw the Three.js canvas image onto the new canvas
            context.drawImage(renderer.domElement, 0, 0);

			existingCanvas = document.getElementById('can1');
               if (existingCanvas) {
                   existingCanvas.remove();
               }
trimWhiteSpace(canvas);
        }

 
  function trimWhiteSpace(canvas) {
        const context = canvas.getContext('2d',{ willReadFrequently: true });
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const width = canvas.width;
        const height = canvas.height;

        let top = 0;
        let bottom = height;
        let left = 0;
        let right = width;

        // Find horizontal borders
        for (let y = 0; y < height; y++) {
            let nonWhiteCount = 0;
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const alpha = data[index + 3];
                
                if (r < 255 || g < 255 || b < 255 || alpha < 255) {
                    nonWhiteCount++;
                }
            }
            if (nonWhiteCount / width > 0.25) {
                top = y;
                break;
            }
        }

        for (let y = height - 1; y >= 0; y--) {
            let nonWhiteCount = 0;
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const alpha = data[index + 3];
                
                if (r < 255 || g < 255 || b < 255 || alpha < 255) {
                    nonWhiteCount++;
                }
            }
            if (nonWhiteCount / width > 0.25) {
                bottom = y + 1;
                break;
            }
        }

        // Find vertical borders
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
            if (nonWhiteCount / height > 0.5) {
			
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
            if (nonWhiteCount / height > 0.5) {
                right = x + 1;
                break;
            }
        }

        // Calculate new dimensions
        const newWidth = right - left;
        const newHeight = bottom - top;
        // Create a new canvas
		const can2 = document.createElement('canvas');
        can2.width = newWidth;
        can2.height = newHeight;
        // Draw the trimmed image onto the new canvas
        const trimmedImageData = context.getImageData(left, top, newWidth, newHeight);
        const context2 = can2.getContext('2d',{ willReadFrequently: true });
        context2.putImageData(trimmedImageData, 0, 0);
	//	document.body.appendChild(can2);

		//let img2 = context2.getImageData(0,0,newWidth, newHeight);
		const can3 = document.createElement('canvas');
		can3.width = newWidth/2;
		can3.height = newHeight/2;
		
		const context3 = can3.getContext('2d',{ willReadFrequently: true });
		context3.drawImage(can2, 0,0,newWidth/2, newHeight/2);
        document.querySelector('.theme-product-detail-image-container').appendChild(can3);
		
    }
        // Function to handle texture upload
        function handleTextureUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Set the filename prefix for the screenshot
            uploadedFilename = file.name.split('.').slice(0, -1).join('.');

            // Create a FileReader to read the uploaded file
            const reader = new FileReader();
            reader.onload = function(e) {
                const textureURL = e.target.result;

                // Load the texture and apply it to the Rectangle
                const textureLoader = new THREE.TextureLoader();
                const uploadedTexture = textureLoader.load(textureURL, function(texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);

                    // Apply the texture to the "Rectangle" object
                    object.traverse(function(child) {
                        if (child.isMesh && child.name === 'Rectangle') {
                            child.material = new THREE.MeshStandardMaterial({  transparent: true, opacity: 1, depthWrite: false, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.4, color: new THREE.Color(0xffffff) });
                            child.material.needsUpdate = true;
                        } else if (child.name === 'Rectangle_2' || child.name === 'Index_Nail' || child.name === 'Thumb_Nail' || child.name === 'Ring_Nail' || child.name === 'Little_Nail'
                            || child.name === 'Middle_Finger' || child.name === 'Index_Nail_1' || child.name === 'Thumb_Nail_1' || child.name === 'Ring_Nail_1' || child.name === 'Little_Nail_1' || child.name === 'Middle_Nail') {
                            child.material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false });
                            child.material.needsUpdate = true;
                        }
                    });
                });
            };

            reader.readAsDataURL(file);
        }

        // Add event listener for file input
        //document.getElementById('textureUpload').addEventListener('change', handleTextureUpload);

        // Render the scene
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
		
}
    }
    document.addEventListener("DOMContentLoaded", loadPage);
