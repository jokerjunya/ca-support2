# 📧 Gmail Assistant - クイックスタートガイド

## 🚀 ワンクリック起動（推奨）

### 方法1: 自動セットアップスクリプト（初心者向け）

```bash
# 1. プロジェクトをダウンロード
git clone https://github.com/jokerjunya/ca-support2.git
cd ca-support2

# 2. ワンクリック起動
./setup.sh
```

### 方法2: Docker起動（上級者向け）

```bash
# 1. プロジェクトをダウンロード
git clone https://github.com/jokerjunya/ca-support2.git
cd ca-support2

# 2. Docker起動
./docker-start.sh
```

## 📋 システム要件

### 最小要件
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **メモリ**: 8GB RAM （AI機能使用時: 16GB推奨）
- **ストレージ**: 10GB 空き容量

### 推奨要件
- **メモリ**: 16GB+ RAM
- **CPU**: 4コア以上
- **ストレージ**: 20GB+ 空き容量（AIモデル用）

## 🛠️ 前提ソフトウェア

### 方法1: 自動セットアップ使用時
- **Node.js 18+**: [nodejs.org](https://nodejs.org/)
- **npm**: Node.jsに含まれています
- **Git** (推奨): [git-scm.com](https://git-scm.com/)

### 方法2: Docker使用時
- **Docker Desktop**: [docker.com](https://docker.com/)
- **Git** (推奨): [git-scm.com](https://git-scm.com/)

## 🎯 起動手順（詳細）

### ステップ1: プロジェクトの取得

```bash
# GitHubからクローン
git clone https://github.com/jokerjunya/ca-support2.git

# プロジェクトディレクトリに移動
cd ca-support2

# ファイル構成確認
ls -la
```

### ステップ2A: 自動セットアップでの起動

```bash
# 実行権限を付与
chmod +x setup.sh

# セットアップ・起動スクリプト実行
./setup.sh
```

**画面の指示に従って選択:**
1. `完全起動 (推奨)` を選択
2. 自動的に依存関係がインストールされます
3. システムチェックが実行されます
4. 開発サーバーが起動します

### ステップ2B: Dockerでの起動

```bash
# 実行権限を付与
chmod +x docker-start.sh

# Docker起動スクリプト実行
./docker-start.sh
```

**画面の指示に従って選択:**
1. `完全起動 (推奨)` を選択
2. 初回は自動的にモデルダウンロードされます（時間がかかります）
3. コンテナが起動します

### ステップ3: アクセス確認

起動完了後、ブラウザで以下にアクセス:

- **メインアプリ**: http://localhost:3000
- **API サーバー**: http://localhost:3001/health
- **Ollama AI**: http://localhost:11434/api/tags

## 🔧 基本的な使い方

### 1. 初回ログイン
1. http://localhost:3000 にアクセス
2. 「ログイン」ボタンをクリック
3. Googleアカウントで認証
4. Gmail APIアクセスを許可

### 2. メール確認
- ダッシュボードで実際のGmailメールが表示されます
- 未読メールは青色でハイライトされます
- 重要メールは赤色でマークされます

### 3. AI返信生成
1. メールを選択
2. 「AI返信生成」ボタンをクリック
3. 語調を選択（ビジネス/カジュアル/丁寧語）
4. 生成された返信を確認・編集
5. 必要に応じて送信

## 🛑 停止方法

### 自動セットアップ版
```bash
# ターミナルで Ctrl+C を押す
# または別ターミナルで:
pkill -f "next dev"
pkill -f "nodemon"
```

### Docker版
```bash
# 停止
docker-compose down

# または
./docker-start.sh
# → 選択肢4「停止・クリーンアップ」を選択
```

## ⚡ 機能概要

### ✅ 実装済み機能
- **Gmail API連携**: 実際のメール取得・表示
- **スレッド表示**: 会話形式でのメール表示
- **AI返信生成**: ローカルLLM（Qwen3:30B）による自動返信
- **多言語対応**: 日本語・英語対応
- **語調選択**: ビジネス/カジュアル/丁寧語
- **セキュリティ**: 完全ローカル処理

### 🔄 開発中機能
- メール送信機能
- テンプレート管理
- 高度な検索・フィルタ
- 統計・分析機能

## 📞 サポート・トラブルシューティング

### よくある問題

**Q1: "Node.js がインストールされていません" エラー**
```bash
# Node.js をインストール
# macOS
brew install node

# Windows
# https://nodejs.org/ からダウンロード

# Ubuntu
sudo apt update
sudo apt install nodejs npm
```

**Q2: "ポート3000/3001が使用中" エラー**
```bash
# 使用中のプロセスを確認
lsof -i :3000
lsof -i :3001

# プロセスを終了
kill -9 <PID>
```

**Q3: Ollamaが起動しない**
```bash
# Ollama インストール確認
ollama --version

# Ollama サービス起動
ollama serve

# モデルダウンロード
ollama pull qwen3:30b
```

**Q4: Docker起動時のメモリエラー**
- Docker Desktopの設定で使用可能メモリを8GB以上に設定
- 不要なDockerコンテナを削除: `docker system prune`

### ログの確認方法

**自動セットアップ版:**
```bash
# バックエンドログ
cd backend && npm run dev

# フロントエンドログ
cd frontend && npm run dev
```

**Docker版:**
```bash
# 全サービスのログ
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ollama
```

## 🔗 関連リンク

- **プロジェクトリポジトリ**: https://github.com/jokerjunya/ca-support2
- **Gmail API設定**: [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)
- **環境設定詳細**: [ENV_SETUP_TEMPLATE.md](./ENV_SETUP_TEMPLATE.md)
- **開発者ガイド**: [PAIR_PROGRAMMING_GUIDE.md](./PAIR_PROGRAMMING_GUIDE.md)

## 📧 お問い合わせ

技術的な問題やバグレポートは、GitHubのIssuesページでお知らせください。 