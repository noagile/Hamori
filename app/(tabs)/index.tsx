import React, { useContext } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, TouchableWithoutFeedback, Image, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppContext } from '@/app/_layout';

// 画面サイズを取得
const { width, height } = Dimensions.get('window');
// SafeAreaの下部マージン
const BOTTOM_MARGIN = height > 700 ? 100 : 80;

export default function HomeScreen() {
  const { 
    setModeSelectorVisible, 
    activeGroupInfo, 
    setActiveGroupInfo, 
    setActiveGroupId,
    activeGroupId,
    setAppMode
  } = useContext(AppContext);

  // 長押し時にモード選択画面を表示する
  const handleLongPress = () => {
    setModeSelectorVisible(true);
  };

  // グループ表示を閉じる
  const handleCloseGroupDisplay = () => {
    setActiveGroupInfo(null);
    setActiveGroupId(null);
  };
  
  // グループをタップして準備モーダルを開く
  const handleGroupPress = () => {
    if (activeGroupId && activeGroupInfo) {
      // ホーム画面のアクティブなグループがタップされた場合、
      // そのグループで準備モーダルを開く
      setAppMode('group_ready');
    }
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
      
      {/* アクティブなグループがあれば表示 */}
      {activeGroupInfo && (
        <View style={styles.activeGroupContainer}>
          <Pressable 
            style={({pressed}) => [
              styles.activeGroupContent,
              {
                backgroundColor: pressed 
                  ? `${activeGroupInfo.color}15` 
                  : `${activeGroupInfo.color}10`,
                borderColor: pressed 
                  ? `${activeGroupInfo.color}30` 
                  : `${activeGroupInfo.color}20`,
              }
            ]}
            onPress={handleGroupPress}
            android_ripple={{ color: `${activeGroupInfo.color}20` }}
          >
            <LinearGradient
              colors={[`${activeGroupInfo.color}dd`, activeGroupInfo.color]}
              style={styles.groupIconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image 
                source={{ uri: activeGroupInfo.image }} 
                style={styles.groupIcon} 
              />
            </LinearGradient>
            <View style={styles.groupInfoText}>
              <Text style={styles.groupName}>{activeGroupInfo.name}</Text>
              <Text style={styles.groupMembers}>
                <Ionicons name="people" size={12} color="#666" /> {activeGroupInfo.members}人と一緒にハモる
              </Text>
            </View>
            <Pressable 
              style={({pressed}) => [
                styles.closeGroupButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={handleCloseGroupDisplay}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={22} color="#999" />
            </Pressable>
          </Pressable>
        </View>
      )}
      
      {/* 紫色の全画面長押しエリア（ヘッダーと下部ナビゲーションを除く） */}
      <TouchableWithoutFeedback
        onLongPress={handleLongPress}
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
  // アクティブなグループ表示用スタイル
  activeGroupContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeGroupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  groupIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  groupInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 13,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeGroupButton: {
    padding: 6,
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
