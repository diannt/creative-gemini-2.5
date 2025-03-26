import * as THREE from 'three';

// Framework: three.js
// User Prompt: A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ;-game starts like that :mario exits their houseruns forward and sees minecraft type blocks in 3D (view from the first-perspective)-then auto-running turns on (from the first-person perspective too)and we have to do parkour via deciding how long we should click space-obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle .Mario can jump ONTO obstacles [!]if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy-Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves


// Constants
const GRAVITY = -30;
const PLAYER_MOVE_SPEED = 5;
const PLAYER_STRAFE_SPEED = 4;
const JUMP_VELOCITY_BASE = 8;
const JUMP_CHARGE_RATE = 10; // Velocity units per second charged
const MAX_JUMP_CHARGE_TIME = 1.0; // Max seconds to charge jump
const PLAYER_HEIGHT = 1.6;
const PLAYER_WIDTH = 0.5;
const BLOCK_SIZE_MIN = 1;
const BLOCK_SIZE_MAX = 4;
const BLOCK_GAP_MIN = 1.5;
const BLOCK_GAP_MAX = 4;
const BLOCK_HEIGHT_MIN = 1;
const BLOCK_HEIGHT_MAX = 6;
const BLOCK_GENERATION_DISTANCE = 30;
const BLOCK_DESPAWN_DISTANCE = 10;
const LANDING_TOLERANCE = 0.05; // 5% of block height
const GROUND_Y = 0;

// Global variables
let scene, camera, renderer, clock;
let player = {
    position: new THREE.Vector3(0, PLAYER_HEIGHT / 2 + 1, 5), // Start slightly above ground
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    isJumping: false,
    isChargingJump: false,
    jumpChargeTime: 0,
    collider: new THREE.Box3(),
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
};
let blocks = [];
let lastBlockZ = 0;
let keys = {};
let gameOver = false;
let score = 0;
let scoreElement = null; // To display score
let gameOverElement = null; // To display game over
let blockMaterial;

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 40);

    // Camera (First-Person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(player.position);
    camera.position.y += player.height / 2 - 0.1; // Adjust camera height relative to player center

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Use false for sharper pixels
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y;
    scene.add(ground);

    // Block Material (Pixelated)
    const textureLoader = new THREE.TextureLoader();
    const blockTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABOSURBVDhPY/z//z8DJYCJkBGgAsMDGP+///+769+/f/v7+PkAGYGJgRkNkBFgZWRgZGNkBBgZGIL///7/7969+/79+w8MDAxAAgQYAE0uDAeQZbQQAAAAAElFTkSuQmCC'); // Simple dirt-like texture
    blockTexture.magFilter = THREE.NearestFilter;
    blockTexture.minFilter = THREE.NearestFilter;
    blockMaterial = new THREE.MeshStandardMaterial({ map: blockTexture });

    // Initial Blocks
    generateInitialBlocks();

    // UI Elements
    scoreElement = document.createElement('div');
    scoreElement.style.position = 'absolute';
    scoreElement.style.top = '10px';
    scoreElement.style.left = '10px';
    scoreElement.style.color = 'white';
    scoreElement.style.fontFamily = 'Arial, sans-serif';
    scoreElement.style.fontSize = '24px';
    document.body.appendChild(scoreElement);

    gameOverElement = document.createElement('div');
    gameOverElement.style.position = 'absolute';
    gameOverElement.style.top = '50%';
    gameOverElement.style.left = '50%';
    gameOverElement.style.transform = 'translate(-50%, -50%)';
    gameOverElement.style.color = 'red';
    gameOverElement.style.fontFamily = 'Arial, sans-serif';
    gameOverElement.style.fontSize = '48px';
    gameOverElement.style.display = 'none'; // Hidden initially
    gameOverElement.innerText = 'GAME OVER\nPress R to Restart';
    gameOverElement.style.textAlign = 'center';
    gameOverElement.style.whiteSpace = 'pre-line';
    document.body.appendChild(gameOverElement);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', (event) => { keys[event.code] = true; handleKeyDown(event); });
    window.addEventListener('keyup', (event) => { keys[event.code] = false; handleKeyUp(event); });
}

function generateInitialBlocks() {
    // Create a starting platform
    createBlock(0, 1, 0, 4, 2, 4);
    lastBlockZ = -4; // Start generating blocks ahead
    for (let i = 0; i < 10; i++) {
        generateNextBlock();
    }
}

function createBlock(x, y, z, width = 1, height = 1, depth = 1) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const block = new THREE.Mesh(geometry, blockMaterial);
    block.position.set(x, y, z);
    block.userData.width = width;
    block.userData.height = height;
    block.userData.depth = depth;
    block.userData.boundingBox = new THREE.Box3().setFromObject(block);
    scene.add(block);
    blocks.push(block);
    return block;
}

