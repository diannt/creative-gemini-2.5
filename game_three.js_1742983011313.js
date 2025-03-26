// Framework: three.js
// User Prompt: A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ;-game starts like that :mario exits their houseruns forward and sees minecraft type blocks in 3D (view from the first-perspective)-then auto-running turns on (from the first-person perspective too)and we have to do parkour via deciding how long we should click space-obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle .Mario can jump ONTO obstacles [!]if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy-Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves

import * as THREE from 'three';

// Constants - Gameplay
const RUN_SPEED = 10;
const STRAFE_SPEED = 5;
const GRAVITY = -30;
const INITIAL_JUMP_VELOCITY = 12;
const JUMP_HOLD_FORCE = 8;
const MAX_JUMP_HOLD_TIME = 0.3; // seconds
const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.5;
const PLAYER_DEPTH = 0.5;
const COLLISION_TOLERANCE = 0.1;
const SIDE_COLLISION_THRESHOLD_PERCENT = 0.05; // 5%

// Constants - World Generation
const BLOCK_SIZE_MIN = 2;
const BLOCK_SIZE_MAX = 6;
const BLOCK_HEIGHT_MIN = 1;
const BLOCK_HEIGHT_MAX = 8;
const GAP_MIN = 2;
const GAP_MAX = 6;
const PLATFORM_WIDTH_MIN = 2;
const PLATFORM_WIDTH_MAX = 8;
const GENERATION_DISTANCE = 50;
const DESPAWN_DISTANCE = -20;
const MAX_BLOCKS = 50;

// Game State
let scene, camera, renderer, clock;
let player = {
    position: new THREE.Vector3(0, PLAYER_HEIGHT / 2, 5),
    velocity: new THREE.Vector3(0, 0, -RUN_SPEED),
    onGround: false,
    isJumping: false,
    jumpStartTime: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    depth: PLAYER_DEPTH
};
let playerBox = new THREE.Box3();
let blocks = [];
let keys = { space: false, a: false, d: false };
let gameState = 'intro'; // 'intro', 'playing', 'gameOver'
let lastBlockZ = 0;
let houseMesh;

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, GENERATION_DISTANCE * 1.5);

    // Clock
    clock = new THREE.Clock();

    // Camera (First-Person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(player.position);
    camera.position.y += PLAYER_HEIGHT / 2; // Eye level

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixelated look
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Optional: for shadows
    scene.add(directionalLight);

    // Initial Ground / House
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1; // Slightly below player start
    scene.add(ground);
    // House (simple block)
    houseMesh = createBlock(new THREE.Vector3(0, 2, 8), new THREE.Vector3(4, 4, 4), 0x8B4513);
    houseMesh.userData.isHouse = true;

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Start Intro Sequence
    startGameSequence();
}

function startGameSequence() {
    gameState = 'intro';
    player.position.set(0, PLAYER_HEIGHT / 2, 5);
    player.velocity.set(0, 0, 0); // Start stationary
    camera.position.copy(player.position);
    camera.position.y += PLAYER_HEIGHT / 2 - 0.2; // Adjust eye level slightly
    camera.lookAt(houseMesh.position);

    // Remove old blocks if any (from previous game)
    blocks.forEach(block => scene.remove(block.mesh));
    blocks = [];
    lastBlockZ = 0; // Reset generation position

    // Add house back if removed
    if (!houseMesh.parent) scene.add(houseMesh);

    // Start game after a delay
    setTimeout(() => {
        if (gameState === 'intro') { // Prevent starting if reset during timeout
             startGame();
        }
    }, 2000); // 2 second delay looking at house
}

function startGame() {
    gameState = 'playing';
    player.velocity.z = -RUN_SPEED; // Start auto-running
    player.onGround = true; // Assume starting on the ground/initial platform
    if (houseMesh.parent) scene.remove(houseMesh); // Remove house
    generateInitialObstacles();
    animate();
}

function createBlock(position, size, color = 0xaaaaaa) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.userData.boundingBox = new THREE.Box3().setFromObject(mesh);
    mesh.userData.size = size.clone(); // Store size for collision check
    scene.add(mesh);
    return mesh;
}

