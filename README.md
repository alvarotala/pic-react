# Pictionary Multiplayer Game

A real-time multiplayer Pictionary game where mobile users create rooms and draw while web users join and guess. Built with React Native (Expo), React (web client), and Socket.IO for real-time communication.

## Game Roles

### Mobile App (React Native) - HOST & DRAWER
- **Room Creation**: Create game rooms and share room codes
- **Word Selection**: Choose what to draw from categorized word lists
- **Interactive Drawing**: Touch-based drawing with undo/clear functionality
- **Real-time Sync**: Drawings are synchronized to web players
- **Game Management**: Start games and control the flow

### Web Client (React) - GUESSER
- **Room Joining**: Join rooms using codes shared by mobile users
- **Real-time Watching**: See drawings as they're created in real-time
- **Guessing Interface**: Submit guesses for the drawings
- **Responsive Design**: Works on desktop and tablet browsers
- **Scoring**: Earn points for correct guesses

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
│ • HOST & DRAWER │    │ • GUESSER ONLY  │    │                 │
│ • Create Rooms  │    │ • Join Rooms    │    │ • Game Rooms    │
│ • Select Words  │    │ • Watch & Guess │    │ • Drawing Sync  │
│ • Draw Always   │    │ • Never Draws   │    │ • Role Enforced │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## How to Play

### Game Flow
1. **Mobile creates room (host & drawer)** → Shares code with web users
2. **Web users join** → Enter the room code to join as guessers
3. **Start game (mobile only)** → Mobile selects a word from categories
4. **Drawing phase** → Mobile draws; web users guess in real-time
5. **Correct guess** → Scores awarded; round ends; brief summary shows top scorer
6. **Next round** → Automatically transitions back to word selection (mobile)
7. **Game over** → After max rounds, show final scores

### Key Rules
- **Mobile = Always Drawer**: Mobile users never guess, only draw
- **Web = Always Guesser**: Web users never draw, only guess
- **No Role Exchange**: Roles are fixed throughout the entire game
- **Mobile Controls Game**: Only mobile users can create rooms and start games
- **Cancel Game**: Only the mobile host can cancel a game in progress. All clients are notified and sent back to the home screen.

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

#### 1.1. Configure Environment Variables

Create a `.env` file in the root directory for the mobile app:

```bash
# Create .env file for mobile app
touch .env
```

Add the following content to `.env`, replacing `YOUR_IP_ADDRESS` with your machine's IP address:

```env
# Mobile app environment variables
SERVER_HOST=YOUR_IP_ADDRESS
SERVER_PORT=3001
```

**Note**: Replace `YOUR_IP_ADDRESS` with your actual machine's IP address. You can find it using the commands in the "Finding Your IP Address" section below.

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
```

#### 3.1. Configure Web Client Environment Variables

Create a `.env` file in the web-client directory:

```bash
# Create .env file for web client
touch .env
```

Add the following content to `.env`, replacing `YOUR_IP_ADDRESS` with your machine's IP address:

```env
# Web client environment variables
SERVER_HOST=YOUR_IP_ADDRESS
SERVER_PORT=3001
```

**Note**: Replace `YOUR_IP_ADDRESS` with your actual machine's IP address. You can find it using the commands in the "Finding Your IP Address" section below.

```bash
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

### Finding Your IP Address

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

**Important**: All devices (mobile and web) must be on the same network as the server.


### Running the Game

1. Start the backend server (`cd server && npm start`)
2. Start the web client (`cd web-client && npm start`)
3. Start the mobile app (`npm start`)
4. Open `http://localhost:3000` in your browser
5. On the mobile app, create a room (host)
6. On the web client(s), join the room using the code shown on mobile


### Scoring & Rounds

- **Per correct guess**: Drawer +10 pts, Guesser +15 pts
- **Timer**: 60 seconds per round
- **Round End**: When someone guesses correctly or time runs out. Top scorer is shown briefly to the mobile host before the next round starts automatically.
- **Max Rounds**: 3 (configurable in server)

