const xxh = require('xxhashjs');

let io;

// key: room, value: count in room
const roomCounts = {};

// key: socket.name, value: room of socket
const rooms = {};

// key: socket.name, value: player object of socket
const players = {};

const gravityMax = 9.8;

const jumpSpeed = 10;

// function to handle new sockets and create new players
const createPlayer = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    socket.name = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xBADD00D5).toString(16);
    if (Object.keys(roomCounts).length === 0) {
      const room = 'room0';
      socket.join(room);
      rooms[socket.name] = room;
      roomCounts[room] = 1;
    } else {
      const roomKeys = Object.keys(roomCounts); // get each room
      let foundRoom = false; // remains false if all rooms are full
      for (let i = 0; i < roomKeys.length; i++) {
        if (roomCounts[roomKeys[i]] < 5) {
          const room = `room${i}`;
          socket.join(room);
          rooms[socket.name] = room;
          roomCounts[room]++;
          foundRoom = true;
          break;
        }
      }
      if (!foundRoom) {
        const room = `room${roomKeys.length}`;
        socket.join(room);
        rooms[socket.name] = room;
        roomCounts[room] = 1;
      }
    }

    // create a new player object and add it to list keyed with socket name
    players[socket.name] = {
      id: socket.name, // unique id
      lastUpdate: new Date().getTime(), // last time player was updated
      x: data.width / 2, // default x coord of player
      y: 0, // default y coord of player
      ySpeed: 0,
      // code from http://www.daverabideau.com/blog/ to generate random color
      color: `#${(`000000${Math.random().toString(16).slice(2, 8).toUpperCase()}`).slice(-6)}`,
      prevX: 0, // default last known x coord
      prevY: 0, // default last known y coord
      destX: data.width / 2, // default desired x coord
      destY: 0, // default desired y coord
      alpha: 0, // default % from prev to dest
      height: 25, // default player height
      width: 25, // default player width
    };

    socket.emit('joined', players[socket.name]);
  });
};

// function to process client movement
const onMove = (sock) => {
  const socket = sock;

  socket.on('move', (data) => {
    players[socket.name] = data;

    players[socket.name].lastUpdate = new Date().getTime();
    socket.broadcast.to(rooms[socket.name]).emit('updateMovement', players[socket.name]);
  });
};

// function to process client jump
const onJump = (sock) => {
  const socket = sock;

  socket.on('jump', () => {
    players[socket.name].ySpeed -= jumpSpeed;
    console.log('jump');
    players[socket.name].lastUpdate = new Date().getTime();
    socket.broadcast.to(rooms[socket.name]).emit('updateMovement', players[socket.name]);
  });
};

const addGravity = () => {
  const playerKeys = Object.keys(players); // get all player id's

  // Iterate players
  for (let i = 0; i < playerKeys.length; i++) {
    const player = players[playerKeys[i]];

    player.prevY = player.y;

    if (!(player.ySpeed > gravityMax)) {
      player.ySpeed += 0.1;
    }
    player.destY += player.ySpeed;

    players[playerKeys[i]] = player;
    players[playerKeys[i]].lastUpdate = new Date().getTime();
  }

  io.sockets.emit('applyGravity', players);
};


// delete players that disconnect
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    io.sockets.in(rooms[socket.name]).emit('left', players[socket.name].id); // notify clients
    socket.leave(rooms[socket.name]); // remove socket from room
    roomCounts[rooms[socket.name]]--;
    if (roomCounts[rooms[socket.name]] <= 0) delete roomCounts[rooms[socket.name]];
    delete rooms[socket.name];
  });
};

const configure = (ioServer) => {
  io = ioServer;

  setInterval(addGravity, 20);

  io.sockets.on('connection', (socket) => {
    createPlayer(socket);
    onMove(socket);
    onJump(socket);
    onDisconnect(socket);
  });
};

module.exports.configure = configure;
