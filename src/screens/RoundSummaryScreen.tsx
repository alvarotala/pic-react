import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';

type RoundSummaryNavigationProp = StackNavigationProp<RootStackParamList, 'RoundSummary'>;

interface Props {
  navigation: RoundSummaryNavigationProp;
}

export default function RoundSummaryScreen({ navigation }: Props) {
  const { lastCorrectGuess, continueNextRound, cancelGame, gameState, clearCorrectGuess } = useSocket();
  const isContinuingRef = useRef(false);

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

  // No-op to avoid unused variable warning if needed

  // Clear correct guess when component unmounts to prevent navigation issues
  useEffect(() => {
    return () => {
      console.log('RoundSummaryScreen unmounting, clearing correct guess');
      clearCorrectGuess();
    };
  }, [clearCorrectGuess]);

  // Explicitly ignore phase changes until Continue is pressed
  useEffect(() => {
    // No navigation side-effect here; we only navigate on Continue
  }, [gameState]);

  if (!lastCorrectGuess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎉 Correct Guess!</Text>
        <Text style={styles.text}>{lastCorrectGuess.playerName} guessed "{lastCorrectGuess.guess}"</Text>
        <Text style={styles.subText}>Time elapsed: {lastCorrectGuess.timeElapsedSeconds}s</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (isContinuingRef.current) {
              console.log('Already continuing, ignoring duplicate press');
              return;
            }
            isContinuingRef.current = true;
            console.log('Continuing to next round, clearing correct guess');
            clearCorrectGuess();
            continueNextRound();
            navigation.replace('WordSelection');
          }}
        >
          <Text style={styles.primaryButtonText}>Continue to Next Round</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});


