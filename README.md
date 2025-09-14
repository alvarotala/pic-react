# Pictionary Multiplayer Game

A real-time multiplayer Pictionary game where mobile users can play with web users. Built with React Native (Expo), React (web client), and Socket.IO for real-time communication.

## Features

### Mobile App (React Native)
- **Real-time Multiplayer**: Online gameplay with web users
- **Interactive Drawing**: Touch-based drawing with undo/clear functionality
- **Real-time Sync**: Drawings are synchronized across all players
- **Game Rooms**: Create or join rooms with room codes
- **Scoring System**: Points for drawing and guessing correctly

### Web Client (React)
- **Cross-platform Play**: Desktop users can play with mobile users
- **Real-time Updates**: Live drawing updates and guess submissions
- **Responsive Design**: Works on desktop and tablet browsers
- **Game Lobby**: Join rooms and manage multiplayer sessions

### Backend Server (Node.js + Socket.IO)
- **Real-time Communication**: WebSocket-based real-time updates
- **Game State Management**: Handles rooms, players, and game flow
- **Drawing Synchronization**: Broadcasts drawing data to all players
- **Multiplayer Logic**: Manages turns, scoring, and game rounds

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Backend Server │
│  (React Native) │    │     (React)     │    │  (Node.js +     │
│                 │◄──►│                 │◄──►│   Socket.IO)    │
│ • Drawing       │    │ • Guessing      │    │                 │
│ • Touch Input   │    │ • Keyboard      │    │ • Game Rooms    │
│ • Real-time     │    │ • Real-time     │    │ • Drawing Sync  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator, Android Emulator, or physical device with Expo Go
- A modern web browser (for web client)

### Installation & Setup

#### 1. Clone and Setup Mobile App

```bash
# Navigate to the project directory
cd pic-react

# Install mobile app dependencies
npm install
```

#### 2. Setup Backend Server

```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:3001`

#### 3. Setup Web Client

```bash
# In a new terminal, navigate to web client directory
cd web-client

# Install web client dependencies
npm install

# Start the web client
npm start
```

The web client will run on `http://localhost:3000`

#### 4. Start Mobile App

```bash
# In another terminal, navigate back to project root
cd pic-react

# Start the mobile app
npm start
```

### Running the Game

1. Start the backend server (`cd server && npm start`)
2. Start the web client (`cd web-client && npm start`)
3. Start the mobile app (`npm start`)
4. Open `http://localhost:3000` in your browser
5. Create a room on the web client
6. Join the room from your mobile app using the room code


### Game Flow

1. **Create/Join Room**: 
   - Web users create a room and get a room code
   - Mobile users enter the room code to join

2. **Lobby**: 
   - All players wait in the lobby
   - Game starts when at least 2 players are present

3. **Drawing Phase**:
   - One player is randomly selected to draw
   - Drawing is synchronized in real-time to all other players
   - 60-second timer for each round

4. **Guessing Phase**:
   - Other players submit guesses
   - Correct guesses award points to both drawer and guesser
   - Round ends when someone guesses correctly or time runs out

5. **Scoring**:
   - Drawer gets 10 points for each correct guess
   - Guesser gets 15 points for correct guess
   - Game continues for 3 rounds

## Development

### Project Structure

```
pic-react/
├── src/                    # Mobile app source
│   ├── components/         # Reusable components
│   ├── screens/           # Screen components (Home, Drawing, Guessing)
│   ├── context/           # React context (Socket)
│   └── types/             # TypeScript types
├── server/                # Backend server
│   ├── server.js          # Main server file
│   └── package.json       # Server dependencies
├── web-client/            # Web client
│   ├── src/               # React web app source
│   └── package.json       # Web client dependencies
└── package.json           # Mobile app dependencies
```

### Key Technologies

- **Mobile**: React Native, Expo, TypeScript, SVG for drawing
- **Web**: React, TypeScript, CSS3
- **Backend**: Node.js, Express, Socket.IO
- **Real-time**: WebSocket connections for live updates

### Development Scripts

```bash
# Mobile app
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run on web browser

# Backend server
cd server
npm start          # Start server
npm run dev        # Start with nodemon (auto-restart)

# Web client
cd web-client
npm start          # Start development server
npm run build      # Build for production
```

## Deployment

### Local Network Testing

To test multiplayer functionality on your local network:

1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

2. Update the server configuration:
   - The mobile app automatically uses your IP address (192.168.100.203)
   - The web client is configured to use the same IP
   - Ensure all devices are on the same network

3. If your IP address changes, update `src/config/server.ts` with the new IP

### Production Deployment

1. **Backend**: Deploy server to services like Heroku, Railway, or DigitalOcean
2. **Web Client**: Build and deploy to Netlify, Vercel, or similar
3. **Mobile**: Build and publish to app stores

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure backend server is running on port 3001
2. **Room Not Found**: Check room code is correct and room still exists
3. **Drawing Not Syncing**: Verify Socket.IO connection is established
4. **Mobile App Won't Start**: Ensure Expo CLI is installed and dependencies are installed
5. **Can't Play Alone**: This is a multiplayer-only game - you need at least 2 players

### Debug Mode

Enable debug logging by checking browser console and Expo logs for Socket.IO connection status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both mobile and web
5. Submit a pull request

## License

MIT License - feel free to use this project for learning and development!
