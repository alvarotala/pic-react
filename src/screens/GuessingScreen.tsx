import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import Rive from 'rive-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type GuessingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Guessing'>;
type GuessingScreenRouteProp = RouteProp<RootStackParamList, 'Guessing'>;

interface Props {
  navigation: GuessingScreenNavigationProp;
  route: GuessingScreenRouteProp;
}

export default function GuessingScreen({ navigation, route }: Props) {
  const { word } = route.params;
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleGuess = () => {
    if (!guess.trim()) {
      Alert.alert('Enter a guess', 'Please type your guess before submitting!');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (guess.toLowerCase().trim() === word.toLowerCase()) {
      setIsCorrect(true);
      Alert.alert(
        '🎉 Correct!',
        `You guessed it right! The word was "${word}". It took you ${newAttempts} attempt${newAttempts > 1 ? 's' : ''}.`,
        [
          { text: 'Play Again', onPress: () => navigation.navigate('Home') },
          { text: 'Guess Another', onPress: () => navigation.replace('Guessing', { word: getRandomWord() }) }
        ]
      );
    } else {
      if (newAttempts >= 3) {
        Alert.alert(
          'Game Over!',
          `Sorry, you've used all your attempts. The word was "${word}".`,
          [
            { text: 'Try Again', onPress: () => navigation.navigate('Home') }
          ]
        );
      } else {
        Alert.alert(
          'Not quite right!',
          `Try again! You have ${3 - newAttempts} attempt${3 - newAttempts > 1 ? 's' : ''} left.`,
          [{ text: 'OK' }]
        );
      }
    }
    
    setGuess('');
  };

  const getRandomWord = () => {
    const words = [
      'Cat', 'Dog', 'House', 'Tree', 'Car', 'Sun', 'Moon', 'Star',
      'Fish', 'Bird', 'Flower', 'Mountain', 'Ocean', 'Rainbow', 'Butterfly', 'Elephant'
    ];
    return words[Math.floor(Math.random() * words.length)];
  };

  const handleGiveUp = () => {
    Alert.alert(
      'Give Up?',
      `The word was "${word}". Would you like to try another word?`,
      [
        { text: 'Back to Home', onPress: () => navigation.navigate('Home') },
        { text: 'Try Another', onPress: () => navigation.replace('Guessing', { word: getRandomWord() }) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guess the Drawing!</Text>
        <Text style={styles.attemptsText}>Attempts: {attempts}/3</Text>
      </View>

      <View style={styles.animationArea}>
        <View style={styles.riveAnimation}>
          <Rive
            url="https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv"
            style={styles.rivePlayer}
          />
        </View>
        
        <View style={styles.hintArea}>
          <Text style={styles.hintText}>
            Look at the drawing and guess what it is!
          </Text>
          <Text style={styles.wordLengthText}>
            Word length: {word.length} letters
          </Text>
        </View>
      </View>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          value={guess}
          onChangeText={setGuess}
          placeholder="Enter your guess..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isCorrect && attempts < 3}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.guessButton,
              (!guess.trim() || isCorrect || attempts >= 3) && styles.disabledButton
            ]}
            onPress={handleGuess}
            disabled={!guess.trim() || isCorrect || attempts >= 3}
          >
            <Text style={styles.buttonText}>Submit Guess</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.giveUpButton]}
            onPress={handleGiveUp}
          >
            <Text style={styles.buttonText}>Give Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  attemptsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  animationArea: {
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
  riveAnimation: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  rivePlayer: {
    width: '100%',
    height: '100%',
  },
  animationPlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  animationSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  hintArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  hintText: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  wordLengthText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputArea: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  guessButton: {
    backgroundColor: '#10b981',
  },
  giveUpButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
