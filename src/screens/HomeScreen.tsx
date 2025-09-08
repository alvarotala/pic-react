import React, { useState } from 'react';
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
import Rive from 'rive-react-native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const WORDS = [
  'Cat', 'Dog', 'House', 'Tree', 'Car', 'Sun', 'Moon', 'Star',
  'Fish', 'Bird', 'Flower', 'Mountain', 'Ocean', 'Rainbow', 'Butterfly', 'Elephant'
];

export default function HomeScreen({ navigation }: Props) {
  const [selectedWord, setSelectedWord] = useState<string>('');

  const handleStartDrawing = () => {
    if (!selectedWord) {
      Alert.alert('Please select a word', 'Choose a word to draw!');
      return;
    }
    navigation.navigate('Drawing', { word: selectedWord });
  };

  const handleStartGuessing = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    navigation.navigate('Guessing', { word: randomWord });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.animationContainer}>
          <Rive
            url="https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv"
            artboardName="Avatar 1"
            stateMachineName="avatar"
            style={styles.riveAnimation}
          />
        </View>
        <Text style={styles.title}>🎨 Pictionary Game</Text>
        <Text style={styles.subtitle}>Draw and guess words with friends!</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a word to draw:</Text>
          <View style={styles.wordGrid}>
            {WORDS.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.wordButton,
                  selectedWord === word && styles.selectedWordButton
                ]}
                onPress={() => setSelectedWord(word)}
              >
                <Text style={[
                  styles.wordText,
                  selectedWord === word && styles.selectedWordText
                ]}>
                  {word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.drawButton]}
            onPress={handleStartDrawing}
          >
            <Text style={styles.buttonText}>🎨 Start Drawing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.guessButton]}
            onPress={handleStartGuessing}
          >
            <Text style={styles.buttonText}>🤔 Start Guessing</Text>
          </TouchableOpacity>
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
  animationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riveAnimation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  wordButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  selectedWordButton: {
    backgroundColor: '#6366f1',
  },
  wordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  selectedWordText: {
    color: '#ffffff',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  drawButton: {
    backgroundColor: '#10b981',
  },
  guessButton: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
