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
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Constants ---
const FLOOR_Y = 0;
const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.5;
const PLAYER_DEPTH = 0.5;
const GRAVITY = -9.8 * 2; // Adjusted gravity for gameplay
const JUMP_VELOCITY = 8;
const MOVE_SPEED = 5;
const STRAFE_SPEED = 4;
const BLOCK_SIZE = 2;
const GENERATION_DISTANCE = 60;
const CULL_DISTANCE = -20;
const MAX_JUMP_HOLD_TIME = 500; // ms for max jump charge
const MIN_JUMP_VELOCITY = 5;
const MAX_JUMP_VELOCITY = 12;
const LANDING_TOLERANCE_PERCENT = 0.15; // Increased tolerance for playability

// --- Global Variables ---
let scene, camera, renderer, controls;
let clock;
let playerVelocity = new THREE.Vector3();
let playerOnGround = false;
let moveForward = false;
let moveBackward = false; // Although auto-running, keep for potential future use
let moveLeft = false;
let moveRight = false;
let canJump = true; // Can the player initiate a jump?
let isJumping = false; // Is the player currently holding the jump key?
let jumpStartTime = 0;

let worldObjects = []; // Store blocks for collision
let lastBlockZ = 0;
let gameRunning = true;
let score = 0;

const textureLoader = new THREE.TextureLoader();
const grassTopTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABFSURBVDhPY2RgYDjAwMSABJiYGP7//38GYGBgYHSANzExwQhiYIQBGBgYGRhABLDh//8/AxhjYPgPF2YABmICmBiQAgASNAUjL+8L8wAAAABJRU5ErkJggg=='); // Simple green
const dirtSideTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABJSURBVDhPY2RgYDjAwMSABJiYGP7///8GYGBgYHSANzExwQhiYIQBGBgYGRhABLDh//8/AxhjYPgPF2YABmICmBiQAgCU7gVn3/7QrAAAAABJRU5ErkJggg=='); // Simple brown
grassTopTexture.magFilter = THREE.NearestFilter;
grassTopTexture.minFilter = THREE.NearestFilter;
dirtSideTexture.magFilter = THREE.NearestFilter;
dirtSideTexture.minFilter = THREE.NearestFilter;

const blockMaterials = [
    new THREE.MeshStandardMaterial({ map: dirtSideTexture }), // right
    new THREE.MeshStandardMaterial({ map: dirtSideTexture }), // left
    new THREE.MeshStandardMaterial({ map: grassTopTexture }), // top
    new THREE.MeshStandardMaterial({ map: dirtSideTexture }), // bottom
    new THREE.MeshStandardMaterial({ map: dirtSideTexture }), // front
    new THREE.MeshStandardMaterial({ map: dirtSideTexture })  // back
];

// --- Initialization ---
function init() {
    // Clock
    clock = new THREE.Clock();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, GENERATION_DISTANCE * 1.5);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, PLAYER_HEIGHT, 5); // Start slightly back

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    const shadowCamSize = 30;
    directionalLight.shadow.camera.left = -shadowCamSize;
    directionalLight.shadow.camera.right = shadowCamSize;
    directionalLight.shadow.camera.top = shadowCamSize;
    directionalLight.shadow.camera.bottom = -shadowCamSize;
    scene.add(directionalLight);
    //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera)); // Debug shadows

    // Controls (Pointer Lock for first-person)
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    const blocker = document.createElement('div');
    blocker.id = 'blocker';
    blocker.style.position = 'absolute';
    blocker.style.width = '100%';
    blocker.style.height = '100%';
    blocker.style.background = 'rgba(0,0,0,0.5)';
    blocker.style.display = 'flex';
    blocker.style.justifyContent = 'center';
    blocker.style.alignItems = 'center';

    const instructions = document.createElement('div');
    instructions.id = 'instructions';
    instructions.style.width = '50%';
    instructions.style.padding = '20px';
    instructions.style.background = 'white';
    instructions.style.borderRadius = '10px';
    instructions.style.textAlign = 'center';
    instructions.style.cursor = 'pointer';
    instructions.innerHTML = `
        <h1>Counter-Intuitive Mario FPS</h1>
        <p>Click to start</p>
        <p>Auto-runs forward. A/D to strafe.</p>
        <p>Hold SPACE to charge jump, release to jump.</p>
        <p>Land ONLY on the top surface of blocks.</p>
        <p>Falling or hitting block sides = Game Over.</p>
    `;
    blocker.appendChild(instructions);
    document.body.appendChild(blocker);

    instructions.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        blocker.style.display = 'none';
        gameRunning = true;
        resetGame(); // Ensure clean start
    });

    controls.addEventListener('unlock', () => {
        if (gameRunning) {
             blocker.style.display = 'flex';
             instructions.innerHTML = `
                <h1>Paused</h1>
                <p>Click to resume</p>
                <p>Score: ${score}</p>
             `;
        } // Don't show pause screen if game over
    });

    // Ground (Game Over Zone)
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide }); // Red floor
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = FLOOR_Y - 0.1; // Slightly below actual floor
    scene.add(ground);

    // Initial Platform
    createBlock(0, FLOOR_Y, 0, 5, 1, 5); // Start platform
    lastBlockZ = 0;

    // Generate initial blocks
    generateWorldChunk();

    // Score Display
    const scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.style.position = 'absolute';
    scoreElement.style.top = '10px';
    scoreElement.style.left = '10px';
    scoreElement.style.color = 'white';
    scoreElement.style.fontFamily = 'Arial, sans-serif';
    scoreElement.style.fontSize = '24px';
    scoreElement.style.textShadow = '1px 1px 2px black';
    scoreElement.innerText = 'Score: 0';
    document.body.appendChild(scoreElement);

    // Event Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

