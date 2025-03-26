import * as THREE from 'three';


let player = {
    position: new THREE.Vector3(0, 10, 0), // Start slightly above ground
    velocity: new THREE.Vector3(0, 0, 0),
    height: 1.8, // Conceptual player height for collision/view
    width: 0.5,  // Conceptual player width/depth
    onGround: false,
    jumpRequest: false,
    jumpHoldTime: 0
};

const gravity = -30;
const moveSpeed = 15; // Auto-run speed
const strafeSpeed = 10;
const minJumpVelocity = 5;
const maxJumpVelocity = 18;
const maxJumpHoldDuration = 0.4; // seconds

let obstacles = [];
let obstacleMaterial;
let groundMesh;

let clock = new THREE.Clock();
let keysPressed = {};
let gameOver = false;
let score = 0; // Basic score example

const obstacleGenerationDistance = 150;
const obstacleRemovalDistance = -50;
let nextObstacleZ = -20; // Start generating obstacles ahead
const obstacleSpacingMin = 10;
const obstacleSpacingMax = 25;
const obstacleWidthMin = 3, obstacleWidthMax = 8;
const obstacleHeightMin = 2, obstacleHeightMax = 15;
const obstacleDepthMin = 3, obstacleDepthMax = 8;
const obstacleLaneWidth = 5; // How far left/right obstacles can spawn

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

    // Player conceptual position (camera is the view)
    player.position.set(0, 5, 10); // Start slightly back and above potential ground

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    // Materials
    obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 }); // Simple grey blocks
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    // Ground (Game Over Zone)
    const groundGeometry = new THREE.PlaneGeometry(500, 50000); // Long strip
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.1; // Slightly below y=0
    scene.add(groundMesh);

    // Initial Obstacles
    for (let i = 0; i < 15; i++) {
        generateObstacle();
    }

    // Event Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp); 

    // Adjust camera initial position for first person
    camera.position.set(player.position.x, player.position.y + player.height * 0.8, player.position.z); // Eye level
    camera.lookAt(player.position.x, player.position.y + player.height * 0.8, player.position.z - 10); // Look forward
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
// Template onDocumentMouseMove overridden by helper_functions

// --- Input Handling ---
function onKeyDown(event) {
    keysPressed[event.code] = true;
    if (event.code === 'Space' && !player.jumpRequest && player.onGround) {
        player.jumpRequest = true;
        player.jumpHoldTime = 0; // Start timer
    }
}

function onKeyUp(event) {
    keysPressed[event.code] = false;
    if (event.code === 'Space' && player.jumpRequest) {
        // Calculate jump strength based on hold time
        const holdRatio = Math.min(player.jumpHoldTime / maxJumpHoldDuration, 1.0);
        const jumpVelocity = minJumpVelocity + (maxJumpVelocity - minJumpVelocity) * holdRatio;
        player.velocity.y = jumpVelocity;
        player.onGround = false;
        player.jumpRequest = false; 
        player.jumpHoldTime = 0;
    }
}

// --- Player Update ---
function updatePlayer(deltaTime) {
    // Apply gravity
    if (!player.onGround) {
        player.velocity.y += gravity * deltaTime;
    }

    // Auto-running forward
    player.velocity.z = -moveSpeed;

    // Strafe movement
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
        player.velocity.x = -strafeSpeed;
    } else if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
        player.velocity.x = strafeSpeed;
    } else {
        player.velocity.x = 0;
    }

    // Update jump hold timer
    if (player.jumpRequest) {
        player.jumpHoldTime += deltaTime;
        // Apply minimum jump velocity immediately if space is tapped briefly
        if (player.jumpHoldTime > 0 && player.velocity.y < minJumpVelocity && player.onGround) {
             player.velocity.y = minJumpVelocity; // Ensure at least a small hop even on tap
             player.onGround = false;
        }
    }

    // Update position based on velocity
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;
    player.position.z += player.velocity.z * deltaTime;

    // Basic ground collision (Game Over condition)
    if (player.position.y < 0) {
        console.log("Game Over: Fell off!");
        gameOver = true;
        player.position.y = 0;
        player.velocity.set(0, 0, 0);
        // Optional: Add game over screen logic here
    }
}

