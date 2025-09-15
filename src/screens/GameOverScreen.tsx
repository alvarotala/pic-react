import React, { useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSocket } from '../context/SocketContext';

type GameOverNavigationProp = StackNavigationProp<RootStackParamList, 'GameOver'>;

interface Props {
  navigation: GameOverNavigationProp;
}

export default function GameOverScreen({ navigation }: Props) {
  const { gameState, clearCorrectGuess } = useSocket();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    clearCorrectGuess();
  }, [clearCorrectGuess]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎉 Game Over! 🎉</Text>
        <Text style={styles.subtitle}>Final Scores:</Text>
        {gameState?.players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <View key={player.id} style={styles.scoreRow}>
              <Text style={styles.rank}>{index + 1}.</Text>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.points}>{player.score} pts</Text>
            </View>
          ))}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rank: {
    width: 24,
    textAlign: 'left',
    color: '#374151',
  },
  playerName: {
    flex: 1,
    color: '#374151',
  },
  points: {
    color: '#6b7280',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});


