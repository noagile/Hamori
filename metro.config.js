const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// エイリアスパスの設定
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

// package.exportsを無効化（SDK 53の問題対応）
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 