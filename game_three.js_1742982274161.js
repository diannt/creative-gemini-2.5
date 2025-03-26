// Framework: three.js
// User Prompt: A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ; game starts like that :
 mario exits their house
 runs forward and sees minecraft type blocks in 3D (view from the first-perspective) then auto-running turns on (from the first-person perspective too)
 and we have to do parkour via deciding how long we should click space obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle .
 Mario can jump ONTO obstacles [!]
 if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves

import * as THREE from 'three';

// --- Constants ---
const PLAYER_HEIGHT = 1.5;
const PLAYER_SPEED = 5.0; // Forward speed
const STRAFE_SPEED = 4.0;
const GRAVITY = -15.0;
const JUMP_VELOCITY_MIN = 4.0;
const JUMP_VELOCITY_MAX = 8.0;
const JUMP_CHARGE_TIME_MAX = 0.5; // seconds
const BLOCK_SIZE_MIN = 1;
const BLOCK_SIZE_MAX = 4;
const BLOCK_HEIGHT_MIN = 1;
const BLOCK_HEIGHT_MAX = 5;
const BLOCK_SPACING_MIN = 2;
const BLOCK_SPACING_MAX = 5;
const GENERATE_DISTANCE = 30;
const CULL_DISTANCE = 20;
const GROUND_Y = 0;
const SIDE_HIT_TOLERANCE_PERCENT = 0.05; // 5% from the top

// --- Global Variables ---
let scene, camera, renderer, clock;
let player = {
    position: new THREE.Vector3(0, PLAYER_HEIGHT, 5), // Start slightly back
    velocity: new THREE.Vector3(0, 0, -PLAYER_SPEED), // Auto-run forward (negative Z)
    onGround: false,
    isChargingJump: false,
    jumpChargeStart: 0,
    width: 0.6, // For collision checking
    height: PLAYER_HEIGHT
};
let blocks = [];
let keyStates = {};
let isGameOver = false;
let lastBlockZ = 0;
let blockMaterial;

// --- Initialization ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

    // Clock
    clock = new THREE.Clock();

    // Camera (First-Person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    // Camera position will be updated to follow player feet + eye height offset

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixelated look often benefits from no AA
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Optional: Adjust for performance if needed
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = false; // Shadows can be expensive, disable for now
    scene.add(directionalLight);

    // Ground (using a large thin box)
    const groundGeometry = new THREE.BoxGeometry(100, 0.2, 1000); // Long ground
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.set(0, GROUND_Y - 0.1, -450); // Position it correctly under player path
    scene.add(ground);

    // Block Material (Pixelated Look)
    blockMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown color like dirt/wood
        roughness: 0.8,
        metalness: 0.1
    });
    // Optional: Use a texture for more Minecraft-like blocks
    // const textureLoader = new THREE.TextureLoader();
    // const texture = textureLoader.load('path/to/your/pixel_block_texture.png', (tex) => {
    //     tex.magFilter = THREE.NearestFilter;
    //     tex.minFilter = THREE.NearestFilter;
    //     blockMaterial.map = tex;
    //     blockMaterial.needsUpdate = true;
    // });


    // Initial Block Generation
    generateInitialBlocks();


    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (event) => {
        keyStates[event.code] = true;
        if (event.code === 'Space' && player.onGround && !player.isChargingJump) {
            player.isChargingJump = true;
            player.jumpChargeStart = clock.getElapsedTime();
        }
        // Restart on 'R' if game over
        if (event.code === 'KeyR' && isGameOver) {
             resetGame();
        }
    });
    document.addEventListener('keyup', (event) => {
        keyStates[event.code] = false;
        if (event.code === 'Space' && player.isChargingJump) {
            player.isChargingJump = false;
            if (player.onGround) {
                const chargeTime = Math.min(clock.getElapsedTime() - player.jumpChargeStart, JUMP_CHARGE_TIME_MAX);
                const jumpPower = THREE.MathUtils.mapLinear(chargeTime, 0, JUMP_CHARGE_TIME_MAX, JUMP_VELOCITY_MIN, JUMP_VELOCITY_MAX);
                player.velocity.y = jumpPower;
                player.onGround = false;
            }
        }
    });

    // Start Animation Loop
    animate();
}

// --- Block Management ---
function createBlock(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const block = new THREE.Mesh(geometry, blockMaterial);
    // Position is center of the block
    block.position.set(x, y + height / 2, z);
    scene.add(block);
    blocks.push(block);
    return block;
}

