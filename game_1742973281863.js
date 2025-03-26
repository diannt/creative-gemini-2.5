// User Prompt: A simple breakout game with left , right , up , down controls ; beautiful pixelated background ; nice 3D ball , kicking bears instead of blocks , and each of them has different animation ; should have a good physics of the real-time bouncing of the ball

let paddle;
let ball;
let bears = [];
let score = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let bearCols = 8;
let bearRows = 4;
let bearWidth;
let bearHeight = 20;
let bearPadding = 10;
let bearOffsetTop = 50;
let bearOffsetLeft;

let pixelBg = [];
let pixelSize = 10;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noSmooth();
  pixelDensity(1); // Ensure pixel art clarity

  // Calculate bear dimensions and offsets based on width
  bearWidth = (width * 0.8) / bearCols - bearPadding;
  bearOffsetLeft = width * 0.1;

  // Initialize pixel background
  for (let x = -width / 2; x < width / 2; x += pixelSize) {
    for (let y = -height / 2; y < height / 2; y += pixelSize) {
      pixelBg.push({
        x: x,
        y: y,
        col: color(random(50, 100), random(80, 150), random(100, 200), 180)
      });
    }
  }

  paddle = {
    w: 120,
    h: 20,
    d: 30, // Depth for 3D
    x: 0, // Centered horizontally in WEBGL
    y: height / 2 - 50, // Near bottom
    speed: 10,
    col: color(200, 200, 0)
  };

  ball = {
    radius: 15,
    pos: createVector(paddle.x, paddle.y - paddle.h / 2 - 15),
    vel: createVector(0, 0),
    speed: 8,
    launched: false,
    col: color(255, 100, 100)
  };

  createBears();
}

function draw() {
  background(20);
  orbitControl(); // Allows camera control for debugging 3D

  // Draw pixelated background
  push();
  translate(0, 0, -200); // Push background back
  noStroke();
  for (let p of pixelBg) {
    fill(p.col);
    rect(p.x, p.y, pixelSize, pixelSize);
  }
  pop();

  // Lighting for 3D elements
  ambientLight(100);
  directionalLight(255, 255, 255, 0.5, 0.5, -1);


  if (gameState === 'start') {
    displayMessage("BREAKOUT BEARS\n\nUse Arrow Keys to Move Paddle\nPress SPACE to Launch Ball");
    // Keep ball attached to paddle
    ball.pos.x = paddle.x;
    ball.pos.y = paddle.y - paddle.h / 2 - ball.radius;
    handlePaddleMovement();
    drawPaddle();
    drawBall();
    drawBears(); // Draw initial state
    drawScore();
  } else if (gameState === 'playing') {
    handlePaddleMovement();
    updateBall();
    checkCollisions();

    drawPaddle();
    drawBall();
    drawBears();
    drawScore();

    // Check for win condition
    let bearsLeft = false;
    for (let bear of bears) {
      if (bear.alive) {
        bearsLeft = true;
        break;
      }
    }
    if (!bearsLeft) {
      gameState = 'gameOver'; // Or a 'win' state
    }

  } else if (gameState === 'gameOver') {
    displayMessage("GAME OVER!\nScore: " + score + "\nPress SPACE to Restart");
    drawPaddle(); // Still draw elements in their final state
    drawBall();
    drawBears();
    drawScore();
  }
}

function handlePaddleMovement() {
  let halfW = width / 2;
  let halfH = height / 2;

  if (keyIsDown(LEFT_ARROW)) {
    paddle.x -= paddle.speed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    paddle.x += paddle.speed;
  }
  if (keyIsDown(UP_ARROW)) {
    paddle.y -= paddle.speed;
  }
  if (keyIsDown(DOWN_ARROW)) {
    paddle.y += paddle.speed;
  }

  // Constrain paddle movement (adjust for WEBGL coordinate system)
  paddle.x = constrain(paddle.x, -halfW + paddle.w / 2, halfW - paddle.w / 2);
  paddle.y = constrain(paddle.y, -halfH + paddle.h / 2, halfH - paddle.h / 2);

  // Keep ball on paddle if not launched
  if (!ball.launched) {
     ball.pos.x = paddle.x;
     ball.pos.y = paddle.y - paddle.h / 2 - ball.radius;
  }
}

