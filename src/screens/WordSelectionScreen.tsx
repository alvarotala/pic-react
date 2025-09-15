import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';

type WordSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WordSelection'>;

interface Props {
  navigation: WordSelectionScreenNavigationProp;
}

const WORD_CATEGORIES = {
  animals: ['Cat', 'Dog', 'Elephant', 'Lion', 'Tiger', 'Bear', 'Bird', 'Fish', 'Butterfly', 'Spider'],
  objects: ['House', 'Car', 'Phone', 'Book', 'Pizza', 'Cake', 'Guitar', 'Piano', 'Camera', 'Computer'],
  nature: ['Tree', 'Sun', 'Moon', 'Star', 'Flower', 'Mountain', 'Ocean', 'Rainbow', 'Cloud', 'Snow'],
  activities: ['Running', 'Dancing', 'Singing', 'Painting', 'Swimming', 'Basketball', 'Football', 'Tennis', 'Cooking', 'Reading']
};

export default function WordSelectionScreen({ navigation }: Props) {
  const { gameState, playerId, selectWord, lastCorrectGuess, clearCorrectGuess, cancelGame, wasGameCancelled, clearCancelled, continueNextRound } = useSocket();
  const isFocused = useIsFocused();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const prevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    const phase = gameState?.gameState || null;
    if (!phase) return;
    // Only navigate when this screen is focused (top of stack)
    if (!isFocused) return;
    // If we are showing RoundSummary (lastCorrectGuess present), do not navigate away automatically
    if (lastCorrectGuess && phase !== 'game-over' && phase !== 'waiting') {
      console.log('WordSelectionScreen: Skipping navigation due to lastCorrectGuess present');
      return;
    }
    if (prevPhaseRef.current === phase) return;

    console.log('WordSelectionScreen: Navigating due to phase change:', phase);
    if (phase === 'waiting') {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else if (phase === 'drawing') {
      navigation.replace('Drawing');
    } else if (phase === 'game-over') {
      navigation.replace('GameOver');
    }

    prevPhaseRef.current = phase;
  }, [gameState?.gameState, navigation, isFocused, lastCorrectGuess]);

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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedWord(null);
  };

  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
  };

  const handleConfirmWord = () => {
    if (!selectedWord) {
      Alert.alert('Select a word', 'Please select a word to draw!');
      return;
    }

    if (!gameState || gameState.currentDrawer !== playerId) {
      Alert.alert('Error', 'You are not the current drawer!');
      return;
    }

    setIsSelecting(true);
    selectWord(selectedWord);
  };

  const handleContinueToNextRound = () => {
    clearCorrectGuess();
    // Reset selection state for new round
    setSelectedCategory(null);
    setSelectedWord(null);
    setIsSelecting(false);
    continueNextRound();
  };

  const isCurrentDrawer = gameState?.currentDrawer === playerId;

  // Debug logging
  console.log('WordSelectionScreen - gameState:', gameState?.gameState);
  console.log('WordSelectionScreen - currentDrawer:', gameState?.currentDrawer);
  console.log('WordSelectionScreen - playerId:', playerId);
  console.log('WordSelectionScreen - isCurrentDrawer:', isCurrentDrawer);

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If finished state is received here, the summary screen will handle it
  if (gameState.gameState === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState.gameState !== 'word-selection') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isCurrentDrawer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>Waiting for word selection...</Text>
          <Text style={styles.waitingText}>
            {gameState.players.find(p => p.id === gameState.currentDrawer)?.name} is selecting a word to draw
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a Word to Draw</Text>
          <Text style={styles.subtitle}>Choose a word that others can guess!</Text>
        </View>

        {/* RoundSummary handles correct-guess messaging */}

        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Choose a Category:</Text>
          <View style={styles.categoryGrid}>
            {Object.keys(WORD_CATEGORIES).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonSelected
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextSelected
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedCategory && (
          <View style={styles.wordSection}>
            <Text style={styles.sectionTitle}>Choose a Word:</Text>
            <View style={styles.wordGrid}>
              {WORD_CATEGORIES[selectedCategory as keyof typeof WORD_CATEGORIES].map((word) => (
                <TouchableOpacity
                  key={word}
                  style={[
                    styles.wordButton,
                    selectedWord === word && styles.wordButtonSelected
                  ]}
                  onPress={() => handleWordSelect(word)}
                >
                  <Text style={[
                    styles.wordButtonText,
                    selectedWord === word && styles.wordButtonTextSelected
                  ]}>
                    {word}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedWord && (
          <View style={styles.confirmSection}>
            <Text style={styles.selectedWordText}>Selected: {selectedWord}</Text>
            <TouchableOpacity
              style={[styles.confirmButton, isSelecting && styles.confirmButtonDisabled]}
              onPress={handleConfirmWord}
              disabled={isSelecting}
            >
              <Text style={styles.confirmButtonText}>
                {isSelecting ? 'Starting Game...' : 'Start Drawing!'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
    marginBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  wordSection: {
    marginBottom: 30,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  wordButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  wordButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  wordButtonTextSelected: {
    color: '#ffffff',
  },
  confirmSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  selectedWordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  playersList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  correctGuessContainer: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  correctGuessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  correctGuessText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});
