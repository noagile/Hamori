import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>プロフィール設定</Text>
      <Text style={styles.subtitle}>この画面は開発中です</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 