function updateBall() {
  if (!ball.launched) return;

  ball.pos.add(ball.vel);

  let halfW = width / 2;
  let halfH = height / 2;

  // Wall collisions
  if (ball.pos.x + ball.radius > halfW || ball.pos.x - ball.radius < -halfW) {
    ball.vel.x *= -1;
    ball.pos.x = constrain(ball.pos.x, -halfW + ball.radius, halfW - ball.radius); // Prevent sticking
  }
  if (ball.pos.y - ball.radius < -halfH) {
    ball.vel.y *= -1;
     ball.pos.y = -halfH + ball.radius; // Prevent sticking
  }

  // Bottom collision (Game Over)
  if (ball.pos.y + ball.radius > halfH) {
    gameState = 'gameOver';
  }
}

function checkCollisions() {
  if (!ball.launched) return;

  // Paddle collision (simple AABB-like for sphere vs box)
  let paddleTop = paddle.y - paddle.h / 2;
  let paddleBottom = paddle.y + paddle.h / 2;
  let paddleLeft = paddle.x - paddle.w / 2;
  let paddleRight = paddle.x + paddle.w / 2;

  if (ball.pos.y + ball.radius > paddleTop &&
      ball.pos.y - ball.radius < paddleBottom &&
      ball.pos.x + ball.radius > paddleLeft &&
      ball.pos.x - ball.radius < paddleRight) {

    // Check if ball was generally above the paddle before this frame to avoid side hits sticking
    if (ball.pos.y - ball.vel.y < paddleTop) {
        ball.vel.y *= -1;
        ball.pos.y = paddleTop - ball.radius; // Place ball just above paddle

        // Add horizontal influence based on hit location
        let diff = ball.pos.x - paddle.x;
        ball.vel.x = map(diff, -paddle.w / 2, paddle.w / 2, -ball.speed * 0.8, ball.speed * 0.8);
        // Ensure total speed remains constant (optional, but good for physics feel)
        ball.vel.normalize().mult(ball.speed);
    }
  }


  // Bear collisions
  for (let bear of bears) {
    if (bear.alive) {
      let bearTop = bear.y - bear.h / 2;
      let bearBottom = bear.y + bear.h / 2;
      let bearLeft = bear.x - bear.w / 2;
      let bearRight = bear.x + bear.w / 2;

      // Simple Sphere-Box collision check
      let closestX = constrain(ball.pos.x, bearLeft, bearRight);
      let closestY = constrain(ball.pos.y, bearTop, bearBottom);
      let distance = dist(ball.pos.x, ball.pos.y, closestX, closestY);

      if (distance < ball.radius) {
        bear.alive = false;
        score += 10;

        // Determine bounce direction (simplified)
        let dx = ball.pos.x - bear.x;
        let dy = ball.pos.y - bear.y;
        let prevBallX = ball.pos.x - ball.vel.x;
        let prevBallY = ball.pos.y - ball.vel.y;

        // Check collision overlap to determine side
        let overlapX = ball.radius - abs(ball.pos.x - bear.x);
        let overlapY = ball.radius - abs(ball.pos.y - bear.y);

        // Crude side detection based on previous position
        // If ball center was previously outside horizontally more than vertically, bounce horizontally
        let hitFromSide = abs(prevBallX - bear.x) > bear.w / 2;
        let hitFromTopBottom = abs(prevBallY - bear.y) > bear.h / 2;

        if (hitFromSide && !hitFromTopBottom) {
             ball.vel.x *= -1; // Hit from side
        } else if (!hitFromSide && hitFromTopBottom) {
             ball.vel.y *= -1; // Hit from top/bottom
        } else {
             // Corner hit or ambiguous - simple vertical bounce often works okay
             ball.vel.y *= -1;
        }

        // Move ball slightly out of collision to prevent multi-hits
        ball.pos.add(ball.vel.copy().normalize().mult(2));
        break; // Only hit one bear per frame
      }
    }
  }
}

