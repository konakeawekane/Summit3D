// Summit3D v1.0
// This is a simple 2.5D heightmap rendering system designed to be an experimental environment for some simple 3D games


// Canvas context ---
const myCanvas = document.getElementById("myCanvas");
const ctx = myCanvas.getContext("2d");

//Set up classes and fuctions---

//Vector3 class
class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Add methods for vector operations
    add(otherVector) {
        this.x += otherVector.x;
        this.y += otherVector.y;
        this.z += otherVector.z;
        return this; // For method chaining
    }

    subtract(otherVector) {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        this.z -= otherVector.z;
        return this;
    }

    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    // Calculate the length (magnitude) of the vector
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // Normalize the vector (make its length 1)
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    // Calculate the dot product with another vector
    dot(otherVector) {
        return this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z;
    }

    // Calculate the cross product with another vector
    cross(otherVector) {
        const x = this.y * otherVector.z - this.z * otherVector.y;
        const y = this.z * otherVector.x - this.x * otherVector.z;
        const z = this.x * otherVector.y - this.y * otherVector.x;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    // Create a new Vector3 instance with the same values
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    // Set the values of the vector
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    // Convert to a string representation
    toString() {
        return `Vector3(${this.x}, ${this.y}, ${this.z})`;
    }
}

function coords(x,y){
    return (x * heightmapResolution + y) * 4;
}

//heightmap reading function
function getHeight(x,y){
    var px = (x * heightmapScale) % heightmapResolution;
    var py = (y * heightmapScale) % heightmapResolution;
    var lx = Math.floor(px);
    var ly = Math.floor(py);
    var hx = Math.ceil(px);
    var hy = Math.ceil(py);

    var xAlpha = px - lx;
    var yAlpha = py - ly;

    var bottomLeft = heightData[coords(lx,ly)];
    var bottomRight = heightData[coords(hx,ly)];
    var topLeft = heightData[coords(lx,hy)];
    var topRight = heightData[coords(hx,hy)];

    var heightBottom = bottomLeft * (1 - xAlpha) + bottomRight * xAlpha;
    var heightTop = topLeft * (1 - xAlpha) + topRight * xAlpha;
    var height = heightBottom * (1 - yAlpha) + heightTop * yAlpha;

    
    return heightmapAmplitude * height;
}

function getColor(x,y){
    var px = (x * heightmapScale) % heightmapResolution;
    var py = (y * heightmapScale) % heightmapResolution;
    var lx = Math.floor(px);
    var ly = Math.floor(py);
    var hx = Math.ceil(px);
    var hy = Math.ceil(py);

    var xAlpha = px - lx;
    var yAlpha = py - ly;

    var bottomLeft = new Vector3(heightData[coords(lx,ly)], heightData[coords(lx,ly) + 1], heightData[coords(lx,ly) + 2]);
    var bottomRight = new Vector3(heightData[coords(hx,ly)], heightData[coords(hx,ly) + 1], heightData[coords(hx,ly) + 2]);
    var topLeft = new Vector3(heightData[coords(lx,hy)], heightData[coords(lx,hy) + 1], heightData[coords(lx,hy) + 2]);
    var topRight = new Vector3(heightData[coords(hx,hy)], heightData[coords(hx,hy) + 1], heightData[coords(hx,hy) + 2]);

    bottomLeft.multiplyScalar(1.0 - xAlpha);
    bottomRight.multiplyScalar(xAlpha);
    bottomLeft.add(bottomRight);
    var colorBottom = bottomLeft.clone();

    topLeft.multiplyScalar(1.0 - xAlpha);
    topRight.multiplyScalar(xAlpha);
    topLeft.add(topRight);
    var colorTop = topLeft.clone();

    colorBottom.multiplyScalar(1.0 - yAlpha);
    colorTop.multiplyScalar(yAlpha);
    colorBottom.add(colorTop);
    var color = colorBottom.clone();

    return color;
    
}

// Camera variables ---
var cameraPosition = new Vector3(512.2,512.8,4);
var cameraRotation = new Vector3(0,0,0);
var fieldOfView = 90.0;
var iterations = 300;
var resolution = 120;
var clipHeight = [resolution];
var sampleDepth = 10;

// World variables ---
var heightmapResolution = 1024;
var heightmapAmplitude = -2.5;
var heightmapScale = 2;
var heightData = [heightmapResolution * heightmapResolution * 4];

// Player movement variables ---
var playerPosition = new Vector3(128,128,4);
var playerVelocity = new Vector3(0,0,0);
var playerAcceleration = 0.005;
var playerVerticalAcceleration = 0.2;
var playerCameraHeight = 30.0;

// Input variables and events---
var lookSpeed = 4.0;
let lastTime = performance.now();
var deltaTime = 1;
var MouseX = 0;
var MouseY = 0;


// stores pressed keys
const pressedKeys = {    
    w : false,
    a : false,
    s : false,
    d : false,
    e : false,
    q : false
}; 
// Mark key as pressed
window.addEventListener('keydown', (event) => {
    pressedKeys[event.key.toLowerCase()] = true; 
    
});
// Mark key as released
window.addEventListener('keyup', (event) => {
    pressedKeys[event.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === myCanvas) {
        MouseX = 0;
        MouseY = 0;
        MouseX = event.movementX;
        MouseY = event.movementY;
    }
});

myCanvas.addEventListener('click', async () => {
    await myCanvas.requestPointerLock();
});

document.getElementById('restart').addEventListener('click', function() {
  window.location.reload();
});

