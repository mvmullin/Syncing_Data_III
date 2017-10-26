let id; // player's unique id
let color; // player's unique color
let socket; // player's socket
let players = {}; // object to hold player properties
let ingrediants = {}; // object to hold falling ingrediants
let ingrediantNum = 0;
let moveLeft = false; // left or a held
let moveRight = false; // right or d held

let canvas;
let ctx;

// bread properties
let breadHeight = 10;
let breadWidth = 30;

//redraw canvas
const draw = () => {
  movePlayer(); // get player movement
  
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear screen
  
  drawPlayers();
  requestAnimationFrame(draw); // continue to draw updates
};

// linear interpolation to jump percentages to new position
let lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};

// object to keep track of keys that are down
let keysDown = {};
// function to update player movement based on keys down.
const keyDownHandler = (e) => {
  e = e || event;
  
  // If key isn't held check press commands
  if(!keysDown[e.keyCode]){
    switch(e.keyCode) {
      case 32: // space
        jump();
        break;
      default:
        break;
    }
  }
  
  keysDown[e.keyCode] = e.type == 'keydown'; // check if key is down
  
  moveLeft = keysDown[37] || keysDown[65]; // left or a held
  moveRight = keysDown[39] || keysDown[68]; // right or d held
  
};

// initialize scripts
const init = () => { 

  socket = io.connect();
  canvas = document.querySelector('#myCanvas');
  ctx = canvas.getContext('2d');

  socket.on('connect', () => {
    socket.emit('join', { width: canvas.width, height: canvas.height})
  });

  socket.on('joined', setPlayer); // set player on server 'joined' event
  socket.on('updateMovement', updatePlayer); // update on server 'updateClient' event
  socket.on('applyGravity', applyGravity);
  socket.on('left', removePlayer); // remove player on server 'removePlayer event
  
  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyDownHandler);
  
};

window.onload = init;