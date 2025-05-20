import 'dotenv/config';

export default {
  name: "Hamori",
  slug: "hamori",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  scheme: "hamori",
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSMicrophoneUsageDescription: "この機能は音声を文字に変換するために必要です。"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: ["android.permission.RECORD_AUDIO"]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // 環境変数からOpenAI APIキーを取得
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: "hamori-37"
    }
  },
  plugins: [
    [
      "expo-av",
      {
        microphonePermission: "マイクへのアクセスを許可すると、音声入力機能が使えます。"
      }
    ]
  ]
}; 