import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { RootNavigator } from './src/presentation/navigation/RootNavigator';
import { useHealthStore } from './src/presentation/state/useHealthStore';
import { useTheme } from './src/core/theme/useTheme';

export default function App() {
  const initializeStore = useHealthStore((state) => state.initializeStore);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
