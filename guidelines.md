# Pictionary Multiplayer Game - Guidelines & Logic

## Game Overview

This is a real-time multiplayer Pictionary game where mobile users create rooms and draw while web users join and guess. The game enforces strict role separation: **mobile users always draw, web users always guess**.

## Game Architecture

### Client Types
- **Mobile App (React Native)**: Host & Drawer role
- **Web Client (React)**: Guesser role only
- **Backend Server (Node.js + Socket.IO)**: Game state management and real-time communication

### Communication Flow
```
Mobile App (Host/Drawer) ←→ Backend Server ←→ Web Client (Guesser)
```

## Game States & Transitions

### State Definitions

| State | Description | Who Can Trigger | Next States |
|-------|-------------|-----------------|-------------|
| `waiting` | Initial state, room created, waiting for players | Mobile (create room) | `word-selection` |
| `word-selection` | Mobile user selecting word to draw | Mobile (start game) | `drawing` |
| `drawing` | Active drawing phase, web users guessing | Mobile (select word) | `finished`, `game-over` |
| `finished` | Round completed, showing summary | Server (correct guess/timeout) | `word-selection`, `game-over` |
| `game-over` | All rounds completed, final scores | Server (max rounds reached) | `waiting` |

### State Transition Flow

```
waiting → word-selection → drawing → finished → word-selection → ... → game-over
  ↑                                                                    ↓
  └─────────────────────── (cancel game) ←─────────────────────────────┘
```

### Detailed State Logic

#### 1. `waiting` State
- **Trigger**: Room creation by mobile user
- **Mobile**: Shows room code, waiting for players
- **Web**: Shows join interface
- **Server**: Manages room, player connections
- **Transition**: Mobile starts game → `word-selection`

#### 2. `word-selection` State
- **Trigger**: Mobile user starts game
- **Mobile**: Shows word category selection interface
- **Web**: Shows "waiting for word selection" screen
- **Server**: Waits for word selection from mobile
- **Transition**: Mobile selects word → `drawing`

#### 3. `drawing` State
- **Trigger**: Mobile user selects word
- **Mobile**: Shows drawing canvas, draws in real-time
- **Web**: Shows drawing canvas, guessing interface
- **Server**: Broadcasts drawing data, handles guesses
- **Timer**: 60 seconds countdown
- **Transition**: Correct guess or timeout → `finished`

#### 4. `finished` State
- **Trigger**: Correct guess or timer expires
- **Mobile**: Shows round summary with correct guess details
- **Web**: Shows "waiting for next round" screen
- **Server**: Awards points, prepares for next round
- **Transition**: Mobile continues → `word-selection` or `game-over`

#### 5. `game-over` State
- **Trigger**: All rounds completed (max 3 rounds)
- **Mobile**: Shows final scores, option to play again
- **Web**: Shows final scores
- **Server**: Game completed
- **Transition**: Mobile creates new room → `waiting`

## Game Rules & Mechanics

### Role Enforcement
- **Mobile Users**: Always the drawer, never guess
- **Web Users**: Always guessers, never draw
- **No Role Switching**: Roles are fixed throughout the entire game
- **Host Control**: Only mobile users can create rooms and control game flow

### Scoring System
- **Correct Guess**: Drawer gets +10 points, Guesser gets +15 points
- **Incorrect Guess**: No points awarded
- **Time Expired**: No points awarded
- **Round Lock**: After correct guess, round is locked to prevent duplicate winners

### Round Management
- **Max Rounds**: 3 rounds per game (configurable)
- **Timer**: 60 seconds per round
- **Round End**: Either correct guess or time expiration
- **Round Summary**: 2-second delay after correct guess before next round
- **Auto-Continue**: Mobile user must manually continue to next round

### Word Categories
The game includes 4 categories with 10 words each:

#### Animals (10 words)
Cat, Dog, Elephant, Lion, Tiger, Bear, Bird, Fish, Butterfly, Spider

#### Objects (10 words)
House, Car, Phone, Book, Pizza, Cake, Guitar, Piano, Camera, Computer

#### Nature (10 words)
Tree, Sun, Moon, Star, Flower, Mountain, Ocean, Rainbow, Cloud, Snow

#### Activities (10 words)
Running, Dancing, Singing, Painting, Swimming, Basketball, Football, Tennis, Cooking, Reading

## Socket Events

### Client → Server Events

| Event | Triggered By | Parameters | Description |
|-------|--------------|------------|-------------|
| `create-room` | Mobile | `(playerName, playerType)` | Create new game room |
| `join-room` | Web | `(roomId, playerName, playerType)` | Join existing room |
| `start-game` | Mobile | `(roomId)` | Start the game |
| `select-word` | Mobile | `(roomId, word)` | Select word to draw |
| `drawing-data` | Mobile | `(roomId, drawingData)` | Send drawing updates |
| `submit-guess` | Web | `(roomId, guess)` | Submit guess |
| `continue-next-round` | Mobile | `(roomId)` | Continue to next round |
| `cancel-game` | Mobile | `(roomId)` | Cancel current game |

