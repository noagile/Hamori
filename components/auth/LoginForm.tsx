import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { login, loginAnonymously, error: globalError } = useAuth();

  // 入力フォームの検証
  const validateForm = () => {
    if (!email) {
      setLocalError('メールアドレスを入力してください');
      return false;
    }
    
    if (!password) {
      setLocalError('パスワードを入力してください');
      return false;
    }
    
    // 基本的なメールアドレス形式の検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('有効なメールアドレスを入力してください');
      return false;
    }
    
    setLocalError(null);
    return true;
  };

  const handleLogin = async () => {
    // フォーム検証
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    
    try {
      // Firebase Authでログイン
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('ログインエラー:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = 'ログインに失敗しました';
      
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
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      }
      
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setLocalError(null);
    
    try {
      // Firebase匿名認証でログイン
      await loginAnonymously();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('匿名ログインエラー:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = '匿名ログインに失敗しました';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '匿名認証が有効になっていません';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください';
      }
      
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  // フォームをリセット
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setLocalError(null);
  };

  // 表示するエラーメッセージを決定
  const displayError = localError || globalError;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Hamori</Text>
        <Text style={styles.subtitle}>飲食店探しをより楽しく簡単に。</Text>
      </View>

      <Text style={styles.formTitle}>ログイン</Text>

      {displayError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, localError && email === '' && styles.inputError]}
          placeholder="メールアドレス"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setLocalError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, localError && password === '' && styles.inputError]}
          placeholder="パスワード（半角英数字8文字以上）"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLocalError(null);
          }}
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
          editable={!isLoading}
        />
        <Pressable
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color="#999"
          />
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>ログイン</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>もしくは</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={handleGuestLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <Text style={styles.guestButtonText}>ゲストとして始める</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>アカウントをお持ちでない方は</Text>
        <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
          <Text style={styles.footerLink}>こちら</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f5f5f7',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#ffeeee',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6c5ce7',
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 16,
  },
  guestButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    width: '80%',
  },
  guestButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#6c5ce7',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  }
});

export default LoginForm; 