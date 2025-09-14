import React, { useState, useEffect } from 'react';
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
  const { gameState, playerId, selectWord } = useSocket();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (gameState) {
      if (gameState.gameState === 'waiting') {
        navigation.navigate('Home');
      } else if (gameState.gameState === 'drawing') {
        navigation.navigate('Drawing');
      } else if (gameState.gameState === 'finished' || gameState.gameState === 'game-over') {
        navigation.navigate('Guessing');
      }
    }
  }, [gameState, navigation]);

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

  const isCurrentDrawer = gameState?.currentDrawer === playerId;

  // Debug logging
  console.log('WordSelectionScreen - gameState:', gameState?.gameState);
  console.log('WordSelectionScreen - currentDrawer:', gameState?.currentDrawer);
  console.log('WordSelectionScreen - playerId:', playerId);
  console.log('WordSelectionScreen - isCurrentDrawer:', isCurrentDrawer);

  if (!gameState || gameState.gameState !== 'word-selection') {
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
});
