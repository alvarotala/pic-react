import React, { useState, useEffect, useRef } from 'react';
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
  const { gameState, playerId, sendDrawingData } = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPaths, setCurrentPaths] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState) {
      if (gameState.gameState === 'waiting') {
        navigation.navigate('Home');
      } else if (gameState.gameState === 'drawing') {
        // Sync with server drawing data
        if (gameState.drawingData && gameState.drawingData.paths) {
          setCurrentPaths(gameState.drawingData.paths);
        }
      } else if (gameState.gameState === 'finished' || gameState.gameState === 'game-over') {
        navigation.navigate('Home');
      }
    }
  }, [gameState, navigation]);

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

  if (!gameState || gameState.gameState !== 'drawing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.drawerText}>
          You are drawing! Web players are guessing.
        </Text>
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

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Draw: {gameState.currentWord}
        </Text>
        <Text style={styles.instructionSubtext}>
          Web players are trying to guess your drawing!
        </Text>
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
