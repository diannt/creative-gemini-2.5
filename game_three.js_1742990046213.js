import * as THREE from 'three';


let camera, scene, renderer;
let player = {
    position: new THREE.Vector3(0, 1.6, 0), // Eye height
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: true,
    isJumping: false,
    jumpStartTime: 0,
    canJump: true,
    width: 0.8, // Player collision width
    height: 1.6 // Player collision height (used for camera offset)
};
let obstacles = [];
let gameSpeed = 5;
const baseSpeed = 5;
const gravity = -25;
const jumpInitialVelocity = 8;
const jumpHoldForce = 0.5;
const maxJumpHoldTime = 400; // milliseconds
const lateralSpeed = 5;
let keys = { space: false, ArrowLeft: false, ArrowRight: false, a: false, d: false };
let gameOver = false;
let clock = new THREE.Clock();
let lastObstacleZ = -10;
const obstacleGenerationDistance = 50;
const obstacleRemovalDistance = -20; // Behind the player
const obstacleSpacingMin = 5;
const obstacleSpacingMax = 15;
const obstacleHeightMin = 1;
const obstacleHeightMax = 5;
const obstacleWidth = 2;
const laneWidth = 3; // Max lateral movement from center
const landingTolerance = 0.95; // Must land on top 95% of the block height

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

    // Basic Scene Setup (already handled by template)

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88cc88 }); // Green ground
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Initial Camera Position (First Person)
camera.position.copy(player.position);
camera.rotation.order = 'YXZ'; // Common for FPS controls

// Initial Obstacles
for (let i = 0; i < 10; i++) {
    generateObstacle();
}

// Event Listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Set initial camera position
camera.position.set(player.position.x, player.position.y, player.position.z);
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

function generateObstacle() {
    const height = THREE.MathUtils.randFloat(obstacleHeightMin, obstacleHeightMax);
    const geometry = new THREE.BoxGeometry(obstacleWidth, height, obstacleWidth);
    // Simple color variation based on height
    const hue = THREE.MathUtils.mapLinear(height, obstacleHeightMin, obstacleHeightMax, 0.1, 0.0); // Green to Brownish
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.6, 0.5) });
    const obstacle = new THREE.Mesh(geometry, material);

    const positionX = THREE.MathUtils.randFloat(-laneWidth + obstacleWidth / 2, laneWidth - obstacleWidth / 2);
    const positionZ = lastObstacleZ - THREE.MathUtils.randFloat(obstacleSpacingMin, obstacleSpacingMax);
    obstacle.position.set(positionX, height / 2, positionZ); // Position based on center bottom

    scene.add(obstacle);
    obstacles.push(obstacle);
    lastObstacleZ = positionZ;
}

function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            keys.space = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.ArrowLeft = true; // Treat A as ArrowLeft
            keys.a = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.ArrowRight = true; // Treat D as ArrowRight
            keys.d = true;
            break;
        case 'KeyR': // Example: Reset key
             if (gameOver) resetGame();
             break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'Space':
            keys.space = false;
            player.isJumping = false; // Stop applying jump hold force
            player.canJump = true; // Allow jumping again after release
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.ArrowLeft = false;
            keys.a = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.ArrowRight = false;
            keys.d = false;
            break;
    }
}

function resetGame() {
    // Remove all obstacles
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];

    // Reset player state
    player.position.set(0, 1.6, 0);
    player.velocity.set(0, 0, 0);
    player.onGround = true;
    player.isJumping = false;
    player.canJump = true;

    // Reset game state
    gameOver = false;
    gameSpeed = baseSpeed;
    lastObstacleZ = -10;
    clock.start(); // Restart clock or reset delta calculation

    // Regenerate initial obstacles
    for (let i = 0; i < 10; i++) {
        generateObstacle();
    }

    // Reset camera
    camera.position.set(player.position.x, player.position.y, player.position.z);
    console.log("Game Reset");
}

// Simple window resize handler (usually in template)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);
// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (gameOver) return;

const delta = clock.getDelta();

// --- Determine Game Speed based on next obstacle ---
let nextObstacle = null;
let minDistance = Infinity;
for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    const distZ = obstacle.position.z - player.position.z;
    if (distZ > 0 && distZ < minDistance) {
        minDistance = distZ;
        nextObstacle = obstacle;
    }
}

if (nextObstacle) {
    const nextHeight = nextObstacle.geometry.parameters.height;
    // Speed increases slightly for lower obstacles, decreases for higher ones
    gameSpeed = baseSpeed * (1 + (1 - Math.min(nextHeight, obstacleHeightMax) / obstacleHeightMax) * 0.5);
} else {
    gameSpeed = baseSpeed;
}

