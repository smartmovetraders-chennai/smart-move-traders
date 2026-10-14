import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import BrandSplashScreen from './src/components/BrandSplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={showSplash ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
      {showSplash ? (
        <BrandSplashScreen onFinish={() => setShowSplash(false)} />
      ) : null}
    </SafeAreaProvider>
  );
}
