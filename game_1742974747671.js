let playerPos, playerVel;
let playerHeight = 1.8;
let playerWidth = 0.5;
let gravity;
let jumpForce;
let autoRunSpeed;
let moveSpeed;
let isOnGround = false;
let isJumping = false;
let jumpCharge = 0;
let maxJumpCharge = 30;
let jumpChargeRate = 1;

let blocks = [];
let blockSize = 2;
let blockSpacing = 5;
let blockGenerationDistance = 100;
let blockRemovalDistance = -20;

let score = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'

let myFont;

function preload() {
  myFont = loadFont('Courier New');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(myFont);

  playerPos = createVector(0, -playerHeight * 3, 10);
  playerVel = createVector(0, 0, 0);
  gravity = createVector(0, 0.03, 0);
  jumpForce = -0.7;
  autoRunSpeed = 0.15;
  moveSpeed = 0.1;

  blocks.push({
    pos: createVector(0, 0, 0),
    size: createVector(blockSize * 2, blockSize, blockSize * 2)
  });
  playerPos.y = blocks[0].pos.y + blocks[0].size.y / 2; // Start on the first block's top surface

  for (let i = 0; i < 15; i++) {
    generateBlock();
  }
}

function draw() {
  background(135, 206, 250);

  let camY = playerPos.y - playerHeight * 0.8;
  camera(playerPos.x, camY, playerPos.z,
         playerPos.x, camY, playerPos.z - 1,
         0, 1, 0);

  ambientLight(150);
  directionalLight(255, 255, 255, 0.5, 0.5, -1);

  if (gameState === 'start') {
    displayStartScreen();
  } else if (gameState === 'playing') {
    handleInput();
    updatePlayer();
    checkCollisions();
    manageBlocks();
    drawBlocks();
    displayScore();

    if (playerPos.y > 50) {
        gameOver();
    }

  } else if (gameState === 'gameOver') {
    drawBlocks();
    displayGameOverScreen();
  }
}

function handleInput() {
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A
    playerPos.x -= moveSpeed;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D
    playerPos.x += moveSpeed;
  }

  if (keyIsDown(32)) { // Space
    if (isOnGround && !isJumping) {
      jumpCharge = min(jumpCharge + jumpChargeRate, maxJumpCharge);
    }
  }
}

function keyPressed() {
  if (gameState === 'start' && key === ' ') {
      gameState = 'playing';
      playerVel.z = -autoRunSpeed;
      // Ensure player starts on the ground state correctly
      let firstBlock = blocks[0];
      playerPos.y = firstBlock.pos.y + firstBlock.size.y / 2;
      isOnGround = true;

  } else if (gameState === 'gameOver' && key === ' ') {
      restartGame();
  }
}

function keyReleased() {
    if (keyCode === 32 && isOnGround && gameState === 'playing') {
        let currentJumpForce = map(jumpCharge, 0, maxJumpCharge, jumpForce * 0.5, jumpForce);
        playerVel.y = currentJumpForce;
        isOnGround = false;
        isJumping = true;
        jumpCharge = 0;
    }
}


function updatePlayer() {
  playerPos.z -= autoRunSpeed;

  playerVel.add(gravity);
  playerPos.add(playerVel);

  if (playerVel.y > 0) {
      isJumping = false;
  }
}

function checkCollisions() {
    let landedOnBlock = false;
    let collisionTolerance = 0.1;
    let sideCollisionHeightThreshold = 0.05; // 5%

    // Assume not on ground unless a landing collision occurs
    let potentialGroundY = Infinity; // Find the highest block we might land on

    for (let i = blocks.length - 1; i >= 0; i--) {
        let block = blocks[i];
        // Player's bounding box (approximated at feet level for landing)
        let playerFeetY = playerPos.y;
        let playerTopY = playerPos.y - playerHeight;
        let playerMinX = playerPos.x - playerWidth / 2;
        let playerMaxX = playerPos.x + playerWidth / 2;
        let playerMinZ = playerPos.z - playerWidth / 2;
        let playerMaxZ = playerPos.z + playerWidth / 2;

        let bMinX = block.pos.x - block.size.x / 2;
        let bMaxX = block.pos.x + block.size.x / 2;
        let bMinY = block.pos.y - block.size.y / 2;
        let bMaxY = block.pos.y + block.size.y / 2;
        let bMinZ = block.pos.z - block.size.z / 2;
        let bMaxZ = block.pos.z + block.size.z / 2;


        let isOverlappingX = (playerMaxX > bMinX && playerMinX < bMaxX);
        let isOverlappingZ = (playerMaxZ > bMinZ && playerMinZ < bMaxZ);

        // Landing Check: Player falling or still, feet are slightly above or just penetrated the top surface
        if (playerVel.y >= -collisionTolerance && isOverlappingX && isOverlappingZ) {
             // Check vertical proximity for landing
             let verticalDistToTop = playerFeetY - bMaxY;
             if (verticalDistToTop >= -collisionTolerance && verticalDistToTop < collisionTolerance + playerVel.y ) { // Check if feet are just above or slightly below the top
                potentialGroundY = min(potentialGroundY, bMaxY); // Track the highest block top we could land on
                landedOnBlock = true;
             }
        }

        // Side Collision Check: Overlapping horizontally and vertically, but not landing on top
        let sideHitThresholdWorldY = bMaxY - block.size.y * sideCollisionHeightThreshold;
        let isVerticallyOverlappingSide = (playerFeetY > bMinY && playerTopY < sideHitThresholdWorldY);

        if (isOverlappingX && isOverlappingZ && isVerticallyOverlappingSide && !landedOnBlock) {
             // Check if player actually hit the side (e.g., was moving towards it)
             // Simple check: if overlapping and not landing, assume side hit
             gameOver();
             return;
        }
    }

    // Post-collision resolution
    if (landedOnBlock) {
        playerPos.y = potentialGroundY; // Snap to the highest block found
        playerVel.y = 0;
        if (!isOnGround) { // Only score once per landing
           score++;
        }
        isOnGround = true;
        isJumping = false;
    } else {
        isOnGround = false;
    }
}


