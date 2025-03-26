import * as THREE from 'three';


let car;
let carSpeed = 0;
let maxSpeed = 0.2;
let acceleration = 0.01;
let deceleration = 0.005; // Friction/braking
let steerAngle = 0;
let maxSteerAngle = Math.PI / 6; // 30 degrees
let steerSpeed = 0.05;
const keysPressed = {};
let clock;
let cameraOffset = new THREE.Vector3(0, 3, -6); // Offset behind and above the car

let camera, scene, renderer; // Core components assumed by template
let mouseX = 0, mouseY = 0; // Example template vars
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// --- Main Initialization ---
function init() {
    // Basic Setup from template
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500; // Default camera Z
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2b2b2b); // Default background
    scene.fog = new THREE.Fog(0x2b2b2b, 1, 10000); // Default fog

    // Clock for delta time
clock = new THREE.Clock();

// Ground
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Car Body (simple box)
const carGeo = new THREE.BoxGeometry(1, 0.5, 2); // width, height, length
const carMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
car = new THREE.Mesh(carGeo, carMat);
car.position.y = 0.25; // Place it on the ground (half the height)
car.castShadow = true;
scene.add(car);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Initial Camera position (will be updated in animate)
camera.position.set(0, 5, -8);
camera.lookAt(car.position);

// Event Listeners for controls
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: softer shadows

// Add basic resize listener
window.addEventListener('resize', onWindowResize);
onWindowResize(); // Call once initially to set size
    // Example: Create materials, geometries, meshes, groups, add to scene
    // Example: const geometry = new THREE.BoxGeometry(100, 100, 100);
    // Example: const material = new THREE.MeshNormalMaterial();
    // Example: const mesh = new THREE.Mesh(geometry, material); scene.add(mesh);

    // Renderer setup from template
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Use true for potentially smoother games
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Event listeners from template (or add game-specific ones in init_logic)
    document.addEventListener('mousemove', onDocumentMouseMove, false); // Example listener
    window.addEventListener('resize', onWindowResize, false);

    
}

// --- Event Handlers & Helpers ---

// Example template function (modify or replace via helper_functions)
// Template onWindowResize overridden by helper_functions

// Example template function (modify or replace via helper_functions)
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 10;
    mouseY = (event.clientY - windowHalfY) * 10;
}

// Keyboard event handlers
function onKeyDown(event) {
    keysPressed[event.key] = true;
}

function onKeyUp(event) {
    keysPressed[event.key] = false;
}

// Window resize handler
function onWindowResize() {
    if (camera && renderer) { // Check if they exist
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

// --- Input Handling ---
let accelerateInput = 0;
let steerInput = 0;

if (keysPressed['ArrowUp'] || keysPressed['w']) {
    accelerateInput = acceleration;
}
if (keysPressed['ArrowDown'] || keysPressed['s']) {
    accelerateInput = -acceleration * 0.7; // Slower reverse
}
if (keysPressed['ArrowLeft'] || keysPressed['a']) {
    steerInput = steerSpeed;
}
if (keysPressed['ArrowRight'] || keysPressed['d']) {
    steerInput = -steerSpeed;
}

// --- Car Physics Update ---
// Apply acceleration/deceleration
if (accelerateInput !== 0) {
    carSpeed += accelerateInput;
} else {
    // Apply friction/drag
    if (carSpeed > 0) {
        carSpeed -= deceleration;
        carSpeed = Math.max(0, carSpeed);
    } else if (carSpeed < 0) {
        carSpeed += deceleration;
        carSpeed = Math.min(0, carSpeed);
    }
}
carSpeed = THREE.MathUtils.clamp(carSpeed, -maxSpeed / 2, maxSpeed); // Clamp speed

// Apply steering rotation (only when moving)
if (Math.abs(carSpeed) > 0.005) { // Only steer if moving significantly
    // Reduce steering angle slightly at higher speeds for stability
    const steeringEffectiveness = 1 - Math.abs(carSpeed / maxSpeed) * 0.4;
    const currentSteerAngle = steerInput * steeringEffectiveness;
    car.rotateY(currentSteerAngle);
}

// --- Car Movement Update ---
// Calculate forward vector based on car's current rotation
const forward = new THREE.Vector3(0, 0, 1);
forward.applyQuaternion(car.quaternion);

// Update car position based on speed and direction
car.position.addScaledVector(forward, carSpeed);

// --- Camera Follow Update ---
// Calculate desired camera position relative to car's new position and rotation
const desiredCameraPosition = car.position.clone().add(cameraOffset.clone().applyQuaternion(car.quaternion));

// Smoothly interpolate camera position towards the desired position (Lerp)
camera.position.lerp(desiredCameraPosition, delta * 5.0); // Adjust the multiplier (5.0) for faster/slower follow

// Make camera look at the car's position
camera.lookAt(car.position);
    // Example: Update object positions, rotations, check input, collisions
    // Example: const time = Date.now() * 0.001; group.rotation.y = time;

    render();
}

// --- Render Function ---
function render() {
    // Example template logic (can be replaced by animate_logic if simple)
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // No specific render logic needed for this simple example.

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();