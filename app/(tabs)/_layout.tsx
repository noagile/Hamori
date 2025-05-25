import { Tabs } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import BottomNav from '@/components/BottomNav';
import VoiceInput from '@/components/VoiceInput';
import HamoriModeSelector from '@/components/HamoriModeSelector';
import GroupReadyScreen from '@/components/GroupReadyScreen';
import { AppContext } from '@/app/_layout';
import { useAuth } from '@/context/AuthContext';
import { firestore, firebaseFirestore } from '@/firebase/config';

// グループ情報の型定義
interface GroupInfo {
  name: string;
  members: number;
  color: string;
  image: string;
  createdAt: string;
  createdBy: string;
  [key: string]: any; // その他の追加情報を許容
}

// デフォルトは空のオブジェクト（グループなし）
const initialMockGroups: Record<string, GroupInfo> = {};

// アプリの状態を表す定数
const APP_MODE = {
  NORMAL: 'normal',           // 通常モード（ナビゲーション表示）
  MODE_SELECTOR: 'selector',  // モード選択画面
  GROUP_READY: 'group_ready', // グループ準備画面
  VOICE_INPUT: 'voice_input'  // 音声入力画面
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth(); // ユーザー情報を取得
  
  const { 
    setVoiceText, 
    setVoiceTags,
    modeSelectorVisible,
    setModeSelectorVisible,
    setActiveGroupId,
    setActiveGroupInfo,
    appMode,
    setAppMode,
    activeGroupId
  } = useContext(AppContext);
  
  // 現在選択されているグループID
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  // カウントダウン完了フラグ
  const [countdownCompleted, setCountdownCompleted] = React.useState(false);

  // グループデータの状態管理
  const [mockGroups, setMockGroups] = useState<Record<string, GroupInfo>>(initialMockGroups);
  
  // ユーザーのグループ情報をFirestoreから取得
  useEffect(() => {
    // ユーザーがログインしている場合のみ実行
    if (user?.uid) {
      const fetchUserGroups = async () => {
        try {
          console.log('ユーザーのグループ情報を取得中...');
          
          // ユーザーが所属するグループを取得
          const userGroupsRef = firebaseFirestore.collection(firestore, `users/${user.uid}/groups`);
          const userGroupsSnapshot = await firebaseFirestore.getDocs(userGroupsRef);
          
          if (userGroupsSnapshot.empty) {
            console.log('ユーザーが所属するグループがありません');
            // 空のグループリストを設定（デフォルトデータは使用しない）
            setMockGroups({});
            return;
          }
          
          // グループデータを整形
          const userGroups: Record<string, GroupInfo> = {};
          
          for (const groupDoc of userGroupsSnapshot.docs) {
            const groupId = groupDoc.id;
            const groupData = groupDoc.data();
            
            // グループの詳細情報を取得
            try {
              const groupDetailRef = firebaseFirestore.doc(firestore, `groups/${groupId}`);
              const groupDetailSnap = await firebaseFirestore.getDoc(groupDetailRef);
              
              if (groupDetailSnap.exists()) {
                const groupDetailData = groupDetailSnap.data();
                
                // グループメンバー数を取得
                const membersRef = firebaseFirestore.collection(firestore, `groups/${groupId}/members`);
                const membersSnap = await firebaseFirestore.getDocs(membersRef);
                const membersCount = membersSnap.size;
                
                userGroups[groupId] = {
                  id: groupId,
                  name: groupDetailData.name || 'グループ名なし',
                  members: membersCount || 1,
                  color: groupDetailData.color || '#6c5ce7',
                  image: groupDetailData.image || `https://randomuser.me/api/portraits/groups/${Math.floor(Math.random() * 10)}.jpg`,
                  createdAt: groupDetailData.createdAt || '',
                  createdBy: groupDetailData.createdBy || 'anonymous',
                  ...groupData
                };
              }
            } catch (error) {
              console.warn(`グループ${groupId}の詳細取得エラー:`, error);
            }
          }
          
          console.log('取得したグループ情報:', userGroups);
          
          // ユーザーのグループリストをセット（常に更新する）
          setMockGroups(userGroups);
        } catch (error) {
          console.error('グループ情報取得エラー:', error);
          // エラーが発生した場合は空のグループリストにする
          setMockGroups({});
        }
      };
      
      fetchUserGroups();
    } else {
      // ユーザーがログインしていない場合は空のグループリストにする
      setMockGroups({});
    }
  }, [user?.uid]);

  // カウントダウン完了フラグが立ったら音声入力モードに切り替え
  useEffect(() => {
    if (countdownCompleted && appMode === APP_MODE.GROUP_READY) {
      setAppMode(APP_MODE.VOICE_INPUT);
    }
  }, [countdownCompleted, appMode]);

  // 音声入力の結果を処理
  const handleVoiceSubmit = (text: string, tags?: string[]) => {
    console.log('音声入力の結果を処理します:', { text, tags });
    setVoiceText(text);
    if (tags && tags.length > 0) {
      // タグ情報をコンテキストに保存
      console.log('タグを保存します:', tags);
      setVoiceTags(tags);
    }
    
    // 通常モードに戻る
    setAppMode(APP_MODE.NORMAL);
    // グループID選択状態をリセット
    setSelectedGroupId(null);
    // カウントダウン完了フラグをリセット
    setCountdownCompleted(false);
  };

  // 個人モードを選択したときの処理
  const handleSelectPersonal = () => {
    console.log('個人モードが選択されました');
    setSelectedGroupId(null);
    setModeSelectorVisible(false);
    // 個人モードを選択したら音声入力画面を表示
    setAppMode(APP_MODE.VOICE_INPUT);
  };

  // 新しいグループを追加する関数
  const handleAddNewGroup = async (groupId: string, groupName: string) => {
    console.log(`新しいグループを追加します: ${groupName} (ID: ${groupId})`);
    
    // ランダムな色とデフォルト画像を設定
    const colors = ['#6c5ce7', '#0984e3', '#00b894', '#fdcb6e', '#e84393', '#d63031', '#00cec9'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomImage = `https://randomuser.me/api/portraits/groups/${Math.floor(Math.random() * 10)}.jpg`;
    
    // 新しいグループオブジェクトを作成
    const newGroup: GroupInfo = {
      name: groupName,
      members: 1, // 最初は自分だけ
      color: randomColor,
      image: randomImage,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'anonymous'
    };
    
    // ログインしているユーザーがいる場合、Firestoreにも保存
    if (user?.uid) {
      try {
        // グループドキュメントを作成
        const groupRef = firebaseFirestore.doc(firestore, `groups/${groupId}`);
        await firebaseFirestore.setDoc(groupRef, {
          ...newGroup,
          createdAt: firebaseFirestore.serverTimestamp(),
        });
        
        // グループメンバーとしてユーザーを追加
        const memberRef = firebaseFirestore.doc(firestore, `groups/${groupId}/members/${user.uid}`);
        await firebaseFirestore.setDoc(memberRef, {
          uid: user.uid,
          role: 'owner',
          joinedAt: firebaseFirestore.serverTimestamp(),
          displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
          photoURL: user.photoURL || null
        });
        
        // ユーザーのグループ一覧にも追加
        const userGroupRef = firebaseFirestore.doc(firestore, `users/${user.uid}/groups/${groupId}`);
        await firebaseFirestore.setDoc(userGroupRef, {
          role: 'owner',
          joinedAt: firebaseFirestore.serverTimestamp()
        });
        
        console.log('グループをFirestoreに保存しました');
      } catch (error) {
        console.error('グループ保存エラー:', error);
        // エラーが発生しても、UIには表示するのでローカルデータは更新する
      }
    }
    
    // グループリストに追加
    setMockGroups(prev => ({
      ...prev,
      [groupId]: newGroup
    }));
    
    return newGroup;
  };

  // グループモードを選択したときの処理
  const handleSelectGroup = async (groupId: string) => {
    console.log(`グループモードが選択されました。グループID: ${groupId}`);
    setSelectedGroupId(groupId);
    setModeSelectorVisible(false);
    
    // 新しく作成されたグループかどうかをチェック
    if (groupId && !mockGroups[groupId] && groupId.startsWith('g')) {
      // 作成しようとしているグループだが情報が存在しない場合、とりあえずデフォルト名を設定
      const defaultName = 'マイグループ';
      try {
        // 非同期でグループを作成
        const newGroup = await handleAddNewGroup(groupId, defaultName);
      
        // グループ情報をコンテキストに保存
        setActiveGroupId(groupId);
        setActiveGroupInfo(newGroup);
      } catch (error) {
        console.error('グループ作成エラー:', error);
        // エラーが発生した場合もUIは続行
      }
    } else if (mockGroups[groupId]) {
      // 既存のグループを選択した場合
      setActiveGroupId(groupId);
      setActiveGroupInfo(mockGroups[groupId]);
    }
    
    // グループモードでは準備画面を表示
    setAppMode(APP_MODE.GROUP_READY);
  };

  // 全員が準備完了したときの処理
  const handleAllReady = () => {
    console.log('全員の準備が完了しました。音声入力を開始します。');
    
    // グループ情報をコンテキストに保存（準備完了時）
    // selectedGroupIdまたはactiveGroupIdを使用
    const groupId = selectedGroupId || activeGroupId;
    if (groupId && mockGroups[groupId]) {
      setActiveGroupId(groupId);
      setActiveGroupInfo(mockGroups[groupId]);
    }
    
    // カウントダウン完了フラグを立てる
    setCountdownCompleted(true);
    // useEffectでモード切替が行われる
  };

  // 呼びかけるボタンを押したときの処理
  const handleNotifyMembers = () => {
    console.log('グループメンバーに呼びかけました。');
    
    // グループ情報をコンテキストに保存（呼びかけ時）
    // selectedGroupIdまたはactiveGroupIdを使用
    const groupId = selectedGroupId || activeGroupId;
    if (groupId && mockGroups[groupId]) {
      setActiveGroupId(groupId);
      setActiveGroupInfo(mockGroups[groupId]);
    }
  };

  // 全員が準備完了でない状態になったときの処理
  const handleNoReadyMembers = () => {
    console.log('全員が準備完了でない状態になりました。');
    
    // グループ情報をリセット（誰も準備完了していないため）
    setActiveGroupId(null);
    setActiveGroupInfo(null);
  };

  // 音声入力を閉じる処理
  const handleCloseVoiceInput = () => {
    setAppMode(APP_MODE.NORMAL);
    setSelectedGroupId(null);
    setCountdownCompleted(false);
    
    // アクティブなグループ情報はそのまま残す (ホーム画面に表示するため)
  };

  // グループ準備画面を閉じる処理
  const handleCloseGroupReady = () => {
    console.log('グループ準備画面を閉じます');
    
    // アプリモードを通常モードに戻す
    setAppMode(APP_MODE.NORMAL);
    // グループID選択状態をリセット
    setSelectedGroupId(null);
    // カウントダウン完了フラグをリセット
    setCountdownCompleted(false);
    
    // モーダルを閉じるときに、ホーム画面のグループ表示もクリア
    // 準備モーダルを完全に閉じる場合、再度開いたときに新しい準備状態で始める
    console.log('モーダルを閉じるため、グループ情報をリセットします');
    setActiveGroupId(null);
    setActiveGroupInfo(null);
  };

  // グループ準備画面から戻るボタンを押したときの処理
  const handleBackFromGroupReady = () => {
    setAppMode(APP_MODE.NORMAL);
    setSelectedGroupId(null);
    // グループ選択モーダルを再表示
    setModeSelectorVisible(true);
    
    // グループ情報をリセット（準備完了していないので）
    setActiveGroupId(null);
    setActiveGroupInfo(null);
  };

  // モード選択画面を閉じる処理
  const handleCloseModeSelector = () => {
    setModeSelectorVisible(false);
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // 標準のタブバーを非表示
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="main" />
        <Tabs.Screen name="profile" />
      </Tabs>
      
      {/* カスタムナビゲーションバー - モーダル表示時には非表示 */}
      {appMode === APP_MODE.NORMAL && !modeSelectorVisible && <BottomNav />}
      
      {/* モード選択画面 */}
      <HamoriModeSelector
        isVisible={modeSelectorVisible}
        onClose={handleCloseModeSelector}
        onSelectPersonal={handleSelectPersonal}
        onSelectGroup={handleSelectGroup}
        onAddNewGroup={handleAddNewGroup}
        mockGroups={mockGroups}
      />
      
      {/* グループ準備画面 */}
      {((selectedGroupId && mockGroups[selectedGroupId]) || (appMode === APP_MODE.GROUP_READY && activeGroupId && mockGroups[activeGroupId])) && (
        <GroupReadyScreen
          isVisible={appMode === APP_MODE.GROUP_READY}
          onClose={handleCloseGroupReady}
          onAllReady={handleAllReady}
          onBack={handleBackFromGroupReady}
          onNotify={handleNotifyMembers}
          onNoReadyMembers={handleNoReadyMembers}
          groupId={selectedGroupId || activeGroupId || ''}
          groupInfo={mockGroups[selectedGroupId || activeGroupId || '']}
        />
      )}
      
      {/* 音声入力コンポーネント */}
      <VoiceInput
        isVisible={appMode === APP_MODE.VOICE_INPUT}
        onClose={handleCloseVoiceInput}
        onSubmit={handleVoiceSubmit}
        groupId={selectedGroupId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
