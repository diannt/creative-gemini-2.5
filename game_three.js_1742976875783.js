// Framework: three.js
// User Prompt: Let'z go ! 
/*
A very counter-intuitive version of Mario game , with a small pixelated figure of Mario and large blocks it should jump upon ; it runs automatically ; and it can only jump ON boxes - IF it drops on the floor - game over ; 

game starts like that :

mario exits their house 
runs forward and sees minecraft type blocks in 3D (view from the first-perspective)

then auto-running turns on (from the first-person perspective too) 

and we have to do parkour via deciding how long we should click space 

obstacles have different heights ; and we run forward to them with different speed because Mario has limited energy based on the height of the particular obstacle . 

Mario can jump ONTO obstacles [!]

if Mario touches anything more than 5% of the block heigth of the obstacle (from the top) -> game over , otherwise it can jump on every obstacle forward or do any other strategy 

Minecraft style , 3D blocks , ability to go left and right ; auto-running ; jump with different length and height via 'space' button ; generated obstacles in front ; need to choose different strategies to make sure you are doing good ; future possibility of multiplayer with NPC that are running alongside you and they can block your path (you can't walk through them and they have a strategy that is made specifically for the player competition , because the one who of you 1-1 is lost first , they will be a loser ) -> there should be a good system of NPC reactions then that are based on NPC learning USER's moves
*/
import * as THREE from 'three';

let scene, camera, renderer;
let player, floor, house;
let blocks = [];
const clock = new THREE.Clock();

let isGameOver = false;
let gameStarted = false; // Controls initial state before auto-run
let initialRunStarted = false; // Controls the very first run trigger

const playerHeight = 1.6;
const playerWidth = 0.4;
const playerDepth = 0.4;
const gravity = -25;
const moveSpeed = 6;
const autoRunSpeedBase = 8;
let currentAutoRunSpeed = 0; // Starts at 0
const jumpInitialVelocity = 8;
const jumpMaxHoldTime = 350; // ms
const jumpVelocityBonusPerMs = 0.025; // Additional velocity per ms held

const blockGenerationDistance = 60;
const blockRemovalDistance = -30;
const floorLevel = 0;
const collisionTolerance = 0.05; // 5% tolerance from top

let keys = {
    left: false,
    right: false,
    space: false,
    spaceDownTime: 0
};

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 80);

    // Camera (First Person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    player = {
        position: new THREE.Vector3(0, playerHeight, 5), // Start near the 'house'
        velocity: new THREE.Vector3(),
        onGround: false,
        isJumping: false,
        jumpStartTime: 0,
        canJump: true,
        collider: new THREE.Box3() // Bounding box for collision
    };
    camera.position.copy(player.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixelated look
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 1) ); // Pixelated look
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
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Floor (Game Over Zone)
    const floorGeometry = new THREE.PlaneGeometry(100, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorLevel;
    floor.receiveShadow = true;
    scene.add(floor);

    // Simple "House" structure
    const houseMaterial = new THREE.MeshStandardMaterial({ color: 0xcc6633 });
    const houseGeometry = new THREE.BoxGeometry(3, 3, 3);
    house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(0, 1.5, 8);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    // Initial Blocks (Path out of house)
    generateBlock(0, 0, 2);
    generateBlock(0, 0, -2);
    generateBlock(0, 0, -6);

    // Event Listeners
    setupEventListeners();

    // Start Game Prompt (or automatically after delay)
    console.log("Press SPACE to start running!");
}

function setupEventListeners() {
    window.addEventListener('keydown', (event) => {
        if (isGameOver) return;

        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                break;
            case 'Space':
                if (!gameStarted) {
                    gameStarted = true;
                    console.log("Let'z go!");
                } else if (!initialRunStarted && player.position.z < 4) {
                     // Allow starting run only after moving past house slightly
                     // Do nothing yet, wait for player to move forward
                }
                 else if (player.canJump && player.onGround && !keys.space) {
                    keys.space = true;
                    keys.spaceDownTime = performance.now();
                    player.isJumping = true; // Indicate intention to jump
                }
                break;
        }
    });

    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                break;
            case 'Space':
                if (keys.space && player.isJumping) {
                    const holdTime = Math.min(performance.now() - keys.spaceDownTime, jumpMaxHoldTime);
                    const jumpBonus = holdTime * jumpVelocityBonusPerMs;
                    player.velocity.y = jumpInitialVelocity + jumpBonus;
                    player.onGround = false;
                    player.canJump = false; // Prevent double jump mid-air
                    // isJumping flag is reset implicitly when landing or by canJump=false
                }
                 keys.space = false; // Reset space key state regardless
                 player.isJumping = false; // Reset intent if space released early
                break;
        }
    });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 1) );
}

