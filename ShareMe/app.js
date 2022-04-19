const express = require('express');
const path = require("path");
const app = express();
const http = require('http');
const https = require('https');
const fs = require('fs');
const { Server } = require("socket.io");


var https_options = {
  key: fs.readFileSync("ssl/privkey.pem"),
  cert: fs.readFileSync("ssl/fullchain.pem"),
  ca: [
    //fs.readFileSync('ssl/chain.pem'),
    //fs.readFileSync('ssl/fullchain.pem')
  ]
}
const server = https.createServer(https_options, app);
const io = new Server(server);
// app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'frontend')));

// app.get('/', (req, res) => {
//   //res.send('<h1>Hello world</h1>');
//   res.sendFile(__dirname + '/frontend/*');
// });

const sockets = new Map();

// Get a new ID for a new connection
function generateID() {
  console.log("getting ID")
  // Duplicate check
  num = getNumber()
  if (!sockets.has(num)) {
    return num
  }
  else {
    console.log("Hit duplicate, trying again")
    return generateID()
  }
}
function getNumber() {
  min = 1000
  max = 9999
  console.log("generating num")
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function verifyId(ID, socket) {
  if (sockets.has(ID)) {
    return true
  }
  else {
    socket.emit('throwError', 'The ID you typed or scanned is invalid.')
  }
}

io.on('connection', (socket) => {
  console.log('a user connected');
  var ID = generateID()

  socket.on('requestID', () => {
    socket.emit('ID', ID)
    sockets.set(ID, socket)
    console.log("added", ID, "to the map")
  });

  socket.on('giveDestination', (ID, URL) => {
    ID = parseInt(ID, 10)
    console.log(`Got a URL of ${URL} for ID ${ID}`)
    if (verifyId(ID, socket)) { // Make sure the phone sent a valid ID

      // Adds an HTTP:// to the URL if the user does not put it in.
      //console.log(URL.charAt(0).toLowerCase())
      if (URL.charAt(0).toLowerCase() === "h" && URL.charAt(1).toLowerCase() === "t" && URL.charAt(2).toLowerCase() === "t" && URL.charAt(3).toLowerCase() === "p") {
        console.log("already has an http")
      }
      else {
        URL = "http://" + URL
      }

      socket = sockets.get(ID)
      socket.emit('URL', URL)
    }
    //console.log(sockets.get(ID), typeof(ID))
    // Next time: if undefined, we need to throw an error the the phone saying the client ID is wrong. Otherwise continue with the URL pass.
    //sockets.get(ID).emit('URL', URL)
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    sockets.delete(ID)
  });
});

//express

app.use(express.static(path.join(__dirname+"/public")));

io.on("connection", function(socket){
	socket.on("sender-join",function(data){
		socket.join(data.uid);
	});
	socket.on("receiver-join",function(data){
		socket.join(data.uid);
		socket.in(data.sender_uid).emit("init", data.uid);
	});
	socket.on("file-meta",function(data){
		socket.in(data.uid).emit("fs-meta", data.metadata);
	});
	socket.on("fs-start",function(data){
		socket.in(data.uid).emit("fs-share", {});
	});
	socket.on("file-raw",function(data){
		socket.in(data.uid).emit("fs-share", data.buffer);
	})
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});