function manageBlocks() {
  let farthestZ = 0;
  if (blocks.length > 0) {
    farthestZ = blocks[blocks.length - 1].pos.z;
  } else {
     // Should not happen if we always keep at least one block, but handle defensively
     farthestZ = playerPos.z - blockGenerationDistance;
  }


  while (playerPos.z < farthestZ + blockGenerationDistance) {
    generateBlock();
     if (blocks.length > 0) { // Update farthestZ after adding a block
        farthestZ = blocks[blocks.length - 1].pos.z;
    } else { break; } // Avoid infinite loop if generation fails
  }

  blocks = blocks.filter(block => block.pos.z > playerPos.z + blockRemovalDistance);
}

function generateBlock() {
  if (blocks.length === 0) {
      // Failsafe: generate a block at player's feet if list is empty
       blocks.push({
            pos: createVector(playerPos.x, playerPos.y + blockSize / 2, playerPos.z - blockSpacing),
            size: createVector(blockSize * 2, blockSize, blockSize * 2)
        });
       return;
  }

  let lastBlock = blocks[blocks.length - 1];
  let newZ = lastBlock.pos.z - blockSpacing - random(0, blockSpacing * 1.5);
  let newX = lastBlock.pos.x + random(-blockSize * 2.5, blockSize * 2.5);
  newX = constrain(newX, -15, 15);

  let newHeight = blockSize * random(0.5, 3.5);

  let prevBlockTopY = lastBlock.pos.y + lastBlock.size.y / 2;
  // Calculate potential jump height based on max jump force
  // vel^2 = u^2 + 2as => 0 = jumpForce^2 + 2 * gravity.y * deltaY => deltaY = -jumpForce^2 / (2*gravity.y)
  let maxJumpHeight = (-jumpForce * jumpForce) / (2 * gravity.y);
  let minJumpHeight = (- (jumpForce * 0.5) * (jumpForce * 0.5)) / (2 * gravity.y); // Min jump height


  // Target Y relative to previous block, ensure it's reachable
  let deltaY = random(-newHeight * 0.5, maxJumpHeight * 0.8); // Allow downward steps too, limit max upward jump needed
  deltaY = constrain(deltaY, -maxJumpHeight * 0.7, maxJumpHeight * 0.8); // Further constrain vertical change

  let newBlockTopY = prevBlockTopY + deltaY;
  newBlockTopY = constrain(newBlockTopY, -8, 8); // Absolute height limits


  let newY = newBlockTopY - newHeight / 2;

  let newWidth = blockSize * random(1, 3);
  let newDepth = blockSize * random(1, 3);

  blocks.push({
    pos: createVector(newX, newY, newZ),
    size: createVector(newWidth, newHeight, newDepth)
  });
}

function drawBlocks() {
  for (let block of blocks) {
    push();
    translate(block.pos.x, block.pos.y, block.pos.z);
    fill(139, 69, 19);
    stroke(50);
    strokeWeight(1); // Make lines slightly thicker in 3D
    box(block.size.x, block.size.y, block.size.z);
    pop();
  }
}

function displayScore() {
  push();
  // Use an ortho projection for 2D overlay drawing
  ortho(-width / 2, width / 2, -height / 2, height / 2, -10, 10);
  translate(0, 0, 0); // Ensure position is relative to center

  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(32);
  textAlign(LEFT, TOP);

  // Position text relative to top-left corner in ortho view
  text(`Score: ${score}`, -width / 2 + 10, -height / 2 + 10);
  pop();
}

function displayStartScreen() {
  push();
  ortho(-width / 2, width / 2, -height / 2, height / 2, -10, 10);
  translate(0, 0, 0);

  background(0, 0, 0, 150);
  fill(255);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("Counter-Intuitive Parkour", 0, -height / 4);
  textSize(24);
  text("Use A/D or Left/Right Arrows to move.", 0, 0);
  text("Hold and release SPACE to jump.", 0, 30);
  text("Land ONLY on top of blocks!", 0, 60);
   textSize(32);
  text("Press SPACE to Start", 0, height / 4);
  pop();
}


function displayGameOverScreen() {
  push();
  ortho(-width / 2, width / 2, -height / 2, height / 2, -10, 10);
  translate(0, 0, 0);

  background(150, 0, 0, 150);
  fill(255);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("GAME OVER", 0, -50);
  textSize(32);
  text(`Final Score: ${score}`, 0, 20);
  text("Press SPACE to Restart", 0, 70);
  pop();
}

function gameOver() {
    gameState = 'gameOver';
    playerVel = createVector(0,0,0);
}

function restartGame() {
  score = 0;
  playerPos = createVector(0, -playerHeight*3, 10);
  playerVel = createVector(0, 0, 0);
  isOnGround = false;
  isJumping = false;
  jumpCharge = 0;

  blocks = [];
  blocks.push({
    pos: createVector(0, 0, 0),
    size: createVector(blockSize * 2, blockSize, blockSize * 2)
  });
   playerPos.y = blocks[0].pos.y + blocks[0].size.y / 2; // Start on the first block's top surface

  for (let i = 0; i < 15; i++) {
    generateBlock();
  }

  gameState = 'playing';
  playerVel.z = -autoRunSpeed;
  isOnGround = true; // Start on the ground
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}