function generateBlock(x = undefined, yOffset = 0, z) {
    const height = Math.max(0.5, 1 + Math.random() * 3 + yOffset);
    const width = 2 + Math.random() * 2;
    const depth = 2 + Math.random() * 3;

    const blockGeometry = new THREE.BoxGeometry(width, height, depth);
    // Simple color variation, Minecraft-esque
    const color = Math.random() < 0.6 ? 0x8B4513 : 0x654321; // Brown/DarkBrown
    const blockMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0.1
        });

    const block = new THREE.Mesh(blockGeometry, blockMaterial);

    block.castShadow = true;
    block.receiveShadow = true;

    const blockX = x !== undefined ? x : (Math.random() - 0.5) * 10; // Random X position if not specified
    block.position.set(
        blockX,
        floorLevel + height / 2,
        z
    );

    block.geometry.computeBoundingBox();
    block.userData = {
        height: height,
        width: width,
        depth: depth,
        boundingBox: new THREE.Box3().setFromObject(block) // World coordinates BB
    };

    blocks.push(block);
    scene.add(block);
}

function updateBlocks(delta) {
    let furthestZ = blocks.length > 0 ? blocks[blocks.length - 1].position.z : 0;

    // Generate new blocks ahead
    while (furthestZ < player.position.z + blockGenerationDistance) {
        const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
        const nextZ = furthestZ - (4 + Math.random() * 4); // Gap between blocks
        const yOffset = lastBlock ? Math.max(-1, Math.min(1, (Math.random() - 0.5) * 2)) : 0; // Slight height variation based on last
        const nextX = lastBlock ? lastBlock.position.x + (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 10;

        generateBlock(nextX, yOffset * 0.5, nextZ); // Pass yOffset to influence height
        furthestZ = blocks[blocks.length - 1].position.z;
    }

    // Remove blocks behind
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        if (block.position.z > player.position.z - blockRemovalDistance) {
            scene.remove(block);
            block.geometry.dispose();
            block.material.dispose();
            blocks.splice(i, 1);
        }
    }
}


