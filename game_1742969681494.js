let dinoPos;
let dinoVelY;
let gravity;
let jumpForce;
let groundLevel;
let score;
let gameOver;
let obstacles;

function setup() {
  createCanvas(400, 200);
  noSmooth();
  dinoPos = { x: 50, y: groundLevel };
  dinoVelY = 0;
  gravity = 0.5;
  jumpForce = -10;
  groundLevel = height - 20;
  score = 0;
  gameOver = false;
  obstacles = [];
}

function draw() {
  background(135, 206, 235); // Sky blue

  if (!gameOver) {
    updatePlayer();
    manageObstacles();
    drawBackground();
    drawDino();
    drawScore();
  } else {
    drawGameOver();
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && !gameOver) {
    if (dinoPos.y >= groundLevel) {
      dinoVelY = jumpForce;
    }
  }
  if (keyCode === 32 && gameOver) {
    restartGame();
  }
}


function updatePlayer() {
  dinoVelY += gravity;
  dinoPos.y += dinoVelY;
  dinoPos.y = constrain(dinoPos.y, 0, groundLevel);


  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (collision(dinoPos, obstacles[i])) {
      gameOver = true;
      break;
    }
  }
}

function manageObstacles() {
  if (frameCount % 60 === 0) {
    obstacles.push({ x: width, y: groundLevel - random(10, 40), w: 20, h: random(20, 50) });
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= 3;
    if (obstacles[i].x + obstacles[i].w < 0) {
      obstacles.splice(i, 1);
      score++;
    }
    fill(100,50,0);
    rect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);
  }
}

function drawBackground() {
  fill(100, 100, 0);
  rect(0, groundLevel, width, height - groundLevel); // Ground
}

function drawDino() {
  fill(255, 0, 0);
  rect(dinoPos.x, dinoPos.y, 10, 10); // Dino body
  fill(0, 0, 0);
  rect(dinoPos.x, dinoPos.y + 10, 10, 5); // Dino legs
}

function drawScore() {
  textSize(16);
  fill(0);
  text("Score: " + score, 10, 20);
}

function drawGameOver() {
  textSize(32);
  fill(0);
  textAlign(CENTER, CENTER);
  text("Game Over!", width / 2, height / 2);
  text("Score: " + score, width / 2, height / 2 + 30);
  textSize(16);
  text("Press Space to Restart", width/2, height/2 + 60);
}

function collision(dino, obstacle) {
  return dino.x < obstacle.x + obstacle.w &&
         dino.x + 10 > obstacle.x &&
         dino.y < obstacle.y + obstacle.h &&
         dino.y + 10 > obstacle.y;
}

function restartGame() {
  dinoPos = { x: 50, y: groundLevel };
  dinoVelY = 0;
  score = 0;
  gameOver = false;
  obstacles = [];
}