// User Prompt: hello world , perfect perfection in diamond flying across the sky and creating rainbows on click -> immersive 3D first-person view gameplay

let myFont;

let camX = 0, camY = -100, camZ = 200;
let pan = 0;
let tilt = 0;
let moveSpeed = 5;
let sensitivity = 0.002;

let rainbows = [];
const rainbowColors = [];
const rainbowLifetime = 180; // Frames

let helloText = "Hello World";
let perfectionText = "Perfect Perfection";

function preload() {
  myFont = loadFont('Arial');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(myFont);
  textSize(32);
  textAlign(CENTER, CENTER);

  rainbowColors.push(color(255, 0, 0));
  rainbowColors.push(color(255, 165, 0));
  rainbowColors.push(color(255, 255, 0));
  rainbowColors.push(color(0, 255, 0));
  rainbowColors.push(color(0, 0, 255));
  rainbowColors.push(color(75, 0, 130));
  rainbowColors.push(color(238, 130, 238));

}

function draw() {
  background(135, 206, 250);

  handleMouseLook();
  handleMovement();

  camera(camX, camY, camZ, camX + cos(pan), camY + sin(tilt), camZ + sin(pan), 0, 1, 0);

  push();
  translate(0, 100, 0);
  rotateX(PI / 2);
  fill(100, 200, 100, 150);
  noStroke();
  plane(5000, 5000);
  pop();

  push();
  translate(0, -200, -500);
  rotateY(millis() * 0.0001);
  fill(255);
  textSize(64);
  text(helloText, 0, 0);
  pop();

  push();
  translate(300, -300, -800);
  rotateY(-millis() * 0.0002);
  fill(255, 255, 0);
  textSize(48);
  text(perfectionText, 0, 0);
  pop();

  for (let i = rainbows.length - 1; i >= 0; i--) {
    rainbows[i].update();
    rainbows[i].display();
    if (rainbows[i].isDead()) {
      rainbows.splice(i, 1);
    }
  }

   push();
   translate(sin(millis() * 0.0005) * 500, -300 + cos(millis()*0.0003)*50, -1000 + cos(millis() * 0.0005) * 500);
   rotateY(millis() * 0.001);
   rotateX(millis() * 0.0007);
   fill(200, 230, 255, 200);
   stroke(255);
   sphere(30);
   pop();
}

function handleMouseLook() {
    // Check if pointer is locked before processing mouse movement
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas) {
        pan -= movedX * sensitivity;
        tilt -= movedY * sensitivity;
        tilt = constrain(tilt, -PI / 2 + 0.01, PI / 2 - 0.01);
    }
}


function handleMovement() {
  let forward = createVector(cos(pan), 0, sin(pan)); // Movement projected onto XZ plane
  forward.normalize();
  let right = createVector(cos(pan + PI / 2), 0, sin(pan + PI / 2));
  right.normalize();

  if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W or Up
    camX += forward.x * moveSpeed;
    camZ += forward.z * moveSpeed;
  }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or Down
    camX -= forward.x * moveSpeed;
    camZ -= forward.z * moveSpeed;
  }
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or Left
    camX -= right.x * moveSpeed;
    camZ -= right.z * moveSpeed;
  }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or Right
    camX += right.x * moveSpeed;
    camZ += right.z * moveSpeed;
  }
   if (keyIsDown(32)) { // Spacebar
     camY -= moveSpeed; // Move camera up
   }
   if (keyIsDown(16)) { // Shift
     camY += moveSpeed; // Move camera down
   }
}

function mousePressed() {
  if (!document.pointerLockElement && !document.mozPointerLockElement && !document.webkitPointerLockElement) {
     requestPointerLock();
  }

  let direction = createVector(cos(pan), sin(tilt), sin(pan));
  direction.normalize();
  let startPos = createVector(camX, camY, camZ).add(direction.copy().mult(20));
  rainbows.push(new Rainbow(startPos, direction));
}

class Rainbow {
  constructor(position, direction) {
    this.particles = [];
    this.basePos = position.copy();
    this.direction = direction.copy();
    this.speed = 3;
    this.particleInterval = 2;
    this.frameCount = 0;
    this.maxParticles = 50;
    this.isComplete = false;
  }

  update() {
      this.frameCount++;

       if (!this.isComplete && this.frameCount % this.particleInterval === 0) {
           if (this.particles.length < this.maxParticles) {
               let particlePos = this.basePos.copy().add(this.direction.copy().mult(this.particles.length * this.speed * this.particleInterval / 3)); // Spread particles
               let colorIndex = this.particles.length % rainbowColors.length;
               this.particles.push(new RainbowParticle(particlePos, rainbowColors[colorIndex]));
           } else {
               this.isComplete = true;
           }
       }

       for (let i = this.particles.length - 1; i >= 0; i--) {
           this.particles[i].update();
           if (this.particles[i].isDead()) {
               this.particles.splice(i, 1);
           }
       }
  }

  display() {
    noStroke();
    for (let p of this.particles) {
      p.display();
    }
  }

  isDead() {
     return this.isComplete && this.particles.length === 0;
  }
}

class RainbowParticle {
  constructor(position, pColor) {
    this.pos = position.copy();
    this.color = pColor;
    this.lifespan = rainbowLifetime;
    this.size = 10;
  }

  update() {
    this.lifespan--;
     // this.pos.y -= 0.1; // Optional floating
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    let alpha = map(this.lifespan, 0, rainbowLifetime, 0, 255);
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    sphere(this.size * (this.lifespan / rainbowLifetime));
    pop();
  }

  isDead() {
    return this.lifespan <= 0;
  }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}