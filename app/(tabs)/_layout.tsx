import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import BottomNav from '@/components/BottomNav';
import VoiceInput from '@/components/VoiceInput';
import { AppContext } from '@/app/_layout';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { voiceInputVisible, setVoiceInputVisible, setVoiceText, setVoiceTags } = useContext(AppContext);

  const handleVoiceSubmit = (text: string, tags?: string[]) => {
    console.log('音声入力の結果を処理します:', { text, tags });
    setVoiceText(text);
    if (tags && tags.length > 0) {
      // タグ情報をコンテキストに保存
      console.log('タグを保存します:', tags);
      setVoiceTags(tags);
    }
    setVoiceInputVisible(false);
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // 標準のタブバーを非表示
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="main" />
        <Tabs.Screen name="profile" />
      </Tabs>
      
      {/* カスタムナビゲーションバー - モーダル表示時には非表示 */}
      {!voiceInputVisible && <BottomNav />}
      
      {/* 音声入力コンポーネント - 最上位レベルに配置してzIndex問題を解決 */}
      <VoiceInput
        isVisible={voiceInputVisible}
        onClose={() => setVoiceInputVisible(false)}
        onSubmit={handleVoiceSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
