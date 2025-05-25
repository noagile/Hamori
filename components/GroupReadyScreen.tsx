import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// モックメンバーデータ（実際の実装ではAPIから取得）
const mockMembers = [
  { id: 'm1', name: '自分', isReady: false, image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'm2', name: '鈴木', isReady: false, image: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { id: 'm3', name: '佐藤', isReady: false, image: 'https://randomuser.me/api/portraits/women/17.jpg' },
  { id: 'm4', name: '田中', isReady: false, image: 'https://randomuser.me/api/portraits/men/67.jpg' },
];

interface GroupReadyScreenProps {
  isVisible: boolean;
  onClose: () => void;
  onAllReady: () => void;
  onBack?: () => void;
  onNotify?: () => void;
  onNoReadyMembers?: () => void;
  groupId: string;
  groupInfo: {
    name: string;
    members: number;
    color: string;
    image: string;
  };
}

const GroupReadyScreen: React.FC<GroupReadyScreenProps> = ({
  isVisible,
  onClose,
  onAllReady,
  onBack,
  onNotify,
  onNoReadyMembers,
  groupId,
  groupInfo
}) => {
  const [slideAnim] = useState(new Animated.Value(700));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [members, setMembers] = useState(mockMembers);
  const [isAllReady, setIsAllReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isNotifying, setIsNotifying] = useState(false);

  // アニメーション効果
  useEffect(() => {
    if (isVisible) {
      // 表示するときのアニメーション
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // 非表示にするときのアニメーション
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 700,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible, slideAnim, overlayOpacity]);

  // 自分の準備状態を変更する
  const toggleMyReadyState = () => {
    const myStatus = members.find(m => m.id === 'm1');
    const willBeReady = myStatus ? !myStatus.isReady : true;
    
    setMembers(prev => 
      prev.map(member => 
        member.id === 'm1' ? {...member, isReady: willBeReady} : member
      )
    );
    
    // 準備完了状態になったら親コンポーネントに通知
    if (willBeReady && onNotify) {
      onNotify();
    }
    
    // 準備完了でない状態になったら、全員が準備完了でないかチェック
    if (!willBeReady) {
      checkNoReadyMembers();
    }
  };

  // 全員が準備完了でないかをチェック
  const checkNoReadyMembers = () => {
    // 自分の準備状態を変更した後の状態を考慮するため、非同期で実行
    setTimeout(() => {
      const anyReady = members.some(member => member.isReady);
      console.log('準備完了チェック:', {anyReady, members: members.map(m => ({id: m.id, ready: m.isReady}))});
      if (!anyReady && onNoReadyMembers) {
        console.log('全員が準備完了でない状態になりました');
        onNoReadyMembers();
      }
    }, 50); // 少し長めの遅延を設定して確実に状態更新後に実行
  };

  // グループメンバーに通知を送信する機能
  const notifyMembers = () => {
    // 通知中の状態を設定
    setIsNotifying(true);

    // グループメンバーへの通知をシミュレート
    setTimeout(() => {
      // 通知完了後にランダムなメンバーを準備完了状態にする
      setMembers(prev => {
        return prev.map(member => {
          if (member.id !== 'm1' && !member.isReady && Math.random() > 0.5) {
            return { ...member, isReady: true };
          }
          return member;
        });
      });
      
      // 通知状態を解除
      setIsNotifying(false);
      
      // 親コンポーネントに通知（ホーム画面にグループ情報を表示するため）
      if (onNotify) {
        onNotify();
      }
      
      // 通知完了のフィードバック
      Alert.alert(
        "通知送信完了",
        `${groupInfo.name}のメンバーに通知を送信しました`,
        [{ text: "OK" }]
      );
    }, 1500);
  };

  // 他のメンバーの準備状態をランダムに変更（デモ用）
  useEffect(() => {
    if (!isVisible) return;

    // ランダムに他のメンバーの準備状態を変更するタイマー
    const timer = setInterval(() => {
      setMembers(prev => {
        // 一旦前の状態を保存
        const prevMembers = [...prev];
        
        // 状態を更新（ランダムに準備完了/未完了を設定）
        const randomMemberId = `m${Math.floor(Math.random() * 3) + 2}`;
        
        // ランダムに準備状態を変更（50%の確率で準備完了、50%の確率で準備未完了）
        const willBeReady = Math.random() > 0.5;
        
        const newMembers = prev.map(member => 
          member.id === randomMemberId ? {...member, isReady: willBeReady} : member
        );
        
        // 準備状態が変わったかチェック
        const randomMemberPrevState = prevMembers.find(m => m.id === randomMemberId)?.isReady || false;
        
        // 準備完了状態に変わった場合は親コンポーネントに通知
        if (!randomMemberPrevState && willBeReady && onNotify) {
          // 少し遅延させて状態更新後に通知
          setTimeout(() => {
            onNotify();
          }, 0);
        }
        
        // 更新後のメンバーで誰か準備完了しているか
        const prevAnyReady = prevMembers.some(member => member.isReady);
        const newAnyReady = newMembers.some(member => member.isReady);
        
        // 全員が準備完了でなくなった場合
        if (prevAnyReady && !newAnyReady && onNoReadyMembers) {
          // 準備完了のメンバーがいた状態から誰も準備完了でない状態になった
          setTimeout(() => {
            onNoReadyMembers();
          }, 0);
        }
        
        return newMembers;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isVisible, onNoReadyMembers, onNotify]);

  // 全員が準備完了したかチェック
  useEffect(() => {
    const allReady = members.every(member => member.isReady);
    if (allReady && !isAllReady) {
      setIsAllReady(true);
      // カウントダウン開始
      setCountdown(3);
    }
  }, [members, isAllReady]);

  // カウントダウン処理
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      // カウントダウン数字拡大・縮小アニメーション
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        })
      ]).start();
      
      const timer = setTimeout(() => {
        setCountdown(prev => prev !== null ? prev - 1 : null);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // カウントダウン終了、準備完了画面はそのままで音声入力に進む処理を親コンポーネントに通知
      onAllReady();
    }
  }, [countdown, onAllReady, scaleAnim]);

  // モーダルを閉じる
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
      // 状態をリセット
      setMembers(mockMembers);
      setIsAllReady(false);
      setCountdown(null);
    });
  };

  // 準備完了ボタン
  const renderReadyButton = () => {
    const myStatus = members.find(m => m.id === 'm1');
    const isReady = myStatus?.isReady || false;

    return (
      <Pressable 
        style={[
          styles.readyButton,
          isReady ? styles.readyButtonActive : null,
          { backgroundColor: isReady ? groupInfo.color : '#f0f0f0' }
        ]}
        onPress={toggleMyReadyState}
        disabled={isAllReady}
      >
        <Text style={[
          styles.readyButtonText,
          isReady ? styles.readyButtonTextActive : null
        ]}>
          {isReady ? '準備完了！' : '準備ができたらタップ'}
        </Text>
      </Pressable>
    );
  };

  // 通知ボタン
  const renderNotifyButton = () => {
    return (
      <Pressable 
        style={[
          styles.notifyButton,
          { borderColor: groupInfo.color }
        ]}
        onPress={notifyMembers}
        disabled={isNotifying}
      >
        {isNotifying ? (
          <ActivityIndicator size="small" color={groupInfo.color} />
        ) : (
          <Text style={[styles.notifyButtonText, { color: groupInfo.color }]}>
            呼びかける
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable 
          style={styles.overlayTouchable} 
          onPress={handleClose}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] }
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {countdown === null ? (
          // カウントダウンがない場合は通常のモーダル表示
          <View style={styles.modalContainer}>
            <BlurView intensity={20} tint="light" style={styles.content}>
              <View style={styles.handle} />
              
              {/* ヘッダー */}
              <View style={styles.header}>
                {onBack ? (
                  <Pressable style={styles.backButton} onPress={onBack}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                  </Pressable>
                ) : (
                  <View style={styles.spacer} />
                )}
                <Text style={styles.title}>{groupInfo.name}でハモる</Text>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </Pressable>
              </View>
              
              {/* グループ情報 */}
              <View style={styles.groupInfo}>
                <Image 
                  source={{ uri: groupInfo.image }}
                  style={[styles.groupImage, {borderColor: groupInfo.color}]}
                />
                <Text style={styles.groupIdText}>ID: {groupId}</Text>
                {/* <Text style={styles.groupSubtitle}>
                  {groupInfo.members}人と一緒にハモる
                </Text> */}
                {/* 呼びかけるボタン */}
                {renderNotifyButton()}
              </View>
              
              {/* メンバー準備状況 */}
              <View style={styles.mainContentContainer}>
                <ScrollView style={styles.scrollContent}>
                  {/* <Text style={styles.sectionTitle}>メンバーの準備状況</Text> */}
                  <View style={styles.membersContainer}>
                    {members.map(member => (
                      <View key={member.id} style={styles.memberItem}>
                        <View style={styles.memberImageContainer}>
                          <Image 
                            source={{ uri: member.image }}
                            style={styles.memberImage}
                          />
                          {member.isReady && (
                            <View style={[styles.readyBadge, {backgroundColor: groupInfo.color}]}>
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={[
                          styles.memberStatus,
                          member.isReady ? {color: groupInfo.color} : null
                        ]}>
                          {member.isReady ? '準備OK' : '準備中...'}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.instructionContainer}>
                    <Text style={styles.instruction}>
                      全員の準備が完了したら、一斉に声を出します。
                      あなたの準備ができたらボタンをタップしてください。
                    </Text>
                  </View>
                </ScrollView>
                
                {/* 固定位置の準備ボタン */}
                <View style={styles.fixedButtonContainer}>
                  {renderReadyButton()}
                </View>
              </View>
            </BlurView>
          </View>
        ) : (
          // カウントダウン表示時はシンプルな表示
          <View style={styles.countdownModalContainer}>
            {/* ヘッダーを非表示にしてカウントダウン数字のみを表示 */}
            {/* カウントダウン数字 */}
            <View style={styles.countdownNumberContainer}>
              <Animated.Text 
                style={[
                  styles.countdownText,
                  {
                    transform: [{ scale: scaleAnim }],
                    color: groupInfo.color
                  }
                ]}
              >
                {countdown}
              </Animated.Text>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 9999,
  },
  overlayTouchable: {
    width: '100%',
    height: '100%',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 700,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 10000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainContentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContent: {
    flex: 1,
    marginBottom: 70, // 固定ボタンの高さ分余白を確保
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 5,
  },
  closeButton: {
    padding: 5,
  },
  spacer: {
    width: 34, // closeButtonと同じ幅を確保
  },
  groupInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    marginBottom: 8,
  },
  groupIdText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  notifyButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 200,
    borderWidth: 1.5,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  notifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  memberItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  memberImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  readyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  memberStatus: {
    fontSize: 12,
    color: '#999',
  },
  instructionContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  readyButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  readyButtonActive: {
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  readyButtonTextActive: {
    color: '#fff',
  },
  countdownModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '100%',
    padding: 20,
  },
  countdownNumberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 340,
    fontWeight: 'bold',
  },
});

export default GroupReadyScreen; 