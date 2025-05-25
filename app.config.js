import 'dotenv/config';

export default {
  name: "Hamori",
  slug: "hamori",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
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
    },
    bundleIdentifier: "com.hamorinew.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: ["android.permission.RECORD_AUDIO"],
    package: "com.hamorinew.app"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // 注意: EXPO_PUBLIC_*で始まる環境変数はprocess.envから直接アクセス可能
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    // Firebase設定
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
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
    ],
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ]
  ]
}; 