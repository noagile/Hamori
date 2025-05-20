import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MainScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        <View style={styles.iconButton}>
          <IconSymbol name="bell" size={24} color="#333" />
        </View>
        <Text style={styles.title}>Hamori</Text>
        <View style={styles.iconButton}>
          <IconSymbol name="bag" size={24} color="#333" />
        </View>
      </View>
      
      {/* コンテンツ部分 */}
      <View style={styles.content}>
        {/* 店舗名エリア */}
        <View style={styles.shopArea}>
          <Text style={styles.shopName}>ブラックハモりん</Text>
        </View>
        
        {/* ポイント表示エリア */}
        <View style={styles.pointArea}>
          <Image 
            source={require('@/assets/icons/Hamori-black.png')} 
            style={styles.pointIcon} 
          />
        </View>
        
        {/* プログレスバー */}
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['#8e7ce7', '#6c5ce7']}
            style={styles.progressBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        
        {/* ポイント情報 */}
        <Text style={styles.pointInfo}>次の段階まであと -109ポイント</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  shopArea: {
    marginBottom: 40,
    padding: 15,
    paddingHorizontal: 30,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  shopName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointArea: {
    marginVertical: 40,
    alignItems: 'center',
  },
  pointIcon: {
    width: 120,
    height: 120,
  },
  progressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 60,
    overflow: 'hidden',
  },
  progressBar: {
    width: '85%',
    height: '100%',
    borderRadius: 5,
  },
  pointInfo: {
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
}); 