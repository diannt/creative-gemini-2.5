let dinoX, dinoY, dinoWidth, dinoHeight;
let groundY;
let obstacles = [];
let score = 0;
let gameOver = false;

function setup() {
  createCanvas(400, 200);
  pixelDensity(1);
  dinoX = 50;
  dinoY = groundY = height - 20;
  dinoWidth = 20;
  dinoHeight = 20;
}

function draw() {
  background(100, 150, 200);
  if (!gameOver) {
    score++;
    moveDino();
    drawDino();
    generateObstacles();
    moveObstacles();
    drawObstacles();
    checkCollision();
    displayScore();
  } else {
    gameOverScreen();
  }
}

function moveDino() {
  if (keyIsDown(UP_ARROW) && dinoY > groundY - dinoHeight) {
    dinoY -= 5;
  } else if (dinoY < groundY) {
    dinoY += 5;
  }
}

function drawDino() {
  fill(0, 100, 0);
  rect(dinoX, dinoY, dinoWidth, dinoHeight);
}

function generateObstacles() {
  if (frameCount % 60 === 0) {
    let obstacleX = width;
    let obstacleY = groundY - 10;
    let obstacleWidth = 10;
    let obstacleHeight = 10;
    obstacles.push({ x: obstacleX, y: obstacleY, w: obstacleWidth, h: obstacleHeight });
  }
}

function moveObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].x -= 5;
  }
}

function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    fill(150, 0, 0);
    rect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);
  }
}

function checkCollision() {
  for (let i = 0; i < obstacles.length; i++) {
    if (dinoX < obstacles[i].x + obstacles[i].w &&
        dinoX + dinoWidth > obstacles[i].x &&
        dinoY < obstacles[i].y + obstacles[i].h &&
        dinoY + dinoHeight > obstacles[i].y) {
      gameOver = true;
    }
  }
}


function displayScore() {
  fill(255);
  textSize(15);
  text("Score: " + score, 10, 20);
}

function gameOverScreen() {
  fill(255,0,0);
  textSize(30);
  textAlign(CENTER, CENTER);
  text("Game Over!", width/2, height/2);
  text("Score: "+score, width/2, height/2 + 30);
}
```