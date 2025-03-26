// Framework: three.js
// User Prompt: A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ; 

game starts like that :

mario exits their house 
runs forward and sees minecraft type blocks in 3D (view from the first-perspective)

then auto-running turns on (from the first-person perspective too) 

and we have to do parkour via deciding how long we should click space 

obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle . 

Mario can jump ONTO obstacles [!]

if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy 

Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'; // Needed if using THREE.TextGeometry
// Note: TextGeometry itself might not be directly in addons, depending on Three.js version.
// If FontLoader isn't found, text display needs an alternative (e.g., textured plane, HTML overlay).
// For this example, we'll stick to console logging and background color change for game over.

// Constants
const PLAYER_HEIGHT = 1.6; // Slightly shorter for better view over blocks?
const PLAYER_WIDTH = 0.4;
const GRAVITY = -9.8 * 2.5; // Adjusted gravity
const JUMP_FORCE_BASE = 7;
const JUMP_CHARGE_RATE = 8;
const MAX_JUMP_CHARGE = 18;
const MOVE_SPEED = 6;
const STRAFE_SPEED = 5;
const BLOCK_SIZE = 2; // Uniform block size for simplicity
const GENERATE_DISTANCE = 60;
const CULL_DISTANCE = -25;
const LANDING_TOLERANCE_PERCENT = 0.05; // 5% tolerance from top edge

// State variables
let scene, camera, renderer;
let player = {
    position: new THREE.Vector3(0, PLAYER_HEIGHT / 2, 5), // Position is feet level
    velocity: new THREE.Vector3(),
    onGround: false,
    isJumping: false, // True when space is held down (charging) or in air after jump
    jumpCharge: 0,
    canJump: true,
    collider: new THREE.Box3(),
    height: PLAYER_HEIGHT,
    width: PLAYER_WIDTH
};
let keys = {
    space: false,
    a: false,
    d: false
};
let blocks = [];
let clock = new THREE.Clock();
let lastBlockZ = 0;
let gameState = 'playing'; // 'playing', 'gameOver'
let gameOverDisplay; // For simple visual feedback

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 10, GENERATE_DISTANCE * 0.9);

    // Camera (First-person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position camera at player's eye level
    camera.position.set(player.position.x, player.position.y + player.height - 0.2, player.position.z);


    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // False for pixelated feel
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Pixelated look
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 15, 10);
    directionalLight.castShadow = false; // Shadows can be expensive, disable for now
    scene.add(directionalLight);

    // Initial Blocks
    createBlock(0, -BLOCK_SIZE, 0, 10, BLOCK_SIZE, 10); // Starting platform (Y is bottom)
    lastBlockZ = -5; // Start generating blocks ahead
    generateInitialBlocks();

    // Event Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function createBlock(x, y_bottom, z, width = BLOCK_SIZE, height = BLOCK_SIZE, depth = BLOCK_SIZE) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    // Simple Minecraft-like colors / materials
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x6a9b4a, roughness: 0.9, metalness: 0.1 }); // Greenish top
    const sideMaterial = new THREE.MeshStandardMaterial({ color: 0x9b7653, roughness: 0.9, metalness: 0.1 }); // Brownish side
    const bottomMaterial = new THREE.MeshStandardMaterial({ color: 0x7a4d2b, roughness: 0.9, metalness: 0.1 }); // Darker bottom

    const materials = [
        sideMaterial,     // right
        sideMaterial,     // left
        topMaterial,      // top
        bottomMaterial,   // bottom
        sideMaterial,     // front
        sideMaterial      // back
    ];

    const block = new THREE.Mesh(geometry, materials);
    // Position block based on its bottom center
    block.position.set(x, y_bottom + height / 2, z);

    // Add collider Box3 based on world coordinates
    block.userData.collider = new THREE.Box3().setFromObject(block);
    block.userData.height = height; // Store height for collision check
    block.userData.y_bottom = y_bottom;
    block.userData.y_top = y_bottom + height;

    scene.add(block);
    blocks.push(block);
    return block;
}

function generateInitialBlocks() {
    for (let i = 0; i < 15; i++) { // Generate more blocks initially
        generateNextBlock();
    }
}