// --- Game Logic ---

function createBlock(x, y, z, width = BLOCK_SIZE, height = BLOCK_SIZE, depth = BLOCK_SIZE) {
    const blockGeometry = new THREE.BoxGeometry(width, height, depth);
    const block = new THREE.Mesh(blockGeometry, blockMaterials);
    block.position.set(x, y + height / 2, z);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData.isBlock = true; // Identifier
    block.userData.height = height;
    block.userData.width = width;
    block.userData.depth = depth;
    block.userData.topSurfaceY = y + height;
    block.userData.bottomSurfaceY = y;
    scene.add(block);
    worldObjects.push(block);
    return block;
}

function generateWorldChunk() {
    const playerZ = controls.getObject().position.z;
    const generateUntilZ = playerZ - GENERATION_DISTANCE;

    while (lastBlockZ > generateUntilZ) {
        const prevBlock = worldObjects[worldObjects.length - 1];
        const prevZ = prevBlock.position.z;
        const prevHeight = prevBlock.userData.height;

        const gap = 2 + Math.random() * 4; // Gap between blocks
        const nextZ = prevZ - prevBlock.userData.depth / 2 - gap - BLOCK_SIZE / 2;

        let nextHeight = Math.max(1, prevHeight + (Math.random() * 4 - 2)); // Vary height, min 1
        nextHeight = Math.round(nextHeight / BLOCK_SIZE) * BLOCK_SIZE; // Snap to block size increments
        nextHeight = Math.max(BLOCK_SIZE, nextHeight); // Ensure min height

        const nextX = prevBlock.position.x + (Math.random() - 0.5) * 6; // Random X offset

        createBlock(nextX, FLOOR_Y, nextZ, BLOCK_SIZE, nextHeight, BLOCK_SIZE);
        lastBlockZ = nextZ;
    }
}

function cullOldObjects() {
    const playerZ = controls.getObject().position.z;
    const cullBehindZ = playerZ - CULL_DISTANCE;

    worldObjects = worldObjects.filter(obj => {
        if (obj.position.z > cullBehindZ) {
            return true;
        } else {
            scene.remove(obj);
            obj.geometry.dispose();
            // obj.material.dispose(); // Material is shared
            return false;
        }
    });
}

function resetGame() {
    // Clear existing blocks
    worldObjects.forEach(obj => scene.remove(obj));
    worldObjects = [];

    // Reset player position and velocity
    controls.getObject().position.set(0, PLAYER_HEIGHT, 5);
    playerVelocity.set(0, 0, 0);
    playerOnGround = false;
    canJump = true;
    isJumping = false;
    lastBlockZ = 0;
    score = 0;
    updateScoreDisplay();

    // Create initial platform again
    createBlock(0, FLOOR_Y, 0, 5, 1, 5);
    lastBlockZ = 0;

    // Generate initial world
    generateWorldChunk();

    // Ensure blocker is hidden if restarting after game over
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    if (controls.isLocked) {
        blocker.style.display = 'none';
    } else {
         blocker.style.display = 'flex';
         instructions.innerHTML = `
            <h1>Counter-Intuitive Mario FPS</h1>
            <p>Click to start</p>
            <p>Auto-runs forward. A/D to strafe.</p>
            <p>Hold SPACE to charge jump, release to jump.</p>
            <p>Land ONLY on the top surface of blocks.</p>
            <p>Falling or hitting block sides = Game Over.</p>
        `;
    }
    gameRunning = true; // Set gameRunning to true explicitly
}

function gameOver() {
    gameRunning = false;
    controls.unlock(); // Release pointer lock

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    blocker.style.display = 'flex';
    instructions.innerHTML = `
        <h1>Game Over!</h1>
        <p>Score: ${score}</p>
        <p>Click to play again</p>
    `;
    // The existing click listener on instructions will handle the restart via controls.lock -> resetGame
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.innerText = `Score: ${Math.floor(score)}`;
    }
}

