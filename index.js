var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var connectionsLimit = 2;
var roomClients = {
  "player1": {
    "id":"",
    "role":""
  },
  "player2": {
    "id":"",
    "role":""
  }
};
var board = {
  "wardenindex":[,],
  "prisonerindex":[,],
  "tunnelindex":[,],
  "obstacleindex":[]
}
// var path = require('path');
function randomRoles() {
  if(Math.random() < 0.5) {
    roomClients.player1.role = "prisoner";
    roomClients.player2.role = "warden";
  } else {
    roomClients.player2.role = "prisoner";
    roomClients.player1.role = "warden";
  }
};

function randomBoard() {
  //tunnel
  var tunnelnum = Math.round(Math.random()*25);
  board.tunnelindex[0] = tunnelnum/5;
  board.tunnelindex[1] = tunnelnum%5;
  
  //warden
  var wardennum = Math.round(Math.random()*25);
  board.wardenindex[0] = wardennum/5;
  board.wardenindex[1] = wardennum%5;
  while(board.wardenindex[0] >= board.tunnelindex[0]-1 && board.wardenindex[0] <= board.tunnelindex[0]+1 
    && board.wardenindex[1] >= board.tunnelindex[1]-1 && board.wardenindex[1] <= board[1]+1) {
    board.wardenindex[0] = wardennum/5;
    board.wardenindex[1] = wardennum%5;
  }

  //prisoner
  var prisonernum = Math.round(Math.random()*25);
  board.prisonerindex[0] = prisonernum/5;
  board.prisonerindex[1] = prisonernum%5;
  while((board.prisonerindex[0] >= board.tunnelindex[0]-1 && board.prisonerindex[0] <= board.tunnelindex[0]+1 
    && board.prisonerindex[1] >= board.tunnelindex[1]-1 && board.prisonerindex[1] <= board[1]+1) || 
    (board.prisonerindex[0] >= board.wardenindex[0]-1 && board.prisonerindex[0] <= board.wardenindex[0]+1 && board.prisonerindex[1] >= board.wardenindex[1]-1 && board.prisonerindex[1] <= board.wardenindex[1]+1)) {
    board.prisonerindex[0] = prisonernum/5;
    board.prisonerindex[1] = prisonernum%5;
  }

  //obstacle1
  var obs1 = [,];
  var obs1num = Math.round(Math.random()*25);
  obs1[0] = Math.round(obs1num/5);
  obs1[1] = obs1num%5;
  while(obs1num == tunnelnum || obs1num == wardennum || obs1num == prisonernum) {
    obs1[0] = Math.round(obs1num/5);
    obs1[1] = obs1num%5;
  }
  board.obstacleindex.push(obs1);

  //obstacle2
  var obs2 = [,];
  var obs2num = Math.round(Math.random()*25);
  obs2[0] = Math.round(obs2num/5);
  obs2[1] = obs2num%5;
  while(obs2num == tunnelnum || obs2num == wardennum || obs2num == prisonernum || obs2num == obs1num) {
    obs2[0] = Math.round(obs2num/5);
    obs2[1] = obs2num%5;
  }
  board.obstacleindex.push(obs2);

  //obstacle3
  var obs3 = [,];
  var obs3num = Math.round(Math.random()*25);
  obs3[0] = Math.round(obs3num/5);
  obs3[1] = obs3num%5;
  while(obs3num == tunnelnum || obs3num == wardennum || obs3num == prisonernum || obs3num == obs1num || obs3num == obs2num){
    obs3[0] = Math.round(obs3num/5);
    obs3[1] = obs3num%5;
  }
  board.obstacleindex.push(obs3);

  //obstacle4
  var obs4 = [,];
  var obs4num = Math.round(Math.random()*25);
  obs4[0] = Math.round(obs4num/5);
  obs4[1] = obs4num%5;
  while(obs4num == tunnelnum || obs4num == wardennum || obs4num == prisonernum || obs4num == obs1num || obs4num == obs2num || obs4num == obs3num){
    obs4[0] = Math.round(obs4num/5);
    obs4[1] = obs4num%5;
  }
  board.obstacleindex.push(obs4);

  //obstacle5
  var obs5 = [,];
  var obs5num = Math.round(Math.random()*25);
  obs5[0] = Math.round(obs5num/5);
  obs5[1] = obs5num%5;
  while(obs5num == tunnelnum || obs5num == wardennum || obs5num == prisonernum || obs5num == obs1num || obs5num == obs2num || obs5num == obs3num || obs5num == obs4num){
    obs5[0] = Math.round(obs5num/5);
    obs5[1] = obs5num%5;
  }
  board.obstacleindex.push(obs5);
}



