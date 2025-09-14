const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web-client/build')));

// Game state management
const gameRooms = new Map();
const WORDS = [
  'Cat', 'Dog', 'House', 'Tree', 'Car', 'Sun', 'Moon', 'Star',
  'Fish', 'Bird', 'Flower', 'Mountain', 'Ocean', 'Rainbow', 'Butterfly', 'Elephant',
  'Pizza', 'Cake', 'Book', 'Phone', 'Computer', 'Camera', 'Guitar', 'Piano',
  'Basketball', 'Football', 'Tennis', 'Swimming', 'Running', 'Dancing', 'Singing', 'Painting'
];

class GameRoom {
  constructor(id, hostId) {
    this.id = id;
    this.hostId = hostId;
    this.players = new Map();
    this.currentWord = '';
    this.currentDrawer = null;
    this.gameState = 'waiting'; // waiting, drawing, guessing, finished
    this.drawingData = null;
    this.guesses = [];
    this.timeLeft = 60;
    this.rounds = 0;
    this.maxRounds = 3;
    this.scores = new Map();
  }

  addPlayer(socketId, playerName, playerType) {
    this.players.set(socketId, {
      id: socketId,
      name: playerName,
      type: playerType, // 'mobile' or 'web'
      isDrawing: false,
      score: this.scores.get(socketId) || 0
    });
    this.scores.set(socketId, this.scores.get(socketId) || 0);
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.scores.delete(socketId);
    
    // If the drawer left, reset the game
    if (this.currentDrawer === socketId) {
      this.currentDrawer = null;
      this.gameState = 'waiting';
      this.currentWord = '';
      this.drawingData = null;
    }
  }

  startNewRound() {
    if (this.players.size < 2) return false;
    
    this.rounds++;
    this.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    // Select a random drawer (excluding the previous drawer)
    const playerIds = Array.from(this.players.keys()).filter(id => id !== this.currentDrawer);
    this.currentDrawer = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    this.gameState = 'drawing';
    this.drawingData = null;
    this.guesses = [];
    this.timeLeft = 60;
    
    // Set drawing status for players
    this.players.forEach((player, id) => {
      player.isDrawing = id === this.currentDrawer;
    });
    
    return true;
  }

  getGameState() {
    return {
      id: this.id,
      players: Array.from(this.players.values()),
      currentWord: this.gameState === 'drawing' ? this.currentWord : '',
      currentDrawer: this.currentDrawer,
      gameState: this.gameState,
      drawingData: this.drawingData,
      guesses: this.guesses,
      timeLeft: this.timeLeft,
      rounds: this.rounds,
      maxRounds: this.maxRounds,
      scores: Object.fromEntries(this.scores)
    };
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new game room
  socket.on('create-room', (playerName, playerType) => {
    const roomId = uuidv4().substring(0, 8);
    const room = new GameRoom(roomId, socket.id);
    room.addPlayer(socket.id, playerName, playerType);
    gameRooms.set(roomId, room);
    
    socket.join(roomId);
    socket.emit('room-created', roomId, room.getGameState());
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  // Join an existing room
  socket.on('join-room', (roomId, playerName, playerType) => {
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('room-not-found');
      return;
    }

    if (room.players.size >= 4) {
      socket.emit('room-full');
      return;
    }

    room.addPlayer(socket.id, playerName, playerType);
    socket.join(roomId);
    socket.emit('room-joined', room.getGameState());
    socket.to(roomId).emit('player-joined', room.getGameState());
    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  // Start the game
  socket.on('start-game', (roomId) => {
    const room = gameRooms.get(roomId);
    if (!room || room.players.size < 2) return;

    if (room.startNewRound()) {
      io.to(roomId).emit('game-started', room.getGameState());
      startGameTimer(roomId);
    }
  });

  // Handle drawing data
  socket.on('drawing-data', (roomId, drawingData) => {
    const room = gameRooms.get(roomId);
    if (!room || room.gameState !== 'drawing' || room.currentDrawer !== socket.id) return;

    room.drawingData = drawingData;
    socket.to(roomId).emit('drawing-update', drawingData);
  });

  // Handle guess submission
  socket.on('submit-guess', (roomId, guess) => {
    const room = gameRooms.get(roomId);
    if (!room || room.gameState !== 'drawing' || room.currentDrawer === socket.id) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const guessData = {
      playerId: socket.id,
      playerName: player.name,
      guess: guess,
      timestamp: Date.now()
    };

    room.guesses.push(guessData);
    
    // Check if guess is correct
    if (guess.toLowerCase().trim() === room.currentWord.toLowerCase()) {
      // Award points
      const drawerScore = room.scores.get(room.currentDrawer) || 0;
      const guesserScore = room.scores.get(socket.id) || 0;
      room.scores.set(room.currentDrawer, drawerScore + 10);
      room.scores.set(socket.id, guesserScore + 15);
      
      // Update player scores
      const drawer = room.players.get(room.currentDrawer);
      const guesser = room.players.get(socket.id);
      if (drawer) drawer.score = room.scores.get(room.currentDrawer);
      if (guesser) guesser.score = room.scores.get(socket.id);
      
      io.to(roomId).emit('correct-guess', guessData, room.getGameState());
      
      // End current round
      setTimeout(() => {
        endRound(roomId);
      }, 2000);
    } else {
      io.to(roomId).emit('guess-submitted', guessData);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and update rooms
    for (const [roomId, room] of gameRooms.entries()) {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          // Remove empty room
          gameRooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          // Notify remaining players
          io.to(roomId).emit('player-left', room.getGameState());
        }
        break;
      }
    }
  });
});

// Game timer function
function startGameTimer(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  const timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomId).emit('timer-update', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearInterval(timer);
      endRound(roomId);
    }
  }, 1000);
}

// End round function
function endRound(roomId) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  room.gameState = 'finished';
  io.to(roomId).emit('round-ended', room.getGameState());

  // Start next round after delay
  setTimeout(() => {
    if (room.rounds < room.maxRounds) {
      if (room.startNewRound()) {
        io.to(roomId).emit('game-started', room.getGameState());
        startGameTimer(roomId);
      }
    } else {
      room.gameState = 'game-over';
      io.to(roomId).emit('game-over', room.getGameState());
    }
  }, 3000);
}

// API endpoints
app.get('/api/rooms/:roomId', (req, res) => {
  const room = gameRooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room.getGameState());
});

// Serve React app for web client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web-client/build/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pictionary server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - http://192.168.100.203:${PORT}`);
});
