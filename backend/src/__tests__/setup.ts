/**
 * Jest テストセットアップファイル
 * テスト実行前の初期化処理を行う
 */

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.GMAIL_API_ENABLED = 'false'; // テスト時はモックデータを使用

// グローバルなテストユーティリティ
global.console = {
  ...console,
  // テスト時のログ出力を制御
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// タイムゾーンをUTCに設定（テストの一貫性のため）
process.env.TZ = 'UTC'; 