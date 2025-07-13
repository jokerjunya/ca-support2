module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // TypeScript変換設定
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // ファイル拡張子の設定
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts'
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // タイムアウト設定
  testTimeout: 10000,
  
  // 詳細表示
  verbose: true
}; 