function generateInitialObstacles() {
    // Generate a starting platform
    const startPlatformSize = new THREE.Vector3(PLATFORM_WIDTH_MAX, 1, 10);
    const startPlatformPos = new THREE.Vector3(0, -0.5, -startPlatformSize.z / 2);
    const startPlatform = createBlock(startPlatformPos, startPlatformSize, 0x666666);
    blocks.push({ mesh: startPlatform, box: startPlatform.userData.boundingBox });
    lastBlockZ = startPlatformPos.z - startPlatformSize.z / 2;

    // Generate some initial blocks
    for (let i = 0; i < 10; i++) {
        generateObstacle();
    }
}

function generateObstacle() {
    const gap = THREE.MathUtils.randFloat(GAP_MIN, GAP_MAX);
    const blockWidth = THREE.MathUtils.randFloat(PLATFORM_WIDTH_MIN, PLATFORM_WIDTH_MAX);
    const blockDepth = THREE.MathUtils.randFloat(BLOCK_SIZE_MIN, BLOCK_SIZE_MAX);
    const blockHeight = THREE.MathUtils.randFloat(BLOCK_HEIGHT_MIN, BLOCK_HEIGHT_MAX);

    const positionX = THREE.MathUtils.randFloat(-PLATFORM_WIDTH_MAX / 2 + blockWidth / 2, PLATFORM_WIDTH_MAX / 2 - blockWidth / 2);
    const positionY = blockHeight / 2 - 0.1; // Position base near y=0
    const positionZ = lastBlockZ - gap - blockDepth / 2;

    const size = new THREE.Vector3(blockWidth, blockHeight, blockDepth);
    const position = new THREE.Vector3(positionX, positionY, positionZ);

    const newBlock = createBlock(position, size, Math.random() * 0xffffff);
    blocks.push({ mesh: newBlock, box: newBlock.userData.boundingBox });

    lastBlockZ = positionZ - blockDepth / 2;
}

function manageObstacles() {
    // Generate new blocks
    if (lastBlockZ > player.position.z - GENERATION_DISTANCE) {
        if (blocks.length < MAX_BLOCKS) {
            generateObstacle();
        }
    }

    // Despawn old blocks
    blocks = blocks.filter(blockData => {
        if (blockData.mesh.position.z > player.position.z - DESPAWN_DISTANCE) {
            return true;
        } else {
            scene.remove(blockData.mesh);
            // Dispose geometry and material if needed for performance
            // blockData.mesh.geometry.dispose();
            // blockData.mesh.material.dispose();
            return false;
        }
    });
}

function updatePlayer(deltaTime) {
    let horizontalVelocity = 0;
    if (keys.a) horizontalVelocity -= STRAFE_SPEED;
    if (keys.d) horizontalVelocity += STRAFE_SPEED;

    player.velocity.x = horizontalVelocity;

    // Apply gravity
    player.velocity.y += GRAVITY * deltaTime;

    // Handle Jumping
    const now = clock.getElapsedTime();
    if (keys.space && !player.isJumping && player.onGround) {
        player.velocity.y = INITIAL_JUMP_VELOCITY;
        player.isJumping = true;
        player.onGround = false;
        player.jumpStartTime = now;
    }

    // Apply jump hold force
    if (player.isJumping && keys.space && (now - player.jumpStartTime < MAX_JUMP_HOLD_TIME)) {
         // Apply diminishing force or constant force up to max hold time
         player.velocity.y += JUMP_HOLD_FORCE * deltaTime * (1 - (now - player.jumpStartTime) / MAX_JUMP_HOLD_TIME);
    }

    // Update position
    player.position.x += player.velocity.x * deltaTime;
    player.position.z += player.velocity.z * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Update player bounding box
    const playerCenter = new THREE.Vector3(player.position.x, player.position.y + player.height / 2, player.position.z);
    const playerSize = new THREE.Vector3(player.width, player.height, player.depth);
    playerBox.setFromCenterAndSize(playerCenter, playerSize);

    player.onGround = false; // Assume not on ground until collision check proves otherwise
}