function drawPaddle() {
  push();
  translate(paddle.x, paddle.y, 0);
  fill(paddle.col);
  noStroke();
  box(paddle.w, paddle.h, paddle.d);
  pop();
}

function drawBall() {
  push();
  translate(ball.pos.x, ball.pos.y, 0);
  fill(ball.col);
  noStroke();
  sphere(ball.radius);
  pop();
}

function createBears() {
  bears = []; // Clear existing bears if restarting
  let startX = -width / 2 + bearOffsetLeft + bearWidth / 2;
  let startY = -height / 2 + bearOffsetTop;

  for (let i = 0; i < bearRows; i++) {
    for (let j = 0; j < bearCols; j++) {
      let x = startX + j * (bearWidth + bearPadding);
      let y = startY + i * (bearHeight + bearPadding);
      bears.push({
        x: x,
        y: y,
        w: bearWidth,
        h: bearHeight,
        d: 20, // Depth for 3D
        alive: true,
        color1: color(random(100, 200), random(50, 100), random(20, 50)), // Bear color 1
        color2: color(random(150, 255), random(80, 150), random(50, 100)), // Bear color 2
        animOffset: floor(random(60)) // Random start for animation cycle
      });
    }
  }
}

function drawBears() {
  for (let bear of bears) {
    if (bear.alive) {
      push();
      translate(bear.x, bear.y, -50); // Push bears back slightly
      noStroke();

      // Simple animation: switch color based on frameCount
      let animCycle = 60; // Frames per cycle
      let currentFrame = (frameCount + bear.animOffset) % animCycle;
      if (currentFrame < animCycle / 2) {
        fill(bear.color1);
        // Draw kicking pose 1 (e.g., simple box)
        box(bear.w, bear.h, bear.d);
      } else {
        fill(bear.color2);
        // Draw kicking pose 2 (e.g., slightly rotated or different shape parts)
         rotateY(sin(frameCount * 0.1 + bear.animOffset) * 0.2); // Simple wobble/kick
         box(bear.w * 0.9, bear.h * 1.1, bear.d); // Slightly different shape
      }
      pop();
    }
  }
}

function drawScore() {
  // Use a separate 2D drawing context for text overlay in WEBGL
  push();
  ortho(-width / 2, width / 2, -height / 2, height / 2, -1000, 1000); // Set up ortho view for text
  translate(0, 0, 500); // Bring text forward
  fill(255);
  textSize(32);
  textAlign(CENTER, TOP);
  text("Score: " + score, 0, -height / 2 + 20);
  pop();
}


function displayMessage(msg) {
  push();
  ortho(-width / 2, width / 2, -height / 2, height / 2, -1000, 1000);
  translate(0, 0, 500);
  fill(255, 255, 0);
  textSize(40);
  textAlign(CENTER, CENTER);
  text(msg, 0, 0);
  pop();
}

function keyPressed() {
  if (keyCode === 32) { // Space Bar
    if (gameState === 'start' && !ball.launched) {
      ball.launched = true;
      ball.vel = createVector(random(-1, 1), -1).normalize().mult(ball.speed);
      gameState = 'playing';
    } else if (gameState === 'gameOver') {
      resetGame();
    }
  }
}

function resetGame() {
  score = 0;
  gameState = 'start';
  paddle.x = 0;
  paddle.y = height / 2 - 50;
  ball.launched = false;
  ball.pos = createVector(paddle.x, paddle.y - paddle.h / 2 - ball.radius);
  ball.vel = createVector(0, 0);
  createBears(); // Recreate the bears
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Recalculate positions/sizes based on new dimensions if needed
    bearWidth = (width * 0.8) / bearCols - bearPadding;
    bearOffsetLeft = width * 0.1;
    paddle.y = height / 2 - 50; // Reset paddle Y pos relative to new height
    // Regenerate background for new size
    pixelBg = [];
     for (let x = -width / 2; x < width / 2; x += pixelSize) {
        for (let y = -height / 2; y < height / 2; y += pixelSize) {
        pixelBg.push({
            x: x,
            y: y,
            col: color(random(50, 100), random(80, 150), random(100, 200), 180)
        });
        }
    }
    // Reset game state to avoid weirdness after resize
    resetGame();
}