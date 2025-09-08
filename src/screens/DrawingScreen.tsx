import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import DrawingCanvas from '../components/DrawingCanvas';

type DrawingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Drawing'>;
type DrawingScreenRouteProp = RouteProp<RootStackParamList, 'Drawing'>;

interface Props {
  navigation: DrawingScreenNavigationProp;
  route: DrawingScreenRouteProp;
}


export default function DrawingScreen({ navigation, route }: Props) {
  const { word } = route.params;
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Clear the timer immediately when time runs out
          clearTimer();
          setIsFinished(true);
          Alert.alert('Time\'s up!', 'Great job drawing!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [navigation]);

  const handleDrawingChange = (drawing: boolean) => {
    setIsDrawing(drawing);
  };

  const handleFinishDrawing = () => {
    clearTimer();
    setIsFinished(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordText}>Draw: {isFinished ? word : '?'}</Text>
        <Text style={styles.timerText}>Time: {timeLeft}s</Text>
      </View>

      <View style={styles.drawingArea}>
        <DrawingCanvas
          style={styles.drawingCanvas}
          onDrawingChange={handleDrawingChange}
          disabled={isFinished}
        />
      </View>

      {!isFinished && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, styles.finishButton]}
            onPress={handleFinishDrawing}
          >
            <Text style={styles.buttonText}>Finish Drawing</Text>
          </TouchableOpacity>
        </View>
      )}
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
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
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
  controls: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
