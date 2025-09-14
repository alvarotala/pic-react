import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';

type GuessingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Guessing'>;

interface Props {
  navigation: GuessingScreenNavigationProp;
}

export default function GuessingScreen({ navigation }: Props) {
  const { gameState, playerId, submitGuess } = useSocket();
  const [guess, setGuess] = useState('');
  const [recentGuesses, setRecentGuesses] = useState<Array<{
    playerName: string;
    guess: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    if (gameState) {
      if (gameState.gameState === 'waiting') {
        navigation.navigate('Home');
      } else if (gameState.gameState === 'drawing') {
        navigation.navigate('Drawing');
      } else if (gameState.gameState === 'game-over') {
        // Handle game over
      }
    }
  }, [gameState, navigation]);

  useEffect(() => {
    if (gameState?.guesses) {
      // Update recent guesses (last 5)
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

  const handleSubmitGuess = () => {
    if (!guess.trim()) return;
    
    submitGuess(guess.trim());
    setGuess('');
  };

  const isCurrentDrawer = gameState?.currentDrawer === playerId;
  const isGameOver = gameState?.gameState === 'game-over';

  if (!gameState || isCurrentDrawer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Guess the Drawing!</Text>
          {!isGameOver && (
            <Text style={styles.timerText}>Time: {gameState.timeLeft}s</Text>
          )}
        </View>

        <View style={styles.gameInfo}>
          <Text style={styles.roundText}>
            Round {gameState.rounds}/{gameState.maxRounds}
          </Text>
          <Text style={styles.drawerText}>
            {gameState.players.find(p => p.id === gameState.currentDrawer)?.name} is drawing
          </Text>
        </View>

        {gameState.drawingData && (
          <View style={styles.drawingArea}>
            <Text style={styles.drawingTitle}>Current Drawing:</Text>
            <View style={styles.drawingPlaceholder}>
              <Text style={styles.drawingText}>🎨</Text>
              <Text style={styles.drawingSubtext}>Drawing in progress...</Text>
            </View>
          </View>
        )}

        {!isGameOver && (
          <View style={styles.guessingArea}>
            <Text style={styles.guessingTitle}>Make your guess:</Text>
            <TextInput
              style={styles.textInput}
              value={guess}
              onChangeText={setGuess}
              placeholder="Enter your guess..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoCorrect={false}
              onSubmitEditing={handleSubmitGuess}
            />
            <TouchableOpacity
              style={[styles.button, !guess.trim() && styles.disabledButton]}
              onPress={handleSubmitGuess}
              disabled={!guess.trim()}
            >
              <Text style={styles.buttonText}>Submit Guess</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.guessesArea}>
          <Text style={styles.guessesTitle}>Recent Guesses:</Text>
          {recentGuesses.length > 0 ? (
            recentGuesses.map((guessItem, index) => (
              <View key={index} style={styles.guessItem}>
                <Text style={styles.guessPlayer}>{guessItem.playerName}:</Text>
                <Text style={styles.guessText}>"{guessItem.guess}"</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noGuessesText}>No guesses yet...</Text>
          )}
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

        {isGameOver && (
          <View style={styles.gameOverArea}>
            <Text style={styles.gameOverTitle}>🎉 Game Over! 🎉</Text>
            <Text style={styles.gameOverSubtext}>Final Scores:</Text>
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <View key={player.id} style={styles.finalScoreItem}>
                  <Text style={styles.finalScoreRank}>
                    {index + 1}. {player.name}
                  </Text>
                  <Text style={styles.finalScore}>{player.score} pts</Text>
                </View>
              ))}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.backButtonText}>Play Again</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
  },
  gameInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  drawerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  drawingArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  drawingPlaceholder: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  drawingText: {
    fontSize: 48,
    marginBottom: 8,
  },
  drawingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  guessingArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guessingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  guessesArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guessesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  guessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  guessPlayer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  guessText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noGuessesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  playersList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  gameOverArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameOverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  gameOverSubtext: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalScoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  finalScoreRank: {
    fontSize: 16,
    color: '#374151',
  },
  finalScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
