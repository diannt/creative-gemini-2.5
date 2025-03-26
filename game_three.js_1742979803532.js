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
import { MathUtils } from 'three';

let scene, camera, renderer;
let ground, house;
let marioState;
let blocks = [];
let keys = {};
let clock = new THREE.Clock();
let gameRunning = false;
let gameOver = false;
let lastBlockZ = -10;
let currentSpeed = 5; // Initial speed

const GRAVITY = -25;
const JUMP_FORCE_MIN = 8;
const JUMP_FORCE_MAX = 15;
const JUMP_CHARGE_TIME_MAX = 0.5; // seconds
const MARIO_HEIGHT = 1.6; // Camera height / eye level
const MARIO_FEET_OFFSET = -0.7; // Offset from camera to feet for collision
const MARIO_WIDTH = 0.4;
const MARIO_DEPTH = 0.4;
const STRAFE_SPEED = 4;
const BLOCK_HIT_TOLERANCE = 0.05; // 5% tolerance from top
const BLOCK_MAX_HEIGHT = 5;
const BLOCK_MIN_HEIGHT = 0.5;
const BLOCK_WIDTH = 2;
const BLOCK_DEPTH = 2;
const BLOCK_SPACING_MIN = 2;
const BLOCK_SPACING_MAX = 5;
const RENDER_DISTANCE = 100;
const START_DELAY = 2; // seconds before auto-run starts

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 10, RENDER_DISTANCE / 1.5);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, RENDER_DISTANCE);
    camera.position.set(0, MARIO_HEIGHT, 5); // Start behind the house

    renderer = new THREE.WebGLRenderer({ antialias: false }); // Pixelated look
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Pixelated look
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, RENDER_DISTANCE * 2);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Forest green
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Mario's House (simple representation)
    const houseGeometry = new THREE.BoxGeometry(3, 3, 3);
    const houseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(0, 1.5, 0);
    house.castShadow = true;
    scene.add(house);

    // Mario State
    resetMarioState();

    // Initial Blocks
    generateInitialBlocks();

    // Event Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Start intro sequence
    setTimeout(() => {
        gameRunning = true;
        // Initial forward speed set in resetMarioState
    }, START_DELAY * 1000);
}

function resetMarioState() {
    marioState = {
        position: new THREE.Vector3(0, MARIO_HEIGHT, 3), // Start just outside the house
        velocity: new THREE.Vector3(0, 0, 0), // Will be set when gameRunning starts
        forwardVelocity: 0, // Controlled by gameRunning
        isGrounded: false, // Starts in the air briefly
        isJumping: false,
        isChargingJump: false,
        jumpChargeStartTime: 0,
        canJump: false, // Can only jump when grounded
        onBlock: null, // Reference to the block Mario is standing on
    };
    camera.position.copy(marioState.position);
    gameOver = false;
    gameRunning = false; // Reset autorun
    currentSpeed = 5;
    marioState.forwardVelocity = -currentSpeed; // Set initial speed for when game starts
}

function generateInitialBlocks() {
    // Clear existing blocks
    blocks.forEach(block => scene.remove(block.mesh));
    blocks = [];
    lastBlockZ = -10; // Reset last block position

    // Generate a few starting blocks
    for (let i = 0; i < 10; i++) {
        generateBlock();
    }
}

function generateBlock() {
    const height = MathUtils.randFloat(BLOCK_MIN_HEIGHT, BLOCK_MAX_HEIGHT);
    const width = BLOCK_WIDTH;
    const depth = BLOCK_DEPTH;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    // Simple Minecraft-like texture simulation with colors
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x964B00, flatShading: true }), // side
        new THREE.MeshStandardMaterial({ color: 0x964B00, flatShading: true }), // side
        new THREE.MeshStandardMaterial({ color: 0x006400, flatShading: true }), // top (grass)
        new THREE.MeshStandardMaterial({ color: 0xA0522D, flatShading: true }), // bottom (dirt)
        new THREE.MeshStandardMaterial({ color: 0x964B00, flatShading: true }), // side
        new THREE.MeshStandardMaterial({ color: 0x964B00, flatShading: true })  // side
    ];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const spacing = MathUtils.randFloat(BLOCK_SPACING_MIN, BLOCK_SPACING_MAX);
    const positionX = MathUtils.randFloat(-3, 3); // Allow some horizontal variation
    const positionZ = lastBlockZ - depth / 2 - spacing;
    const positionY = height / 2;

    mesh.position.set(positionX, positionY, positionZ);

    lastBlockZ = positionZ - depth / 2;

    const blockData = {
        mesh: mesh,
        height: height,
        width: width,
        depth: depth,
        boundingBox: new THREE.Box3().setFromObject(mesh) // Cache bounding box
    };

    blocks.push(blockData);
    scene.add(mesh);
}

