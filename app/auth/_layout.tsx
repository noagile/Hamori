import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{ 
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            animation: 'slide_from_right'
          }} 
        />
      </Stack>
    </>
  );
} 