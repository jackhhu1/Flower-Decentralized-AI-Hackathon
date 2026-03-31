import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import EducationScreen from './src/screens/EducationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DermatologistMode from './src/screens/DermatologistMode';
import AnalysisReview from './src/screens/AnalysisReview';
import { theme } from './src/theme/theme';

const Stack = createStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          'Roboto': require('react-native-vector-icons/Fonts/Roboto.ttf'),
          'Roboto_medium': require('react-native-vector-icons/Fonts/Roboto_medium.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
          />
          <Stack.Screen 
            name="Results" 
            component={ResultsScreen} 
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen} 
          />
              <Stack.Screen 
                name="Education" 
                component={EducationScreen} 
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen} 
              />
              <Stack.Screen 
                name="DermatologistMode" 
                component={DermatologistMode} 
              />
              <Stack.Screen 
                name="AnalysisReview" 
                component={AnalysisReview} 
              />
            </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
