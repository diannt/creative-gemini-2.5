import * as THREE from 'three';

// Framework: three.js
// User Prompt: A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ;-game starts like that :mario exits their houseruns forward and sees minecraft type blocks in 3D (view from the first-perspective)-then auto-running turns on (from the first-person perspective too)and we have to do parkour via deciding how long we should click space-obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle .Mario can jump ONTO obstacles [!]if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy-Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves


let scene, camera, renderer, clock;
let player, playerVelocity, playerOnGround, playerCollider;
let blocks = [];
let keys = { space: false, a: false, d: false };
let isGameOver = false;
let autoRunSpeed = 8;
const gravity = -30;
const jumpForce = 12;
const playerHeight = 1.8;
const playerWidth = 0.5;
const playerDepth = 0.5;
let lastBlockZ = -10;
const generationDistance = 50;
const blockLandMargin = 0.05; // 5% tolerance from top
let blockTexture;

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 60);

    // Camera (First-Person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, playerHeight, 5); // Start slightly back

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Clock
    clock = new THREE.Clock();

    // Player Setup
    player = camera; // Use camera as player reference
    playerVelocity = new THREE.Vector3();
    playerOnGround = false;
    // Player collider slightly below camera
    playerCollider = new THREE.Box3(
        new THREE.Vector3(-playerWidth / 2, -playerHeight, -playerDepth / 2),
        new THREE.Vector3(playerWidth / 2, 0, playerDepth / 2)
    );

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    blockTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABOSURBVDhPY2RgYDjAwMzAxAJkGMiAEQBKKBZgACADUEAIgGQYyIAQQAmFABZAZQAUAFIAKQAUgApAFQBhBJQwUABQAChgFAAsAEAaQsjAwAAAT5s9gZp070wAAAABJRU5ErkJggg==', (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
    });

    // Initial Floor (Optional visualization, real floor check is numeric)
    // const floorGeometry = new THREE.PlaneGeometry(100, 200);
    // const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.rotation.x = -Math.PI / 2;
    // floor.position.y = -1; // Below the death plane
    // floor.receiveShadow = true;
    // scene.add(floor);

    // Initial Blocks
    generateInitialBlocks();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', () => { if (isGameOver) resetGame(); });

    // Start Game
    resetGame(); // Initialize game state
    animate();
}

function createBlock(position, size) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({ map: blockTexture, color: 0xffffff });
    const block = new THREE.Mesh(geometry, material);
    block.position.copy(position);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData.size = size.clone(); // Store size for collision check
    block.userData.collider = new THREE.Box3().setFromObject(block);
    scene.add(block);
    blocks.push(block);
    lastBlockZ = Math.min(lastBlockZ, position.z - size.z / 2);
    return block;
}

function generateInitialBlocks() {
    // Starting platform
    createBlock(new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(5, 1, 10));
    lastBlockZ = -5; // End of starting platform
}

function generateBlocksIfNeeded() {
    while (player.position.z < lastBlockZ + generationDistance) {
        const prevBlock = blocks[blocks.length - 1];
        const prevPos = prevBlock ? prevBlock.position : new THREE.Vector3(0, 0, 0);
        const prevSize = prevBlock ? prevBlock.userData.size : new THREE.Vector3(1, 1, 1);

        const gap = THREE.MathUtils.randFloat(1.5, 4.0); // Gap between blocks
        const newZ = prevPos.z - (prevSize.z / 2) - gap - THREE.MathUtils.randFloat(1.5, 4.0) / 2; // Center Z of new block

        const newWidth = THREE.MathUtils.randFloat(2, 5);
        const newHeight = THREE.MathUtils.randFloat(1, 5);
        const newDepth = THREE.MathUtils.randFloat(2, 5);
        const newX = THREE.MathUtils.randFloat(-4, 4); // Random horizontal position

        createBlock(new THREE.Vector3(newX, newHeight / 2 - 0.5, newZ), new THREE.Vector3(newWidth, newHeight, newDepth));
    }
}

function removeOldBlocks() {
    const removalThreshold = player.position.z + 20; // Remove blocks well behind the player
    blocks = blocks.filter(block => {
        if (block.position.z > removalThreshold) {
            scene.remove(block);
            block.geometry.dispose();
            block.material.dispose();
            return false;
        }
        return true;
    });
}

function updatePlayer(deltaTime) {
    if (isGameOver) return;

    let moveDirection = new THREE.Vector3(0, 0, -1); // Auto-run forward (negative Z)
    let strafeDirection = new THREE.Vector3();

    if (keys.a) {
        strafeDirection.x -= 1;
    }
    if (keys.d) {
        strafeDirection.x += 1;
    }

    strafeDirection.normalize().multiplyScalar(autoRunSpeed * 0.7 * deltaTime);
    moveDirection.multiplyScalar(autoRunSpeed * deltaTime);

    // Apply movement
    player.position.add(moveDirection);
    player.position.add(strafeDirection);

    // Apply gravity
    if (!playerOnGround) {
        playerVelocity.y += gravity * deltaTime;
    }

    // Jump
    if (keys.space && playerOnGround) {
        playerVelocity.y = jumpForce;
        playerOnGround = false;
    }

    // Update vertical position
    player.position.y += playerVelocity.y * deltaTime;

    // Update player collider position
    const playerPos = player.position;
    playerCollider.min.set(playerPos.x - playerWidth / 2, playerPos.y - playerHeight, playerPos.z - playerDepth / 2);
    playerCollider.max.set(playerPos.x + playerWidth / 2, playerPos.y, playerPos.z + playerDepth / 2);

    // Basic floor collision (Game Over)
    if (player.position.y < -10) { // Fall far enough
         gameOver("Fell into the void!");
    }

}

