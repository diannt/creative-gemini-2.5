let groundLevel;
let playerPos;
let playerVel;
let gravity = 0.5;
let jumpForce = -10;
let score = 0;
let gameOver = false;
let obstacles = [];
let pterodactyls = [];

function setup() {
  createCanvas(400, 300);
  noSmooth();
  groundLevel = height - 20;
  playerPos = createVector(50, groundLevel);
  playerVel = createVector(0, 0);
}

function draw() {
  background(0, 0, 30);
  if (gameOver) {
    textSize(20);
    fill(255);
    text("Game Over! Score: " + score, width / 4, height / 2);
    text("Press Space to Restart", width / 4, height / 2 + 30);
    return;
  }

  // Draw ground
  fill(50, 100, 50);
  rect(0, groundLevel, width, 20);

  // Draw player
  fill(0, 100, 0);
  rect(playerPos.x, playerPos.y, 20, 20);

  // Update player physics
  playerVel.y += gravity;
  playerPos.y += playerVel.y;
  playerPos.y = constrain(playerPos.y, 0, groundLevel);

  //Generate Obstacles
  if (frameCount % 60 === 0) {
    obstacles.push(createVector(width, groundLevel - 20));
  }
  if (frameCount % 120 === 0) {
    pterodactyls.push(createVector(width, random(50, 150)));
  }

  //Draw and update obstacles
  for (let i = 0; i < obstacles.length; i++) {
    fill(100, 50, 50);
    rect(obstacles[i].x, obstacles[i].y, 20, 20);
    obstacles[i].x -= 5;
    if (obstacles[i].x + 20 < 0) {
      obstacles.splice(i, 1);
      score++;
    }
  }

  //Draw and update pterodactyls
  for (let i = 0; i < pterodactyls.length; i++) {
    fill(100, 100, 200);
    rect(pterodactyls[i].x, pterodactyls[i].y, 20, 10);
    pterodactyls[i].x -= 3;
    if (pterodactyls[i].x + 20 < 0) {
      pterodactyls.splice(i, 1);
    }
  }

  //Collision Detection
  for (let i = 0; i < obstacles.length; i++) {
    if (playerPos.x + 20 > obstacles[i].x && playerPos.x < obstacles[i].x + 20 && playerPos.y + 20 > obstacles[i].y) {
      gameOver = true;
    }
  }
  for (let i = 0; i < pterodactyls.length; i++) {
    if (playerPos.x + 20 > pterodactyls[i].x && playerPos.x < pterodactyls[i].x + 20 && playerPos.y + 20 > pterodactyls[i].y && playerPos.y < pterodactyls[i].y + 10) {
      gameOver = true;
    }
  }

  //Display Score
  textSize(15);
  fill(255);
  text("Score: " + score, 10, 20);
}

function keyPressed() {
  if (keyCode === 32 && gameOver) {
      gameOver = false;
      score = 0;
      obstacles = [];
      pterodactyls = [];
      playerPos = createVector(50, groundLevel);
      playerVel = createVector(0, 0);
  }
  if (keyCode === 32 && !gameOver && playerPos.y === groundLevel) {
    playerVel.y = jumpForce;
  }
}
```