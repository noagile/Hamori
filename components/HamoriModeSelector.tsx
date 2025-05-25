import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, ScrollView, TextInput, Alert, Modal, Share } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { firestore, firebaseFirestore } from '@/firebase/config';

// グループ情報の型定義
interface GroupInfo {
  name: string;
  members: number;
  color: string;
  image: string;
}

interface HamoriModeSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectGroup: (groupId: string) => void;
  onAddNewGroup?: (groupId: string, groupName: string) => any;
  mockGroups?: {[key: string]: GroupInfo}; // グループ情報を親コンポーネントから受け取る
}

const HamoriModeSelector: React.FC<HamoriModeSelectorProps> = ({
  isVisible,
  onClose,
  onSelectPersonal,
  onSelectGroup,
  onAddNewGroup,
  mockGroups = {} // デフォルト値として空オブジェクトを設定
}) => {
  const [slideAnim] = useState(new Animated.Value(550));
  const [overlayOpacity] = useState(new Animated.Value(0));
  
  // 認証情報を取得
  const { user } = useAuth();
  
  // デフォルトのプロフィール画像URL
  const defaultProfileImage = 'https://randomuser.me/api/portraits/lego/1.jpg';
  
  // ユーザープロフィール画像
  const profileImageUrl = user?.photoURL || defaultProfileImage;
  
  // ユーザーの表示名
  const displayName = user?.displayName || (user?.email?.split('@')[0]) || 'ゲスト';
  
  // グループ追加モーダルの表示状態
  const [showGroupAddModal, setShowGroupAddModal] = useState(false);
  // グループ追加モーダルのアニメーション用
  const [addModalSlideAnim] = useState(new Animated.Value(500));
  const [addModalOverlayOpacity] = useState(new Animated.Value(0));
  // グループ作成用の名前入力
  const [newGroupName, setNewGroupName] = useState('');
  // グループ参加用のID入力
  const [groupIdInput, setGroupIdInput] = useState('');
  // 作成したグループのID（共有用）
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  React.useEffect(() => {
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
          toValue: 550,
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
      
      // メインモーダルが閉じる時に、グループ追加モーダルも閉じる
      setShowGroupAddModal(false);
    }
  }, [isVisible, slideAnim, overlayOpacity]);

  // モーダルを閉じる
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 550,
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
    });
  };

  // グループ選択処理
  const handleGroupSelect = (groupId: string) => {
    onSelectGroup(groupId);
  };
  
  // グループ追加ボタンクリック処理
  const handleAddGroupPress = () => {
    // フラグを使って状態を更新
    setNewGroupName('');
    setCreatedGroupId(null);
    
    // まずメインモーダルを隠す
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 550,
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
      // メインモーダルが隠れた後、追加モーダルを表示
      setShowGroupAddModal(true);
    });
  };
  
  // 追加モーダルの表示状態が変わったときの処理
  useEffect(() => {
    if (showGroupAddModal) {
      // 追加モーダルが表示される時のアニメーション
      addModalSlideAnim.setValue(500); // 初期位置をリセット
      addModalOverlayOpacity.setValue(0); // 透明度をリセット
      
      Animated.parallel([
        Animated.timing(addModalSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(addModalOverlayOpacity, {
          toValue: 0.5,
          duration: 300, 
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showGroupAddModal, addModalSlideAnim, addModalOverlayOpacity]);
  
  // グループ作成処理
  const handleCreateGroup = async () => {
    // グループ名のバリデーション
    if (!newGroupName.trim()) {
      Alert.alert('エラー', 'グループ名を入力してください');
      return;
    }
    
    // グループIDの生成（firestore対応のID）
    const timestamp = Date.now();
    const randomChars = Math.random().toString(36).substring(2, 6);
    const newGroupId = `g-${timestamp}-${randomChars}`;
    
    try {
      // ユーザーがログインしているか確認
      if (!user?.uid) {
        Alert.alert('エラー', 'グループを作成するにはログインが必要です');
        return;
      }
      
      // グループ作成処理（実際のアプリではAPIリクエストなどで実装）
      if (onAddNewGroup) {
        await onAddNewGroup(newGroupId, newGroupName);
      }
      
      setCreatedGroupId(newGroupId);
      
      console.log(`グループを作成しました: ${newGroupName} (ID: ${newGroupId})`);
    } catch (error) {
      console.error('グループ作成エラー:', error);
      Alert.alert('エラー', 'グループの作成に失敗しました');
    }
  };
  
  // グループID共有処理
  const handleShareGroupId = async () => {
    // createdGroupIdがあればそれを使用、なければモックのグループIDを生成
    const groupIdToShare = createdGroupId || `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    try {
      // Share APIを使用してグループIDを共有
      const groupInfo = mockGroups[groupIdToShare] || { name: newGroupName || 'マイグループ' };
      const result = await Share.share({
        message: `Hamoriアプリであなたをグループ「${groupInfo.name}」に招待します！\n\nグループID: ${groupIdToShare}\n\nアプリを開いて「グループに参加」からこのIDを入力してください。`,
        title: `Hamoriグループへの招待: ${groupInfo.name}`
      });
      
      if (result.action === Share.sharedAction) {
        console.log('共有成功', groupIdToShare);
        
        // 共有が成功した場合はグループIDを保存
        if (!createdGroupId) {
          setCreatedGroupId(groupIdToShare);
        }
      }
    } catch (error) {
      console.error('共有エラー:', error);
      Alert.alert('共有エラー', '共有が失敗しました');
    }
  };
  
  // モーダルを前の画面に戻す処理
  const handleBackToMainModal = () => {
    // 追加モーダルを閉じるアニメーション
    Animated.parallel([
      Animated.timing(addModalSlideAnim, {
        toValue: 500,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(addModalOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 追加モーダルが閉じた後にグループ選択モーダルを表示
      setShowGroupAddModal(false);
      
      // メインモーダルのアニメーションを開始
      if (isVisible) {
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
      }
    });
  };

  // グループ参加処理
  const handleJoinGroup = async () => {
    if (!groupIdInput.trim()) {
      Alert.alert('エラー', 'グループIDを入力してください');
      return;
    }
    
    const groupId = groupIdInput.trim();
    
    // ユーザーがログインしているか確認
    if (!user?.uid) {
      Alert.alert('エラー', 'グループに参加するにはログインが必要です');
      return;
    }
    
    try {
      // Firestoreでグループが存在するか確認
      const groupRef = firebaseFirestore.doc(firestore, `groups/${groupId}`);
      const groupDoc = await firebaseFirestore.getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        // mockGroupsにあるか確認（ローカルテスト用）
        if (mockGroups[groupId] || groupId.startsWith('g')) {
          // ローカルデータのみで参加処理
          Alert.alert(
            'グループに参加しました',
            `グループに参加しました！`,
            [{ 
              text: 'OK',
              onPress: () => {
                setShowGroupAddModal(false);
                onSelectGroup(groupId);
              }
            }]
          );
          return;
        } else {
          Alert.alert('エラー', '指定されたグループIDは存在しません');
          return;
        }
      }
      
      // グループデータを取得
      const groupData = groupDoc.data();
      
      // すでに参加しているか確認
      const memberRef = firebaseFirestore.doc(firestore, `groups/${groupId}/members/${user.uid}`);
      const memberDoc = await firebaseFirestore.getDoc(memberRef);
      
      if (memberDoc.exists()) {
        Alert.alert('通知', 'あなたはすでにこのグループに参加しています');
        setShowGroupAddModal(false);
        onSelectGroup(groupId);
        return;
      }
      
      // グループに参加
      await firebaseFirestore.setDoc(memberRef, {
        uid: user.uid,
        role: 'member',
        joinedAt: firebaseFirestore.serverTimestamp(),
        displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
        photoURL: user.photoURL || null
      });
      
      // ユーザーのグループリストに追加
      const userGroupRef = firebaseFirestore.doc(firestore, `users/${user.uid}/groups/${groupId}`);
      await firebaseFirestore.setDoc(userGroupRef, {
        role: 'member',
        joinedAt: firebaseFirestore.serverTimestamp()
      });
      
      Alert.alert(
        'グループに参加しました',
        `「${groupData.name}」に参加しました！`,
        [{ 
          text: 'OK',
          onPress: () => {
            setShowGroupAddModal(false);
            onSelectGroup(groupId);
          }
        }]
      );
    } catch (error) {
      console.error('グループ参加エラー:', error);
      Alert.alert('エラー', 'グループへの参加中にエラーが発生しました');
    }
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
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint="light" style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>グループ選択</Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              <View style={styles.gridContainer}>
                {/* グループ追加アイコン */}
                <Pressable 
                  style={styles.iconItem}
                  onPress={handleAddGroupPress}
                >
                  <View style={[styles.iconCircle, styles.addGroupIcon]}>
                    <LinearGradient
                      colors={['#00b894dd', '#00b894']}
                      style={styles.gradientBg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                  <Text style={styles.iconText}>グループ追加</Text>
                </Pressable>
                
                {/* 個人アイコン */}
                <Pressable 
                  style={styles.iconItem}
                  onPress={onSelectPersonal}
                >
                  <View style={[styles.iconCircle, styles.personalIcon]}>
                    <LinearGradient
                      colors={['#8e7ce7', '#6c5ce7']}
                      style={styles.gradientBg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Image
                      source={{ uri: profileImageUrl }}
                      style={styles.personImage}
                    />
                  </View>
                  <Text style={styles.iconText}>{displayName}</Text>
                </Pressable>
                
                {/* グループアイコン - mockGroupsオブジェクトからのデータを表示 */}
                {Object.entries(mockGroups).map(([groupId, groupInfo]) => (
                  <Pressable 
                    key={groupId}
                    style={styles.iconItem}
                    onPress={() => handleGroupSelect(groupId)}
                  >
                    <View style={styles.iconCircle}>
                      <LinearGradient
                        colors={[`${groupInfo.color}dd`, groupInfo.color]}
                        style={styles.gradientBg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <Image
                        source={{ uri: groupInfo.image }}
                        style={styles.groupImage}
                      />
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>{groupInfo.members}</Text>
                      </View>
                    </View>
                    <Text style={styles.iconText}>{groupInfo.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            
            {/* グループID入力フォーム */}
            <View style={styles.quickJoinContainer}>
              <View style={styles.quickJoinForm}>
                <TextInput
                  style={styles.quickJoinInput}
                  placeholder="グループIDを入力"
                  value={groupIdInput}
                  onChangeText={setGroupIdInput}
                />
                <Pressable 
                  style={styles.quickJoinButton}
                  onPress={handleJoinGroup}
                >
                  <Text style={styles.quickJoinButtonText}>参加</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      </Animated.View>
      
      {/* グループ追加モーダル */}
      <Modal
        visible={showGroupAddModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleBackToMainModal}
      >
        <Animated.View 
          style={[
            styles.addModalOverlay,
            { opacity: addModalOverlayOpacity }
          ]}
          pointerEvents="auto"
        >
          <Pressable 
            style={styles.overlayTouchable}
            onPress={handleBackToMainModal}
          />
        </Animated.View>
        <Animated.View 
          style={[
            styles.addModalContainer,
            { transform: [{ translateY: addModalSlideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Pressable 
              style={styles.backButton} 
              onPress={handleBackToMainModal}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </Pressable>
            <Text style={styles.title}>グループを作成</Text>
            <Pressable 
              style={styles.closeButton} 
              onPress={() => {
                // モーダルを完全に閉じるアニメーション
                Animated.parallel([
                  Animated.timing(addModalSlideAnim, {
                    toValue: 500,
                    duration: 200,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                  }),
                  Animated.timing(addModalOverlayOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  })
                ]).start(() => {
                  setShowGroupAddModal(false);
                  // グループ選択モーダルも閉じる
                  onClose();
                });
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>
          
          {/* 作成フォーム */}
          <View style={styles.formContainer}>
            {!createdGroupId ? (
              <>
                <Text style={styles.inputLabel}>グループ名</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="新しいグループの名前を入力"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
                <Pressable 
                  style={[styles.button, styles.createButton]}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.buttonText}>グループを作成</Text>
                </Pressable>
              </>
            ) : (
              <ScrollView style={styles.scrollContent}>
                <View style={styles.createdGroupContainer}>
                  <Text style={styles.successText}>グループを作成しました！</Text>
                  <Text style={styles.groupIdText}>グループID: {createdGroupId}</Text>
                  <Text style={styles.infoText}>
                    このIDを友達に共有して招待しましょう。
                  </Text>
                </View>
                <Pressable 
                  style={[styles.button, styles.shareButton]}
                  onPress={handleShareGroupId}
                >
                  <Ionicons name="share-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>IDを共有</Text>
                </Pressable>
                <Pressable 
                  style={[styles.button, styles.doneButton]}
                  onPress={() => {
                    // モーダルを閉じてグループ準備画面に移動
                    setShowGroupAddModal(false);
                    
                    // このグループで始める
                    if (createdGroupId) {
                      onSelectGroup(createdGroupId);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>このグループで始める</Text>
                </Pressable>
                {/* 下部に余白を追加 */}
                <View style={{height: 20}} />
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </Modal>
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
    height: 550,
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
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 5,
    width: 30,
  },
  closeButton: {
    padding: 5,
    width: 30,
  },
  scrollView: {
    flex: 1,
    marginBottom: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  iconItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  personalIcon: {
    backgroundColor: '#6c5ce7',
  },
  addGroupIcon: {
    backgroundColor: '#00b894',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  personImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  groupImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  iconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: 11,
    color: '#666',
  },
  // グループ追加モーダル用スタイル
  addModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 10999,
  },
  addModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 5,
    height: 480,
    zIndex: 11000,
  },
  formContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  scrollContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  createButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 30,
    marginTop: 30,
    height: 56,
  },
  shareButton: {
    backgroundColor: '#0984e3',
    borderRadius: 30,
    height: 56,
  },
  doneButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 30,
    height: 56,
    marginTop: 16,
  },
  createdGroupContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#f5f9f8',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00b894',
    marginBottom: 16,
    textAlign: 'center',
  },
  groupIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  quickJoinContainer: {
    paddingVertical: 20,
  },
  quickJoinForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 100,
    backgroundColor: '#f9f9f9',
    paddingLeft: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickJoinInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    height: 50,
    color: '#333',
    backgroundColor: 'transparent',
  },
  quickJoinButton: {
    height: 42,
    width: 72,
    marginRight: 4,
    borderRadius: 100,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickJoinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default HamoriModeSelector; 