const drawPlayers = () => {
  let keys = Object.keys(players); // get all player id's
  
  // Iterate players
  for(let i = 0; i < keys.length; i++)
  {
    const player = players[keys[i]];
    
    // keep animation running smoothly
    if(player.alpha < 1) player.alpha += 0.05;
    
    // set draw color to unique player color
    ctx.fillStyle = player.color;
    
    player.x = (player.destX == 0 || player.destX == canvas.width) ? player.destX : lerp(player.prevX, player.destX, player.alpha); // smooth transition with lerp
    player.y = lerp(player.prevY, player.destY, player.alpha);

    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
};

// update a player from server
const updatePlayer = (data) => {
  // if the player is new, add them to players and return
  if(!players[data.id])
  {
    players[data.id] = data;
    return;
  }

  // grab player object based on id
  const player = players[data.id];

  // return if player's last update is newer than this server data
  if(player.lastUpdate >= data.lastUpdate) {
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

const applyGravity = (data) => {
  let serverKeys = Object.keys(data);
  
  for(let i = 0; i < serverKeys.length; i++) {
    if(players[data[serverKeys[i]].id]) updatePlayer(data[serverKeys[i]]);
  }
};

// remove player based on id
const removePlayer = (id) => {
  if(players[id]) {
    delete players[id];
  }
};

// set this player from server
const setPlayer = (data) => {
  id = data.id; // set id from server data
  color = data.color; // set color from server data
  players[id] = data; // set player with new id
  requestAnimationFrame(draw); // draw with new info
};

// function to update player position
const movePlayer = () => {
  const player = players[id]; // get this player with their id
  player.prevX = player.x;
  
  const speed = 5; // how far to move
  
  if(moveLeft) {
    if(player.destX < 0) player.destX = canvas.width;
    else player.destX -= speed;
  }
  if(moveRight) {
    if(player.destX > canvas.width) player.destX = 0;
    else player.destX += speed;
  }
  
  if(player.destY > (canvas.height - player.height))
    player.destY = canvas.height - player.height;
  
  // reset alpha when moving to keep playing animation
  player.alpha = 0.05;
  
  // send movement to server
  socket.emit('move', player);
}

// add to player's speed on jump
const jump = () => {
  if(players[id].destY >= (canvas.height - players[id].height)) 
    socket.emit('jump');
};