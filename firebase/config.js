// Firebase JS SDK設定ファイル
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';

// Firebase構成
const firebaseConfig = {
  apiKey: "AIzaSyBWnboZ-O4csFJgu7Y64tZPhMuR_K73-oE",
  authDomain: "hamori-c0c72.firebaseapp.com",
  projectId: "hamori-c0c72",
  storageBucket: "hamori-c0c72.firebasestorage.app",
  messagingSenderId: "264717257563",
  appId: "1:264717257563:web:663f405c5b11ddee35287e"
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