function generateNextBlock() {
    const minGap = 1.5;
    const maxGap = 6; // Max horizontal jump distance influence
    const minHeight = 1;
    const maxHeight = 6; // Allow taller blocks
    const xRange = 6; // Wider range for left/right movement

    const prevBlock = blocks[blocks.length - 1];
    const prevTopY = prevBlock ? prevBlock.userData.y_top : 0;

    const gap = minGap + Math.random() * (maxGap - minGap);
    let height = minHeight + Math.random() * (maxHeight - minHeight);
    let y_bottom = 0; // Default ground level

    // Make height relative to previous block sometimes, ensure jumpability
    const heightDiff = Math.random() * 4 - 2; // -2 to +2 height difference
    const targetTopY = Math.max(0.5, prevTopY + heightDiff); // Ensure minimum height reachable from ground
    height = Math.max(minHeight, targetTopY - y_bottom); // Adjust height based on target top


    const x = (Math.random() - 0.5) * xRange;
    const z = lastBlockZ - gap - BLOCK_SIZE / 2; // Place it further away (center Z)

    createBlock(x, y_bottom, z, BLOCK_SIZE, height, BLOCK_SIZE);
    lastBlockZ = z - BLOCK_SIZE / 2; // Update last Z position based on back face
}


function handleKeyDown(event) {
    if (gameState === 'gameOver' && (event.key === 'r' || event.key === 'R')) {
        restartGame();
        return;
    }
    if (gameState !== 'playing') return;

    switch (event.code) { // Use event.code for layout independence
        case 'Space':
            if (player.onGround && player.canJump) {
                keys.space = true;
                player.isJumping = true; // Indicate charging started
                player.jumpCharge = JUMP_FORCE_BASE; // Start with base jump force
            }
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.a = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.d = true;
            break;
    }
}

