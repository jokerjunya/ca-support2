# 📧 Gmail Assistant

ローカルLLM搭載のGmailラッパーアプリケーション

## 🚀 **ワンクリック起動**

### 📱 超簡単！3ステップで開始

```bash
# 1. プロジェクトをダウンロード
git clone https://github.com/jokerjunya/ca-support2.git
cd ca-support2

# 2. ワンクリック起動（自動セットアップ付き）
./setup.sh

# または Docker で起動
./docker-start.sh
```

### 🔧 起動方法選択

| 方法 | 対象者 | 特徴 | コマンド |
|------|--------|------|----------|
| **自動セットアップ** | 初心者 | 依存関係を自動インストール | `./setup.sh` |
| **Docker起動** | 上級者 | 完全隔離環境 | `./docker-start.sh` |
| **診断のみ** | トラブル時 | 環境チェック | `./diagnose.sh` |

## 🎯 プロジェクト概要

Gmail APIと連携し、ローカルLLM (Qwen3:30B) を使用してAI返信生成を行うメールアシスタントです。

### ✅ 主要機能

- **Gmail API連携**: 実際のメール取得・表示
- **AI返信生成**: ローカルLLM（Qwen3:30B）による自動返信
- **スレッド表示**: 会話形式でのメール表示
- **語調選択**: ビジネス/カジュアル/丁寧語
- **完全ローカル処理**: データ外部送信なし
- **多言語対応**: 日本語・英語対応

## 📋 システム要件

### 最小要件
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **メモリ**: 8GB RAM （AI機能使用時: 16GB推奨）
- **ストレージ**: 10GB 空き容量

### 前提ソフトウェア

**自動セットアップ使用時:**
- Node.js 18+ ([nodejs.org](https://nodejs.org/))

**Docker使用時:**
- Docker Desktop ([docker.com](https://docker.com/))

## 🔍 起動前チェック

システム環境を事前にチェックできます：

```bash
./diagnose.sh
```

## 📖 詳細ガイド

### 📚 完全ドキュメント
- **[クイックスタートガイド](./QUICK_START_GUIDE.md)** - 詳細な起動手順
- **[トラブルシューティング](./TROUBLESHOOTING.md)** - 問題解決ガイド
- **[Gmail API設定](./GMAIL_SETUP_GUIDE.md)** - Gmail連携設定
- **[環境設定](./ENV_SETUP_TEMPLATE.md)** - 環境変数設定

### 🔧 開発者向け
- **[ペアプログラミングガイド](./PAIR_PROGRAMMING_GUIDE.md)** - 開発手順
- **[プロジェクト計画](./PROJECT_PLAN.md)** - 機能ロードマップ

## 🌐 アクセス先

起動後、以下のURLでアクセス：

- **Gmail Assistant**: http://localhost:3000
- **API サーバー**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001/health

## 💡 基本的な使い方

### 1. 初回認証
1. http://localhost:3000 にアクセス
2. 「ログイン」ボタンでGoogle認証
3. Gmail APIアクセス許可

### 2. メール操作
- 📧 実際のGmailメールを表示
- 🔵 未読メール（青色ハイライト）
- 🔴 重要メール（赤色マーク）

### 3. AI返信生成
1. メール選択
2. 「AI返信生成」ボタン
3. 語調選択（ビジネス/カジュアル/丁寧語）
4. 生成結果の確認・編集

## 🛑 停止方法

### 自動セットアップ版
```bash
# ターミナルでCtrl+C
# または
pkill -f "next dev"
pkill -f "nodemon"
```

### Docker版
```bash
# 停止
docker-compose down

# クリーンアップ付き停止
./docker-start.sh → 選択肢4
```

## 🤖 AI機能（Ollama）

### 自動インストール
- セットアップスクリプトが自動的にチェック
- 必要に応じてインストール手順を表示

### 手動インストール
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# モデルダウンロード
ollama pull qwen3:30b
```

## 📊 開発進捗

### ✅ 完了済み
- ✅ 基本プロジェクト構造
- ✅ Gmail API連携
- ✅ ローカルLLM統合 (Qwen3:30B)
- ✅ AI返信生成機能
- ✅ 語調選択機能
- ✅ 自動化スクリプト作成
- ✅ 返信テンプレートシステム
- ✅ スレッド管理機能
- ✅ パフォーマンス最適化
- ✅ 統計ダッシュボード強化
- ✅ **ワンクリック起動システム**

### 🔄 開発中
- 🔄 本番環境対応
- 🔄 メール送信機能
- 🔄 高度な検索・フィルタ

## 🛠 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **バックエンド**: Express.js, TypeScript, Passport.js
- **AI**: Ollama + Qwen3:30B
- **データベース**: Gmail API + Mock Data
- **認証**: Google OAuth2.0
- **コンテナ**: Docker + Docker Compose

## 🔐 セキュリティ

- 🔒 全AI処理はローカル実行
- 🚫 外部APIへのデータ送信なし
- 👀 Gmail APIは読み取り専用権限
- 🔑 認証情報は環境変数で管理

## 📞 サポート

### 🆘 困った時は

1. **診断ツール実行**: `./diagnose.sh`
2. **トラブルシューティング**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. **GitHub Issues**: 技術的な問題報告

### 📧 お問い合わせ

技術的な問題やバグレポートは、GitHubのIssuesページでお知らせください。

---

**開発者向けメモ**: 今後は必ず`./setup.sh`または`./docker-start.sh`を使用して起動してください。手動でコマンドを実行する場合は、適切なディレクトリにいることを確認してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。 