function generateNextBlock() {
    const prevBlock = blocks[blocks.length - 1];
    const gap = THREE.MathUtils.randFloat(BLOCK_GAP_MIN, BLOCK_GAP_MAX);
    const newZ = lastBlockZ - (prevBlock ? prevBlock.userData.depth / 2 : 0) - gap;

    const width = THREE.MathUtils.randFloat(BLOCK_SIZE_MIN, BLOCK_SIZE_MAX);
    const height = THREE.MathUtils.randFloat(BLOCK_HEIGHT_MIN, BLOCK_HEIGHT_MAX);
    const depth = THREE.MathUtils.randFloat(BLOCK_SIZE_MIN, BLOCK_SIZE_MAX);

    // Allow some horizontal variation, ensuring it's reachable
    const maxXOffset = Math.max(0, (prevBlock ? prevBlock.userData.width / 2 : 1) + gap * 0.5);
    const newX = THREE.MathUtils.randFloat(-maxXOffset, maxXOffset);
    const newY = GROUND_Y + height / 2;

    const newBlock = createBlock(newX, newY, newZ - depth / 2, width, height, depth);
    lastBlockZ = newBlock.position.z - depth / 2;
}

function removeOldBlocks() {
    const removalThreshold = camera.position.z + BLOCK_DESPAWN_DISTANCE;
    blocks = blocks.filter(block => {
        const blockEnd = block.position.z + block.userData.depth / 2;
        if (blockEnd > removalThreshold) {
            scene.remove(block);
            block.geometry.dispose();
            // material is shared, no dispose here
            return false;
        }
        return true;
    });
}

function handleKeyDown(event) {
    if (gameOver && event.code === 'KeyR') {
        resetGame();
        return;
    }
    if (gameOver) return;

    if (event.code === 'Space' && player.onGround && !player.isJumping && !player.isChargingJump) {
        player.isChargingJump = true;
        player.jumpChargeTime = 0;
    }
}

function handleKeyUp(event) {
    if (gameOver) return;

    if (event.code === 'Space' && player.isChargingJump) {
        player.isChargingJump = false;
        player.onGround = false;
        player.isJumping = true;
        const chargedVelocity = JUMP_VELOCITY_BASE + player.jumpChargeTime * JUMP_CHARGE_RATE;
        player.velocity.y = chargedVelocity;
        player.jumpChargeTime = 0;
    }
}

function updatePlayer(deltaTime) {
    if (gameOver) return;

    // --- Movement --- 
    // Auto-run forward (negative Z)
    player.velocity.z = -PLAYER_MOVE_SPEED;

    // Strafing
    let strafeVelocity = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) {
        strafeVelocity = -PLAYER_STRAFE_SPEED;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        strafeVelocity = PLAYER_STRAFE_SPEED;
    }
    player.velocity.x = strafeVelocity;

    // --- Jumping & Gravity ---
    if (player.isChargingJump) {
        player.jumpChargeTime = Math.min(player.jumpChargeTime + deltaTime, MAX_JUMP_CHARGE_TIME);
    }

    if (!player.onGround) {
        player.velocity.y += GRAVITY * deltaTime;
    }

    // --- Apply Velocity & Update Position ---
    const deltaPosition = player.velocity.clone().multiplyScalar(deltaTime);
    player.position.add(deltaPosition);

    // --- Update Collider ---
    const playerHalfWidth = player.width / 2;
    const playerHalfHeight = player.height / 2;
    player.collider.set(
        new THREE.Vector3(player.position.x - playerHalfWidth, player.position.y - playerHalfHeight, player.position.z - playerHalfWidth), // Use width for depth approx
        new THREE.Vector3(player.position.x + playerHalfWidth, player.position.y + playerHalfHeight, player.position.z + playerHalfWidth)
    );

    // --- Collision Detection ---
    checkCollisions(deltaPosition);

    // --- Update Camera --- 
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + player.height / 2 - 0.1; // Eye level
    camera.position.z = player.position.z;

    // --- Ground Check --- 
    if (player.position.y - player.height / 2 < GROUND_Y + 0.01 && !player.isJumping) {
         // Slightly above ground to avoid z-fighting if on ground block
         // Only trigger game over if significantly below the intended ground/block surface
        if (player.position.y < GROUND_Y - 0.5) { // Allow some tolerance before game over
             triggerGameOver("Fell off the world!");
        } else if (!player.onGround) {
             // Landed on the base ground plane - this shouldn't happen unless starting
             // If it happens mid-game, it means they missed a block
             if (score > 0) { // Don't trigger game over immediately at start
                 triggerGameOver("Missed a jump!");
             }
             // Snap to ground if slightly below and not jumping upwards
             // player.position.y = GROUND_Y + player.height / 2;
             // player.velocity.y = 0;
             // player.onGround = true;
             // player.isJumping = false;
        }
    }

}

