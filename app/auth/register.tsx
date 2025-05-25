import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { user } = useAuth();
  
  // ユーザーがすでにログインしている場合、タブ画面にリダイレクト
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <RegisterForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
}); 