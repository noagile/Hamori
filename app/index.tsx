import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  
  // ユーザーがログイン済みならタブ画面へ、そうでなければログイン画面へリダイレクト
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/auth/login" />;
} 