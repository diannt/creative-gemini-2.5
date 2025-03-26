import * as THREE from 'three';


/* Game constants */
const GRAVITY = 30;
const FORWARD_SPEED = 15;
const LATERAL_SPEED = 10;
const JUMP_INITIAL_VELOCITY = 10;
const JUMP_HOLD_FORCE = 1.5; // Multiplier for upward velocity while holding space
const MAX_JUMP_TIME = 0.3; // Max duration space can be held for boost (in seconds)
const PLAYER_HEIGHT = 2.0;
const PLAYER_WIDTH = 1.0;
const CAMERA_HEIGHT_OFFSET = 1.6; // Eye level relative to player base
const CAMERA_Z_OFFSET = 0.5; // How far camera is behind player center
const OBSTACLE_SPAWN_DISTANCE = 50;
const OBSTACLE_DESPAWN_DISTANCE = 20;
const MIN_OBSTACLE_GAP = 5;
const MAX_OBSTACLE_GAP = 15;
const MIN_OBSTACLE_HEIGHT = 1;
const MAX_OBSTACLE_HEIGHT = 6;
const OBSTACLE_WIDTH = 4;
const OBSTACLE_DEPTH = 4;
const GROUND_Y = 0;
const LANDING_TOLERANCE = 0.05; // 5% tolerance below obstacle top
const INITIAL_RUN_DISTANCE = 15; // Distance from house before obstacles start

/* Game state variables */
let player = { 
  position: new THREE.Vector3(0, PLAYER_HEIGHT / 2, 5), // Start inside 'house'
  velocity: new THREE.Vector3(0, 0, 0),
  collider: new THREE.Box3(),
  mesh: null // Will be assigned in init
};
let clock;
let obstacles = [];
let lastObstacleZ = 0; // Relative to player's starting Z
let keys = {
  space: false,
  left: false,
  right: false
};
let isJumping = false;
let jumpTime = 0;
let isOnGround = false;
let gameOver = false;
let initialRunComplete = false;
let score = 0; // Basic score example

// Texture placeholder (replace with actual loading if needed)
let blockTexture;
let playerTexture;

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

    clock = new THREE.Clock();

// Basic Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x88dd88 }); // Greenish ground
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = GROUND_Y;
scene.add(ground);

// Player Mesh (Simple Cube)
const playerGeometry = new THREE.BoxGeometry(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH);
// Basic material, replace with pixelated texture if available
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); 
player.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
// Don't add player mesh directly to scene if using first-person
// player.mesh.position.copy(player.position);
// scene.add(player.mesh); 

// Starting House (Simple Representation)
const houseGeometry = new THREE.BoxGeometry(5, 5, 5);
const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
const houseMesh = new THREE.Mesh(houseGeometry, houseMaterial);
houseMesh.position.set(0, 2.5, 7.5); // Position behind player start
scene.add(houseMesh);

// Set initial camera position (first-person)
camera.position.set(
    player.position.x,
    player.position.y - PLAYER_HEIGHT / 2 + CAMERA_HEIGHT_OFFSET, 
    player.position.z + CAMERA_Z_OFFSET
);
camera.rotation.order = 'YXZ'; // Set rotation order
camera.rotation.y = Math.PI; // Look forward initially

// Initialize player state
player.position.y = GROUND_Y + PLAYER_HEIGHT / 2;
lastObstacleZ = player.position.z - INITIAL_RUN_DISTANCE - 10; // Start spawning obstacles ahead

// Event Listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Initial obstacle generation trigger (will spawn when player moves)

console.log('Game Initialized. Press Space to jump, Left/Right or A/D to move.');
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
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Example template function (modify or replace via helper_functions)
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 10;
    mouseY = (event.clientY - windowHalfY) * 10;
}

function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            keys.space = true;
            event.preventDefault(); // Prevent page scroll
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'Space':
            keys.space = false;
            isJumping = false; // Stop jump boost when key released
            jumpTime = MAX_JUMP_TIME; // Prevent further boost
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
    }
}

