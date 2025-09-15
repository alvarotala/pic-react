import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';
import DrawingCanvas from '../components/DrawingCanvas';

type DrawingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Drawing'>;

interface Props {
  navigation: DrawingScreenNavigationProp;
}

export default function DrawingScreen({ navigation }: Props) {
  const { gameState, playerId, sendDrawingData, cancelGame, wasGameCancelled, clearCancelled, lastCorrectGuess } = useSocket();
  const isFocused = useIsFocused();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPaths, setCurrentPaths] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prevPhaseRef = useRef<string | null>(null);
  const navigatedToSummaryRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const phase = gameState?.gameState || null;
    if (!phase) return;
    if (!isFocused) return;
    
    // Update drawing data based on phase and server data
    if (phase === 'drawing') {
      if (gameState?.drawingData?.paths) {
        setCurrentPaths(gameState.drawingData.paths);
      } else {
        // Clear paths if no drawing data (new round)
        setCurrentPaths([]);
      }
    } else if (phase === 'word-selection') {
      // Clear paths when starting word selection (new round)
      setCurrentPaths([]);
    }
    
    // Only navigate on phase changes, not on every render
    if (prevPhaseRef.current === phase) return;

    console.log('DrawingScreen: Phase change from', prevPhaseRef.current, 'to', phase);

    // Simple navigation logic
    if (phase === 'waiting') {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else if (phase === 'game-over') {
      navigation.replace('GameOver');
    }
    // Don't navigate for other states - let correct guess handle navigation

    prevPhaseRef.current = phase;
  }, [gameState?.gameState, gameState?.drawingData, navigation, isFocused]);

  // Handle game cancellation broadcast
  useEffect(() => {
    if (wasGameCancelled) {
      Alert.alert('Game cancelled', 'The host cancelled the game.', [
        { text: 'OK', onPress: () => {} }
      ]);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      clearCancelled();
    }
  }, [wasGameCancelled, clearCancelled, navigation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Navigate to round summary when correct guess is received - IMMEDIATE
  useEffect(() => {
    console.log('DrawingScreen: useEffect triggered - lastCorrectGuess:', !!lastCorrectGuess, 'navigatedToSummaryRef:', navigatedToSummaryRef.current, 'isFocused:', isFocused);
    
    if (lastCorrectGuess && !navigatedToSummaryRef.current && isFocused) {
      console.log('DrawingScreen: ✅ Correct guess received, navigating to RoundSummary IMMEDIATELY');
      console.log('DrawingScreen: Correct guess data:', lastCorrectGuess);
      navigatedToSummaryRef.current = true;
      
      // Navigate IMMEDIATELY - no delays, no timeouts
      navigation.replace('RoundSummary');
    }
    
    // Reset navigation flag when correct guess is cleared
    if (!lastCorrectGuess && navigatedToSummaryRef.current) {
      console.log('DrawingScreen: Correct guess cleared, resetting navigation flag');
      navigatedToSummaryRef.current = false;
    }
  }, [lastCorrectGuess, navigation, isFocused]);

  // Header: replace back with Cancel action
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Cancel game', 'Are you sure you want to cancel the game for everyone?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelGame() },
            ]);
          }}
          style={{ marginLeft: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, cancelGame]);

  const handleDrawingChange = (drawing: boolean) => {
    setIsDrawing(drawing);
  };

  const handleDrawingUpdate = (paths: string[]) => {
    setCurrentPaths(paths);
    
    // Send drawing data to server if this player is the drawer
    if (gameState?.currentDrawer === playerId) {
      console.log('Sending drawing data:', { paths });
      sendDrawingData({ paths });
    }
  };

  const isCurrentDrawer = gameState?.currentDrawer === playerId;

  // Show loading only if we don't have game state at all
  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If we have a correct guess, navigate immediately - don't show loading
  if (lastCorrectGuess) {
    // This useEffect will handle navigation
    return null; // Don't render anything while navigating
  }

  // If we're not in drawing state and no correct guess, something is wrong
  if (gameState.gameState !== 'drawing') {
    console.log('DrawingScreen: Unexpected state - not drawing and no correct guess');
    // Don't show loading, just let the useEffect handle navigation
    return null;
  }

  // If not the current drawer, show waiting message
  if (!isCurrentDrawer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Waiting for your turn...</Text>
          <Text style={styles.waitingText}>
            {gameState.players.find(p => p.id === gameState.currentDrawer)?.name} is drawing
          </Text>
          <Text style={styles.waitingSubtext}>
            Web players are guessing the drawing!
          </Text>
          <View style={styles.playersList}>
            <Text style={styles.playersTitle}>Players:</Text>
            {gameState.players.map((player) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerName}>
                  {player.name} {player.isDrawing ? '🎨' : '👀'}
                </Text>
                <Text style={styles.playerScore}>{player.score} pts</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordText}>
          Draw: {gameState.currentWord}
        </Text>
        <Text style={styles.timerText}>Time: {gameState.timeLeft}s</Text>
      </View>

      <View style={styles.playerInfo}>
        <Text style={styles.roundText}>
          Round {gameState.rounds}/{gameState.maxRounds}
        </Text>
      </View>

      <View style={styles.drawingArea}>
        <DrawingCanvas
          style={styles.drawingCanvas}
          onDrawingChange={handleDrawingChange}
          disabled={!isCurrentDrawer}
          paths={currentPaths}
          onPathsChange={handleDrawingUpdate}
          isMultiplayer={true}
        />
      </View>

      <View style={styles.playersList}>
        <Text style={styles.playersTitle}>Players:</Text>
        {gameState.players.map((player) => (
          <View key={player.id} style={styles.playerItem}>
            <Text style={styles.playerName}>
              {player.name} {player.isDrawing ? '🎨' : '👀'}
            </Text>
            <Text style={styles.playerScore}>{player.score} pts</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  drawerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  roundText: {
    fontSize: 14,
    color: '#6b7280',
  },
  drawingArea: {
    flex: 1,
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  drawingCanvas: {
    flex: 1,
  },
  instructions: {
    padding: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  playersList: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playerName: {
    fontSize: 14,
    color: '#374151',
  },
  playerScore: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
