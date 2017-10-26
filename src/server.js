// import modules
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');
const sockets = require('./sockets.js');
// set port
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html files into memory
const client = fs.readFileSync(`${__dirname}/../hosted/index.html`);
const bundle = fs.readFileSync(`${__dirname}/../hosted/bundle.js`);

// function invoked by HTTP module on requests from clients
const onRequest = (request, response) => {
  response.writeHead(200);
  if (request.url === '/bundle.js') {
    response.write(bundle);
  } else response.write(client);
  response.end();
};

// create http server with callback, and listen for requests on specified port
const app = http.createServer(onRequest).listen(port);

// Websocket server code, separate protocol from HTTP. 
// Pass HTTP server into socket.io and grab websocket server
const io = socketio(app);

// pass socket.io server to sockets file to handle websockets
sockets.configure(io);

console.log('Websocket server started');
