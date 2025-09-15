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
  gameState: 'waiting' | 'word-selection' | 'drawing' | 'guessing' | 'finished' | 'game-over';
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
  const [currentScreen, setCurrentScreen] = useState<'home' | 'lobby' | 'waiting-for-word' | 'drawing' | 'guessing' | 'game-over'>('home');
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
      setCurrentScreen('waiting-for-word');
      console.log('Game started, waiting for word selection');
    });

    newSocket.on('next-round-started', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('waiting-for-word');
      console.log('Next round started, waiting for word selection');
    });

    newSocket.on('word-selected', (state: GameState) => {
      setGameState(state);
      console.log('🔔 Web: word-selected event received');
      console.log('🔔 Web: playerId:', playerId);
      console.log('🔔 Web: currentDrawer:', state.currentDrawer);
      console.log('🔔 Web: isCurrentDrawer:', state.currentDrawer === playerId);
      
      const newScreen = state.currentDrawer === playerId ? 'drawing' : 'guessing';
      console.log('🔔 Web: Setting screen to:', newScreen);
      setCurrentScreen(newScreen);
    });

    newSocket.on('drawing-update', (drawingData: any) => {
      console.log('Received drawing update:', drawingData);
      setGameState(prev => (prev ? { ...prev, drawingData } : prev));
    });

    newSocket.on('guess-submitted', (guessData: any) => {
      console.log('Guess submitted:', guessData);
    });

    newSocket.on('correct-guess', (guessData: any, state: GameState) => {
      console.log('🔔 Web: correct-guess event received');
      console.log('🔔 Web: guessData:', guessData);
      console.log('🔔 Web: state:', state);
      
      setGameState(state);
      console.log('🔔 Web: ✅ Correct guess processed:', guessData);
    });

    newSocket.on('timer-update', (timeLeft: number) => {
      setGameState(prev => (prev ? { ...prev, timeLeft } : prev));
    });

    newSocket.on('round-finished', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('waiting-for-word');
      console.log('Round finished - waiting for next word selection');
    });

    newSocket.on('continue-to-word-selection', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('waiting-for-word');
      console.log('Continue to word selection - waiting for mobile to select word');
    });

    newSocket.on('game-over', (state: GameState) => {
      setGameState(state);
      setCurrentScreen('game-over');
      console.log('Game over');
    });

    newSocket.on('room-creation-denied', (message: string) => {
      alert(message);
    });

    newSocket.on('game-start-denied', (message: string) => {
      alert(message);
    });

    newSocket.on('drawing-denied', (message: string) => {
      alert(message);
    });
  };

  // Auto-connect on component mount
  useEffect(() => {
    connect();
  }, []);

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

  const joinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    if (!roomCode.trim()) {
      alert('Please enter a room code!');
      return;
    }

    if (socket && isConnected && playerName.trim() && roomCode.trim()) {
      socket.emit('join-room', roomCode.trim().toUpperCase(), playerName.trim(), 'web');
    } else {
      alert('Please wait for connection to establish...');
    }
  };

  const submitGuess = () => {
    console.log('🔔 Web: submitGuess called');
    console.log('🔔 Web: socket:', !!socket);
    console.log('🔔 Web: gameState:', !!gameState);
    console.log('🔔 Web: guess:', guess.trim());
    console.log('🔔 Web: currentDrawer:', gameState?.currentDrawer);
    console.log('🔔 Web: playerId:', playerId);
    console.log('🔔 Web: isNotCurrentDrawer:', gameState?.currentDrawer !== playerId);
    
    if (socket && gameState && guess.trim() && gameState.currentDrawer !== playerId) {
      console.log('🔔 Web: ✅ Sending guess:', guess.trim());
      socket.emit('submit-guess', gameState.id, guess.trim());
      setGuess('');
    } else {
      console.log('🔔 Web: ❌ Cannot submit guess - conditions not met');
    }
  };

  const leaveRoom = () => {
    console.log('🔔 Web: Leaving room');
    // Disconnect from socket to actually leave the room
    if (socket) {
      socket.disconnect();
    }
    setCurrentScreen('home');
    setGameState(null);
    setPlayerName('');
    setRoomCode('');
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
          <div className="join-section">
            <div className="input-group">
              <label>Join existing room:</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={8}
              />
            </div>
            <button className="btn btn-primary" onClick={joinRoom}>
              🔗 Join Room
            </button>
          </div>
          
          <div className="info-section">
            <p className="info-text">
              💡 <strong>Note:</strong> Only mobile devices can create rooms. 
              Ask a friend with the mobile app to create a room and share the room code with you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLobby = () => (
    <div className="container">
      <div className="lobby-header">
        <h2>Room: {gameState?.id}</h2>
        <button className="btn btn-back" onClick={leaveRoom}>
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
            <div className="waiting-section">
              <p className="waiting-text">
                ✅ Ready to start! Waiting for the mobile app user to start the game...
              </p>
              <p className="info-text">
                💡 Only mobile devices can start the game. Ask the room creator to start!
              </p>
            </div>
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
          <svg 
            width="100%" 
            height="300" 
            style={{ border: '2px dashed #e2e8f0', backgroundColor: '#f8fafc' }}
          >
            {gameState?.drawingData?.paths?.map((path: string, index: number) => (
              <path
                key={index}
                d={path}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {!gameState?.drawingData?.paths?.length && (
              <g>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#6b7280">
                  🎨 Drawing Canvas
                </text>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#9ca3af">
                  📱 Use your mobile device to draw!
                </text>
                <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#9ca3af">
                  💡 Web clients can only watch and guess. Only mobile devices can draw!
                </text>
              </g>
            )}
          </svg>
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

  const renderWaitingForWord = () => (
    <div className="container">
      <div className="game-header">
        <h2>Waiting for word selection...</h2>
        <div className="game-info">
          <span className="round">Round {gameState?.rounds}/{gameState?.maxRounds}</span>
        </div>
      </div>

      <div className="drawing-area">
        <div className="drawing-canvas">
          <svg 
            width="100%" 
            height="300" 
            style={{ border: '2px dashed #e2e8f0', backgroundColor: '#f8fafc' }}
          >
            <g>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#6b7280">
                ⏳ Waiting for word selection...
              </text>
              <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#9ca3af">
                The mobile user is selecting a word to draw
              </text>
            </g>
          </svg>
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
          <svg 
            width="100%" 
            height="300" 
            style={{ border: '2px dashed #e2e8f0', backgroundColor: '#f8fafc' }}
          >
            {gameState?.drawingData?.paths?.map((path: string, index: number) => (
              <path
                key={index}
                d={path}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {!gameState?.drawingData?.paths?.length && (
              <g>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#6b7280">
                  🎨 Drawing in progress...
                </text>
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#9ca3af">
                  Watch the drawing and make your guess!
                </text>
              </g>
            )}
          </svg>
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

    </div>
  );

  const renderGameOver = () => (
    <div className="container">
      <div className="game-over-section">
        <h2>🎉 Game Over! 🎉</h2>
        <h3>Final Scores:</h3>
        {gameState?.players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <div key={player.id} className="final-score-item">
              <span className="final-score-rank">{index + 1}. {player.name}</span>
              <span className="final-score">{player.score} pts</span>
            </div>
          ))}
        <div className="button-group">
          <button className="btn btn-primary" onClick={() => setCurrentScreen('lobby')}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );

  switch (currentScreen) {
    case 'home':
      return renderHome();
    case 'lobby':
      return renderLobby();
    case 'waiting-for-word':
      return renderWaitingForWord();
    case 'drawing':
      return renderDrawing();
    case 'guessing':
      return renderGuessing();
    case 'game-over':
      return renderGameOver();
    default:
      return renderHome();
  }
}

export default App;
