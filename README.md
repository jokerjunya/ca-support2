# Gmail Assistant

ローカルLLM搭載のGmailラッパーアプリケーション

## 🎯 プロジェクト概要

Gmail APIと連携し、ローカルLLM (Qwen3:30B) を使用してAI返信生成を行うメールアシスタントです。

## 🚀 開発環境セットアップ

### 前提条件
- Node.js 18以上
- npm
- Ollama (+ Qwen3:30B モデル)

### 📋 推奨開発方法

**❌ 避けるべきコマンド:**
```bash
# ルートディレクトリで直接実行しない
npm run dev  # Error: package.json not found
```

**✅ 推奨方法:**
```bash
# 自動化スクリプトを使用 (推奨)
./start-dev.sh both          # 両方のサーバーを起動
./start-dev.sh frontend      # フロントエンドのみ
./start-dev.sh backend       # バックエンドのみ
```

### 🔧 手動セットアップ（スクリプト不使用の場合）

```bash
# 1. 依存関係インストール
cd frontend && npm install @tailwindcss/forms @tailwindcss/typography
cd ../backend && npm install

# 2. 開発サーバー起動
# バックエンド
cd backend && npm run dev

# フロントエンド（別ターミナル）
cd frontend && npm run dev
```

## 🤖 LLM統合状況

- **モデル**: Qwen3:30B (Ollama経由)
- **状態**: ✅ 実装完了・動作確認済み
- **機能**: 
  - 💼 ビジネス調
  - 😊 カジュアル調
  - 🙏 丁寧語調
- **平均処理時間**: 3-6秒
- **信頼度**: 0.8

## 📱 アクセス先

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

## 🧪 動作確認

```bash
# AI返信生成テスト
curl -X POST http://localhost:3001/api/emails/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "mock_1",
    "replyType": "business",
    "customInstructions": "短く簡潔に回答してください",
    "language": "ja"
  }'
```

## 🔍 トラブルシューティング

### よくある問題と解決策

1. **`npm run dev`でpackage.jsonが見つからない**
   ```bash
   # 解決: プロジェクトルートで自動化スクリプトを使用
   ./start-dev.sh both
   ```

2. **@tailwindcss/forms モジュールが見つからない**
   ```bash
   # 解決: 依存関係を再インストール
   cd frontend && npm install @tailwindcss/forms @tailwindcss/typography
   ```

3. **TypeScriptコンパイルエラー**
   ```bash
   # 解決: 型チェック実行
   cd backend && npx tsc --noEmit
   ```

4. **Ollamaに接続できない**
   ```bash
   # 解決: Ollama起動確認
   ollama list
   ollama serve
   ```

## 📊 開発進捗

- [x] 基本プロジェクト構造
- [x] Gmail API連携
- [x] ローカルLLM統合 (Qwen3:30B)
- [x] AI返信生成機能
- [x] 語調選択機能
- [x] 自動化スクリプト作成
- [ ] 返信テンプレートシステム
- [ ] スレッド管理機能
- [ ] パフォーマンス最適化
- [ ] 統計ダッシュボード強化
- [ ] 本番環境対応

## 🛠 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **バックエンド**: Express.js, TypeScript, Passport.js
- **AI**: Ollama + Qwen3:30B
- **データベース**: Gmail API + Mock Data
- **認証**: Google OAuth2.0 (Optional)

## 📝 使用方法

1. 開発サーバーを起動
2. http://localhost:3000 にアクセス
3. メール一覧から返信したいメールを選択
4. 「AI返信生成」ボタンをクリック
5. 語調を選択（ビジネス/カジュアル/丁寧語）
6. 生成された返信を確認・編集
7. 送信

## 🔐 セキュリティ

- 全てのAI処理はローカルで実行
- 外部APIへのデータ送信なし
- Gmail APIは読み取り専用権限で使用
- 認証情報は環境変数で管理

---

**開発者向けメモ**: 今後は必ず`./start-dev.sh`を使用して開発環境を起動してください。手動でコマンドを実行する場合は、適切なディレクトリにいることを確認してください。 