// --- Obstacle Management ---
function generateObstacle() {
    const width = THREE.MathUtils.randFloat(obstacleWidthMin, obstacleWidthMax);
    const height = THREE.MathUtils.randFloat(obstacleHeightMin, obstacleHeightMax);
    const depth = THREE.MathUtils.randFloat(obstacleDepthMin, obstacleDepthMax);
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const obstacle = new THREE.Mesh(geometry, obstacleMaterial);

    // Position obstacles ahead
    obstacle.position.z = nextObstacleZ - depth / 2;
    obstacle.position.y = height / 2; // Place base on y=0
    obstacle.position.x = THREE.MathUtils.randFloat(-obstacleLaneWidth, obstacleLaneWidth);

    // Calculate next obstacle position
    nextObstacleZ -= THREE.MathUtils.randFloat(obstacleSpacingMin, obstacleSpacingMax) + depth;

    obstacles.push(obstacle);
    scene.add(obstacle);
}

function updateObstacles() {
    // Generate new obstacles if needed
    if (player.position.z + nextObstacleZ < obstacleGenerationDistance) {
        generateObstacle();
    }

    // Remove obstacles far behind the player
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (obstacle.position.z > player.position.z - obstacleRemovalDistance) {
            scene.remove(obstacle);
            obstacle.geometry.dispose(); // Clean up geometry
            obstacles.splice(i, 1);
        }
    }
}

// --- Collision Detection ---
function checkCollisions() {
    player.onGround = false; // Assume not on ground unless collision detected
    const playerHalfWidth = player.width / 2;
    const playerHalfHeight = player.height / 2; // Use full height for bottom check

    // Player Bounding Box (conceptual)
    const playerBox = new THREE.Box3(
        new THREE.Vector3(player.position.x - playerHalfWidth, player.position.y, player.position.z - playerHalfWidth),
        new THREE.Vector3(player.position.x + playerHalfWidth, player.position.y + player.height, player.position.z + playerHalfWidth)
    );

    for (const obstacle of obstacles) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        const obstacleHeight = obstacleBox.max.y - obstacleBox.min.y;
        const collisionMargin = 0.1; // Small margin for landing check
        const sideHitTolerance = obstacleHeight * 0.05; // 5% tolerance from top

        if (playerBox.intersectsBox(obstacleBox)) {
            const playerBottom = player.position.y;
            const obstacleTop = obstacleBox.max.y;
            const obstacleBottom = obstacleBox.min.y;

            // Check for landing ON TOP
            if (player.velocity.y <= 0 && // Moving downwards or stationary
                playerBottom >= obstacleTop - collisionMargin && // Player bottom is near or slightly above obstacle top
                playerBottom < obstacleTop + player.velocity.y * clock.getDelta() + collisionMargin * 2 // Player bottom wasn't significantly above last frame
               ) 
            { 
                player.onGround = true;
                player.velocity.y = 0;
                player.position.y = obstacleTop; // Snap to top
                score++; // Example: increment score per successful landing
                console.log("Score:", score);
                break; // Stop checking after landing on one obstacle
            }
            // Check for hitting the SIDES or BOTTOM (Game Over)
            else if (playerBottom < obstacleTop - sideHitTolerance) {
                 console.log("Game Over: Hit side/bottom of obstacle!");
                 gameOver = true;
                 player.velocity.set(0, 0, 0);
                 // Optional: Add game over screen logic here
                 break;
            }
            // Handle hitting the front face slightly if needed (e.g., slow down?)
            // For now, any non-top collision below the tolerance is game over.
        }
    }
}

// --- Overriding Template Functions (Optional) ---
// function onWindowResize() { /* Custom resize logic */ }
// function onDocumentMouseMove(event) { /* Custom mouse logic */ }

// Define any extra functions needed by your init or animate logic

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (gameOver) return;

    const deltaTime = clock.getDelta();

    updatePlayer(deltaTime);
    updateObstacles();
    checkCollisions();

    // Update camera to follow player (First Person)
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + player.height * 0.8; // Eye level
    camera.position.z = player.position.z;

    // Keep camera looking forward relative to player
    const lookAtPosition = new THREE.Vector3(player.position.x, camera.position.y, player.position.z - 10);
    camera.lookAt(lookAtPosition);
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

    // The default camera movement based on mouse is disabled by the animate_logic override
    // If you wanted mouse look, you'd implement it in animate_logic or helper_functions/onDocumentMouseMove
    // For now, camera is locked forward based on player position.

    renderer.render(scene, camera); // Final render call
}

// --- Start ---
init();
animate();