### Server → Client Events

| Event | Sent To | Parameters | Description |
|-------|---------|------------|-------------|
| `room-created` | Mobile | `(roomId, gameState)` | Room created successfully |
| `room-joined` | Web | `(gameState)` | Successfully joined room |
| `room-not-found` | Web | `()` | Room doesn't exist |
| `room-full` | Web | `()` | Room is full |
| `player-joined` | All | `(gameState)` | New player joined |
| `player-left` | All | `(gameState)` | Player left |
| `game-started` | All | `(gameState)` | Game started |
| `word-selected` | All | `(gameState)` | Word selected, drawing phase |
| `drawing-update` | Web | `(drawingData)` | Drawing data update |
| `guess-submitted` | All | `(guessData)` | Guess submitted |
| `correct-guess` | All | `(guessData, gameState)` | Correct guess made |
| `timer-update` | All | `(timeLeft)` | Timer countdown |
| `round-ended` | All | `(gameState)` | Round completed |
| `game-over` | All | `(gameState)` | Game finished |
| `game-cancelled` | All | `()` | Game cancelled by host |

## Navigation Logic

### Mobile App Navigation Flow
```
Home → WordSelection → Drawing → RoundSummary → WordSelection → ... → GameOver
  ↑                                                                    ↓
  └─────────────────────── (cancel game) ←─────────────────────────────┘
```

### Web Client Screen Flow
```
Home → Lobby → WaitingForWord → Guessing → WaitingForWord → ... → GameOver
  ↑                                                                    ↓
  └─────────────────────── (cancel game) ←─────────────────────────────┘
```

### Navigation Guards
- **Focus-based**: Only navigate when screen is focused
- **State-based**: Check game state before navigation
- **Duplicate prevention**: Prevent multiple rapid navigation calls
- **Cleanup**: Clear state when navigating away

## Error Handling

### Connection Issues
- **Auto-reconnect**: Clients attempt to reconnect on disconnect
- **Connection status**: Visual indicators for connection state
- **Graceful degradation**: Handle server unavailability

### Game State Errors
- **Invalid actions**: Prevent actions in wrong game state
- **Role validation**: Enforce role-based permissions
- **State synchronization**: Handle state inconsistencies

### Navigation Errors
- **Duplicate navigation**: Prevent multiple rapid screen changes
- **State cleanup**: Clear state when navigating away
- **Focus management**: Only navigate when screen is active

## Performance Considerations

### Real-time Drawing
- **Drawing data**: SVG path data transmitted in real-time
- **Optimization**: Only send drawing updates, not full state
- **Bandwidth**: Efficient data structure for drawing paths

### State Management
- **Minimal updates**: Only update changed state properties
- **Debouncing**: Prevent rapid state updates
- **Cleanup**: Proper cleanup of timers and listeners

### Memory Management
- **Component unmounting**: Clean up resources on unmount
- **State clearing**: Clear state when no longer needed
- **Timer cleanup**: Clear all timers and timeouts

## Development Guidelines

### Code Organization
- **Separation of concerns**: Clear separation between UI and logic
- **Reusable components**: Shared components between screens
- **Context management**: Centralized state management with React Context

### Error Handling
- **Try-catch blocks**: Wrap async operations
- **User feedback**: Show appropriate error messages
- **Logging**: Console logging for debugging

### Testing Considerations
- **State transitions**: Test all possible state changes
- **Role enforcement**: Verify role-based restrictions
- **Navigation flow**: Test complete user journeys
- **Error scenarios**: Test error conditions and recovery

## Configuration

### Server Configuration
- **Max rounds**: 3 (configurable in `server.js`)
- **Timer duration**: 60 seconds (configurable)
- **Max players**: 4 players per room
- **Port**: 3001 (configurable)

### Client Configuration
- **Server URL**: Configurable in client code
- **Reconnection**: Automatic reconnection attempts
- **Timeout**: Connection timeout settings

## Security Considerations

### Input Validation
- **Player names**: Length and character restrictions
- **Room codes**: Case-insensitive, alphanumeric
- **Guesses**: Sanitize input to prevent XSS

### Role Enforcement
- **Server-side validation**: Validate roles on server
- **Client-side checks**: Additional client-side validation
- **Permission checks**: Verify permissions before actions

### Data Protection
- **No sensitive data**: No personal information stored
- **Temporary data**: Game data cleared after game ends
- **Room cleanup**: Rooms deleted when empty or game ends
