let groundLevel;
let playerX, playerY, playerVX, playerVY, jumpForce, gravity;
let score;
let gameOver;
let obstacles = [];

function setup() {
  createCanvas(400, 300);
  noSmooth();
  groundLevel = height - 20;
  playerX = 50;
  playerY = groundLevel;
  playerVX = 0;
  playerVY = 0;
  jumpForce = -10;
  gravity = 0.5;
  score = 0;
  gameOver = false;

  for (let i = 0; i < 10; i++) {
    obstacles.push({
      x: width + i * 50,
      y: groundLevel - 20,
      w: 20,
      h: 20,
      type: 'rock'
    });
  }
}

function draw() {
  background(135, 206, 235); // Sky blue
  fill(100, 149, 237); // Slightly darker blue for ground
  rect(0, groundLevel, width, 20);

  if (gameOver) {
    textSize(20);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    text("Game Over! Score: " + score + " Press Space to Restart", width / 2, height / 2);
    return;
  }

  playerVY += gravity;
  playerY += playerVY;
  playerY = constrain(playerY, 0, groundLevel);

  fill(0, 100, 0);
  rect(playerX, playerY, 20, 20);

  for (let i = 0; i < obstacles.length; i++) {
    let obs = obstacles[i];
    obs.x -= 2;
    fill(139,69,19);
    rect(obs.x, obs.y, obs.w, obs.h);

    if (playerX + 20 > obs.x && playerX < obs.x + obs.w && playerY + 20 > obs.y && playerY < obs.y + obs.h) {
      gameOver = true;
    }
    if (obs.x + obs.w < 0) {
      obstacles.splice(i, 1);
      score++;
      obstacles.push({
        x: width + random(50,100),
        y: groundLevel - 20,
        w: 20,
        h: 20,
        type: 'rock'
      });
    }

  }
}


function keyPressed() {
  if (keyCode === UP_ARROW && !gameOver) {
    playerVY = jumpForce;
  }
  if (keyCode === 32 && gameOver) {
    restartGame();
  }
}

function restartGame() {
  playerX = 50;
  playerY = groundLevel;
  playerVX = 0;
  playerVY = 0;
  score = 0;
  gameOver = false;
  obstacles = [];
  for (let i = 0; i < 10; i++) {
    obstacles.push({
      x: width + i * 50,
      y: groundLevel - 20,
      w: 20,
      h: 20,
      type: 'rock'
    });
  }
}