function spawnObstacle() {
    const height = THREE.MathUtils.randFloat(MIN_OBSTACLE_HEIGHT, MAX_OBSTACLE_HEIGHT);
    const width = OBSTACLE_WIDTH;
    const depth = OBSTACLE_DEPTH;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    // Use a simple color, replace with texture if loaded
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2) // Random darkish color
        // map: blockTexture, // Assign texture if loaded
    });
    // Ensure pixelated look if using textures
    // if (blockTexture) {
    //     blockTexture.magFilter = THREE.NearestFilter;
    //     blockTexture.minFilter = THREE.NearestFilter;
    // }

    const obstacle = new THREE.Mesh(geometry, material);

    const gap = THREE.MathUtils.randFloat(MIN_OBSTACLE_GAP, MAX_OBSTACLE_GAP);
    const spawnZ = lastObstacleZ - gap - depth / 2;
    
    // Randomize X position slightly, ensure player can potentially pass
    const maxX = 10; // Example boundary for obstacle placement
    const spawnX = THREE.MathUtils.randFloat(-maxX + width / 2, maxX - width / 2);

    obstacle.position.set(spawnX, GROUND_Y + height / 2, spawnZ);

    // Store collider in userData for efficiency
    obstacle.userData.collider = new THREE.Box3().setFromObject(obstacle);

    scene.add(obstacle);
    obstacles.push(obstacle);
    lastObstacleZ = spawnZ; // Update position of the last spawned obstacle's front face
}

// Optional: Add resetGame function if needed
/*
function resetGame() {
    // Reset player position, velocity
    player.position.set(0, PLAYER_HEIGHT / 2, 5);
    player.velocity.set(0, 0, 0);

    // Clear existing obstacles
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];

    // Reset game state variables
    lastObstacleZ = player.position.z - INITIAL_RUN_DISTANCE - 10;
    gameOver = false;
    initialRunComplete = false;
    isOnGround = false;
    isJumping = false;
    score = 0;
    keys = { space: false, left: false, right: false };

    // Ensure camera is reset
    camera.position.set(
        player.position.x,
        player.position.y - PLAYER_HEIGHT / 2 + CAMERA_HEIGHT_OFFSET, 
        player.position.z + CAMERA_Z_OFFSET
    );
    camera.rotation.y = Math.PI;

    console.log('Game Reset.');
}
*/
// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (gameOver) {
    // Optional: Add game over text or overlay
    // console.log('Game Over! Final Score:', score);
    // Could potentially call a reset function here after a delay
    return; 
}

const deltaTime = clock.getDelta();

