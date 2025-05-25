import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // デフォルトのプロフィール画像URL
  const defaultProfileImage = 'https://randomuser.me/api/portraits/lego/1.jpg';
  
  // 匿名ユーザーかどうかをチェック
  const isAnonymous = user?.isAnonymous || false;
  
  // ユーザー名を取得
  const userName = user?.displayName || 'ゲストユーザー';
  
  // メールアドレスを取得
  const userEmail = user?.email || (isAnonymous ? '匿名ログイン中' : '登録情報なし');
  
  // プロフィール画像URL
  const profileImageUrl = user?.photoURL || defaultProfileImage;
  
  // ログアウト処理
  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('ログアウトエラー:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました。もう一度お試しください。');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // アカウント登録画面へ移動
  const navigateToRegister = () => {
    router.push('/auth/register');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: profileImageUrl }} 
          style={styles.profileImage}
          defaultSource={require('../../assets/icon.png')}
        />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>プロフィール編集</Text>
        </TouchableOpacity>
        
        {isAnonymous && (
          <TouchableOpacity style={styles.registerButton} onPress={navigateToRegister}>
            <Text style={styles.registerButtonText}>アカウント登録</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="heart-outline" size={22} color="#666" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>お気に入り店舗</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={22} color="#666" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>訪問履歴</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={22} color="#666" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>設定</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={22} color="#666" style={styles.menuIcon} />
          <Text style={styles.menuItemText}>ヘルプ・お問い合わせ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" style={styles.menuIcon} />
              <Text style={[styles.menuItemText, styles.logoutText]}>ログアウト</Text>
            </>
          )}
        </TouchableOpacity>
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
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutItem: {
    marginTop: 20,
  },
  logoutText: {
    color: '#e74c3c',
  }
}); 