function handleKeyUp(event) {
     if (gameState !== 'playing') return;

    switch (event.code) { // Use event.code
        case 'Space':
            if (keys.space && player.isJumping && player.onGround) { // Was charging ON GROUND
                player.velocity.y = player.jumpCharge;
                player.onGround = false;
                player.canJump = false; // Prevent double jump mid-air
                player.isJumping = true; // Still true, but now means "in air from jump"
                player.jumpCharge = 0; // Reset charge
                // Small delay before allowing jump again after landing
                setTimeout(() => { player.canJump = true; }, 150); // Shorter delay
            }
            keys.space = false;
            // If space is released mid-air, it has no effect on current jump
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer(deltaTime) {
    if (gameState !== 'playing') return;

    const prevPosition = player.position.clone(); // Store position before updates

    // --- Horizontal Movement ---
    let strafeVelocity = 0;
    if (keys.a) strafeVelocity -= STRAFE_SPEED;
    if (keys.d) strafeVelocity += STRAFE_SPEED;
    player.velocity.x = strafeVelocity;

    // --- Auto-running ---
    player.velocity.z = -MOVE_SPEED;

    // --- Vertical Movement (Jumping and Gravity) ---
    if (keys.space && player.isJumping && player.onGround) {
        // Charging jump while on ground
        player.jumpCharge += JUMP_CHARGE_RATE * deltaTime;
        player.jumpCharge = Math.min(player.jumpCharge, MAX_JUMP_CHARGE);
        // Stick to ground while charging
        player.velocity.y = Math.max(player.velocity.y, 0); // Prevent sinking while charging
    }

    // Apply gravity if not on ground
    if (!player.onGround) {
        player.velocity.y += GRAVITY * deltaTime;
    } else {
        // If on ground but not charging jump, ensure Y velocity is zero or slightly negative
         if (!keys.space) {
             player.velocity.y = Math.min(0, player.velocity.y);
         }
    }

    // --- Update Position based on Velocity ---
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;
    player.position.z += player.velocity.z * deltaTime;

    // --- Collision Detection and Resolution ---
    player.onGround = false; // Assume not on ground until proven otherwise

    // Update player collider (simplified box centered at feet, extending upwards)
    const playerHalfWidth = player.width / 2;
    player.collider.min.set(player.position.x - playerHalfWidth, player.position.y, player.position.z - playerHalfWidth);
    player.collider.max.set(player.position.x + playerHalfWidth, player.position.y + player.height, player.position.z + playerHalfWidth);

    let landedThisFrame = false;

    for (const block of blocks) {
        // Broad phase check (optional optimization: check if block is nearby Z)
        if (Math.abs(player.position.z - block.position.z) > BLOCK_SIZE * 2) continue;

        if (player.collider.intersectsBox(block.userData.collider)) {
            const blockTop = block.userData.y_top;
            const blockBottom = block.userData.y_bottom;
            const blockHeight = block.userData.height;
            const landingTolerance = blockHeight * LANDING_TOLERANCE_PERCENT;

            const feetY = player.position.y;
            const prevFeetY = prevPosition.y; // Feet position in previous frame

            // Check for landing ON TOP
            // Conditions:
            // 1. Player was above or near the top in the previous frame.
            // 2. Player is now at or below the top (but not too far below).
            // 3. Player is moving downwards or has negligible Y velocity.
            if (player.velocity.y <= 0.1 && // Moving down or slow
                prevFeetY >= blockTop - 0.05 && // Was near or above top edge
                feetY <= blockTop + 0.1 && // Now is near or slightly below top edge
                feetY >= blockTop - landingTolerance) // Feet are within landing tolerance from top
            {
                player.position.y = blockTop; // Snap feet Y position to block top
                player.velocity.y = 0;
                player.onGround = true;
                player.isJumping = false; // Landed, no longer jumping/charging
                landedThisFrame = true;
                // Keep player.canJump state managed by timeout in keyup
                break; // Stop checking collisions for this frame once landed
            }
            // Check for hitting the side LOW (Game Over)
            else if (feetY < blockTop - landingTolerance && feetY > blockBottom - 0.1) // Hit side significantly below tolerance
            {
                 setGameOver(`Landed too low (>${(LANDING_TOLERANCE_PERCENT * 100).toFixed(0)}%) on block side`);
                 return; // Exit update loop on game over
            }
            // Collision Resolution (simple push-out for sides/front)
            else {
                 const overlap = player.collider.intersect(block.userData.collider); // Get intersection box
                 const overlapSize = overlap.getSize(new THREE.Vector3());

                 // Determine primary collision axis (axis with smallest overlap is likely penetration axis)
                 if (overlapSize.y < overlapSize.x && overlapSize.y < overlapSize.z) {
                      // Vertical collision (hitting underside or head bump)
                      if (player.velocity.y > 0 && feetY < blockBottom + overlapSize.y) { // Hitting underside while moving up
                          player.position.y = blockBottom - player.height - 0.01; // Push down
                          player.velocity.y = 0; // Stop upward movement
                      }
                      // Landing case already handled above
                 } else if (overlapSize.x < overlapSize.z) {
                      // Horizontal collision (X-axis)
                      if (player.position.x < block.position.x) { // Player is left of block center
                          player.position.x = block.userData.collider.min.x - playerHalfWidth - 0.01; // Push left
                      } else { // Player is right of block center
                          player.position.x = block.userData.collider.max.x + playerHalfWidth + 0.01; // Push right
                      }
                      player.velocity.x = 0; // Stop horizontal movement in that direction
                 } else {
                      // Horizontal collision (Z-axis - hitting front/back)
                      if (player.position.z < block.position.z) { // Player is behind block center (relative Z)
                          // player.position.z = block.userData.collider.min.z - playerHalfWidth - 0.01; // Push back (less likely needed)
                      } else { // Player is in front of block center
                           // Hitting the front face while moving forward (-Z)
                           setGameOver("Hit front of block");
                           return; // Exit update loop
                      }
                      // player.velocity.z = 0; // Stop forward movement - handled by game over
                 }
            }
        }
    }


    // --- Check Floor Collision (Game Over) ---
    // Use a low Y value instead of an actual floor mesh
    if (!landedThisFrame && player.position.y < -5) { // Give some leeway below y=0
        setGameOver("Fell off the world");
        return;
    }


    // --- Update Camera ---
    // Camera position at player's eye level
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + player.height - 0.2; // Eye level slightly below top
    camera.position.z = player.position.z;
    // Keep camera looking straight ahead (relative to player's forward direction)
    camera.lookAt(player.position.x, camera.position.y, player.position.z - 1);


    // --- Block Management ---
    // Generate new blocks
    if (lastBlockZ > player.position.z - GENERATE_DISTANCE) {
        generateNextBlock();
    }

    // Remove old blocks
    blocks = blocks.filter(block => {
        if (block.position.z > player.position.z + CULL_DISTANCE) { // Check based on player Z + cull distance
            return true; // Keep block
        } else {
            scene.remove(block);
            // Dispose geometry and material to free memory
            if (block.geometry) block.geometry.dispose();
            // Dispose materials if they are unique per block, or manage shared materials carefully
            if (Array.isArray(block.material)) {
                 block.material.forEach(m => m.dispose());
            } else if (block.material) {
                 block.material.dispose();
            }
            return false; // Remove block from array
        }
    });
}

function setGameOver(reason = "Game Over") {
    if (gameState === 'gameOver') return; // Prevent multiple calls

    gameState = 'gameOver';
    player.velocity.set(0, 0, 0); // Stop player movement

    console.log("GAME OVER:", reason);
    console.log("Press 'R' to restart");

    // Simple visual feedback: Red background tint
    scene.background = new THREE.Color(0xaa0000);
    scene.fog.color.set(0xaa0000); // Match fog color

    // Optionally create a simple mesh overlay (avoids complex text rendering)
    if (!gameOverDisplay) {
        const overlayGeo = new THREE.PlaneGeometry(2, 1);
        const overlayMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
        gameOverDisplay = new THREE.Mesh(overlayGeo, overlayMat);
        scene.add(gameOverDisplay);
    }
    // Position it in front of the camera
    const distance = 2;
    const targetPosition = new THREE.Vector3(0, 0, -distance);
    targetPosition.applyMatrix4(camera.matrixWorld); // Project position in front of camera
    gameOverDisplay.position.copy(targetPosition);
    gameOverDisplay.lookAt(camera.position);
    gameOverDisplay.visible = true;
}

function restartGame() {
    // Remove existing blocks
    blocks.forEach(block => {
        scene.remove(block);
        if (block.geometry) block.geometry.dispose();
        if (Array.isArray(block.material)) {
            block.material.forEach(m => m.dispose());
        } else if (block.material) {
            block.material.dispose();
        }
    });
    blocks = [];

    // Reset player state
    player.position.set(0, PLAYER_HEIGHT / 2, 5);
    player.velocity.set(0, 0, 0);
    player.onGround = false; // Will land on start platform
    player.isJumping = false;
    player.jumpCharge = 0;
    player.canJump = true;

    // Reset game state
    gameState = 'playing';
    scene.background = new THREE.Color(0x87ceeb); // Reset background
    scene.fog.color.set(0x87ceeb); // Reset fog color
    if (gameOverDisplay) gameOverDisplay.visible = false; // Hide game over overlay

    // Reset keys
    keys.space = false;
    keys.a = false;
    keys.d = false;

    // Regenerate initial blocks
    lastBlockZ = 0;
    createBlock(0, -BLOCK_SIZE, 0, 10, BLOCK_SIZE, 10); // Starting platform
    lastBlockZ = -5;
    generateInitialBlocks();

    // Reset clock
    clock.start(); // Good practice to reset delta timer
}


function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.05); // Cap delta time

    if (gameState === 'playing') {
        updatePlayer(deltaTime);
    } else if (gameState === 'gameOver') {
        // Keep game over overlay in front of camera if it exists
        if (gameOverDisplay && gameOverDisplay.visible) {
            const distance = 2;
            const targetPosition = new THREE.Vector3(0, 0, -distance);
            targetPosition.applyMatrix4(camera.matrixWorld);
            gameOverDisplay.position.copy(targetPosition);
            gameOverDisplay.lookAt(camera.position);
        }
        // Optionally add slight camera drift or other effect
    }

    renderer.render(scene, camera);
}

// --- Start ---
init();