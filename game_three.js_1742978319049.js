// Framework: three.js
// User Prompt: a simple 3d car driving simulator from the first POV

import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    AmbientLight,
    DirectionalLight,
    Vector3,
    Quaternion,
    Clock,
    Color,
    Fog
} from 'three';

let scene, camera, renderer, clock;
let ground, obstacles = [];

const carState = {
    position: new Vector3(0, 0.5, 0), // Start slightly above ground
    rotation: new Quaternion(),
    speed: 0,
    maxSpeed: 5,
    acceleration: 5,
    braking: 10,
    turnSpeed: 1.5, // radians per second
    friction: 2,
};

const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

function init() {
    // Scene
    scene = new Scene();
    scene.background = new Color(0x87CEEB); // Sky blue
    scene.fog = new Fog(0x87CEEB, 50, 150);

    // Camera (First Person View)
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position the camera slightly behind the car's logical position to simulate driver view
    updateCameraPosition();

    // Renderer
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true; // Optional: for shadows
    scene.add(directionalLight);

    // Ground
    const groundMaterial = new MeshStandardMaterial({ color: 0x556B2F }); // Dark Olive Green
    const groundGeometry = new PlaneGeometry(500, 500);
    ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be flat
    ground.receiveShadow = true; // Optional
    scene.add(ground);

    // Obstacles (simple cubes)
    const boxGeometry = new BoxGeometry(2, 2, 2);
    for (let i = 0; i < 20; i++) {
        const boxMaterial = new MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const box = new Mesh(boxGeometry, boxMaterial);
        box.position.set(
            (Math.random() - 0.5) * 200,
            1,
            (Math.random() - 0.5) * 200
        );
        box.castShadow = true; // Optional
        scene.add(box);
        obstacles.push(box);
    }


    // Clock
    clock = new Clock();

    // Event Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Start Animation Loop
    animate();
}

function handleKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            controls.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            controls.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            controls.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            controls.right = true;
            break;
    }
}

function handleKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            controls.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            controls.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            controls.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            controls.right = false;
            break;
    }
}

function updateCar(deltaTime) {
    let moving = false;

    // Acceleration / Braking
    if (controls.forward) {
        carState.speed = Math.min(carState.maxSpeed, carState.speed + carState.acceleration * deltaTime);
        moving = true;
    }
    if (controls.backward) {
        carState.speed = Math.max(-carState.maxSpeed / 2, carState.speed - carState.braking * deltaTime); // Slower reverse
        moving = true;
    }

    // Friction / Deceleration
    if (!moving) {
        if (carState.speed > 0) {
            carState.speed = Math.max(0, carState.speed - carState.friction * deltaTime);
        } else if (carState.speed < 0) {
            carState.speed = Math.min(0, carState.speed + carState.friction * deltaTime);
        }
    }

    // Steering (only when moving)
    if (Math.abs(carState.speed) > 0.1) {
        let turnFactor = Math.sign(carState.speed); // Turn direction depends on forward/backward
        if (controls.left) {
            const deltaRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), carState.turnSpeed * deltaTime * turnFactor);
            carState.rotation.multiplyQuaternions(deltaRotation, carState.rotation);
        }
        if (controls.right) {
            const deltaRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -carState.turnSpeed * deltaTime * turnFactor);
            carState.rotation.multiplyQuaternions(deltaRotation, carState.rotation);
        }
    }


    // Update Position based on speed and direction
    const forward = new Vector3(0, 0, -1);
    forward.applyQuaternion(carState.rotation);
    forward.normalize();

    const velocity = forward.multiplyScalar(carState.speed * deltaTime);
    carState.position.add(velocity);

    // Keep car on the ground (simple approach)
    carState.position.y = 0.5;

    // Update Camera to follow car's state
    updateCameraPosition();
}


function updateCameraPosition() {
    // Camera position is slightly behind and above the car's logical center
    const cameraOffset = new Vector3(0, 1.0, 0.5); // x=0, y=up, z=behind
    cameraOffset.applyQuaternion(carState.rotation);
    camera.position.copy(carState.position).add(cameraOffset);

    // Camera looks slightly ahead of the car's position
    const lookAtOffset = new Vector3(0, 0.5, -5); // Look ahead and slightly down
    lookAtOffset.applyQuaternion(carState.rotation);
    const lookAtPoint = carState.position.clone().add(lookAtOffset);

    camera.lookAt(lookAtPoint);
    camera.up.set(0, 1, 0); // Ensure the camera's up is correct
    camera.quaternion.copy(carState.rotation); // Align camera rotation with car rotation for first person
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    updateCar(deltaTime);

    renderer.render(scene, camera);
}

init();