import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList, Image, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import axios from 'axios';

// Google Places APIキー
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
// OpenAI APIキー
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;
// ChatGPT APIのベースURL
const CHATGPT_API_URL = 'https://api.openai.com/v1/chat/completions';

// モックのグループデータ（実際の実装では親コンポーネントからpropsで渡すか、APIから取得）
const mockGroups = {
  'g1': { name: '会社の仲間', members: 5, color: '#6c5ce7', image: 'https://randomuser.me/api/portraits/groups/1.jpg' },
  'g2': { name: '大学の友達', members: 4, color: '#0984e3', image: 'https://randomuser.me/api/portraits/groups/2.jpg' },
  'g3': { name: '家族', members: 3, color: '#00b894', image: 'https://randomuser.me/api/portraits/groups/3.jpg' },
  'g4': { name: 'サークル', members: 8, color: '#fdcb6e', image: 'https://randomuser.me/api/portraits/groups/4.jpg' },
};

// レストラン検索結果の型定義
interface Restaurant {
  id: string;
  name: string;
  vicinity: string; // 住所
  rating?: number;
  user_ratings_total?: number;
  photos?: { photo_reference: string }[];
  price_level?: number;
  opening_hours?: { open_now: boolean };
}

// モックデータ（API接続が失敗した場合のフォールバック用）
const mockData = {
  status: 'OK',
  results: [
    {
      id: '1',
      name: '和食鍋専門店 あったか亭',
      vicinity: '東京都渋谷区神宮前5-1-1',
      rating: 4.5,
      user_ratings_total: 120,
      price_level: 2,
      opening_hours: { open_now: true },
      photos: []
    },
    {
      id: '2',
      name: 'カフェ ホットタイム',
      vicinity: '東京都渋谷区神宮前5-2-2',
      rating: 4.2,
      user_ratings_total: 85,
      price_level: 1,
      opening_hours: { open_now: true },
      photos: []
    },
    {
      id: '3',
      name: 'コージーインテリア料理店',
      vicinity: '東京都渋谷区神宮前5-3-3',
      rating: 4.7,
      user_ratings_total: 210,
      price_level: 3,
      opening_hours: { open_now: false },
      photos: []
    }
  ]
};

interface RestaurantSearchResultsProps {
  tags: string[];
  onClose?: () => void;
  groupId?: string | null;
}