// --- Initial Run --- 
if (!initialRunComplete) {
    player.position.z -= FORWARD_SPEED * deltaTime;
    if (player.position.z <= 0) { // Reached origin from house start
        initialRunComplete = true;
        console.log('Initial run complete, obstacles starting!');
    }
} else { 
    // --- Normal Game Loop --- 

    // --- Input Handling ---
    let lateralMovement = 0;
    if (keys.left) {
        lateralMovement -= LATERAL_SPEED * deltaTime;
    }
    if (keys.right) {
        lateralMovement += LATERAL_SPEED * deltaTime;
    }
    player.position.x += lateralMovement;
    // Optional: Clamp player.position.x to stay within ground bounds
    // player.position.x = THREE.MathUtils.clamp(player.position.x, -groundWidth/2 + PLAYER_WIDTH/2, groundWidth/2 - PLAYER_WIDTH/2);

    // --- Jumping Logic ---
    if (keys.space) {
        if (isOnGround) {
            isJumping = true;
            isOnGround = false;
            jumpTime = 0;
            player.velocity.y = JUMP_INITIAL_VELOCITY;
        } else if (isJumping && jumpTime < MAX_JUMP_TIME) {
            player.velocity.y += JUMP_HOLD_FORCE * (1 - jumpTime / MAX_JUMP_TIME) * deltaTime * 60; // Apply diminishing force, scale by delta
            jumpTime += deltaTime;
        }
    } else {
        // Ensure jump boost stops if space is released early
        if (isJumping) {
            jumpTime = MAX_JUMP_TIME; // Stop further boost
        }
    }

    // --- Physics Update ---
    // Apply gravity if not on ground
    if (!isOnGround) {
        player.velocity.y -= GRAVITY * deltaTime;
    }

    // Update position based on velocity
    player.position.y += player.velocity.y * deltaTime;
    player.position.z -= FORWARD_SPEED * deltaTime; // Constant forward movement

    // --- Collision Detection ---
    isOnGround = false; // Assume not on ground until checked

    // Ground Collision
    if (player.position.y <= GROUND_Y + PLAYER_HEIGHT / 2) {
        player.position.y = GROUND_Y + PLAYER_HEIGHT / 2;
        player.velocity.y = 0;
        isOnGround = true;
        isJumping = false; 
        jumpTime = 0;
    }

    // Update player collider
    player.collider.setFromCenterAndSize(
        player.position, 
        new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH)
    );

    // Obstacle Collision
    let landedOnObstacle = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        const obstacleCollider = obstacle.userData.collider;

        // Broad phase check (optional, but good for performance)
        if (Math.abs(player.position.z - obstacle.position.z) > (OBSTACLE_DEPTH / 2 + PLAYER_WIDTH / 2 + 1)) {
            continue; // Skip if too far away on Z axis
        }

        if (player.collider.intersectsBox(obstacleCollider)) {
            const obstacleTop = obstacle.position.y + obstacle.geometry.parameters.height / 2;
            const playerBottom = player.position.y - PLAYER_HEIGHT / 2;
            const playerTop = player.position.y + PLAYER_HEIGHT / 2;

            // Check if landing ON TOP
            // Player's bottom must be above or slightly below the obstacle top
            // Player must be moving downwards or stationary vertically
            if (player.velocity.y <= 0 && 
                playerBottom >= obstacleTop - (obstacle.geometry.parameters.height * LANDING_TOLERANCE) && 
                playerBottom <= obstacleTop + 0.1) { // Small buffer above
                
                // Check horizontal overlap before confirming landing
                if (player.position.x + PLAYER_WIDTH/2 > obstacle.position.x - OBSTACLE_WIDTH/2 &&
                    player.position.x - PLAYER_WIDTH/2 < obstacle.position.x + OBSTACLE_WIDTH/2) {
                    
                    player.position.y = obstacleTop + PLAYER_HEIGHT / 2;
                    player.velocity.y = 0;
                    isOnGround = true; // Treat obstacle top as ground
                    isJumping = false;
                    jumpTime = 0;
                    landedOnObstacle = true;
                    score++; // Increment score for successful landing
                    // console.log('Landed! Score:', score);
                    break; // Stop checking other obstacles once landed
                }
            }
             
            // If intersection occurs and it's not a valid landing, it's a crash
            if (!landedOnObstacle) {
                console.error('Game Over - Hit Obstacle!');
                gameOver = true;
                player.velocity.set(0, 0, 0); // Stop player
                break; // Exit obstacle loop
            }
        }
    }
    
    // If falling and missed all obstacles, check if hit ground (already handled by ground collision)
    // But if the loop finished and player is below ground level (shouldn't happen with ground check)
    // could be game over too.

    // --- Obstacle Management ---
    // Spawn new obstacles
    if (player.position.z < lastObstacleZ + OBSTACLE_SPAWN_DISTANCE - 100) { // Check far ahead
        spawnObstacle();
    }

    // Despawn old obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (obstacle.position.z > player.position.z + OBSTACLE_DESPAWN_DISTANCE) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
        }
    }
}

// --- Camera Update ---
camera.position.x = player.position.x;
camera.position.y = player.position.y - PLAYER_HEIGHT / 2 + CAMERA_HEIGHT_OFFSET;
camera.position.z = player.position.z + CAMERA_Z_OFFSET;
// Keep camera looking forward relative to its own orientation
// camera.lookAt(player.position.x, player.position.y - PLAYER_HEIGHT / 2 + CAMERA_HEIGHT_OFFSET, player.position.z - 10);
// Simpler: Just ensure it looks mostly forward along Z
camera.rotation.x = 0; // Keep camera level for now
camera.rotation.y = Math.PI; // Ensure looking in negative Z direction
camera.rotation.z = 0;
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

    // Optional: Add any specific rendering effects or post-processing here
// For now, standard render call in template is sufficient.

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();