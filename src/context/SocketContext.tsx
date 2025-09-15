import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../config/server';

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

interface SocketContextType {
  socket: Socket | null;
  gameState: GameState | null;
  isConnected: boolean;
  playerId: string | null;
  playerName: string | null;
  playerType: 'mobile' | 'web' | null;
  roomId: string | null;
  roomError: string | null;
  lastCorrectGuess: { playerName: string; guess: string; timeElapsedSeconds: number } | null;
  wasGameCancelled: boolean;
  connect: () => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: () => void;
  cancelGame: () => void;
  continueNextRound: () => void;
  selectWord: (word: string) => void;
  sendDrawingData: (drawingData: any) => void;
  submitGuess: (guess: string) => void;
  disconnect: () => void;
  clearRoomError: () => void;
  clearCorrectGuess: () => void;
  clearCancelled: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Server URL is now imported from config/server.ts

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerType] = useState<'mobile' | 'web'>('mobile');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [lastCorrectGuess, setLastCorrectGuess] = useState<{ playerName: string; guess: string; timeElapsedSeconds: number } | null>(null);
  const [wasGameCancelled, setWasGameCancelled] = useState<boolean>(false);

  const connect = () => {
    if (socket) {
      console.log('Already connected or connecting...');
      return;
    }

    console.log('Connecting to server:', SERVER_URL);
    const newSocket = io(SERVER_URL, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setPlayerId(newSocket.id || null);
      console.log('✅ Connected to server:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Disconnected from server:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('room-created', (roomId: string, state: GameState) => {
      setRoomId(roomId);
      setGameState(state);
      console.log('Room created:', roomId);
    });

    newSocket.on('room-joined', (state: GameState) => {
      setGameState(state);
      console.log('Joined room');
    });

    newSocket.on('room-not-found', () => {
      console.log('Room not found');
      setRoomError('Room not found!');
    });

    newSocket.on('room-full', () => {
      console.log('Room is full');
      setRoomError('Room is full!');
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
      console.log('Game started');
    });

    newSocket.on('word-selected', (state: GameState) => {
      setGameState(state);
      console.log('Word selected, starting drawing phase');
    });

    newSocket.on('drawing-update', (drawingData: any) => {
      setGameState(prev => (prev ? { ...prev, drawingData } : prev));
    });

    newSocket.on('guess-submitted', (guessData: any) => {
      console.log('Guess submitted:', guessData);
    });

    newSocket.on('correct-guess', (guessData: any, state: GameState) => {
      setGameState(state);
      const timeElapsedSeconds = Math.max(0, 60 - (state?.timeLeft ?? 0));
      // Only set lastCorrectGuess if not already set to avoid multiple triggers
      setLastCorrectGuess(prev => prev ?? {
        playerName: guessData.playerName,
        guess: guessData.guess,
        timeElapsedSeconds,
      });
      console.log('Correct guess:', guessData);
    });

    newSocket.on('timer-update', (timeLeft: number) => {
      setGameState(prev => (prev ? { ...prev, timeLeft } : prev));
    });

    newSocket.on('round-ended', (state: GameState) => {
      setGameState(state);
      console.log('Round ended');
    });

    newSocket.on('game-over', (state: GameState) => {
      setGameState(state);
      console.log('Game over');
    });

    newSocket.on('game-cancelled', () => {
      console.log('Game cancelled by host');
      setWasGameCancelled(true);
      setGameState(null);
      setRoomId(null);
    });

    newSocket.on('game-start-denied', (message: string) => {
      console.log('Game start denied:', message);
      setRoomError(message);
    });
  };

  const createRoom = (name: string) => {
    if (socket && isConnected) {
      setPlayerName(name);
      socket.emit('create-room', name, playerType);
    } else {
      console.log('Please wait for connection to establish...');
    }
  };

  const joinRoom = (roomId: string, name: string) => {
    if (socket && isConnected) {
      setPlayerName(name);
      setRoomId(roomId);
      socket.emit('join-room', roomId, name, playerType);
    } else {
      console.log('Please wait for connection to establish...');
    }
  };

  const startGame = () => {
    if (socket && roomId) {
      socket.emit('start-game', roomId);
    }
  };

  const cancelGame = () => {
    if (socket && roomId && playerType === 'mobile') {
      socket.emit('cancel-game', roomId);
    }
  };

  const continueNextRound = () => {
    if (socket && roomId && playerType === 'mobile') {
      socket.emit('continue-next-round', roomId);
    }
  };

  const selectWord = (word: string) => {
    if (socket && roomId) {
      socket.emit('select-word', roomId, word);
    }
  };

  const sendDrawingData = (drawingData: any) => {
    if (socket && roomId && gameState?.currentDrawer === playerId) {
      socket.emit('drawing-data', roomId, drawingData);
    }
  };

  const submitGuess = (guess: string) => {
    if (socket && roomId && gameState?.currentDrawer !== playerId) {
      socket.emit('submit-guess', roomId, guess);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setGameState(null);
      setRoomId(null);
      setPlayerName(null);
    }
  };

  const clearRoomError = () => {
    setRoomError(null);
  };

  const clearCorrectGuess = () => {
    setLastCorrectGuess(null);
  };

  const clearCancelled = () => {
    setWasGameCancelled(false);
  };

  // Auto-connect on component mount
  useEffect(() => {
    connect();
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        isConnected,
        playerId,
        playerName,
        playerType,
        roomId,
        roomError,
        lastCorrectGuess,
        wasGameCancelled,
        connect,
        createRoom,
        joinRoom,
        startGame,
        cancelGame,
        continueNextRound,
        selectWord,
        sendDrawingData,
        submitGuess,
        disconnect,
        clearRoomError,
        clearCorrectGuess,
        clearCancelled,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
