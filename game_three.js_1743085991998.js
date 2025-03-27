import * as THREE from 'three';


let player;
const playerSpeed = 5.0;
const keyboard = {};
let clock;
let textureLoader;

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

// Texture Loader
textureLoader = new THREE.TextureLoader();

// Basic Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Pixelated Texture Loading Helper
const loadPixelTexture = (url) => {
  const texture = textureLoader.load(url);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace; // Ensure correct color
  return texture;
};

// Ground
const groundTexture = loadPixelTexture('https://threejs.org/examples/textures/minecraft/grass_dirt.png'); // Placeholder texture
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Player (Mario - simple cube)
const playerTexture = loadPixelTexture('https://threejs.org/examples/textures/minecraft/creeper.png'); // Placeholder texture
const playerMaterial = new THREE.MeshStandardMaterial({ map: playerTexture });
const playerGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8); // Approximate Mario proportions
player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.9; // Place him standing on the ground
scene.add(player);

// Adjust Camera
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, 0);

// Keyboard Listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
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

function onKeyDown(event) {
    keyboard[event.key.toLowerCase()] = true;
}

function onKeyUp(event) {
    keyboard[event.key.toLowerCase()] = false;
}

// Optional: Add onWindowResize if needed
/*
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
*/
// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get time difference between frames

// Player Movement
const moveDistance = playerSpeed * delta;

if (keyboard['w'] || keyboard['ArrowUp']) {
    player.position.z -= moveDistance;
}
if (keyboard['s'] || keyboard['ArrowDown']) {
    player.position.z += moveDistance;
}
if (keyboard['a'] || keyboard['ArrowLeft']) {
    player.position.x -= moveDistance;
}
if (keyboard['d'] || keyboard['ArrowRight']) {
    player.position.x += moveDistance;
}

// Keep player on the ground (simple constraint)
player.position.y = 0.9;

// Optional: Make camera follow player (simple)
// camera.position.x = player.position.x;
// camera.position.z = player.position.z + 10;
// camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
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

    

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();