function updatePlayer(delta) {
    if (!gameStarted) return;

     // --- Initial Run Phase ---
    if (!initialRunStarted) {
        // Move forward slowly until past the house Z position
        if (player.position.z > 4) { // Arbitrary Z position past the house
             player.velocity.z = -autoRunSpeedBase; // Start auto-running
             currentAutoRunSpeed = autoRunSpeedBase;
             initialRunStarted = true;
        } else {
             player.velocity.z = -2.0; // Slow walk out
             currentAutoRunSpeed = 0; // Not auto-running yet
        }
    } else {
         // Normal auto-run speed
         player.velocity.z = -currentAutoRunSpeed;
    }


    // Sideways movement
    let targetVelocityX = 0;
    if (keys.left) targetVelocityX -= moveSpeed;
    if (keys.right) targetVelocityX += moveSpeed;
    // Smooth sideways movement slightly
    player.velocity.x += (targetVelocityX - player.velocity.x) * 0.1;


    // Apply gravity
    player.velocity.y += gravity * delta;

    // Apply velocity to position
    player.position.x += player.velocity.x * delta;
    player.position.z += player.velocity.z * delta;

    // Vertical movement and collision prediction
    let predictedY = player.position.y + player.velocity.y * delta;
    player.onGround = false; // Assume not on ground unless collision detected

    // Update player collider position (centered at feet for ground checks)
    const playerColliderCenter = new THREE.Vector3(
        player.position.x,
        predictedY - playerHeight / 2, // Center at feet level for Y check
        player.position.z
    );
     player.collider.setFromCenterAndSize(
        playerColliderCenter,
        new THREE.Vector3(playerWidth, playerHeight, playerDepth)
    );


    // Collision Detection with Blocks
    let landedOnBlock = false;
    for (const block of blocks) {
        // Broad phase check (optional optimization)
        if (Math.abs(player.position.z - block.position.z) > (block.userData.depth / 2 + playerDepth)) continue;
        if (Math.abs(player.position.x - block.position.x) > (block.userData.width / 2 + playerWidth)) continue;

        block.userData.boundingBox.setFromObject(block); // Update block bounding box

        if (player.collider.intersectsBox(block.userData.boundingBox)) {
            const blockTopY = block.position.y + block.userData.height / 2;
            const blockLandingZoneTop = blockTopY;
            const blockLandingZoneBottom = blockTopY - block.userData.height * collisionTolerance;

            // Check if landing on top
            if (player.velocity.y <= 0 && // Moving downwards
                player.position.y >= blockLandingZoneBottom - 0.05 && // Player feet are near/above the landing zone bottom
                predictedY - playerHeight <= blockLandingZoneTop + 0.1) // Predicted feet position is near/below the top
                {

                // Check precise landing zone
                if (predictedY - playerHeight <= blockLandingZoneTop && predictedY - playerHeight >= blockLandingZoneBottom) {
                     // Successful Landing
                    player.position.y = blockTopY + playerHeight; // Snap feet to top + height
                    player.velocity.y = 0;
                    player.onGround = true;
                    player.canJump = true; // Can jump again
                    landedOnBlock = true;
                    break; // Stop checking blocks once landed
                } else {
                    // Hit the side or landed too low
                    console.log("Hit side or landed too low!");
                    gameOver();
                    return; // Exit updatePlayer
                }
            }
            // Handle side collision (simple stop for now, could push player back)
             else if (player.position.y < blockTopY) { // Check if player is below the top of the block when colliding
                  console.log("Hit side!");
                  gameOver();
                  return;
            }
        }
    }

    // Apply vertical position change if not landed
    if (!landedOnBlock) {
        player.position.y = predictedY;
    }

    // Check Floor Collision (Game Over)
    if (player.position.y <= floorLevel + playerHeight && !player.onGround) {
         // Check if player *just* fell below floor level
         if(player.position.y - player.velocity.y * delta > floorLevel + playerHeight) {
             player.position.y = floorLevel + playerHeight; // Place feet exactly on floor for game over state
         }
         console.log("Fell to the floor!");
         gameOver();
         return;
    }

     // Reset jump ability slightly after leaving ground (coyote time - basic version)
     if (!player.onGround && player.velocity.y < -1) { // If falling significantly
         //player.canJump = false; // Already handled by jump release logic mostly
     }


    // Update Camera Position to Player Position
    camera.position.copy(player.position);
}

function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    console.log("Game Over!");
    currentAutoRunSpeed = 0;
    player.velocity.set(0, 0, 0);
    // Could display a message on screen here
    // For now, just stops movement
}

// Simple reset (refresh page for full reset)
function resetGame() {
    isGameOver = false;
    gameStarted = false;
    initialRunStarted = false;
    currentAutoRunSpeed = 0;
    player.position.set(0, playerHeight, 5);
    player.velocity.set(0, 0, 0);
    player.onGround = false; // Will likely start on a block or fall initially
    player.canJump = true;
    keys.left = false;
    keys.right = false;
    keys.space = false;

    // Remove existing blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
        scene.remove(blocks[i]);
        blocks[i].geometry.dispose();
        blocks[i].material.dispose();
    }
    blocks = [];

    // Regenerate initial blocks
    generateBlock(0, 0, 2);
    generateBlock(0, 0, -2);
    generateBlock(0, 0, -6);

    camera.position.copy(player.position);
    console.log("Game Reset. Press SPACE to start again!");

}


function animate() {
    if (isGameOver && keys.space) { // Allow reset with Space after game over
        resetGame();
    }

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (!isGameOver) {
        updatePlayer(delta);
        if(initialRunStarted) { // Only generate/remove blocks once running
             updateBlocks(delta);
        }
    }

    renderer.render(scene, camera);
}

init();
animate();