function updateBlocks() {
    // Generate new blocks if needed
    if (camera.position.z < lastBlockZ + RENDER_DISTANCE * 0.7) {
        generateBlock();
    }

    // Remove blocks behind the player
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].mesh.position.z > camera.position.z + 10) {
            scene.remove(blocks[i].mesh);
            blocks.splice(i, 1);
        } else {
            // Update bounding box if needed (though static here)
            // blocks[i].boundingBox.setFromObject(blocks[i].mesh);
        }
    }
}

function handleKeyDown(event) {
    keys[event.code] = true;

    if (event.code === 'Space' && marioState.canJump && !marioState.isChargingJump && !marioState.isJumping) {
        marioState.isChargingJump = true;
        marioState.jumpChargeStartTime = clock.getElapsedTime();
    }

    if (event.code === 'KeyR' && gameOver) {
        restartGame();
    }
}

function handleKeyUp(event) {
    keys[event.code] = false;

    if (event.code === 'Space' && marioState.isChargingJump) {
        marioState.isChargingJump = false;
        marioState.isJumping = true;
        marioState.isGrounded = false;
        marioState.canJump = false; // Prevent jumping again until grounded
        marioState.onBlock = null; // No longer on the specific block

        const chargeDuration = Math.min(clock.getElapsedTime() - marioState.jumpChargeStartTime, JUMP_CHARGE_TIME_MAX);
        const jumpForce = MathUtils.lerp(JUMP_FORCE_MIN, JUMP_FORCE_MAX, chargeDuration / JUMP_CHARGE_TIME_MAX);

        marioState.velocity.y = jumpForce;
    }
}

function handleInput(deltaTime) {
    let strafeVelocity = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) {
        strafeVelocity = STRAFE_SPEED;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        strafeVelocity = -STRAFE_SPEED;
    }

    // Calculate strafe direction relative to camera
    const right = new THREE.Vector3();
    camera.getWorldDirection(right); // Get forward direction first
    right.cross(camera.up); // Cross with up to get right vector
    right.normalize();

    marioState.velocity.x = right.x * strafeVelocity;
    marioState.velocity.z = right.z * strafeVelocity;

    // Forward velocity is constant when gameRunning
    if (gameRunning) {
         marioState.forwardVelocity = -currentSpeed; // Always move forward
    } else {
         marioState.forwardVelocity = 0;
    }
}

function updateMario(deltaTime) {
    // Apply gravity
    if (!marioState.isGrounded) {
        marioState.velocity.y += GRAVITY * deltaTime;
    } else {
        marioState.velocity.y = 0; // Ensure no accumulation while grounded
    }

    // Calculate movement vector based on forward and strafe velocity
    const moveDelta = new THREE.Vector3();
    const forwardDirection = new THREE.Vector3();
    camera.getWorldDirection(forwardDirection);

    // Combine forward and strafe movement
    const strafeDirection = new THREE.Vector3().crossVectors(camera.up, forwardDirection).normalize();
    moveDelta.addScaledVector(forwardDirection, marioState.forwardVelocity * deltaTime); // Forward/Backward
    moveDelta.addScaledVector(strafeDirection, -marioState.velocity.x * deltaTime); // Strafe (velocity.x holds strafe speed relative to camera right)


    // Apply vertical velocity
    moveDelta.y = marioState.velocity.y * deltaTime;

    // Update position
    marioState.position.add(moveDelta);

    // Update camera position to follow Mario
    camera.position.copy(marioState.position);
}

