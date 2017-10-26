'use strict';

var id = void 0; // player's unique id
var color = void 0; // player's unique color
var socket = void 0; // player's socket
var players = {}; // object to hold player properties
var ingrediants = {}; // object to hold falling ingrediants
var ingrediantNum = 0;
var moveLeft = false; // left or a held
var moveRight = false; // right or d held

var canvas = void 0;
var ctx = void 0;

// bread properties
var breadHeight = 10;
var breadWidth = 30;

//redraw canvas
var draw = function draw() {
  movePlayer(); // get player movement

  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear screen

  drawPlayers();
  requestAnimationFrame(draw); // continue to draw updates
};

// linear interpolation to jump percentages to new position
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

// object to keep track of keys that are down
var keysDown = {};
// function to update player movement based on keys down.
var keyDownHandler = function keyDownHandler(e) {
  e = e || event;

  // If key isn't held check press commands
  if (!keysDown[e.keyCode]) {
    switch (e.keyCode) {
      case 32:
        // space
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
var init = function init() {

  socket = io.connect();
  canvas = document.querySelector('#myCanvas');
  ctx = canvas.getContext('2d');

  socket.on('connect', function () {
    socket.emit('join', { width: canvas.width, height: canvas.height });
  });

  socket.on('joined', setPlayer); // set player on server 'joined' event
  socket.on('updateMovement', updatePlayer); // update on server 'updateClient' event
  socket.on('applyGravity', applyGravity);
  socket.on('left', removePlayer); // remove player on server 'removePlayer event

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyDownHandler);
};

window.onload = init;
'use strict';

var drawPlayers = function drawPlayers() {
  var keys = Object.keys(players); // get all player id's

  // Iterate players
  for (var i = 0; i < keys.length; i++) {
    var player = players[keys[i]];

    // keep animation running smoothly
    if (player.alpha < 1) player.alpha += 0.05;

    // set draw color to unique player color
    ctx.fillStyle = player.color;

    player.x = player.destX == 0 || player.destX == canvas.width ? player.destX : lerp(player.prevX, player.destX, player.alpha); // smooth transition with lerp
    player.y = lerp(player.prevY, player.destY, player.alpha);

    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
};

// update a player from server
var updatePlayer = function updatePlayer(data) {
  // if the player is new, add them to players and return
  if (!players[data.id]) {
    players[data.id] = data;
    return;
  }

  // grab player object based on id
  var player = players[data.id];

  // return if player's last update is newer than this server data
  if (player.lastUpdate >= data.lastUpdate) {
    return;
  }

  //update positions to lerp between
  player.prevX = data.prevX;
  player.prevY = data.prevY;
  player.destX = data.destX;
  player.destY = data.destY;
  player.ySpeed = data.ySpeed;

  // reset lerp percentage
  player.alpha = 0.05;
};

var applyGravity = function applyGravity(data) {
  var serverKeys = Object.keys(data);

  for (var i = 0; i < serverKeys.length; i++) {
    if (players[data[serverKeys[i]].id]) updatePlayer(data[serverKeys[i]]);
  }
};

// remove player based on id
var removePlayer = function removePlayer(id) {
  if (players[id]) {
    delete players[id];
  }
};

// set this player from server
var setPlayer = function setPlayer(data) {
  id = data.id; // set id from server data
  color = data.color; // set color from server data
  players[id] = data; // set player with new id
  requestAnimationFrame(draw); // draw with new info
};

// function to update player position
var movePlayer = function movePlayer() {
  var player = players[id]; // get this player with their id
  player.prevX = player.x;

  var speed = 5; // how far to move

  if (moveLeft) {
    if (player.destX < 0) player.destX = canvas.width;else player.destX -= speed;
  }
  if (moveRight) {
    if (player.destX > canvas.width) player.destX = 0;else player.destX += speed;
  }

  if (player.destY > canvas.height - player.height) player.destY = canvas.height - player.height;

  // reset alpha when moving to keep playing animation
  player.alpha = 0.05;

  // send movement to server
  socket.emit('move', player);
};

// add to player's speed on jump
var jump = function jump() {
  if (players[id].destY >= canvas.height - players[id].height) socket.emit('jump');
};
