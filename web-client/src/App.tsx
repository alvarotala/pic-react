import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';

interface Player {
  id: string;
  name: string;
  type: 'mobile' | 'web';
  isDrawing: boolean;
  score: number;
}

interface GameState {
  id: string;
  players: Player[];
  currentWord: string;
  currentDrawer: string | null;
  gameState: 'waiting' | 'drawing' | 'guessing' | 'finished' | 'game-over';
  drawingData: any;
  guesses: Array<{
    playerId: string;
    playerName: string;
    guess: string;
    timestamp: number;
  }>;
  timeLeft: number;
  rounds: number;
  maxRounds: number;
  scores: Record<string, number>;
}

const SERVER_URL = window.location.hostname === 'localhost' ? 'http://192.168.100.203:3001' : '';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentScreen, setCurrentScreen] = useState<'home' | 'lobby' | 'drawing' | 'guessing'>('home');
  const [guess, setGuess] = useState('');
  const [recentGuesses, setRecentGuesses] = useState<Array<{
    playerName: string;
    guess: string;
    timestamp: number;
  }>>([]);

  const connect = () => {
    if (socket) {
      console.log('Already connected or connecting...');
      return;
    }

    console.log('Connecting to server:', SERVER_URL);
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setPlayerId(newSocket.id || null);
      console.log('✅ Connected to server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from server');
    });

    newSocket.on('room-created', (roomId: string, state: GameState) => {
      setGameState(state);
      setCurrentScreen('lobby');
      console.log('Room created:', roomId);
    });

    newSocket.on('room-joined', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('lobby');
      console.log('Joined room');
    });

    newSocket.on('room-not-found', () => {
      alert('Room not found!');
    });

    newSocket.on('room-full', () => {
      alert('Room is full!');
    });

    newSocket.on('player-joined', (state: GameState) => {
      setGameState(state);
      console.log('Player joined');
    });

    newSocket.on('player-left', (state: GameState) => {
      setGameState(state);
      console.log('Player left');
    });

    newSocket.on('game-started', (state: GameState) => {
      setGameState(state);
      setCurrentScreen(state.currentDrawer === playerId ? 'drawing' : 'guessing');
      console.log('Game started');
    });

    newSocket.on('drawing-update', (drawingData: any) => {
      if (gameState) {
        setGameState(prev => prev ? { ...prev, drawingData } : null);
      }
    });

    newSocket.on('guess-submitted', (guessData: any) => {
      console.log('Guess submitted:', guessData);
    });

    newSocket.on('correct-guess', (guessData: any, state: GameState) => {
      setGameState(state);
      console.log('Correct guess:', guessData);
      alert(`${guessData.playerName} guessed correctly: "${guessData.guess}"`);
    });

    newSocket.on('timer-update', (timeLeft: number) => {
      if (gameState) {
        setGameState(prev => prev ? { ...prev, timeLeft } : null);
      }
    });

    newSocket.on('round-ended', (state: GameState) => {
      setGameState(state);
      console.log('Round ended');
    });

    newSocket.on('game-over', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('guessing');
      console.log('Game over');
    });
  };

  useEffect(() => {
    if (gameState?.guesses) {
      const recent = gameState.guesses
        .slice(-5)
        .map(g => ({
          playerName: g.playerName,
          guess: g.guess,
          timestamp: g.timestamp
        }));
      setRecentGuesses(recent);
    }
  }, [gameState?.guesses]);

  const createRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    if (!socket) {
      connect();
    }
    
    if (socket && playerName.trim()) {
      socket.emit('create-room', playerName.trim(), 'web');
    }
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    if (!roomCode.trim()) {
      alert('Please enter a room code!');
      return;
    }

    if (!socket) {
      connect();
    }
    
    if (socket && playerName.trim() && roomCode.trim()) {
      socket.emit('join-room', roomCode.trim().toUpperCase(), playerName.trim(), 'web');
    }
  };

  const startGame = () => {
    if (socket && gameState && gameState.players.length >= 2) {
      socket.emit('start-game', gameState.id);
    } else {
      alert('You need at least 2 players to start the game!');
    }
  };

  const submitGuess = () => {
    if (socket && gameState && guess.trim() && gameState.currentDrawer !== playerId) {
      socket.emit('submit-guess', gameState.id, guess.trim());
      setGuess('');
    }
  };

  const isCurrentDrawer = gameState?.currentDrawer === playerId;

  const renderHome = () => (
    <div className="container">
      <div className="header">
        <h1>🌐 Pictionary Web Client</h1>
        <p>Play with mobile users in real-time!</p>
      </div>

      <div className="connection-status">
        <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
        <span>{isConnected ? 'Connected to server' : 'Disconnected from server'}</span>
      </div>

      <div className="setup-form">
        <div className="input-group">
          <label>Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={createRoom}>
            🎮 Create Room
          </button>
          
          <div className="divider">OR</div>
          
          <div className="join-section">
            <label>Join existing room:</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={8}
            />
            <button className="btn btn-secondary" onClick={joinRoom}>
              🔗 Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="container">
      <div className="lobby-header">
        <h2>Room: {gameState?.id}</h2>
        <button className="btn btn-back" onClick={() => setCurrentScreen('home')}>
          ← Back
        </button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({gameState?.players.length}/4):</h3>
          {gameState?.players.map((player) => (
            <div key={player.id} className="player-item">
              <span className="player-name">
                {player.name} {player.type === 'mobile' ? '📱' : '💻'}
              </span>
              <span className="player-score">{player.score} pts</span>
            </div>
          ))}
        </div>

        <div className="lobby-actions">
          {gameState && gameState.players.length >= 2 ? (
            <button className="btn btn-success" onClick={startGame}>
              🚀 Start Game
            </button>
          ) : (
            <p className="waiting-text">Waiting for more players... (Need at least 2)</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDrawing = () => (
    <div className="container">
      <div className="game-header">
        <h2>Draw: {gameState?.currentWord}</h2>
        <div className="game-info">
          <span className="timer">Time: {gameState?.timeLeft}s</span>
          <span className="round">Round {gameState?.rounds}/{gameState?.maxRounds}</span>
        </div>
      </div>

      <div className="drawing-area">
        <div className="drawing-canvas">
          <p>🎨 Drawing Canvas</p>
          <p>Use your mobile device to draw!</p>
        </div>
      </div>

      <div className="players-section">
        <h3>Players:</h3>
        {gameState?.players.map((player) => (
          <div key={player.id} className="player-item">
            <span className="player-name">
              {player.name} {player.isDrawing ? '🎨' : '👀'}
            </span>
            <span className="player-score">{player.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuessing = () => (
    <div className="container">
      <div className="game-header">
        <h2>Guess the Drawing!</h2>
        <div className="game-info">
          <span className="timer">Time: {gameState?.timeLeft}s</span>
          <span className="round">Round {gameState?.rounds}/{gameState?.maxRounds}</span>
        </div>
      </div>

      <div className="drawing-area">
        <div className="drawing-canvas">
          <p>🎨 Drawing in progress...</p>
          <p>Watch the drawing and make your guess!</p>
        </div>
      </div>

      {gameState?.gameState !== 'game-over' && !isCurrentDrawer && (
        <div className="guessing-section">
          <div className="input-group">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your guess..."
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            />
            <button className="btn btn-primary" onClick={submitGuess} disabled={!guess.trim()}>
              Submit Guess
            </button>
          </div>
        </div>
      )}

      <div className="guesses-section">
        <h3>Recent Guesses:</h3>
        {recentGuesses.length > 0 ? (
          recentGuesses.map((guessItem, index) => (
            <div key={index} className="guess-item">
              <span className="guess-player">{guessItem.playerName}:</span>
              <span className="guess-text">"{guessItem.guess}"</span>
            </div>
          ))
        ) : (
          <p className="no-guesses">No guesses yet...</p>
        )}
      </div>

      <div className="players-section">
        <h3>Players:</h3>
        {gameState?.players.map((player) => (
          <div key={player.id} className="player-item">
            <span className="player-name">
              {player.name} {player.isDrawing ? '🎨' : '👀'}
            </span>
            <span className="player-score">{player.score} pts</span>
          </div>
        ))}
      </div>

      {gameState?.gameState === 'game-over' && (
        <div className="game-over-section">
          <h2>🎉 Game Over! 🎉</h2>
          <h3>Final Scores:</h3>
          {gameState.players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.id} className="final-score-item">
                <span className="final-score-rank">{index + 1}. {player.name}</span>
                <span className="final-score">{player.score} pts</span>
              </div>
            ))}
          <button className="btn btn-primary" onClick={() => setCurrentScreen('home')}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );

  switch (currentScreen) {
    case 'home':
      return renderHome();
    case 'lobby':
      return renderLobby();
    case 'drawing':
      return renderDrawing();
    case 'guessing':
      return renderGuessing();
    default:
      return renderHome();
  }
}

export default App;
