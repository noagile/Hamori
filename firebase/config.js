// Firebase JS SDK設定ファイル
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';
import Constants from 'expo-constants';

// app.config.jsから設定を取得
const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId
} = Constants.expoConfig?.extra || {};

// Firebase構成
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId
};

// Firebaseアプリの初期化
console.log('Firebaseアプリを初期化中...');
const app = initializeApp(firebaseConfig);

// 認証サービスの初期化
console.log('Firebase認証を初期化中...');
const auth = firebaseAuth.initializeAuth(app, {
  persistence: firebaseAuth.getReactNativePersistence(AsyncStorage)
});

// Firestoreの初期化
console.log('Firestoreを初期化中...');
const firestore = firebaseFirestore.getFirestore(app);

console.log('Firebase設定が完了しました');

export { 
  app, 
  auth, 
  firestore,
  firebaseAuth,
  firebaseFirestore
}; 