app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  if (io.engine.clientsCount > connectionsLimit) {
    socket.emit('err', { message: 'reach the limit of connections' })
    socket.disconnect()
    console.log(socket.id+ ' has tried to connect but the socket has reach the limit of connections. Disconnected...')
    return
  }
  console.log('one user connected ' + socket.id);
  socket.on("req", (message) => {
    if(message === "join") {
      socket.join('room', () => {
        let rooms = Object.keys(socket.rooms);
        console.log(rooms);
        io.of('/').in('room').clients((error, clients) => {
          if (error) throw error;
          if(clients.length === 1) {
            if(roomClients.player1.id === "") {
              roomClients.player1.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("waiting", "waiting for another opponent...");
            } else {
              roomClients.player2.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("waiting", "waiting for another opponent...");
            }
            
          } else if (clients.length === 2) {
            if (roomClients.player2.id === "") {
              roomClients.player2.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("connected", "connection success");
              randomRoles();
              io.to(clients[0]).emit("char",roomClients.player1.role);
              io.to(clients[1]).emit("char",roomClients.player2.role);
              console.log(roomClients);
              randomBoard();
              io.emit("board", board);
              // change to send array of randomed field
              io.to(roomClients.player1).emit("start", "start match");
            } else {
              roomClients.player1.id = socket.id;
              console.log("Client(s) in the room: "+clients);
              io.emit("connected", "connection success");
              randomRoles();
              io.to(clients[0]).emit("char",roomClients.player2.role);
              io.to(clients[1]).emit("char",roomClients.player1.role);
              console.log(roomClients);
              randomBoard();
              io.emit("board", board);
              // change to send array of randomed field
              io.to(roomClients.player1).emit("start", "start match");
            }
            
          }  
        });
      });
    } else if (message === "leave") {
      socket.leave('room');
      if(roomClients.player1.id === socket.id) {
        roomClients.player1.id == "";
        roomClients.player1.role == "";
        roomClients.player1.index == ""
      } else if(roomClients.player2.id === socket.id) {
        roomClients.player2.id == "";
        roomClients.player2.role == "";
        roomClients.player2.index == ""
      }
      console.log(roomClients);
      io.of('/').in('room').clients((error, clients) => {
        io.to(clients[0]).emit("waiting", "waiting for another opponent...")
      });
    }
  })
  

  // socket.on("req", message => {
  //   console.log(socket.id + " " + message);
  //   if (message === "join") {
  //     io.emit("status", "waiting for players...");
  //     // must send random index not
  //     io.emit("board", {
  //       warderindex = [2, 3],
  //       prisonerindex =[4, 1],
  //       tunnelindex = [4, 0],
  //       obstacleindex = [[0, 0], [2, 2], [4, 2], [1, 3], [3, 4]]
  //     });
  //     io.emit("turn" , "Your turn!")
  //   }
  // });

  // socket.on("move", message => {
  //   switch (message) {
  //     case "up":
  //       if(roomClients.player1.id === socket.id) {
  //         if() {
  //           roomClients.player1.index[1]++;
  //           io.emit("board", board);
  //         }
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[1]++;
  //         io.emit("board", board);
  //       }
  //       break;
      
  //     case "down":
  //       if(roomClients.player1.id === socket.id) {
  //         roomClients.player1.index[1]--;
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[1]--;
  //       }
  //       break;
      
  //     case "left":
  //       if(roomClients.player1.id === socket.id) {
  //         roomClients.player1.index[0]++;
  //       } else if(roomClients.player2.id === socket.id) {
  //         roomClients.player2.index[0]++;
  //       }
  //       break;

  //     case "right":

  //       break;
      
  //     case "skip":

  //       break;
        
  //     default:
  //       break;
  //   }
  // });
        

  // console.log("one user connected " + socket.id);
  // console.log("This is from Tai");

  // socket.on("req", message => {
  //   console.log(socket.id + " " + message);
  //   if (message === "join") {
  //     io.emit("status", "waiting for players...");
  //     // must send random index not
  //     io.emit("board", {
  //       warderindex: [2, 3],
  //       prisonerindex: [4, 1],
  //       tunnelindex: [4, 0],
  //       obstacleindex: [[0, 0], [2, 2], [4, 2], [1, 3], [3, 4]]
  //     });
  //   }
  

  socket.on("disconnect", function() {
    console.log("one user disconnected " + socket.id);
    console.log(roomClients);
    
  });
});

http.listen(3000, function() {
  console.log("server listening on port 3000");
});
