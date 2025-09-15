import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { gameState, isConnected, connect, createRoom, startGame, roomError, clearRoomError, wasGameCancelled, clearCancelled } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    if (gameState && gameState.gameState === 'word-selection') {
      navigation.replace('WordSelection');
    } else if (gameState && gameState.gameState === 'drawing') {
      navigation.replace('Drawing');
    } else if (gameState && gameState.gameState === 'waiting') {
      // Stay on this screen to show lobby
    }
  }, [gameState, navigation]);

  // Handle room errors
  useEffect(() => {
    if (roomError) {
      Alert.alert('Room Error', roomError);
      clearRoomError();
    }
  }, [roomError, clearRoomError]);

  // Handle game cancellation broadcast
  useEffect(() => {
    if (wasGameCancelled) {
      Alert.alert('Game cancelled', 'The host cancelled the game.', [
        { text: 'OK', onPress: () => {} }
      ]);
      clearCancelled();
    }
  }, [wasGameCancelled, clearCancelled]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      Alert.alert('Enter your name', 'Please enter your name to create a room!');
      return;
    }

    setIsCreatingRoom(true);
    if (!isConnected) {
      connect();
    }
    createRoom(playerName.trim());
  };


  const handleStartGame = () => {
    if (gameState && gameState.players.length >= 2) {
      startGame();
    } else {
      Alert.alert('Not enough players', 'You need at least 2 players to start the game!');
    }
  };

  const renderLobby = () => {
    if (!gameState) return null;

    return (
      <View style={styles.lobbyContainer}>
        <Text style={styles.lobbyTitle}>Room: {gameState.id}</Text>
        <Text style={styles.playersTitle}>Players ({gameState.players.length}/4):</Text>
        
        {gameState.players.map((player, index) => (
          <View key={player.id} style={styles.playerItem}>
            <Text style={styles.playerName}>
              {player.name} {player.type === 'mobile' ? '📱' : '💻'}
            </Text>
            <Text style={styles.playerScore}>Score: {player.score}</Text>
          </View>
        ))}

        <View style={styles.lobbyActions}>
          {gameState.players.length >= 2 ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>🚀 Start Game</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.waitingText}>
              Waiting for more players... (Need at least 2)
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderConnectionStatus = () => {
    return (
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected to server' : 'Disconnected from server'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>📱 Pictionary Mobile</Text>
        <Text style={styles.subtitle}>Create rooms and draw for web players!</Text>

        {renderConnectionStatus()}

        {gameState ? (
          renderLobby()
        ) : (
          <View style={styles.setupContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Name:</Text>
              <TextInput
                style={styles.textInput}
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                maxLength={20}
              />
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateRoom}
                disabled={isCreatingRoom}
              >
                <Text style={styles.buttonText}>
                  {isCreatingRoom ? 'Creating...' : '🎮 Create Room'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoSection}>
                <Text style={styles.infoText}>
                  💡 Share the room code with web players so they can join and guess your drawings!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 30,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  setupContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
  actionsContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
    lineHeight: 20,
  },
  lobbyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lobbyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  playerScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  lobbyActions: {
    marginTop: 20,
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
