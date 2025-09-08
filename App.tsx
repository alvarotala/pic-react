import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import DrawingScreen from './src/screens/DrawingScreen';
import GuessingScreen from './src/screens/GuessingScreen';

export type RootStackParamList = {
  Home: undefined;
  Drawing: { word: string };
  Guessing: { word: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
              options={{ title: 'Pictionary' }}
            />
            <Stack.Screen 
              name="Drawing" 
              component={DrawingScreen} 
              options={{ title: 'Draw It!' }}
            />
            <Stack.Screen 
              name="Guessing" 
              component={GuessingScreen} 
              options={{ title: 'Guess It!' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}