function generateInitialBlocks() {
     // Start block
     createBlock(0, GROUND_Y, 0, 3, 1, 3);
     lastBlockZ = 0;
     // Generate some initial blocks ahead
     for (let i = 0; i < 15; i++) {
         generateNextBlock();
     }
}

function generateNextBlock() {
    const gap = THREE.MathUtils.randFloat(BLOCK_SPACING_MIN, BLOCK_SPACING_MAX);
    const newZ = lastBlockZ - gap - BLOCK_SIZE_MAX / 2; // Adjust Z based on previous block and gap

    const width = THREE.MathUtils.randFloat(BLOCK_SIZE_MIN, BLOCK_SIZE_MAX);
    const height = THREE.MathUtils.randFloat(BLOCK_HEIGHT_MIN, BLOCK_HEIGHT_MAX);
    const depth = THREE.MathUtils.randFloat(BLOCK_SIZE_MIN, BLOCK_SIZE_MAX);

    // Ensure x position allows for jumping room, maybe limit range
    const x = THREE.MathUtils.randFloat(-5, 5);
    const y = GROUND_Y; // Blocks start from ground level

    const newBlock = createBlock(x, y, newZ - depth/2, width, height, depth);
    lastBlockZ = newBlock.position.z - depth / 2; // Update lastBlockZ to the front face of the new block
}

function manageBlocks() {
    // Generate new blocks if player is close to the furthest generated block
    if (player.position.z < lastBlockZ + GENERATE_DISTANCE) {
        generateNextBlock();
    }

    // Remove blocks far behind the player
    blocks = blocks.filter(block => {
        if (block.position.z > player.position.z + CULL_DISTANCE) {
            scene.remove(block);
            // Dispose geometry and material if needed (material is shared here)
            // block.geometry.dispose();
            return false; // Remove from array
        }
        return true; // Keep in array
    });
}


