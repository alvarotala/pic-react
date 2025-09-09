# Pictionary Mobile App

A simple interactive mobile app for Pictionary built with React Native (Expo) and TypeScript with real drawing functionality.

## Features

- **Home Screen**: Choose words to draw or start guessing
- **Drawing Screen**: Interactive drawing interface with touch-based drawing
- **Guessing Screen**: Guess the word with visual feedback
- **Real Drawing**: Touch-based drawing with undo/clear functionality
- **TypeScript**: Full type safety throughout the application

## Drawing Features

This app includes a fully functional drawing system:

- **Touch Drawing**: Draw with your finger on the screen
- **Undo Functionality**: Undo the last drawn path
- **Clear Canvas**: Clear all drawings
- **Real-time Drawing**: Smooth drawing experience with SVG paths
- **Timer**: 60-second drawing timer

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. Navigate to the project directory:
   ```bash
   cd pictionary-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## Project Structure

```
src/
├── components/
│   └── DrawingCanvas.tsx      # Touch-based drawing component
├── screens/
│   ├── HomeScreen.tsx         # Main menu and word selection
│   ├── DrawingScreen.tsx      # Drawing interface with timer
│   └── GuessingScreen.tsx     # Guessing interface with attempts
└── types/                     # TypeScript type definitions
```

## Drawing Implementation Details

### Drawing Canvas Component

The `DrawingCanvas` component provides a complete drawing experience:

```typescript
interface DrawingCanvasProps {
  style?: any;
  onDrawingChange?: (isDrawing: boolean) => void;
}
```

### Drawing Features

- **SVG-based Drawing**: Uses react-native-svg for smooth vector graphics
- **Gesture Handling**: Pan gesture handler for touch drawing
- **Path Management**: Tracks drawing paths for undo functionality
- **Real-time Updates**: Immediate visual feedback during drawing

### Drawing Controls

- **Undo**: Remove the last drawn path
- **Clear**: Clear all drawings from the canvas
- **Drawing State**: Tracks when user is actively drawing

## Future Enhancements

- Add actual Rive animation files
- Implement real-time multiplayer functionality
- Add more drawing tools and features
- Include sound effects and haptic feedback
- Add user profiles and scoring system




https://rive.app/community/files/2195-4346-avatar-pack-use-case/