const RestaurantSearchResults: React.FC<RestaurantSearchResultsProps> = ({ tags, onClose, groupId }) => {
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bestRestaurant, setBestRestaurant] = useState<Restaurant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optimizedKeyword, setOptimizedKeyword] = useState<string>('');
  const [optimizingQuery, setOptimizingQuery] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  // 選択されているグループ情報を取得
  const selectedGroup = groupId && mockGroups[groupId] ? mockGroups[groupId] : null;

  // GPTを使用してタグから最適な検索クエリを生成する
  const optimizeSearchQuery = async (inputTags: string[]): Promise<string> => {
    if (!OPENAI_API_KEY) {
      console.log('OpenAI APIキーが設定されていないため、タグをそのまま使用します');
      return inputTags.join(' ');
    }

    try {
      setOptimizingQuery(true);
      console.log('GPTを使用して検索クエリを最適化します...');
      
      // グループ情報を含めたプロンプト作成
      let promptContent = "あなたはGoogle Mapsで日本の飲食店を検索するための専門家です。ユーザーから提供されたタグを基に、日本のGoogle Maps検索で最も良い結果が得られる検索クエリを作成してください。";
      
      // グループモードの場合はプロンプトに情報を追加
      if (selectedGroup) {
        promptContent += `ユーザーは「${selectedGroup.name}」というグループ（${selectedGroup.members}人）で飲食店を探しています。グループでの食事に適した検索クエリを考慮してください。`;
      }
      
      promptContent += "店舗タイプや料理ジャンル、特徴的な要素を含む、簡潔で効果的な日本語の検索キーワードを返してください。例えば「和食 鍋料理 個室」のように、空白で区切られた3-5個のキーワードが理想的です。検索クエリのみを返してください。";
      
      const prompt = {
        model: "gpt-4",  // gpt-4よりコスト効率の良いモデルを使用
        messages: [
          {
            role: "system",
            content: promptContent
          },
          {
            role: "user",
            content: `以下のタグから、日本のGoogle Maps検索で飲食店を効果的に見つけるための最適な検索クエリを作成してください。${selectedGroup ? `「${selectedGroup.name}」（${selectedGroup.members}人）のグループに適した店舗を検索します。` : ''}タグをそのまま使用してもいいのですが、そのまま使用しても検索にヒットしなそうな場合はタグを上位概念で捉えて簡潔なクエリを作成して：${inputTags.join(', ')}`
          }
        ]
      };
      
      const response = await axios.post(CHATGPT_API_URL, prompt, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });
      
      const optimizedQuery = response.data.choices[0].message.content.trim();
      console.log('最適化された検索クエリ:', optimizedQuery);
      
      return optimizedQuery;
    } catch (error) {
      console.error('検索クエリの最適化に失敗しました:', error);
      return inputTags.join(' '); // エラー時は元のタグを使用
    } finally {
      setOptimizingQuery(false);
    }
  };

  // GPTを使用して最も適合する飲食店を選択する
  const selectBestRestaurant = (restaurantList: Restaurant[]): Restaurant | null => {
    if (!restaurantList || restaurantList.length === 0) return null;
    
    // レストランをランク付けするための評価関数
    const rateRestaurant = (restaurant: Restaurant): number => {
      let score = 0;
      
      // 評価点数による加点
      if (restaurant.rating) {
        score += restaurant.rating * 10; // 評価は0〜5なので、重みづけ
        
        // レビュー数による信頼性の加点
        if (restaurant.user_ratings_total) {
          // レビュー数に対する対数スケールの重み付け (より多くのレビューがあるほど信頼性が高い)
          score += Math.log10(restaurant.user_ratings_total) * 5;
        }
      }
      
      // 営業中なら加点
      if (restaurant.opening_hours && restaurant.opening_hours.open_now) {
        score += 20;
      }
      
      // 写真があれば加点 (情報の充実度)
      if (restaurant.photos && restaurant.photos.length > 0) {
        score += 10;
      }
      
      return score;
    };
    
    // 全レストランを評価してソート
    const ratedRestaurants = restaurantList.map(restaurant => ({
      restaurant,
      score: rateRestaurant(restaurant)
    }));
    
    // スコアの高い順にソート
    ratedRestaurants.sort((a, b) => b.score - a.score);
    
    console.log('ベストレストラン選出:', ratedRestaurants[0].restaurant.name, 'スコア:', ratedRestaurants[0].score);
    
    // 最高評価のレストランを返す
    return ratedRestaurants[0].restaurant;
  };

  // タグをキーワードにして検索を実行
  useEffect(() => {
    if (!tags || tags.length === 0) return;
    
    const searchRestaurants = async () => {
      setLoading(true);
      setErrorMsg(null);
      setBestRestaurant(null);
      setShowAllResults(false);
      
      try {
        // 位置情報の権限を取得
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('位置情報へのアクセス許可が必要です');
          setLoading(false);
          return;
        }
        
        // 現在位置を取得
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // GPTでタグを最適化された検索クエリに変換
        const optimizedKeyword = await optimizeSearchQuery(tags);
        setOptimizedKeyword(optimizedKeyword);
        
        // APIキーの確認
        if (!GOOGLE_MAPS_API_KEY) {
          console.error('Google Maps APIキーが設定されていません');
          setErrorMsg('APIキーが正しく設定されていません。管理者に連絡してください。');
          setLoading(false);
          return;
        }
        
        console.log('Google Maps APIキー (先頭5文字):', GOOGLE_MAPS_API_KEY.substring(0, 5) + '...');
        
        // axios を使用して API リクエストを送信（CORS問題を回避）
        console.log('検索開始:', optimizedKeyword);
        
        try {
          // APIリクエストパラメータ
          const params = {
            location: `${latitude},${longitude}`,
            radius: 1500,
            type: 'restaurant',
            keyword: optimizedKeyword,
            language: 'ja',
            key: GOOGLE_MAPS_API_KEY
          };
          
          console.log('リクエストパラメータ:', JSON.stringify({...params, key: 'API_KEY'}));
          
          // axios を使用して API リクエストを送信
          const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
            { params }
          );
          
          console.log('Places API レスポンスステータス:', response.data.status);
          
          if (response.data.status === 'OK') {
            const results = response.data.results;
            console.log(`${results.length}件のレストランが見つかりました`);
            
            // 全レストランデータを保存
            setRestaurants(results);
            
            // 最適なレストランを選択
            const best = selectBestRestaurant(results);
            setBestRestaurant(best);
            
          } else if (response.data.status === 'ZERO_RESULTS') {
            console.log('レストランが見つかりませんでした');
            setRestaurants([]);
            setErrorMsg('条件に合うレストランが見つかりませんでした');
          } else if (response.data.status === 'REQUEST_DENIED') {
            console.error('本番APIでエラー発生。モックデータを使用します');
            // モックデータを使用
            setRestaurants(mockData.results);
            // 最適なレストランを選択
            const best = selectBestRestaurant(mockData.results);
            setBestRestaurant(best);
          } else {
            console.error('Google Places API エラー:', response.data.status);
            // モックデータを使用
            setRestaurants(mockData.results);
            // 最適なレストランを選択
            const best = selectBestRestaurant(mockData.results);
            setBestRestaurant(best);
          }
        } catch (apiError) {
          console.error('API呼び出しエラー。詳細:', apiError);
          console.error('モックデータを使用します');
          // モックデータを使用
          setRestaurants(mockData.results);
          // 最適なレストランを選択
          const best = selectBestRestaurant(mockData.results);
          setBestRestaurant(best);
        }
      } catch (error) {
        console.error('レストラン検索エラー:', error);
        setErrorMsg('レストランの検索中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    searchRestaurants();
  }, [tags]);

  // 写真のURLを取得
  const getPhotoUrl = (photoReference: string | undefined) => {
    // 写真リファレンスがない場合はデフォルト画像を返す
    if (!photoReference) {
      // デモ用ランダム画像を返す
      const demoImages = [
        'https://source.unsplash.com/random/200x200/?japanese-food',
        'https://source.unsplash.com/random/200x200/?restaurant',
        'https://source.unsplash.com/random/200x200/?cafe',
        'https://source.unsplash.com/random/200x200/?hot-pot'
      ];
      return demoImages[Math.floor(Math.random() * demoImages.length)];
    }
    
    // axios を使用した場合、直接 URL を返せます
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  // GoogleマップでのナビゲーションURLを取得
  const getDirectionsUrl = (restaurantName: string, vicinity: string) => {
    const query = encodeURIComponent(`${restaurantName} ${vicinity}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // 地図アプリを開く
  const openMaps = (restaurant: Restaurant) => {
    const url = getDirectionsUrl(restaurant.name, restaurant.vicinity);
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('エラー', '地図アプリを開けませんでした');
        }
      })
      .catch(error => {
        console.error('リンクを開く際にエラーが発生しました:', error);
      });
  };

  // 価格レベルを表示（¥の数で表現）
  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return '価格不明';
    
    const yen = '¥';
    return yen.repeat(priceLevel || 1);
  };

  // レストラン情報を表示するアイテム
  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity 
      style={styles.restaurantCard}
      onPress={() => openMaps(item)}
    >
      {item.photos && item.photos.length > 0 ? (
        <Image 
          source={{ uri: getPhotoUrl(item.photos[0].photo_reference) }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
      ) : (
        <Image 
          source={{ uri: getPhotoUrl(undefined) }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantAddress}>{item.vicinity}</Text>
        
        <View style={styles.restaurantMetaContainer}>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
                {item.user_ratings_total && (
                  <Text style={styles.ratingCount}> ({item.user_ratings_total})</Text>
                )}
              </Text>
            </View>
          )}
          
          <Text style={styles.priceLevel}>
            {renderPriceLevel(item.price_level)}
          </Text>
          
          {item.opening_hours && (
            <Text style={[
              styles.openStatus,
              item.opening_hours.open_now ? styles.openNow : styles.closedNow
            ]}>
              {item.opening_hours.open_now ? '営業中' : '営業時間外'}
            </Text>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#666" style={styles.arrowIcon} />
    </TouchableOpacity>
  );

  // 単一レストランのプレビューカード
  const renderSingleRestaurant = (restaurant: Restaurant) => (
    <View style={styles.singleRestaurantContainer}>
      {restaurant.photos && restaurant.photos.length > 0 ? (
        <Image 
          source={{ uri: getPhotoUrl(restaurant.photos[0].photo_reference) }}
          style={styles.singleRestaurantImage}
          resizeMode="cover"
        />
      ) : (
        <Image 
          source={{ uri: getPhotoUrl(undefined) }}
          style={styles.singleRestaurantImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.singleRestaurantInfo}>
        <Text style={styles.singleRestaurantName}>{restaurant.name}</Text>
        <Text style={styles.singleRestaurantAddress}>{restaurant.vicinity}</Text>
        
        <View style={styles.singleRestaurantMetaRow}>
          {restaurant.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingTextLarge}>
                {restaurant.rating.toFixed(1)}
                {restaurant.user_ratings_total && (
                  <Text style={styles.ratingCountLarge}> ({restaurant.user_ratings_total})</Text>
                )}
              </Text>
            </View>
          )}
          
          <Text style={styles.priceLevelLarge}>
            {renderPriceLevel(restaurant.price_level)}
          </Text>
        </View>
        
        <View style={styles.singleRestaurantMetaRow}>
          {restaurant.opening_hours && (
            <Text style={[
              styles.openStatusLarge,
              restaurant.opening_hours.open_now ? styles.openNow : styles.closedNow
            ]}>
              {restaurant.opening_hours.open_now ? '営業中' : '営業時間外'}
            </Text>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => openMaps(restaurant)}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.navigationButtonText}>ナビゲーション</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.allResultsButton}
            onPress={() => setShowAllResults(true)}
          >
            <Text style={styles.allResultsButtonText}>他の結果を見る</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>おすすめのレストラン</Text>
        
        {/* グループ情報表示 */}
        {selectedGroup && (
          <View style={[styles.groupInfoBanner, {backgroundColor: `${selectedGroup.color}22`}]}>
            <Image 
              source={{ uri: selectedGroup.image }}
              style={[styles.groupIconImage, {borderColor: selectedGroup.color}]}
            />
            <Text style={styles.groupInfoText}>
              <Text style={styles.groupNameInBanner}>{selectedGroup.name}</Text>
              <Text style={styles.groupMembersText}> ({selectedGroup.members}人) で探しています</Text>
            </Text>
          </View>
        )}
        
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={`tag-${index}`} style={[
              styles.tag,
              selectedGroup ? {backgroundColor: selectedGroup.color} : null 
            ]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        {optimizedKeyword && (
          <View style={styles.queryInfoContainer}>
            <Text style={styles.queryInfoText}>検索クエリ: <Text style={styles.queryHighlight}>{optimizedKeyword}</Text></Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>
            {optimizingQuery ? 'クエリを最適化中...' : 'レストランを検索中...'}
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff4757" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>レストランが見つかりませんでした</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : !showAllResults && bestRestaurant ? (
        // 最適なレストラン1件を表示
        <ScrollView contentContainerStyle={styles.singleResultContainer}>
          <Text style={styles.bestMatchTitle}>最も条件に合うお店</Text>
          {renderSingleRestaurant(bestRestaurant)}
        </ScrollView>
      ) : (
        // 全レストランのリスト表示
        <View style={styles.allResultsContainer}>
          {!showAllResults && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowAllResults(false)}
            >
              <Ionicons name="arrow-back" size={18} color="#6c5ce7" />
              <Text style={styles.backButtonText}>おすすめ店舗に戻る</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={restaurants}
            renderItem={renderItem}
            keyExtractor={(item) => item.id || `restaurant-${Math.random().toString(36).substr(2, 9)}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  queryInfoContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6c5ce7',
  },
  queryInfoText: {
    fontSize: 12,
    color: '#666',
  },
  queryHighlight: {
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6c5ce7',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  // 単一レストラン表示用のスタイル
  singleResultContainer: {
    padding: 16,
  },
  bestMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  singleRestaurantContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  singleRestaurantImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  singleRestaurantInfo: {
    padding: 16,
  },
  singleRestaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  singleRestaurantAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  singleRestaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingTextLarge: {
    marginLeft: 4,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ratingCountLarge: {
    fontSize: 14,
    color: '#666',
  },
  priceLevelLarge: {
    fontSize: 16,
    color: '#666',
    marginLeft: 16,
  },
  openStatusLarge: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  navigationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  allResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  allResultsButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 15,
  },
  allResultsContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButtonText: {
    color: '#6c5ce7',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  // 既存のリスト表示用スタイル
  restaurantCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  restaurantMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  ratingCount: {
    fontSize: 12,
    color: '#888',
  },
  priceLevel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  openStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openNow: {
    backgroundColor: '#e3fcef',
    color: '#0bab64',
  },
  closedNow: {
    backgroundColor: '#ffeded',
    color: '#ff4757',
  },
  arrowIcon: {
    alignSelf: 'center',
  },
  groupInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  groupIconImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    marginRight: 8,
  },
  groupInfoText: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  groupNameInBanner: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  groupMembersText: {
    fontSize: 12,
    color: '#666',
  },
});

export default RestaurantSearchResults; 