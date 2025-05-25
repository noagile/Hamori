import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, loginAnonymously, error } = useAuth();

  const handleRegister = async () => {
    // 入力チェック
    if (!email || !password || !confirmPassword) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードと確認用パスワードが一致しません');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で設定してください');
      return;
    }
    
    setIsLoading(true);
    try {
      // Firebase Authで新規ユーザー登録
      // displayNameが空の場合は、メールアドレスの@より前の部分を使用
      const userDisplayName = displayName || email.split('@')[0];
      await register(email, password, userDisplayName);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('登録エラー:', error);
      Alert.alert('登録エラー', error.message || '登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      // Firebase匿名認証でログイン
      await loginAnonymously();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('匿名ログインエラー:', error);
      Alert.alert('匿名ログインエラー', error.message || '匿名ログインに失敗しました。しばらくしてから再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Hamori</Text>
        <Text style={styles.subtitle}>飲食店探しをより楽しく簡単に。</Text>
      </View>

      <Text style={styles.formTitle}>新規登録</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="表示名（任意）"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          placeholderTextColor="#999"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="パスワード（半角英数字8文字以上）"
          value={password}
          onChangeText={setPassword}
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

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="パスワード（確認用）"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          placeholderTextColor="#999"
          editable={!isLoading}
        />
        <Pressable
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isLoading}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color="#999"
          />
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>新規登録</Text>
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
        <Text style={styles.footerText}>アカウントをお持ちの方は</Text>
        <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
          <Text style={styles.footerLink}>こちら</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default RegisterForm; 