function checkCollisions() {
    let landedOnBlock = false;

    for (const blockData of blocks) {
        if (playerBox.intersectsBox(blockData.box)) {
            const blockMesh = blockData.mesh;
            const blockTop = blockMesh.position.y + blockMesh.userData.size.y / 2;
            const blockBottom = blockMesh.position.y - blockMesh.userData.size.y / 2;
            const playerBottom = player.position.y;
            const playerTop = player.position.y + player.height;

            // Check for landing on top
            if (player.velocity.y <= 0 && // Moving downwards or stationary
                playerBottom >= blockTop - COLLISION_TOLERANCE && // Player bottom is near or above block top
                playerBottom <= blockTop + COLLISION_TOLERANCE * 2) // Added tolerance for slight overshoots
            {
                 // Check horizontal overlap
                 if (playerBox.max.x > blockData.box.min.x && playerBox.min.x < blockData.box.max.x &&
                     playerBox.max.z > blockData.box.min.z && playerBox.min.z < blockData.box.max.z)
                 {
                    player.position.y = blockTop; // Snap to top
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.isJumping = false;
                    landedOnBlock = true;
                    // No need to check other blocks for landing once landed
                    break; // Exit the loop early after landing
                 }
            }
        }
    }

     // If not landed, check for side collisions ONLY if not resolving a landing
    if (!landedOnBlock) {
         for (const blockData of blocks) {
             if (playerBox.intersectsBox(blockData.box)) {
                const blockMesh = blockData.mesh;
                const blockTop = blockMesh.position.y + blockMesh.userData.size.y / 2;
                const blockHeight = blockMesh.userData.size.y;
                const collisionThresholdY = blockTop - blockHeight * SIDE_COLLISION_THRESHOLD_PERCENT;
                const playerBottom = player.position.y;

                // Check if the collision is primarily horizontal or vertical (below the top threshold)
                // A simple check: if player's bottom is below the threshold, it's a side hit
                if (playerBottom < collisionThresholdY) {
                    console.log("Game Over: Hit side of block");
                    gameOver();
                    return; // Exit collision checks
                }
                // Optional: More sophisticated side collision check could analyze penetration depth
             }
         }
    }


    // Check for falling off the world
    if (player.position.y < -10) { // Give some leeway below y=0
        console.log("Game Over: Fell off world");
        gameOver();
    }
}

function gameOver() {
    gameState = 'gameOver';
    player.velocity.set(0, 0, 0);
    // Display game over message (simple console log for now)
    console.log("GAME OVER! Press R to restart.");
    // In a real game, show a UI overlay here
}

function resetGame() {
    // Clear existing blocks
    blocks.forEach(blockData => scene.remove(blockData.mesh));
    blocks = [];
    lastBlockZ = 0;

    // Reset player state
    player.position.set(0, PLAYER_HEIGHT / 2, 5);
    player.velocity.set(0, 0, 0);
    player.onGround = false;
    player.isJumping = false;
    keys = { space: false, a: false, d: false };

    // Restart sequence
    startGameSequence();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'Space':
            keys.space = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.a = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.d = true;
            break;
        case 'KeyR':
             if (gameState === 'gameOver') {
                 resetGame();
             }
             break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'Space':
            keys.space = false;
            // Optional: Could trigger end of jump force application here
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.a = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.d = false;
            break;
    }
}

function animate() {
    if (gameState === 'gameOver' && !keys.r) {
        // Stop animation updates but keep rendering maybe?
        // Or just cancel the animation frame request
        // For simplicity, we allow 'R' check within loop
    }
     if (gameState === 'playing') {
        const deltaTime = Math.min(clock.getDelta(), 0.05); // Clamp delta time to prevent large jumps

        updatePlayer(deltaTime);
        checkCollisions();
        manageObstacles();

        // Update camera position to follow player
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + PLAYER_HEIGHT / 2 - 0.2; // Eye level adjustment
        camera.position.z = player.position.z;

        // Keep camera looking forward relative to player movement
        const lookAtPosition = new THREE.Vector3(player.position.x, camera.position.y, player.position.z - 1);
        camera.lookAt(lookAtPosition);
    }

    renderer.render(scene, camera);

    // Only continue animation loop if not in intro (handled by setTimeout)
    if (gameState !== 'intro') {
       requestAnimationFrame(animate);
    }
}

// Start the application
init();