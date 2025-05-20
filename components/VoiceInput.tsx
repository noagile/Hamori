import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable, TextInput, ActivityIndicator, Platform, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppContext } from '@/app/_layout';
import RestaurantSearchResults from './RestaurantSearchResults';

interface VoiceInputProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (text: string, tags?: string[]) => void;
}

interface Tag {
  label: string;
  description: string;
}

// WhisperAPIのベースURL
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
// ChatGPT APIのベースURL
const CHATGPT_API_URL = 'https://api.openai.com/v1/chat/completions';
// 環境変数からAPIキーを取得 (expo-constants経由)
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;
// ストレージキー (環境変数が設定されていない場合のフォールバック用)
const API_KEY_STORAGE_KEY = 'openai_api_key';

const VoiceInput: React.FC<VoiceInputProps> = ({ isVisible, onClose, onSubmit }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [apiKey, setApiKey] = useState<string>(OPENAI_API_KEY || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!OPENAI_API_KEY);
  const [apiKeyInputValue, setApiKeyInputValue] = useState('');
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  
  // タグ分析関連の状態
  const [tags, setTags] = useState<Tag[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);

  // 状態の追加：店舗検索モードの状態
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);

  // AppContextから状態とセッター関数を取得
  const { setVoiceText, setVoiceTags, setVoiceTagDescriptions } = useContext(AppContext);

  // マイク権限を取得する
  useEffect(() => {
    (async () => {
      try {
        console.log('マイク権限をリクエスト中...');
        const { granted } = await Audio.requestPermissionsAsync();
        console.log('マイク権限の結果:', granted);
        setHasAudioPermission(granted);
      } catch (error) {
        console.error('マイク権限の取得に失敗しました', error);
      }
    })();
  }, []);

  // APIキーをストレージから読み込む（環境変数が設定されていない場合のみ）
  useEffect(() => {
    const loadApiKey = async () => {
      if (OPENAI_API_KEY) {
        setApiKey(OPENAI_API_KEY);
        setShowApiKeyInput(false);
        return;
      }
      
      try {
        const storedApiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedApiKey) {
          setApiKey(storedApiKey);
          setShowApiKeyInput(false);
        } else {
          // キーが保存されていない場合は入力フォームを表示
          setShowApiKeyInput(true);
        }
      } catch (error) {
        console.error('APIキーの読み込みに失敗しました', error);
      }
    };
    
    loadApiKey();
  }, []);

  // APIキーを保存する
  const saveApiKey = async () => {
    if (!apiKeyInputValue.trim()) {
      Alert.alert('エラー', 'APIキーを入力してください');
      return;
    }
    
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInputValue);
      setApiKey(apiKeyInputValue);
      setApiKeyInputValue('');
      setShowApiKeyInput(false);
    } catch (error) {
      console.error('APIキーの保存に失敗しました', error);
      Alert.alert('エラー', 'APIキーの保存に失敗しました');
    }
  };

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
          toValue: 400,
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
  }, [isVisible]);

  // 録音の開始
  const startRecording = async () => {
    // APIキーがない場合は録音を開始しない
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    // マイク権限がない場合は権限を取得する
    if (!hasAudioPermission) {
      try {
        console.log('録音開始前に再度マイク権限をリクエスト中...');
        const { granted } = await Audio.requestPermissionsAsync();
        console.log('マイク権限の結果:', granted);
        setHasAudioPermission(granted);
        
        if (!granted) {
          Alert.alert('権限エラー', 'マイクへのアクセス権限が必要です。設定アプリから権限を許可してください。');
          return;
        }
      } catch (error) {
        console.error('マイク権限の取得に失敗しました', error);
        Alert.alert('エラー', 'マイク権限の取得に失敗しました');
        return;
      }
    }

    try {
      // 録音のためのオーディオモードの設定
      console.log('オーディオモードを設定中...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 録音オプションの設定
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      };

      // 録音の開始
      console.log('録音を開始します...');
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('録音が開始されました');
      setRecording(recording);
      setIsRecording(true);
      setText(''); // 既存のテキストをクリア
    } catch (error) {
      console.error('録音の開始に失敗しました', error);
      Alert.alert('エラー', '録音の開始に失敗しました');
    }
  };

  // 録音の停止とWhisper APIへの送信
  const stopRecording = async () => {
    if (!recording) {
      console.log('録音オブジェクトがありません');
      return;
    }
    
    console.log('録音を停止します...');
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      console.log('録音を停止して解放します');
      await recording.stopAndUnloadAsync();
      console.log('録音URIを取得します');
      const uri = recording.getURI();
      if (!uri) {
        console.error('録音URIが取得できませんでした');
        throw new Error('録音URIが取得できませんでした');
      }
      console.log('録音URIが取得できました:', uri);
      
      // オーディオファイルをAPIに送信
      console.log('文字起こしを開始します');
      await transcribeAudio(uri);
    } catch (error) {
      console.error('録音の停止に失敗しました', error);
      setIsProcessing(false);
      Alert.alert('エラー', '録音の処理に失敗しました');
    } finally {
      setRecording(null);
      // オーディオモードをリセット
      console.log('オーディオモードをリセットします');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    }
  };

  // オーディオファイルをWhisper APIに送信して文字起こしを取得
  const transcribeAudio = async (uri: string) => {
    try {
      // APIキーがない場合はエラー
      if (!apiKey) {
        console.error('APIキーが設定されていません');
        throw new Error('APIキーが設定されていません');
      }
      
      // オーディオファイルを取得
      console.log('オーディオファイルを取得します');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('オーディオファイルのサイズ:', blob.size, 'bytes');
      
      // FormDataの作成
      console.log('APIリクエストのためのFormDataを作成します');
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja'); // 日本語を指定
      
      // Whisper APIにリクエスト送信
      console.log('WhisperAPIにリクエストを送信します: ', WHISPER_API_URL);
      console.log('APIキー:', apiKey.substring(0, 5) + '...');
      
      const apiResponse = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      console.log('APIレスポンスのステータス:', apiResponse.status);
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('APIエラーのレスポンス:', errorData);
        throw new Error(`API Error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await apiResponse.json();
      console.log('文字起こし結果:', data);
      setText(data.text);
    } catch (error) {
      console.error('文字起こしに失敗しました', error);
      setText('文字起こしに失敗しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // テキストをGPT-4を使ってタグに分解する
  const analyzeTextForTags = async (inputText: string) => {
    if (!apiKey || !inputText.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      console.log('テキストをタグに分析します:', inputText);
      
      const prompt = {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "あなたは飲食店探しを助けるAIアシスタントです。ユーザーの入力から飲食店検索に役立つキーワードを抽出し、必ず3つ以上のタグに変換してください。どんな入力でも必ず3つ以上のタグを作成してください。内容がシンプルで飲食店に直接関連しない場合でも、可能性のある関連タグを作成してください。各タグには短い説明も付けてください。結果はJSON形式で返してください。タグの例:「寒い」→「鍋」「あったかい料理」「焼肉」"
          },
          {
            role: "user",
            content: `あなたは飲食店探しを助けるAIアシスタントです。ユーザーの入力から飲食店検索に役立つキーワードを抽出し、必ず3つ以上のタグに変換してください。どんな入力でも必ず3つ以上のタグを作成してください。内容がシンプルで飲食店に直接関連しない場合でも、可能性のある関連タグを作成してください。各タグには短い説明も付けてください。結果はJSON形式で返してください。タグの例:「寒い」→「鍋」「あったかい料理」「焼肉」：「${inputText}」`
          }
        ],
        response_format: { type: "json_object" }
      };
      
      console.log('GPT API リクエストを送信します');
      const response = await fetch(CHATGPT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(prompt)
      });
      
      console.log('GPT API レスポンスのステータス:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('GPT APIエラー:', errorData);
        throw new Error(`GPT API Error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log('GPT APIレスポンス:', data);
      
      // レスポンスからタグを抽出
      try {
        const content = data.choices[0].message.content;
        console.log('APIからの生の応答:', content);
        
        // JSONを解析
        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (parseError) {
          console.error('JSONの解析に失敗しました:', parseError);
          // 強制的にJSONに変換を試みる
          const jsonPattern = /{.*}/s;
          const match = content.match(jsonPattern);
          if (match) {
            try {
              parsedContent = JSON.parse(match[0]);
            } catch {
              throw new Error('JSONの抽出に失敗しました');
            }
          } else {
            throw new Error('レスポンスからJSONを見つけられませんでした');
          }
        }
        
        // tagsが存在するかチェック
        if (parsedContent.tags && Array.isArray(parsedContent.tags)) {
          // APIレスポンスのtag/descriptionプロパティをlabel/descriptionプロパティにマッピング
          const formattedTags = parsedContent.tags.map((item: any) => {
            // 「tag」「label」「name」プロパティを適切に抽出
            const label = item.tag || item.label || item.name || '';
            const description = item.description || '';
            return { label, description };
          });
          
          console.log('フォーマットされたタグ:', formattedTags);
          
          // タグが3つ未満の場合は、デフォルトタグを追加
          if (formattedTags.length < 3) {
            console.log('タグが3つ未満のため、デフォルトタグを追加します');
            const defaultTags = [
              { label: '人気店', description: '口コミ評価の高い人気のある飲食店' },
              { label: 'おすすめ料理', description: 'シェフのおすすめや名物料理がある店舗' },
              { label: '居心地のよい空間', description: '落ち着いた雰囲気で長居できる店舗' },
              { label: '地元の味', description: '地元で愛されている料理や食材を使った店舗' }
            ];
            
            // 不足分のタグを追加
            const neededTags = 3 - formattedTags.length;
            for (let i = 0; i < neededTags; i++) {
              formattedTags.push(defaultTags[i]);
            }
          }
          
          setTags(formattedTags);
          setShowAnalysisResult(true);
        } else if (parsedContent.タグ && Array.isArray(parsedContent.タグ)) {
          // 日本語の「タグ」キーで返ってきた場合の処理
          console.log('日本語の「タグ」キーが見つかりました');
          
          const formattedTags = parsedContent.タグ.map((item: any) => {
            // 「名前」と「説明」プロパティを抽出
            const label = item.名前 || item.名称 || item.タグ || item.tag || item.label || '';
            const description = item.説明 || item.description || '';
            return { label, description };
          });
          
          console.log('フォーマットされたタグ (日本語キー):', formattedTags);
          
          if (formattedTags.length < 3) {
            console.log('タグが3つ未満のため、デフォルトタグを追加します');
            const defaultTags = [
              { label: '人気店', description: '口コミ評価の高い人気のある飲食店' },
              { label: 'おすすめ料理', description: 'シェフのおすすめや名物料理がある店舗' },
              { label: '居心地のよい空間', description: '落ち着いた雰囲気で長居できる店舗' }
            ];
            
            const neededTags = 3 - formattedTags.length;
            for (let i = 0; i < neededTags; i++) {
              formattedTags.push(defaultTags[i]);
            }
          }
          
          setTags(formattedTags);
          setShowAnalysisResult(true);
        } else {
          // tagsがない場合、別の形式を試みる
          console.log('標準形式のタグが見つかりません。別の形式を試します...');
          
          // カスタム形式でのタグ抽出を試みる
          const extractedTags = [];
          
          // キーが "tag1", "tag2", "tag3" などの場合
          for (let i = 1; i <= 5; i++) {
            const tagKey = `tag${i}`;
            const descKey = `description${i}`;
            
            if (parsedContent[tagKey]) {
              extractedTags.push({
                label: parsedContent[tagKey],
                description: parsedContent[descKey] || `${parsedContent[tagKey]}に関連する飲食店`
              });
            }
          }
          
          // 別の形式: "tags"がオブジェクトの配列ではなく文字列の配列の場合
          if (extractedTags.length === 0 && Array.isArray(parsedContent.tags)) {
            parsedContent.tags.forEach((tag: string | any, index: number) => {
              if (typeof tag === 'string') {
                extractedTags.push({
                  label: tag,
                  description: `${tag}に関連する飲食店`
                });
              } else if (typeof tag === 'object' && tag.name) {
                extractedTags.push({
                  label: tag.name,
                  description: tag.description || `${tag.name}に関連する飲食店`
                });
              }
            });
          }
          
          // タグが3つ未満の場合は、デフォルトタグを追加
          if (extractedTags.length < 3) {
            console.log('抽出したタグが3つ未満のため、デフォルトタグを追加します');
            const defaultTags = [
              { label: '人気店', description: '口コミ評価の高い人気のある飲食店' },
              { label: 'おすすめ料理', description: 'シェフのおすすめや名物料理がある店舗' },
              { label: '居心地のよい空間', description: '落ち着いた雰囲気で長居できる店舗' }
            ];
            
            // 不足分のタグを追加
            const neededTags = 3 - extractedTags.length;
            for (let i = 0; i < neededTags; i++) {
              extractedTags.push(defaultTags[i]);
            }
          }
          
          if (extractedTags.length > 0) {
            setTags(extractedTags);
            setShowAnalysisResult(true);
          } else {
            throw new Error('タグデータの形式が正しくありません');
          }
        }
      } catch (parseError) {
        console.error('APIレスポンスの解析に失敗しました', parseError);
        Alert.alert('エラー', 'タグの生成に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('テキスト分析に失敗しました', error);
      Alert.alert('エラー', 'テキストの分析に失敗しました。もう一度お試しください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecord = () => {
    console.log('ハモるボタンが押されました - 現在の状態:', { isRecording, hasAudioPermission });
    
    if (isRecording) {
      console.log('録音停止を試みます');
      stopRecording();
    } else {
      console.log('録音開始を試みます');
      startRecording();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    if (!showAnalysisResult) {
      // まだ分析していない場合は分析を開始
      analyzeTextForTags(text);
    } else if (!showRestaurantSearch) {
      // 分析結果を表示している場合は店舗検索モードに切り替え
      const tagLabels = tags.map(tag => tag.label);
      setShowRestaurantSearch(true);
      
      // AppContextにも保存
      setVoiceText(text);
      setVoiceTags(tagLabels);
      
      // タグの説明をマップとして保存
      const tagDescriptions: Record<string, string> = {};
      tags.forEach(tag => {
        tagDescriptions[tag.label] = tag.description;
      });
      setVoiceTagDescriptions(tagDescriptions);
    } else {
      // 店舗検索結果を表示している場合は結果を送信して閉じる
      if (onSubmit) {
        console.log('タグを送信します:', tags);
        // tagsからlabelのみを抽出して送信
        const tagLabels = tags.map(tag => tag.label);
        console.log('タグラベルのみを送信:', tagLabels);
        
        // AppContextに保存
        setVoiceText(text);
        setVoiceTags(tagLabels);
        
        // タグの説明をマップとして保存
        const tagDescriptions: Record<string, string> = {};
        tags.forEach(tag => {
          tagDescriptions[tag.label] = tag.description;
        });
        setVoiceTagDescriptions(tagDescriptions);
        
        onSubmit(text, tagLabels);
      }
      
      // 改善されたクローズ処理を使用
      handleClose();
    }
  };

  const handleResetAnalysis = () => {
    setShowAnalysisResult(false);
    setShowRestaurantSearch(false);
    setTags([]);
  };
  
  // 店舗検索を閉じて、タグ表示に戻る
  const handleCloseRestaurantSearch = () => {
    setShowRestaurantSearch(false);
  };

  // モーダルを閉じる際の処理を改善
  const handleClose = () => {
    // モーダルを閉じる前に状態をリセット
    if (showRestaurantSearch) {
      setShowRestaurantSearch(false);
    }

    // アニメーションが完了するまで待つ
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
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
      // アニメーション完了後に親コンポーネントのonCloseを呼び出す
      onClose();
      
      // 追加の状態リセット
      setText('');
      setTags([]);
      setShowAnalysisResult(false);
    });
  };

  // モーダルの高さを動的に調整
  useEffect(() => {
    if (showRestaurantSearch) {
      // 店舗検索表示時は大きく表示
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showRestaurantSearch]);
  
  // モーダルのコンテナースタイルを動的に設定
  const containerStyle = [
    styles.container,
    { 
      height: showRestaurantSearch ? '90%' as const : 420, 
      transform: [{ translateY: slideAnim }] 
    }
  ];

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
        style={containerStyle}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint="light" style={styles.content}>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.title}>
                {showRestaurantSearch ? 'おすすめの店舗' : 'ハモる'}
              </Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            
            {showApiKeyInput ? (
              <View style={styles.apiKeyContainer}>
                <Text style={styles.apiKeyTitle}>OpenAI APIキーを入力してください</Text>
                <TextInput
                  style={styles.apiKeyInput}
                  placeholder="sk-..."
                  value={apiKeyInputValue}
                  onChangeText={setApiKeyInputValue}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable style={styles.apiKeyButton} onPress={saveApiKey}>
                  <Text style={styles.apiKeyButtonText}>保存</Text>
                </Pressable>
              </View>
            ) : showRestaurantSearch ? (
              // 店舗検索結果表示
              <View style={styles.restaurantSearchContainer}>
                <RestaurantSearchResults 
                  tags={tags.map(tag => tag.label)} 
                  onClose={handleCloseRestaurantSearch} 
                />
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  {isProcessing ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="large" color="#6c5ce7" />
                      <Text style={styles.processingText}>音声を処理中...</Text>
                    </View>
                  ) : isAnalyzing ? (
                    <View style={styles.processingContainer}>
                      <ActivityIndicator size="large" color="#6c5ce7" />
                      <Text style={styles.processingText}>テキストを分析中...</Text>
                    </View>
                  ) : showAnalysisResult ? (
                    <ScrollView style={styles.analysisResultContainer}>
                      <Text style={styles.analysisTitle}>テキスト</Text>
                      <Text style={styles.inputText}>「{text}」</Text>
                      
                      <Text style={styles.tagsTitle}>タグ</Text>
                      <View style={styles.tagsList}>
                        {tags.map((tag, index) => (
                          <View key={index} style={styles.tagItem}>
                            <Text style={styles.tagLabel}>{tag.label}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.resetContainer}>
                        <Pressable style={styles.resetButton} onPress={handleResetAnalysis}>
                          <Text style={styles.resetButtonText}>やり直す</Text>
                        </Pressable>
                      </View>
                    </ScrollView>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="音声入力結果"
                      placeholderTextColor="#999"
                      multiline
                      value={text}
                      onChangeText={setText}
                      editable={!isRecording && !isProcessing}
                    />
                  )}
                </View>
                
                <View style={styles.buttonContainer}>
                  {!showAnalysisResult && (
                    <Pressable 
                      style={[
                        styles.recordButton, 
                        isRecording && styles.recordingButton,
                        isProcessing && styles.disabledButton
                      ]}
                      onPress={handleRecord}
                      disabled={isProcessing || isAnalyzing}
                    >
                      <LinearGradient
                        colors={isRecording ? ['#FF6B6B', '#FF0000'] : ['#8e7ce7', '#6c5ce7']}
                        style={styles.recordButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons 
                          name={isRecording ? "stop" : "mic"} 
                          size={28} 
                          color="white" 
                        />
                      </LinearGradient>
                    </Pressable>
                  )}
                  
                  {(text.length > 0 || showAnalysisResult) && !isProcessing && !isRecording && !isAnalyzing && (
                    <Pressable style={styles.submitButton} onPress={handleSubmit}>
                      <Text style={styles.submitButtonText}>
                        {!showAnalysisResult ? "分析" : "店舗を検索"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </BlurView>
        </View>
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
    height: 420,
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
  },
  closeButton: {
    padding: 5,
  },
  apiKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  apiKeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  apiKeyInput: {
    width: '100%',
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  apiKeyButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  apiKeyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c5ce7',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    overflow: 'hidden',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  recordingButton: {
    shadowColor: '#FF0000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analysisResultContainer: {
    flex: 1,
    padding: 5,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagItem: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tagLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  resetButtonText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '500',
  },
  restaurantSearchContainer: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  tagDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});

export default VoiceInput; 