//Initialization of the heightmap ---
let heightmap = new Image();
//On finished loading the heightmap use a canvas element to scan it into an array
heightmap.onload = function() {
    console.log("Heightmap loaded successfully!");
    let tmp = document.createElement('canvas');
    tmp.width = heightmap.width;
    tmp.height = heightmap.height;
    let heightmapContext = tmp.getContext('2d');
    heightmapContext.drawImage(heightmap, 0, 0);
    //Store image data into height map data array (data is stored as [R,G,B,A,R,G,B,A...])
    let imageData = heightmapContext.getImageData(0, 0, tmp.width, tmp.height);
    heightData = imageData.data; // This is a Uint8ClampedArray of RGBA values
    tmp.remove();
    initialize();
};
heightmap.onerror = function() {
    console.error("Error loading Heightmap.");
};

heightmap.src = "image-maps/mountains.jpeg";

//Initialization of the program loop ---
function initialize(){
    setInterval(update, 16); //set the update loop to target 60 frames per second
}

function update(){
    playerPhysics();
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
    render();
    let now = performance.now();
    deltaTime = now - lastTime;
    lastTime = now;
    // prevent the previous inputs to bleed into the next frame
    MouseX = 0;
    MouseY = 0;
}

function playerPhysics(){
    playerPosition.add(playerVelocity);
    if(-getHeight(playerPosition.x, playerPosition.y) > playerPosition.z){
        playerPosition.z = -getHeight(playerPosition.x, playerPosition.y);
    }

    const forwardX = Math.sin(cameraRotation.x * (Math.PI / 180));
    const forwardY = Math.cos(cameraRotation.x * (Math.PI / 180));
    const rightX = Math.sin((cameraRotation.x + 90) * (Math.PI / 180));
    const rightY = Math.cos((cameraRotation.x + 90) * (Math.PI / 180));

    if (pressedKeys['w']){
        playerVelocity.x = playerVelocity.x + forwardX * playerAcceleration;
        playerVelocity.y = playerVelocity.y + forwardY * playerAcceleration;
    }
    if (pressedKeys['s']){
        playerVelocity.x = playerVelocity.x + forwardX * -playerAcceleration;
        playerVelocity.y = playerVelocity.y + forwardY * -playerAcceleration;
    }
    if (pressedKeys['a']){
        playerVelocity.x = playerVelocity.x + rightX * -playerAcceleration;
        playerVelocity.y = playerVelocity.y + rightY * -playerAcceleration;
    }
    if (pressedKeys['d']){
        playerVelocity.x = playerVelocity.x + rightX * playerAcceleration;
        playerVelocity.y = playerVelocity.y + rightY * playerAcceleration;
    }
    if (pressedKeys['e']){
        playerVelocity.z = playerVelocity.z + playerVerticalAcceleration;
    }
    if (pressedKeys['q']){
        playerVelocity.z = playerVelocity.z - playerVerticalAcceleration;
    }

    cameraRotation.x = cameraRotation.x + MouseX;
    cameraRotation.y = cameraRotation.y - MouseY * 4.0;
    playerVelocity.x = playerVelocity.x * 0.95;
    playerVelocity.y = playerVelocity.y * 0.95;
    playerVelocity.z = playerVelocity.z * 0.98;
    cameraPosition.set(playerPosition.x,playerPosition.y,playerPosition.z);
    cameraPosition.z = cameraPosition.z + playerCameraHeight;
}

function render(){
    
    var horizonOffset = (myCanvas.height / 2) + cameraRotation.y;
    var columnWidth = Math.ceil(myCanvas.width / resolution);
    // reset the clip height to the bottom of the screen
    clipHeight = new Array(resolution).fill(myCanvas.height);
    // iterate throught each layer starting at the front
    for (let i = 1; i<iterations; i++){
        var depth = (sampleDepth / iterations) * (Math.pow(1.03,i) - 0.97);
        var leftPointX = Math.sin((fieldOfView * -0.5 + cameraRotation.x) * (Math.PI / 180)) * depth + cameraPosition.x;
        var leftPointY = Math.cos((fieldOfView * -0.5 + cameraRotation.x) * (Math.PI / 180)) * depth + cameraPosition.y;
        var rightPointX = Math.sin((fieldOfView * 0.5 + cameraRotation.x) * (Math.PI / 180)) * depth + cameraPosition.x;
        var rightPointY = Math.cos((fieldOfView * 0.5 + cameraRotation.x) * (Math.PI / 180)) * depth + cameraPosition.y;
        var StepX = (rightPointX - leftPointX) / resolution;
        var StepY = (rightPointY - leftPointY) / resolution;

        for (let j = -1; j<resolution; j++ ){
            
            var currentWorldX = leftPointX + (StepX * j);
            var currentWorldY = leftPointY + (StepY * j);
            var currentWorldHeight = getHeight(currentWorldX, currentWorldY);
            var color = getColor(currentWorldX, currentWorldY);

            var screenX = (myCanvas.width / resolution) * j;
            var screenY = horizonOffset + ((currentWorldHeight + cameraPosition.z) * 10) / depth;
            if (screenY < clipHeight[j]){
            ctx.fillStyle = "rgb(" + color.x + ',' + color.y + ',' + color.z + ')';
            ctx.fillRect(screenX,screenY,columnWidth,clipHeight[j] - screenY);
            clipHeight[j] = Math.ceil(screenY);
            }
        }
    }

    // Print FPS onto the screen
    //ctx.font = "12px Arial";
    //ctx.fillStyle = "green";
    //ctx.fillText(Math.round(1000.0 / deltaTime) + ' FPS', 430, 350);
}
