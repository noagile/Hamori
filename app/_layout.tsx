import React, { useState, createContext } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

// ボイスインプットの状態を管理するためのコンテキスト
export const AppContext = createContext<{
  voiceInputVisible: boolean;
  setVoiceInputVisible: (visible: boolean) => void;
  voiceText: string;
  setVoiceText: (text: string) => void;
  voiceTags: string[];
  setVoiceTags: (tags: string[]) => void;
  voiceTagDescriptions: Record<string, string>;
  setVoiceTagDescriptions: (descriptions: Record<string, string>) => void;
  restaurantSearchVisible: boolean;
  setRestaurantSearchVisible: (visible: boolean) => void;
}>({
  voiceInputVisible: false,
  setVoiceInputVisible: () => {},
  voiceText: '',
  setVoiceText: () => {},
  voiceTags: [],
  setVoiceTags: () => {},
  voiceTagDescriptions: {},
  setVoiceTagDescriptions: () => {},
  restaurantSearchVisible: false,
  setRestaurantSearchVisible: () => {},
});

// フォントの読み込みが終わるまでSplashScreenを表示
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // アプリ全体で共有する状態
  const [voiceInputVisible, setVoiceInputVisible] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceTags, setVoiceTags] = useState<string[]>([]);
  const [voiceTagDescriptions, setVoiceTagDescriptions] = useState<Record<string, string>>({});
  const [restaurantSearchVisible, setRestaurantSearchVisible] = useState(false);

  useEffect(() => {
    if (error) console.warn(error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppContext.Provider value={{ 
      voiceInputVisible, 
      setVoiceInputVisible, 
      voiceText, 
      setVoiceText, 
      voiceTags, 
      setVoiceTags,
      voiceTagDescriptions,
      setVoiceTagDescriptions,
      restaurantSearchVisible,
      setRestaurantSearchVisible
    }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <Stack initialRouteName="auth">
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