function checkCollisions() {
    if (isGameOver) return;

    playerOnGround = false; // Assume not on ground until collision check proves otherwise
    let landedSafely = false;

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockCollider = block.userData.collider;

        if (playerCollider.intersectsBox(blockCollider)) {
            const playerBottom = playerCollider.min.y;
            const blockTop = blockCollider.max.y;
            const blockBottom = blockCollider.min.y;
            const blockHeight = block.userData.size.y;
            const safeLandHeight = blockTop - blockHeight * blockLandMargin;

            // Check if landing on top
            if (playerVelocity.y <= 0 && // Moving downwards or stationary
                playerBottom >= safeLandHeight && // Player bottom is within the safe zone
                playerBottom <= blockTop + 0.1) // Player bottom is very close to or slightly above the top
            {
                // Check horizontal overlap
                if (playerCollider.max.x > blockCollider.min.x &&
                    playerCollider.min.x < blockCollider.max.x &&
                    playerCollider.max.z > blockCollider.min.z &&
                    playerCollider.min.z < blockCollider.max.z)
                {
                        // Landed!
                        player.position.y = blockTop + playerHeight; // Adjust player height exactly to the top
                        playerVelocity.y = 0;
                        playerOnGround = true;
                        landedSafely = true;
                        break; // Stop checking after landing on one block
                }
            }
            else {
                 // Collision wasn't a safe landing (hit side or bottom)
                 // Check if the collision is significant (not just grazing the safe top part)
                 if (playerBottom < safeLandHeight) {
                     gameOver("Hit the side of a block!");
                     return;
                 }
            }
        }
    }

     // If no safe landing was detected after checking all blocks, and player is below a certain threshold, game over
    if (!playerOnGround && playerVelocity.y <= 0 && player.position.y < 0.1) {
         // Check if we are over *any* block top at all, even if velocity wasn't negative yet
         let overAnyBlock = false;
         for (let i = 0; i < blocks.length; i++) {
             const block = blocks[i];
             const blockCollider = block.userData.collider;
             if (playerCollider.max.x > blockCollider.min.x &&
                 playerCollider.min.x < blockCollider.max.x &&
                 playerCollider.max.z > blockCollider.min.z &&
                 playerCollider.min.z < blockCollider.max.z &&
                 Math.abs(player.position.y - playerHeight - blockCollider.max.y) < 0.2 ) // Check if roughly above a block
                 {
                     overAnyBlock = true;
                     break;
                 }
         }
         if (!overAnyBlock) {
            // Only trigger game over if truly falling onto the 'floor' area
             gameOver("Missed the blocks!");
         }

    }
}

function gameOver(message) {
    if (isGameOver) return;
    isGameOver = true;
    playerVelocity.set(0, 0, 0);
    console.log("Game Over: " + message);

    // Display game over message (simple DOM element)
    let msgElement = document.getElementById('message');
    if (!msgElement) {
        msgElement = document.createElement('div');
        msgElement.id = 'message';
        msgElement.style.position = 'absolute';
        msgElement.style.top = '50%';
        msgElement.style.left = '50%';
        msgElement.style.transform = 'translate(-50%, -50%)';
        msgElement.style.color = 'red';
        msgElement.style.fontSize = '36px';
        msgElement.style.fontFamily = 'Arial, sans-serif';
        msgElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        msgElement.style.padding = '20px';
        msgElement.style.borderRadius = '10px';
        msgElement.style.textAlign = 'center';
        document.body.appendChild(msgElement);
    }
    msgElement.innerHTML = `Game Over!<br/>${message}<br/>Click to Restart`;
    msgElement.style.display = 'block';
}

function resetGame() {
    // Clear existing blocks
    blocks.forEach(block => {
        scene.remove(block);
        block.geometry.dispose();
        block.material.dispose();
    });
    blocks = [];

    // Reset player state
    player.position.set(0, playerHeight, 5);
    playerVelocity.set(0, 0, 0);
    playerOnGround = false; // Start on starting platform, check collision will fix this
    isGameOver = false;
    lastBlockZ = -10;

    // Hide game over message
    const msgElement = document.getElementById('message');
    if (msgElement) {
        msgElement.style.display = 'none';
    }

    // Regenerate initial blocks
    generateInitialBlocks();
    // Force immediate collision check to place player correctly on start platform
    checkCollisions();
    if (!playerOnGround) { // Ensure player is placed correctly
        player.position.y = blocks[0].userData.collider.max.y + playerHeight;
        playerOnGround = true;
    }

}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (!isGameOver) {
        updatePlayer(deltaTime);
        checkCollisions();
        generateBlocksIfNeeded();
        removeOldBlocks();
    }

    renderer.render(scene, camera);
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
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'Space':
            keys.space = false;
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

// Start the application
init();