function checkCollisions(deltaPosition) {
    player.onGround = false; // Assume not on ground until collision check proves otherwise
    let landedOnBlock = false;

    for (const block of blocks) {
        if (player.collider.intersectsBox(block.userData.boundingBox)) {
            const blockTop = block.position.y + block.userData.height / 2;
            const blockBottom = block.position.y - block.userData.height / 2;
            const blockLeft = block.position.x - block.userData.width / 2;
            const blockRight = block.position.x + block.userData.width / 2;
            const blockFront = block.position.z - block.userData.depth / 2;
            const blockBack = block.position.z + block.userData.depth / 2;

            const playerBottom = player.position.y - player.height / 2;
            const playerTop = player.position.y + player.height / 2;
            const playerPrevBottom = playerBottom - deltaPosition.y;

            // Check for landing on top
            if (player.velocity.y <= 0 && // Moving downwards or stationary vertically
                playerPrevBottom >= blockTop - 0.01 && // Was above or very close to the top edge in the previous frame
                playerBottom < blockTop + 0.1) // Now intersecting or slightly below the top edge
            {
                const landingHeightThreshold = blockTop - block.userData.height * LANDING_TOLERANCE;
                if (playerBottom >= landingHeightThreshold) {
                    // Successful Landing
                    player.position.y = blockTop + player.height / 2;
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.isJumping = false;
                    landedOnBlock = true;
                    break; // Stop checking collisions for this frame once landed
                } else {
                    // Hit the side too low while falling
                    triggerGameOver("Hit the side of the block!");
                    return;
                }
            }
            // Other collision types (hitting sides, bottom)
            else {
                 // Simple side collision check (crude)
                 // If player center is inside block bounds horizontally/depth-wise
                 if (playerTop > blockBottom && playerBottom < blockTop) { // Vertical overlap
                    // Check X collision
                    if ((deltaPosition.x > 0 && player.position.x - player.width/2 < blockLeft + deltaPosition.x) ||
                        (deltaPosition.x < 0 && player.position.x + player.width/2 > blockRight + deltaPosition.x)) {
                         triggerGameOver("Ran into a block horizontally!");
                         return;
                    }
                    // Check Z collision (running into front)
                     if (deltaPosition.z < 0 && player.position.z - player.width/2 < blockFront + deltaPosition.z) {
                         triggerGameOver("Ran into the front of a block!");
                         return;
                     }
                 }

                 // Hitting underside? (Shouldn't happen often with this gameplay)
                 if (player.velocity.y > 0 && playerTop > blockBottom && playerBottom < blockBottom + 0.1) {
                     triggerGameOver("Hit the bottom of a block!");
                     return;
                 }
            }
        }
    }
    // If no landing collision detected, and player was falling, they continue falling.
    // If player was not previously on ground and didn't land, onGround remains false.
}


function triggerGameOver(reason = "Game Over") {
    if (gameOver) return;
    console.log("Game Over: ", reason);
    gameOver = true;
    player.velocity.set(0, 0, 0);
    gameOverElement.innerText = `GAME OVER\n${reason}\nScore: ${score}\nPress R to Restart`;
    gameOverElement.style.display = 'block';
}

function resetGame() {
    gameOver = false;
    gameOverElement.style.display = 'none';
    score = 0;

    // Clear existing blocks
    blocks.forEach(block => scene.remove(block));
    blocks = [];

    // Reset player
    player.position.set(0, PLAYER_HEIGHT / 2 + 1, 5);
    player.velocity.set(0, 0, 0);
    player.onGround = false; // Will likely land on start platform immediately
    player.isJumping = false;
    player.isChargingJump = false;
    player.jumpChargeTime = 0;

    // Regenerate initial blocks
    generateInitialBlocks();

    // Reset camera
    camera.position.copy(player.position);
    camera.position.y += player.height / 2 - 0.1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    if (!gameOver) {
        updatePlayer(deltaTime);

        // Generate new blocks as player moves forward
        if (camera.position.z < lastBlockZ + BLOCK_GENERATION_DISTANCE) {
            generateNextBlock();
        }

        // Remove blocks behind the player
        removeOldBlocks();

        // Update Score (simple time/distance based)
        score = Math.max(0, Math.floor(-player.position.z));
        scoreElement.innerText = `Score: ${score}`;
    } else {
        // Allow restart key check even when game is over
        if (keys['KeyR']) {
             resetGame();
        }
    }

    renderer.render(scene, camera);
}