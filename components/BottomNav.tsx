import { View, Text, StyleSheet, Pressable, Image, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useContext } from 'react';
import { BlurView } from 'expo-blur';
import { AppContext } from '@/app/_layout';

interface BottomNavProps {
  onHomePress?: () => void;
  onMainPress?: () => void;
  onProfilePress?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  onHomePress = () => router.push('/(tabs)/index'),
  onMainPress = () => router.push('/(tabs)/index'),
  onProfilePress = () => router.push('/(tabs)/profile')
}) => {
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const { setVoiceInputVisible } = useContext(AppContext);

  useEffect(() => {
    Animated.timing(translateYAnim, {
      toValue: 0,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleHamoriPress = () => {
    setVoiceInputVisible(true);
  };

  return (
    <BlurView intensity={15} tint="light" style={styles.btmNav}>
      <Pressable style={styles.btmNavIcon} onPress={onHomePress}>
        <View style={styles.iconBorder}>
          <View style={styles.personIcon} />
        </View>
      </Pressable>
      
      <Animated.View 
        style={[
          styles.btmNavHamori, 
          { transform: [{ translateY: translateYAnim }] }
        ]}
      >
        <Pressable onPress={handleHamoriPress} style={styles.btmNavHamoriBtn}>
          <LinearGradient 
            style={styles.btmNavGradient} 
            colors={['#8e7ce7', '#6c5ce7']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Image 
            source={require('@/assets/icons/Hamori-white.png')} 
            style={styles.btmNavHamoriIcon}
            resizeMode="contain"
          />
        </Pressable>
      </Animated.View>
      
      <Pressable style={styles.profileBtn} onPress={onProfilePress}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={styles.userIcon}
        />
      </Pressable>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  btmNav: {
    paddingTop: 8,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  btmNavIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBorder: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  personIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    marginBottom: 2,
    position: 'relative',
    top: -3,
  },
  btmNavHamori: {
    position: 'relative',
    top: -15,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  btmNavHamoriBtn: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  btmNavGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  btmNavHamoriIcon: {
    width: 36,
    height: 36,
  },
  profileBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  }
});

export default BottomNav; 