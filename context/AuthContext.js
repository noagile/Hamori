import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase JS SDKをインポート
import { auth, firestore, firebaseAuth, firebaseFirestore } from '../firebase/config';

// ストレージキー
const AUTH_USER_KEY = '@hamori_auth_user';
const USERS_STORAGE_KEY = '@hamori_users';
const POSTS_STORAGE_KEY = '@hamori_posts';
const LIKES_STORAGE_KEY = '@hamori_likes';

// モックデータ初期化
const initializeStorage = async () => {
  try {
    // ユーザーデータが存在するか確認
    const users = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!users) {
      // 初期ユーザーデータ
      const initialUsers = {
        'demo@example.com': {
          uid: 'user-1',
          email: 'demo@example.com',
          password: 'password123',
          displayName: 'デモユーザー',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      };
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      console.log('初期ユーザーデータを作成しました');
    }
    
    // 投稿データが存在するか確認
    const posts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
    if (!posts) {
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify([]));
      console.log('投稿データストアを初期化しました');
    }
    
    // いいねデータが存在するか確認
    const likes = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
    if (!likes) {
      await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify({}));
      console.log('いいねデータストアを初期化しました');
    }
  } catch (error) {
    console.error('データストア初期化エラー:', error);
  }
};

// データベース操作のユーティリティ
const localDB = {
  // ユーザー関連操作
  users: {
    get: async (userId) => {
      try {
        const users = JSON.parse(await AsyncStorage.getItem(USERS_STORAGE_KEY) || '{}');
        return users[userId] || null;
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
        return null;
      }
    },
    getByEmail: async (email) => {
      try {
        const users = JSON.parse(await AsyncStorage.getItem(USERS_STORAGE_KEY) || '{}');
        return Object.values(users).find(user => user.email === email) || null;
      } catch (error) {
        console.error('メールでのユーザー検索エラー:', error);
        return null;
      }
    },
    create: async (userData) => {
      try {
        const users = JSON.parse(await AsyncStorage.getItem(USERS_STORAGE_KEY) || '{}');
        const uid = `user-${Date.now()}`;
        const newUser = {
          uid,
          ...userData,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        users[newUser.email] = newUser;
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return newUser;
      } catch (error) {
        console.error('ユーザー作成エラー:', error);
        throw error;
      }
    },
    update: async (email, updates) => {
      try {
        const users = JSON.parse(await AsyncStorage.getItem(USERS_STORAGE_KEY) || '{}');
        if (users[email]) {
          users[email] = { ...users[email], ...updates, updatedAt: new Date().toISOString() };
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
          return users[email];
        }
        throw new Error('ユーザーが見つかりません');
      } catch (error) {
        console.error('ユーザー更新エラー:', error);
        throw error;
      }
    }
  },
  
  // 投稿関連操作
  posts: {
    getAll: async () => {
      try {
        return JSON.parse(await AsyncStorage.getItem(POSTS_STORAGE_KEY) || '[]');
      } catch (error) {
        console.error('投稿一覧取得エラー:', error);
        return [];
      }
    },
    add: async (postData) => {
      try {
        const posts = JSON.parse(await AsyncStorage.getItem(POSTS_STORAGE_KEY) || '[]');
        const newPost = {
          id: `post-${Date.now()}`,
          ...postData,
          createdAt: new Date().toISOString()
        };
        posts.push(newPost);
        await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
        return newPost;
      } catch (error) {
        console.error('投稿作成エラー:', error);
        throw error;
      }
    },
    getByUser: async (userId) => {
      try {
        const posts = JSON.parse(await AsyncStorage.getItem(POSTS_STORAGE_KEY) || '[]');
        return posts.filter(post => post.userId === userId);
      } catch (error) {
        console.error('ユーザー投稿取得エラー:', error);
        return [];
      }
    }
  }
};

// 認証コンテキストの作成
export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  register: async (email, password, displayName) => {},
  login: async (email, password) => {},
  loginAnonymously: async () => {},
  logout: async () => {},
  db: firestore
});

