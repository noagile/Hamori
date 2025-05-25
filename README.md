# Hamori

Hamori アプリケーションのリポジトリです。

## 概要

このプロジェクトはReact Nativeで開発されたモバイルアプリケーションです。

## インストール方法

```
npm install
```

## 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の環境変数を設定してください：

```
# Firebase設定
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# APIキー
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

※APIキーなどの機密情報は`.env`ファイルに保存し、GitHubにアップロードしないでください。

## 実行方法

```
npm start
``` 