import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={styles.profileImage} 
        />
        <Text style={styles.userName}>ユーザー名</Text>
        <Text style={styles.userEmail}>user@example.com</Text>
        
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>プロフィール編集</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>お気に入り店舗</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>訪問履歴</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>設定</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>ヘルプ・お問い合わせ</Text>
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
  },
  editButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  }
}); 