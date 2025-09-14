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
    this.gameState = 'waiting'; // waiting, word-selection, drawing, guessing, finished
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
    this.currentWord = '';
    
    // Mobile is ALWAYS the drawer - find the mobile player
    const mobilePlayer = Array.from(this.players.entries())
      .find(([id, player]) => player.type === 'mobile');
    
    if (!mobilePlayer) {
      console.log('No mobile players available for drawing');
      return false;
    }
    
    this.currentDrawer = mobilePlayer[0]; // Always the same mobile player
    
    this.gameState = 'word-selection';
    this.drawingData = null;
    this.guesses = [];
    this.timeLeft = 60;
    
    // Set drawing status - mobile is always drawing, web players are always guessing
    this.players.forEach((player, id) => {
      player.isDrawing = player.type === 'mobile';
    });
    
    console.log(`Mobile drawer (always): ${this.currentDrawer}`);
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

  // Create a new game room (mobile only)
  socket.on('create-room', (playerName, playerType) => {
    // Only allow mobile devices to create rooms
    if (playerType !== 'mobile') {
      socket.emit('room-creation-denied', 'Only mobile devices can create rooms');
      console.log(`Room creation denied for ${socket.id} - not a mobile device`);
      return;
    }

    const roomId = uuidv4().substring(0, 8).toLowerCase();
    const room = new GameRoom(roomId, socket.id);
    room.addPlayer(socket.id, playerName, playerType);
    gameRooms.set(roomId, room);
    
    socket.join(roomId);
    socket.emit('room-created', roomId, room.getGameState());
    console.log(`Room created: ${roomId} by ${socket.id} (mobile)`);
  });

  // Join an existing room
  socket.on('join-room', (roomId, playerName, playerType) => {
    // Convert roomId to lowercase for case-insensitive lookup
    const normalizedRoomId = roomId.toLowerCase();
    const room = gameRooms.get(normalizedRoomId);
    if (!room) {
      socket.emit('room-not-found');
      return;
    }

    if (room.players.size >= 4) {
      socket.emit('room-full');
      return;
    }

    room.addPlayer(socket.id, playerName, playerType);
    socket.join(normalizedRoomId);
    socket.emit('room-joined', room.getGameState());
    socket.to(normalizedRoomId).emit('player-joined', room.getGameState());
    console.log(`Player ${socket.id} joined room ${normalizedRoomId}`);
  });

  // Start the game (mobile only)
  socket.on('start-game', (roomId) => {
    console.log(`Start game requested by ${socket.id} for room ${roomId}`);
    const normalizedRoomId = roomId.toLowerCase();
    const room = gameRooms.get(normalizedRoomId);
    if (!room || room.players.size < 2) {
      console.log(`Game start failed - room: ${!!room}, players: ${room?.players.size}`);
      return;
    }

    // Check if the player requesting to start is a mobile device
    const player = room.players.get(socket.id);
    console.log(`Player requesting start: ${JSON.stringify(player)}`);
    if (!player || player.type !== 'mobile') {
      socket.emit('game-start-denied', 'Only mobile devices can start the game');
      console.log(`Game start denied for ${socket.id} - not a mobile device`);
      return;
    }

    console.log('Starting new round...');
    if (room.startNewRound()) {
      console.log('Round started, broadcasting game-started event');
      io.to(normalizedRoomId).emit('game-started', room.getGameState());
      startGameTimer(normalizedRoomId);
    } else {
      console.log('Failed to start new round');
    }
  });

  // Handle word selection (mobile only)
  socket.on('select-word', (roomId, word) => {
    console.log(`Received word selection from ${socket.id} for room ${roomId}: ${word}`);
    const normalizedRoomId = roomId.toLowerCase();
    const room = gameRooms.get(normalizedRoomId);
    if (!room || room.gameState !== 'word-selection' || room.currentDrawer !== socket.id) {
      console.log(`Word selection rejected - room: ${!!room}, gameState: ${room?.gameState}, currentDrawer: ${room?.currentDrawer}, socketId: ${socket.id}`);
      return;
    }

    // Check if the player selecting is a mobile device
    const player = room.players.get(socket.id);
    if (!player || player.type !== 'mobile') {
      socket.emit('word-selection-denied', 'Only mobile devices can select words');
      console.log(`Word selection denied for ${socket.id} - not a mobile device`);
      return;
    }

    room.currentWord = word;
    room.gameState = 'drawing';
    console.log(`Word selected: ${word}, starting drawing phase for room ${normalizedRoomId}`);
    io.to(normalizedRoomId).emit('word-selected', room.getGameState());
  });

  // Handle drawing data (mobile only)
  socket.on('drawing-data', (roomId, drawingData) => {
    console.log(`Received drawing data from ${socket.id} for room ${roomId}:`, drawingData);
    const normalizedRoomId = roomId.toLowerCase();
    const room = gameRooms.get(normalizedRoomId);
    if (!room || room.gameState !== 'drawing' || room.currentDrawer !== socket.id) {
      console.log(`Drawing data rejected - room: ${!!room}, gameState: ${room?.gameState}, currentDrawer: ${room?.currentDrawer}, socketId: ${socket.id}`);
      return;
    }

    // Check if the player drawing is a mobile device
    const player = room.players.get(socket.id);
    if (!player || player.type !== 'mobile') {
      socket.emit('drawing-denied', 'Only mobile devices can draw');
      console.log(`Drawing denied for ${socket.id} - not a mobile device`);
      return;
    }

    room.drawingData = drawingData;
    console.log(`Broadcasting drawing update to room ${normalizedRoomId}`);
    socket.to(normalizedRoomId).emit('drawing-update', drawingData);
  });

  // Handle guess submission
  socket.on('submit-guess', (roomId, guess) => {
    const normalizedRoomId = roomId.toLowerCase();
    const room = gameRooms.get(normalizedRoomId);
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
      
      io.to(normalizedRoomId).emit('correct-guess', guessData, room.getGameState());
      
      // End current round
      setTimeout(() => {
        endRound(normalizedRoomId);
      }, 2000);
    } else {
      io.to(normalizedRoomId).emit('guess-submitted', guessData);
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
  const normalizedRoomId = roomId.toLowerCase();
  const room = gameRooms.get(normalizedRoomId);
  if (!room) return;

  const timer = setInterval(() => {
    room.timeLeft--;
    io.to(normalizedRoomId).emit('timer-update', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearInterval(timer);
      endRound(normalizedRoomId);
    }
  }, 1000);
}

// End round function
function endRound(roomId) {
  const normalizedRoomId = roomId.toLowerCase();
  const room = gameRooms.get(normalizedRoomId);
  if (!room) return;

  room.gameState = 'finished';
  io.to(normalizedRoomId).emit('round-ended', room.getGameState());

  // Start next round after delay
  setTimeout(() => {
    if (room.rounds < room.maxRounds) {
      if (room.startNewRound()) {
        io.to(normalizedRoomId).emit('game-started', room.getGameState());
        startGameTimer(normalizedRoomId);
      }
    } else {
      room.gameState = 'game-over';
      io.to(normalizedRoomId).emit('game-over', room.getGameState());
    }
  }, 3000);
}

// API endpoints
app.get('/api/rooms/:roomId', (req, res) => {
  const normalizedRoomId = req.params.roomId.toLowerCase();
  const room = gameRooms.get(normalizedRoomId);
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