// コンテキストのプロバイダーコンポーネント
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 認証状態を監視
  useEffect(() => {
    console.log('[AuthContext] 認証状態の監視を開始');
    
    // Firebase認証が初期化されていることを確認
    if (!auth) {
      console.error('[AuthContext] Firebase認証が初期化されていません');
      setError('Firebase認証が初期化されていません');
      setLoading(false);
      return;
    }
    
    // キャッシュからユーザー情報を取得
    const loadCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) {
          console.log('[AuthContext] キャッシュからユーザー情報を読み込みました');
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.warn('[AuthContext] キャッシュからの読み込みエラー:', error);
      }
    };

    loadCachedUser();
    
    let unsubscribe = () => {};
    
    // Firebase認証状態の購読設定（安全に実行）
    try {
      unsubscribe = firebaseAuth.onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            console.log('[AuthContext] ユーザーがログイン中:', firebaseUser.uid);
            
            // Firebase Userオブジェクトから必要な情報を抽出
            const userInfo = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isAnonymous: firebaseUser.isAnonymous,
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL
            };
            
            // 追加のユーザー情報をFirestoreから取得
            try {
              const userDocRef = firebaseFirestore.doc(firestore, 'users', firebaseUser.uid);
              const userDoc = await firebaseFirestore.getDoc(userDocRef);
              if (userDoc.exists()) {
                // FirestoreデータとFirebaseユーザーデータをマージ
                const userData = { ...userInfo, ...userDoc.data() };
                setUser(userData);
                // キャッシュに保存
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
              } else {
                // Firestoreにデータがない場合は基本情報のみを使用
                setUser(userInfo);
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo));
                
                // 必要に応じてFirestoreにユーザー情報を作成（エラーを無視）
                try {
                  await firebaseFirestore.setDoc(userDocRef, {
                    ...userInfo,
                    createdAt: firebaseFirestore.serverTimestamp(),
                    lastLoginAt: firebaseFirestore.serverTimestamp()
                  });
                } catch (createError) {
                  console.warn('[AuthContext] 新規ユーザー情報の作成に失敗しました（権限不足の可能性）:', createError);
                }
              }
            } catch (firestoreError) {
              console.warn('[AuthContext] Firestoreからのデータ取得エラー:', firestoreError);
              // Firestoreエラーが発生しても認証は継続する
              console.log('[AuthContext] Firestoreエラーを無視してユーザー情報を設定します');
              setUser(userInfo);
              await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo));
            }
          } else {
            console.log('[AuthContext] ユーザーはログアウト状態');
            setUser(null);
            await AsyncStorage.removeItem(AUTH_USER_KEY);
          }
        } catch (error) {
          console.error('[AuthContext] 認証状態処理エラー:', error);
          setError('認証状態の処理中にエラーが発生しました');
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('[AuthContext] 認証監視設定エラー:', error);
      setError('認証状態の監視設定に失敗しました');
      setLoading(false);
    }

    // クリーンアップ関数
    return () => {
      console.log('[AuthContext] 認証状態監視をクリーンアップ');
      unsubscribe();
    };
  }, []);

  // メールアドレスとパスワードで登録
  const register = async (email, password, displayName) => {
    console.log('[AuthContext] 新規ユーザー登録:', { email, displayNameLength: displayName?.length });
    
    setLoading(true);
    setError(null);
    
    try {
      // Firebase認証でユーザー作成
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      
      // 表示名を設定
      if (displayName) {
        await firebaseAuth.updateProfile(userCredential.user, { displayName });
      }
      
      console.log('[AuthContext] ユーザー登録成功:', userCredential.user.uid);
      
      // ユーザー情報を作成
      const userData = {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isAnonymous: false
      };
      
      // AsyncStorageに保存
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
      // Firestoreにユーザープロファイルを保存（権限エラー対応）
      try {
        const userDocRef = firebaseFirestore.doc(firestore, 'users', userCredential.user.uid);
        await firebaseFirestore.setDoc(userDocRef, {
          ...userData,
          createdAt: firebaseFirestore.serverTimestamp(),
          lastLoginAt: firebaseFirestore.serverTimestamp()
        });
        console.log('[AuthContext] ユーザー情報をFirestoreに保存しました');
      } catch (firestoreError) {
        // Firestoreへの保存エラーはログに残すが、登録処理自体は続行
        console.warn('[AuthContext] Firestoreへのユーザー情報保存に失敗しました（権限不足の可能性）:', firestoreError);
        console.log('[AuthContext] ローカルのみにユーザー情報を保存して続行します');
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('[AuthContext] 登録エラー:', error);
      
      let errorMessage = '登録処理中にエラーが発生しました';
      
      // Firebase認証エラーの日本語化
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます。より強力なパスワードを設定してください';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'この認証方法は現在有効になっていません';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // メールアドレスとパスワードでログイン
  const login = async (email, password) => {
    console.log('[AuthContext] ログイン試行:', { email });
    
    setLoading(true);
    setError(null);
    
    try {
      // Firebase認証でログイン
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] ログイン成功:', userCredential.user.uid);
      
      // ユーザー情報の基本データを作成
      const userInfo = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || email.split('@')[0],
        isAnonymous: false,
        lastLoginAt: new Date().toISOString()
      };
      
      // AsyncStorageに保存
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      
      // ログイン日時を更新（Firestoreエラー対応）
      try {
        const userDocRef = firebaseFirestore.doc(firestore, 'users', userCredential.user.uid);
        await firebaseFirestore.updateDoc(userDocRef, {
          lastLoginAt: firebaseFirestore.serverTimestamp()
        });
        console.log('[AuthContext] Firestoreのログイン日時を更新しました');
      } catch (firestoreError) {
        console.warn('[AuthContext] Firestoreのログイン日時更新に失敗しました:', firestoreError);
        
        // ドキュメントが存在しない場合または権限エラーの場合
        try {
          const userDocRef = firebaseFirestore.doc(firestore, 'users', userCredential.user.uid);
          await firebaseFirestore.setDoc(userDocRef, {
            ...userInfo,
            createdAt: firebaseFirestore.serverTimestamp(),
            lastLoginAt: firebaseFirestore.serverTimestamp()
          });
          console.log('[AuthContext] ユーザー情報をFirestoreに新規作成しました');
        } catch (createError) {
          console.warn('[AuthContext] Firestoreへのユーザー情報作成に失敗しました（権限不足の可能性）:', createError);
          console.log('[AuthContext] ローカルのみにユーザー情報を保存して続行します');
        }
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('[AuthContext] ログインエラー:', error);
      
      let errorMessage = 'ログイン処理中にエラーが発生しました';
      
      // Firebase認証エラーの日本語化
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'このアカウントは無効になっています';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'ユーザーが見つかりません';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが正しくありません';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてお試しください';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 匿名ログイン
  const loginAnonymously = async () => {
    console.log('[AuthContext] 匿名ログイン試行');
    
    setLoading(true);
    setError(null);
    
    try {
      // Firebase匿名認証
      const userCredential = await firebaseAuth.signInAnonymously(auth);
      console.log('[AuthContext] 匿名ログイン成功:', userCredential.user.uid);
      
      // 匿名ユーザー情報をFirestoreに保存（権限エラー対応）
      try {
        const userDocRef = firebaseFirestore.doc(firestore, 'users', userCredential.user.uid);
        await firebaseFirestore.setDoc(userDocRef, {
          uid: userCredential.user.uid,
          isAnonymous: true,
          createdAt: firebaseFirestore.serverTimestamp(),
          lastLoginAt: firebaseFirestore.serverTimestamp()
        });
        console.log('[AuthContext] 匿名ユーザー情報をFirestoreに保存しました');
      } catch (firestoreError) {
        // Firestoreの権限エラーはデータ保存の問題なので、認証自体は続行する
        console.warn('[AuthContext] Firestoreへのデータ保存エラー（権限不足の可能性）:', firestoreError);
        
        // Firestoreエラーでも基本的なユーザー情報は保存する
        const userInfo = {
          uid: userCredential.user.uid,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        
        // AsyncStorageにユーザー情報を保存
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userInfo));
        setUser(userInfo);
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('[AuthContext] 匿名ログインエラー:', error);
      
      let errorMessage = '匿名ログイン処理中にエラーが発生しました';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '匿名認証が有効になっていません';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    console.log('[AuthContext] ログアウト試行');
    
    setLoading(true);
    setError(null);
    
    try {
      await firebaseAuth.signOut(auth);
      console.log('[AuthContext] ログアウト成功');
    } catch (error) {
      console.error('[AuthContext] ログアウトエラー:', error);
      setError('ログアウト処理中にエラーが発生しました');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // コンテキスト値
  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginAnonymously,
    logout,
    db: firestore
  };

  // エラー画面
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>認証エラー</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.helpText}>
          アプリを再起動するか、サポートに問い合わせてください。
        </Text>
      </View>
    );
  }

  // ローディング画面
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>認証情報を確認中...</Text>
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// スタイル
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555'
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  helpText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8
  }
});

// カスタムフック
export const useAuth = () => {
  return useContext(AuthContext);
}; 