// --- Player Update and Collision ---
function updatePlayer(deltaTime) {
    if (isGameOver) return;

    let strafeVelocity = 0;

    // Strafe Input
    if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
        strafeVelocity = -STRAFE_SPEED;
    }
    if (keyStates['KeyD'] || keyStates['ArrowRight']) {
        strafeVelocity = STRAFE_SPEED;
    }

    // Apply gravity
    if (!player.onGround) {
        player.velocity.y += GRAVITY * deltaTime;
    }

    // Calculate proposed movement
    const deltaPosition = new THREE.Vector3();
    // Forward movement (always applied)
    deltaPosition.z = player.velocity.z * deltaTime;
    // Strafe movement
    deltaPosition.x = strafeVelocity * deltaTime;
     // Vertical movement
    deltaPosition.y = player.velocity.y * deltaTime;


    // --- Collision Detection ---
    player.onGround = false; // Assume not on ground until collision check proves otherwise

    const playerFeetY = player.position.y;
    const nextPlayerFeetY = playerFeetY + deltaPosition.y;

    // Check ground collision first
    if (nextPlayerFeetY <= GROUND_Y) {
        gameOver("Fell to the ground!");
        player.velocity.y = 0;
        player.position.y = GROUND_Y; // Place player exactly on ground for game over screen
        player.onGround = true; // Technically on ground, but game is over
        return; // Stop further processing
    }


    // Check block collisions
    let landedOnBlock = false;
    let hitSide = false;

    // Simplified player bounding box at feet level for checking
    const nextPlayerPos = player.position.clone().add(deltaPosition);

    for (const block of blocks) {
        const blockBox = new THREE.Box3().setFromObject(block);
        const blockTopY = blockBox.max.y;
        const blockBottomY = blockBox.min.y;

        // --- Vertical Collision (Landing) ---
        const isFalling = player.velocity.y <= 0;
        const wasAbove = player.position.y >= blockTopY;
        const willBeBelowTop = nextPlayerPos.y < blockTopY;
        const isHorizontallyAligned = nextPlayerPos.x + player.width / 2 > blockBox.min.x &&
                                    nextPlayerPos.x - player.width / 2 < blockBox.max.x &&
                                    nextPlayerPos.z + player.width / 2 > blockBox.min.z &&
                                    nextPlayerPos.z - player.width / 2 < blockBox.max.z;

        if (isFalling && wasAbove && willBeBelowTop && isHorizontallyAligned) {
            // Potential landing
            deltaPosition.y = blockTopY - player.position.y; // Adjust deltaY to land exactly on top
            player.velocity.y = 0;
            player.onGround = true;
            landedOnBlock = true;
            // console.log("Landed!");
            break; // Stop checking other blocks once landed
        }

        // --- Horizontal & Side Collision (Bonk / Game Over) ---
        // Create a bounding box for the player's *next* position
        const nextPlayerBox = new THREE.Box3(
             new THREE.Vector3(nextPlayerPos.x - player.width / 2, nextPlayerPos.y, nextPlayerPos.z - player.width / 2),
             new THREE.Vector3(nextPlayerPos.x + player.width / 2, nextPlayerPos.y + player.height, nextPlayerPos.z + player.width / 2)
        );

        if (!landedOnBlock && nextPlayerBox.intersectsBox(blockBox)) {
             // Check if the collision height is too low on the block
             const allowedTopRegion = block.geometry.parameters.height * SIDE_HIT_TOLERANCE_PERCENT;
             const minSafeCollisionY = blockTopY - allowedTopRegion;

             // Check the lowest point of the player box that intersects
             const intersectionMinY = Math.max(nextPlayerBox.min.y, blockBox.min.y);

             if (intersectionMinY < minSafeCollisionY) {
                hitSide = true;
                // console.log("Hit side - too low!");
                break;
             } else {
                 // If collision is high enough, potentially just bonk/stop horizontal movement
                 // Check which direction caused the collision
                 const tempPlayerBoxX = new THREE.Box3().copy(nextPlayerBox).translate(new THREE.Vector3(-deltaPosition.x, 0, 0));
                 const tempPlayerBoxZ = new THREE.Box3().copy(nextPlayerBox).translate(new THREE.Vector3(0, 0, -deltaPosition.z));

                 if (!tempPlayerBoxX.intersectsBox(blockBox)) { // Collision caused by X movement
                     deltaPosition.x = 0;
                     // console.log("Bonk X");
                 }
                 if (!tempPlayerBoxZ.intersectsBox(blockBox)) { // Collision caused by Z movement
                     deltaPosition.z = 0;
                     player.velocity.z = 0; // Stop auto-run temporarily if hitting front
                     // console.log("Bonk Z");
                 }
             }
        }
    }

     // Check for side hit game over condition after checking all blocks
     if (hitSide && !landedOnBlock) { // Ensure it wasn't a landing scenario
        gameOver("Hit the side of a block!");
        return; // Stop further processing
    }


    // Apply final position change
    player.position.add(deltaPosition);

    // Update camera position to follow player (eye level)
    camera.position.set(
        player.position.x,
        player.position.y + PLAYER_HEIGHT * 0.8, // Eye level slightly below top of player height
        player.position.z
    );
    // Look slightly ahead, maintaining horizontal level
    camera.lookAt(player.position.x, player.position.y + PLAYER_HEIGHT * 0.8, player.position.z - 10); 


    // Resume constant forward velocity (auto-run) if it was stopped by bonk
    if(player.velocity.z === 0) {
        player.velocity.z = -PLAYER_SPEED;
    }

}

// --- Game State ---
function gameOver(message) {
    if (!isGameOver) { // Prevent multiple calls
        console.log("Game Over:", message);
        isGameOver = true;
        player.velocity.set(0, 0, 0); // Stop player movement
        
        // Display overlay message
        const overlay = document.createElement('div');
        overlay.id = 'gameOverOverlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = 'white';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column'; // Stack text vertically
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.textAlign = 'center';
        overlay.style.fontSize = '3em';
        overlay.style.fontFamily = '"Courier New", Courier, monospace'; // Pixel-like font
        overlay.innerHTML = `<div>Game Over!</div><div>${message}</div><div style="font-size: 0.5em; margin-top: 20px;">Press R to Restart</div>`;
        document.body.appendChild(overlay);
    }
}

function resetGame() {
    console.log("Resetting game...");
    // Remove existing blocks
    blocks.forEach(block => scene.remove(block));
    blocks = [];

    // Reset player state
    player.position.set(0, PLAYER_HEIGHT, 5);
    player.velocity.set(0, 0, -PLAYER_SPEED);
    player.onGround = false; // Will be corrected by landing on start block
    player.isChargingJump = false;

    // Reset game state
    isGameOver = false;
    lastBlockZ = 0;

    // Remove game over overlay
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
        overlay.parentNode.removeChild(overlay);
    }

    // Regenerate initial blocks
    generateInitialBlocks();

    // Ensure clock delta is reasonable after pause
    clock.getDelta();
}


// --- Window Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (!isGameOver) {
        updatePlayer(deltaTime);
        manageBlocks();
    }

    renderer.render(scene, camera);
}

// --- Start ---
init();