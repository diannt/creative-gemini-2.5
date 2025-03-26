// User Prompt: a simple breakout game with controls of up and down

let paddleY;
let ballX, ballY, ballVelX, ballVelY;
let bricks = [];
let score = 0;
let gameOver = false;

const brickRows = 5;
const brickCols = 10;
const brickWidth = 40;
const brickHeight = 20;
const brickPadding = 5;

function setup() {
  createCanvas(600, 400);
  noSmooth();
  paddleY = height - 50;
  ballX = width / 2;
  ballY = height / 2;
  ballVelX = 5;
  ballVelY = 5;
  for (let i = 0; i < brickRows; i++) {
    for (let j = 0; j < brickCols; j++) {
      bricks.push({
        x: j * (brickWidth + brickPadding) + brickPadding,
        y: i * (brickHeight + brickPadding) + brickPadding,
        broken: false
      });
    }
  }
}

function draw() {
  background(220);
  drawPaddle();
  drawBall();
  updateBall();
  drawBricks();
  checkCollisions();
  displayScore();
  if (gameOver) {
    displayGameOver();
  }
}

function drawPaddle() {
  fill(0);
  rect(width / 2 - 50, paddleY, 100, 10);
}

function drawBall() {
  fill(255,0,0);
  ellipse(ballX, ballY, 10, 10);
}

function updateBall() {
  ballX += ballVelX;
  ballY += ballVelY;

  if (ballX + 5 > width || ballX - 5 < 0) {
    ballVelX *= -1;
  }
  if (ballY - 5 < 0) {
    ballVelY *= -1;
  }
  if (ballY + 5 > height) {
    gameOver = true;
  }
}

function drawBricks() {
  for (let i = 0; i < bricks.length; i++) {
    if (!bricks[i].broken) {
      fill(0, 0, 255);
      rect(bricks[i].x, bricks[i].y, brickWidth, brickHeight);
    }
  }
}

function checkCollisions() {
  //Paddle collision
  if (ballY + 5 > paddleY && ballX > width / 2 - 50 && ballX < width / 2 + 50) {
    ballVelY *= -1;
  }

  //Brick collision
  for (let i = 0; i < bricks.length; i++) {
    if (!bricks[i].broken && ballX > bricks[i].x && ballX < bricks[i].x + brickWidth && ballY > bricks[i].y && ballY < bricks[i].y + brickHeight) {
      bricks[i].broken = true;
      ballVelY *= -1;
      score++;
    }
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && !gameOver) {
      paddleY -= 20;
      paddleY = constrain(paddleY,0, height - 50);
  } else if (keyCode === DOWN_ARROW && !gameOver) {
    paddleY += 20;
    paddleY = constrain(paddleY,0, height - 50);
  }
  if (keyCode === 32 && gameOver) {
    resetGame();
  }
}

function displayScore() {
  fill(0);
  textSize(20);
  text("Score: " + score, 10, 30);
}

function displayGameOver() {
  fill(0);
  textSize(30);
  text("Game Over! Press Space to Restart", width / 4, height / 2);
}

function resetGame() {
  gameOver = false;
  score = 0;
  ballX = width / 2;
  ballY = height / 2;
  ballVelX = 5;
  ballVelY = 5;
  for (let i = 0; i < bricks.length; i++) {
    bricks[i].broken = false;
  }
}