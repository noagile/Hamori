import React, { useContext } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppContext } from '@/app/_layout';

// 画面サイズを取得
const { width, height } = Dimensions.get('window');
// SafeAreaの下部マージン
const BOTTOM_MARGIN = height > 700 ? 100 : 80;

export default function HomeScreen() {
  const { setVoiceInputVisible } = useContext(AppContext);

  // 音声入力モーダルを開くハンドラー
  const handleVoiceInputOpen = () => {
    setVoiceInputVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        <View style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </View>
        <Text style={styles.title}>Hamori</Text>
        <View style={styles.iconButton}>
          <Ionicons name="search-outline" size={24} color="#333" />
        </View>
      </View>
      
      {/* 紫色の全画面長押しエリア（ヘッダーと下部ナビゲーションを除く） */}
      <TouchableWithoutFeedback
        onLongPress={handleVoiceInputOpen}
        delayLongPress={500} // 500ms長押しでモーダル表示
      >
        <View style={styles.touchableArea}>
          <LinearGradient
            colors={['#8e7ce7', '#6c5ce7']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* 未来感を演出するアニメーショングラフィック（静的表現） */}
            {/* <View style={styles.futuristicCircle} />
            <View style={styles.futuristicCircleSmall} /> */}
            
            {/* コンテンツは空にする */}
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
      
      {/* スペース確保（ボトムナビゲーション用） */}
      <View style={{ height: BOTTOM_MARGIN }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  touchableArea: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // 未来感を演出する要素
  futuristicCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -100,
  },
  futuristicCircleSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },
});
