import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SocketProvider } from './src/context/SocketContext';
import HomeScreen from './src/screens/HomeScreen';
import WordSelectionScreen from './src/screens/WordSelectionScreen';
import DrawingScreen from './src/screens/DrawingScreen';
import RoundSummaryScreen from './src/screens/RoundSummaryScreen';
import GameOverScreen from './src/screens/GameOverScreen';

export type RootStackParamList = {
  Home: undefined;
  WordSelection: undefined;
  Drawing: undefined;
  RoundSummary: undefined;
  GameOver: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SocketProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#6366f1',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'Pictionary Mobile' }}
              />
              <Stack.Screen 
                name="WordSelection" 
                component={WordSelectionScreen} 
                options={{ title: 'Select Word' }}
              />
              <Stack.Screen 
                name="Drawing" 
                component={DrawingScreen} 
                options={{ title: 'Drawing' }}
              />
              <Stack.Screen 
                name="RoundSummary" 
                component={RoundSummaryScreen} 
                options={{ title: 'Round Summary' }}
              />
              <Stack.Screen 
                name="GameOver" 
                component={GameOverScreen} 
                options={{ title: 'Game Over' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SocketProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}