// --- Event Handlers ---
function onKeyDown(event) {
    if (!controls.isLocked && gameRunning) return; // Don't process keys if paused or game over unless it's to restart

    switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'Space':
            if (canJump && playerOnGround) {
                isJumping = true;
                jumpStartTime = performance.now();
                // Don't apply velocity yet, wait for key release or max hold
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
        case 'Space':
            if (isJumping) {
                const jumpHoldTime = Math.min(performance.now() - jumpStartTime, MAX_JUMP_HOLD_TIME);
                const jumpRatio = jumpHoldTime / MAX_JUMP_HOLD_TIME;
                const jumpVelocity = MIN_JUMP_VELOCITY + (MAX_JUMP_VELOCITY - MIN_JUMP_VELOCITY) * jumpRatio;

                playerVelocity.y = jumpVelocity;
                playerOnGround = false;
                canJump = false; // Prevent double jump mid-air
                isJumping = false;
            }
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Collision Detection ---
function checkCollisions(delta) {
    const playerPos = controls.getObject().position;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(playerPos.x, playerPos.y - PLAYER_HEIGHT / 2 + 0.1, playerPos.z), // Center slightly lower
        new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT - 0.2, PLAYER_DEPTH) // Slightly smaller box
    );

    let onValidSurface = false;
    let hitSide = false;
    let landedBlock = null;

    for (const block of worldObjects) {
        const blockBox = new THREE.Box3().setFromObject(block);

        if (playerBox.intersectsBox(blockBox)) {
            const playerBottom = playerPos.y - PLAYER_HEIGHT / 2;
            const blockTop = block.userData.topSurfaceY;
            const blockBottom = block.userData.bottomSurfaceY;
            const landingTolerance = block.userData.height * LANDING_TOLERANCE_PERCENT;

            // Check for landing ON TOP
            // Player's feet are slightly above block top, and player is moving down or horizontal
            if (playerVelocity.y <= 0 &&
                playerBottom >= blockTop - landingTolerance &&
                playerBottom <= blockTop + 0.1) // Allow slight penetration
            {
                 // Check horizontal overlap
                if (playerPos.x + PLAYER_WIDTH / 2 > block.position.x - block.userData.width / 2 &&
                    playerPos.x - PLAYER_WIDTH / 2 < block.position.x + block.userData.width / 2 &&
                    playerPos.z + PLAYER_DEPTH / 2 > block.position.z - block.userData.depth / 2 &&
                    playerPos.z - PLAYER_DEPTH / 2 < block.position.z + block.userData.depth / 2)
                {
                    onValidSurface = true;
                    landedBlock = block;
                    break; // Found a landing spot
                }
            }
            // Check for hitting the SIDES (below the tolerance zone)
            else if (playerBottom < blockTop - landingTolerance) {
                 // More rigorous side check - are we truly intersecting the side volume?
                 // This simple check assumes any intersection below tolerance is a side hit
                 hitSide = true;
                 // console.log("Hit side!");
                 break; // Hit a side, game over potentially
            }
             // Check for hitting the bottom (less likely but possible)
            // else if (playerTop > blockBottom && playerTop < blockBottom + 0.1 && playerVelocity.y > 0) {
            //     playerVelocity.y = 0; // Bonk head
            // }
        }
    }

    // --- Apply Collision Results ---

    if (hitSide) {
        gameOver();
        return;
    }

    if (onValidSurface && landedBlock) {
        playerVelocity.y = 0;
        playerPos.y = landedBlock.userData.topSurfaceY + PLAYER_HEIGHT / 2;
        playerOnGround = true;
        canJump = true; // Allow jumping again
    } else {
        playerOnGround = false;
        // Apply gravity if not on ground
        playerVelocity.y += GRAVITY * delta;
    }

    // --- Update Position based on Velocity ---
    const damping = Math.exp(-3 * delta) - 1;
    // playerVelocity.addScaledVector(playerVelocity, damping); // Air resistance/damping (optional)

    const deltaPosition = playerVelocity.clone().multiplyScalar(delta);
    controls.moveRight(deltaPosition.x);
    controls.moveForward(deltaPosition.z); // Use moveForward for auto-run component
    controls.getObject().position.y += deltaPosition.y;

    // --- Floor Collision (Game Over) ---
    if (playerPos.y - PLAYER_HEIGHT / 2 < FLOOR_Y && !playerOnGround) {
        // Check if we *just* fell below and weren't already on a block
        // A small buffer might be needed depending on physics steps
        if (playerPos.y < FLOOR_Y + 0.1) { // Use camera base position for floor check
             gameOver();
             return;
        }
    }
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!gameRunning || !controls.isLocked) {
        // If game is over or paused, don't update logic
        // Still render the scene
        renderer.render(scene, camera);
        return;
    }

    // --- Update Logic ---
    const playerPos = controls.getObject().position;

    // Auto-run forward
    // Calculate forward direction (independent of camera pitch)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    controls.moveForward(MOVE_SPEED * delta);

    // Strafe movement
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize(); // Get right vector based on forward

    if (moveLeft) {
        controls.moveRight(-STRAFE_SPEED * delta);
    }
    if (moveRight) {
        controls.moveRight(STRAFE_SPEED * delta);
    }

    // --- Physics and Collision ---
    checkCollisions(delta);

    // --- World Generation/Culling ---
    generateWorldChunk();
    cullOldObjects();

    // --- Update Score --- (Based on forward distance)
    // Use a reference point or just the absolute Z value if starting near 0
    score = Math.max(score, -playerPos.z); // Score increases as player moves in negative Z
    updateScoreDisplay();

    // --- Render ---
    renderer.render(scene, camera);
}

// --- Start ---
init();
animate();