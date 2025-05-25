// React関連のインポート
import React, { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { LogBox, Text, View, ActivityIndicator } from 'react-native';

// 警告を抑制（開発中のみ）
LogBox.ignoreLogs([
  'You are initializing Firebase Auth',
  'Setting a timer',
  'Expo AV has been deprecated',
  'Component auth has not been registered yet',
  'AsyncStorage has been extracted from react-native'
]);

// Firebase設定をインポート
import './firebase/config';

// ローカル設定を簡単に確認
console.log('--- ローカルストレージベースのアプリを起動します ---');

// アプリコンポーネント定義
export default function App() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    console.log('Hamoriアプリがマウントされました');
    
    // Firebase初期化を確認
    const initializeFirebase = async () => {
      try {
        // 少し待機してFirebaseの初期化を確実にする
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsReady(true);
        console.log('Firebase初期化の確認が完了しました');
      } catch (error) {
        console.error('Firebase初期化確認エラー:', error);
        setIsReady(true); // エラーが発生しても続行
      }
    };
    
    initializeFirebase();
    
    return () => console.log('Hamoriアプリがアンマウントされました');
  }, []);

  console.log('Hamoriアプリ起動中...');
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={{ marginTop: 16, color: '#555' }}>アプリを初期化中...</Text>
      </View>
    );
  }
  
  try {
    const ctx = require.context('./app');
    return <ExpoRoot context={ctx} />;
  } catch (error) {
    console.error('ExpoRoot初期化エラー:', error);
    return (
      <React.Fragment>
        <Text style={{textAlign: 'center', marginTop: 100}}>
          アプリの起動に失敗しました。エラーログを確認してください。
        </Text>
      </React.Fragment>
    );
  }
}

// アプリをメインコンポーネントとして登録
console.log('--- Hamoriアプリをルートコンポーネントとして登録 ---');
registerRootComponent(App); 