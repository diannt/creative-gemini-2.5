import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let player, ground;
const playerSpeed = 0.1;
const keys = {};

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

    // Basic Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
scene.add(ground);

// Player Cube
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; // Place it on top of the ground
scene.add(player);

// Set camera position
camera.position.set(0, 5, 10);
camera.lookAt(scene.position);

// Event Listeners for Keyboard
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);
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
    keys[event.key.toLowerCase()] = true;
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

// Basic resize handler (if not already in template)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Player Movement
if (keys['w'] || keys['ArrowUp']) {
    player.position.z -= playerSpeed;
}
if (keys['s'] || keys['ArrowDown']) {
    player.position.z += playerSpeed;
}
if (keys['a'] || keys['ArrowLeft']) {
    player.position.x -= playerSpeed;
}
if (keys['d'] || keys['ArrowRight']) {
    player.position.x += playerSpeed;
}

// Keep player on ground (simple check)
if (player.position.y < 0.5) {
    player.position.y = 0.5;
}
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

    // Optional: Make camera follow player slightly
// camera.lookAt(player.position); // Direct lookAt
// Smooth follow example (more complex):
// const targetPosition = new THREE.Vector3(player.position.x, camera.position.y, player.position.z + 5);
// camera.position.lerp(targetPosition, 0.05); 
// camera.lookAt(player.position);

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();