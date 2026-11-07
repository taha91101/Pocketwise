import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Image } from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { useTheme } from './src/hooks/useTheme';
import { RootNavigator } from './src/navigation/RootNavigator';

// Keep the native splash screen visible while we hydrate
SplashScreen.preventAutoHideAsync();

function MainApp() {
  const { isDark } = useTheme();
  const isHydrated = useAppStore((state) => state.isHydrated);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Once hydrated, hide the native splash and reveal the app
  const onAppReady = useCallback(async () => {
    if (isHydrated) {
      await SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  // Show our full custom splash image while loading
  if (!isHydrated) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <StatusBar style="dark" />
        <Image
          source={require('./assets/splash.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onAppReady}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <MainApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