// --- Player Movement ---

// Forward Movement (Auto-run)
player.position.z -= gameSpeed * delta;

// Lateral Movement
let lateralMove = 0;
if (keys.ArrowLeft || keys.a) lateralMove -= lateralSpeed * delta;
if (keys.ArrowRight || keys.d) lateralMove += lateralSpeed * delta;
player.position.x += lateralMove;
player.position.x = THREE.MathUtils.clamp(player.position.x, -laneWidth, laneWidth); // Clamp lateral movement

// --- Jumping --- 
if (keys.space && player.canJump && player.onGround) {
    player.isJumping = true;
    player.onGround = false;
    player.canJump = false; // Prevent re-jump until key release
    player.velocity.y = jumpInitialVelocity;
    player.jumpStartTime = performance.now();
}

// Apply jump hold force
if (keys.space && player.isJumping) {
    const jumpDuration = performance.now() - player.jumpStartTime;
    if (jumpDuration < maxJumpHoldTime) {
        player.velocity.y += jumpHoldForce * (1 - jumpDuration / maxJumpHoldTime); // Force decreases over time
    }
}

// Apply Gravity
if (!player.onGround) {
    player.velocity.y += gravity * delta;
    player.position.y += player.velocity.y * delta;
}

// --- Collision Detection & Landing --- 
let landedOnObstacle = false;
let collisionDetected = false;

for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    const obPos = obstacle.position;
    const obHeight = obstacle.geometry.parameters.height;
    const obDepth = obstacle.geometry.parameters.depth; // Assuming BoxGeometry
    const obWidth = obstacle.geometry.parameters.width;

    const halfDepth = obDepth / 2;
    const halfWidth = obWidth / 2;
    const playerHalfWidth = player.width / 2;

    // Simple AABB check (Axis-Aligned Bounding Box)
    const collisionX = player.position.x + playerHalfWidth > obPos.x - halfWidth && player.position.x - playerHalfWidth < obPos.x + halfWidth;
    const collisionZ = player.position.z > obPos.z - halfDepth && player.position.z < obPos.z + halfDepth;
    const collisionY = player.position.y < obPos.y + obHeight && player.position.y + player.height > obPos.y; // Check vertical overlap

    if (collisionX && collisionZ) {
        collisionDetected = true;
        // Check for landing ON TOP
        if (player.velocity.y <= 0 && // Moving downwards or stationary vertically
            player.position.y >= obPos.y + obHeight * landingTolerance && // Above the tolerance threshold
            player.position.y - player.velocity.y * delta < obPos.y + obHeight * landingTolerance && // Was above the obstacle top in the previous frame (approx)
             player.position.y - player.velocity.y * delta >= obPos.y + obHeight // Ensure was fully above before landing
            ) {
            player.position.y = obPos.y + obHeight; // Snap to top
            player.velocity.y = 0;
            player.onGround = true;
            player.isJumping = false;
            landedOnObstacle = true;
            break; // Landed, no need to check other obstacles for landing
        }
        // Check for hitting the sides or landing too low
        else if (collisionY) {
            console.log("Game Over - Hit Obstacle Side or landed too low");
            gameOver = true;
            break;
        }
    }
}

// Check ground collision if not landed on an obstacle and below ground
if (!landedOnObstacle && player.position.y <= 0) {
    if (!collisionDetected) { // Only hit ground if not inside an obstacle vertically
        player.position.y = 0;
        player.velocity.y = 0;
        player.onGround = true;
        player.isJumping = false;
    } else {
        // If inside an obstacle and hit ground level, it's likely a side hit near the bottom
         console.log("Game Over - Hit Obstacle near ground");
         gameOver = true;
    }
}

// If falling and no collision detected, set onGround to false
if (!landedOnObstacle && player.position.y > 0 && !collisionDetected) {
     player.onGround = false;
}

// --- Obstacle Management ---
// Generate new obstacles
if (player.position.z < lastObstacleZ + obstacleGenerationDistance - 100) { // Generate ahead
    generateObstacle();
}

// Remove old obstacles
for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].position.z > player.position.z - obstacleRemovalDistance) {
        scene.remove(obstacles[i]);
        obstacles.splice(i, 1);
    }
}

// --- Update Camera --- 
camera.position.set(player.position.x, player.position.y + player.height * 0.9, player.position.z); // Slightly offset camera y for better view
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

    // Optional: Add specific render logic if needed, e.g., post-processing
// renderer.render(scene, camera); // This line is usually already in the template's render()

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();