function checkCollisions() {
    const marioFeetPos = marioState.position.clone().add(new THREE.Vector3(0, MARIO_FEET_OFFSET, 0));
    let landedOnBlockThisFrame = false;
    let currentGroundY = 0; // Default ground level

    marioState.isGrounded = false; // Assume not grounded unless proven otherwise
    marioState.canJump = false;
    marioState.onBlock = null;

    const marioCollider = new THREE.Box3(
        new THREE.Vector3(marioFeetPos.x - MARIO_WIDTH / 2, marioFeetPos.y, marioFeetPos.z - MARIO_DEPTH / 2),
        new THREE.Vector3(marioFeetPos.x + MARIO_WIDTH / 2, marioFeetPos.y + 0.1, marioFeetPos.z + MARIO_DEPTH / 2) // Thin box at feet level for landing check
    );

    for (const block of blocks) {
        // Broad phase check (optional optimization)
        if (Math.abs(block.mesh.position.z - marioState.position.z) > BLOCK_DEPTH / 2 + MARIO_DEPTH / 2 + 1 ||
            Math.abs(block.mesh.position.x - marioState.position.x) > BLOCK_WIDTH / 2 + MARIO_WIDTH / 2 + 1) {
            continue;
        }

        // Check collision with block
        if (marioCollider.intersectsBox(block.boundingBox)) {
            const blockTopY = block.mesh.position.y + block.height / 2;
            const blockSideHitThreshold = blockTopY - block.height * BLOCK_HIT_TOLERANCE;

            // Check if landing on top
            if (marioState.velocity.y <= 0 && marioFeetPos.y >= blockTopY - 0.1 && marioFeetPos.y <= blockTopY + 0.2) {
                 // Landed!
                marioState.position.y = blockTopY - MARIO_FEET_OFFSET; // Adjust position exactly to top
                marioState.velocity.y = 0;
                marioState.isGrounded = true;
                marioState.canJump = true; // Allow jumping from blocks
                marioState.isJumping = false;
                landedOnBlockThisFrame = true;
                marioState.onBlock = block;
                currentGroundY = blockTopY; // Update effective ground level
                break; // Stop checking other blocks once landed
            }
             // Check if hitting the side (below the tolerance threshold)
            else if (marioFeetPos.y < blockSideHitThreshold) {
                // Hit the side - Game Over
                console.log("Game Over: Hit side of block");
                triggerGameOver();
                return; // Exit collision check immediately
            }
        }
    }

    // Check if fell to the floor (only if not landed on a block)
    if (!landedOnBlockThisFrame && marioFeetPos.y <= 0.01) { // Small tolerance above 0
        console.log("Game Over: Fell to the floor");
        triggerGameOver();
    }

    // If not grounded on a block, but still above floor, ensure canJump is false
    if (!marioState.isGrounded) {
        marioState.canJump = false;
    }
}

function triggerGameOver() {
    gameOver = true;
    gameRunning = false;
    marioState.velocity.set(0, 0, 0);
    marioState.forwardVelocity = 0;
    // Maybe add a visual indicator like red screen flash or text later
    console.log("GAME OVER! Press 'R' to restart.");
}

function restartGame() {
    // Reset state variables
    resetMarioState();

    // Regenerate initial blocks
    generateInitialBlocks();

    // Reset camera
    camera.position.set(0, MARIO_HEIGHT, 5);

    // Clear keys
    keys = {};

    // Restart intro sequence timer
     setTimeout(() => {
        gameRunning = true;
        marioState.forwardVelocity = -currentSpeed; // Re-apply speed
    }, START_DELAY * 1000);

    console.log("Game Restarted");
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (!gameOver) {
        handleInput(deltaTime);
        updateMario(deltaTime);
        if (gameRunning) { // Only check collisions and update blocks when running
             checkCollisions();
             updateBlocks();
        }
    }

    // Ensure camera looks forward, slightly tilted down if jumping/falling
    const lookTarget = new THREE.Vector3(camera.position.x, camera.position.y - 0.5, camera.position.z - 10);
    camera.lookAt(lookTarget);


    renderer.render(scene, camera);
}

// --- Start the game ---
init();
animate();