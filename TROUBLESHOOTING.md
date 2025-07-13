# 🛠️ Gmail Assistant - トラブルシューティング

## 🔍 一般的な診断手順

### 1. システム状態の確認

```bash
# システム診断スクリプト実行
./setup.sh
# → 選択肢4「診断モードのみ」を選択

# または個別確認
node --version    # v18.0.0 以上
npm --version     # 8.0.0 以上
git --version     # 任意
```

### 2. プロセス状態の確認

```bash
# 実行中のNode.jsプロセス確認
ps aux | grep node

# ポート使用状況確認
lsof -i :3000  # フロントエンド
lsof -i :3001  # バックエンド
lsof -i :11434 # Ollama
```

### 3. ログファイルの確認

```bash
# リアルタイムログ監視
tail -f backend/logs/*.log  # バックエンドログ
```

## ❌ エラー別解決方法

### インストール・セットアップエラー

#### Error: "Node.js がインストールされていません"

**原因**: Node.jsが未インストールまたはパスが通っていない

**解決方法**:
```bash
# macOS (Homebrew)
brew install node

# macOS (公式)
# https://nodejs.org/ からダウンロード

# Windows
# https://nodejs.org/ からダウンロード
# またはchocolatey: choco install nodejs

# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm

# インストール確認
node --version
npm --version
```

#### Error: "npm install failed"

**原因**: ネットワーク問題、権限問題、キャッシュ問題

**解決方法**:
```bash
# キャッシュクリア
npm cache clean --force

# npmレジストリ確認
npm config get registry

# 権限問題の場合（Node.js再インストール推奨）
sudo chown -R $(whoami) ~/.npm

# プロキシ環境の場合
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# yarn使用を試す
npm install -g yarn
yarn install
```

### 起動・実行エラー

#### Error: "address already in use :::3000"

**原因**: ポート3000が他のプロセスで使用中

**解決方法**:
```bash
# 使用中プロセス確認
lsof -i :3000

# プロセス終了
kill -9 <PID>

# または別ポートで起動
PORT=3002 npm run dev

# 全関連プロセス終了
pkill -f "next dev"
pkill -f "node.*3000"
```

#### Error: "address already in use :::3001"

**原因**: ポート3001が他のプロセスで使用中

**解決方法**:
```bash
# 使用中プロセス確認
lsof -i :3001

# プロセス終了
kill -9 <PID>

# または全関連プロセス終了
pkill -f "nodemon"
pkill -f "ts-node.*src/index.ts"
```

#### Error: "TypeScript compilation failed"

**原因**: TypeScriptコンパイルエラー

**解決方法**:
```bash
# エラー詳細確認
cd backend
npx tsc --noEmit --pretty

# 型定義インストール
npm install @types/node @types/express --save-dev

# TypeScript設定確認
cat tsconfig.json

# 強制ビルド
npm run build --force
```

### Gmail API・認証エラー

#### Error: "Google OAuth認証情報が設定されていません"

**原因**: 環境変数が未設定または不正

**解決方法**:
```bash
# 環境変数ファイル確認
cat backend/.env

# 必要な設定
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
GMAIL_API_ENABLED=true

# テンプレートからコピー
cp backend/.env.template backend/.env
# → .envファイルを編集
```

#### Error: "Invalid id value" (Gmail API)

**原因**: Gmail APIから無効なメッセージIDを受信

**解決方法**:
```bash
# エラーハンドリングが機能していることを確認
# モックデータにフォールバックしているかチェック

# ログ確認
grep "Invalid id value" backend/logs/*.log

# Gmail API認証状態確認
curl http://localhost:3001/api/auth/status

# 再認証
# ブラウザで認証プロセスをやり直し
```

#### Error: "認証が必要です"

**原因**: Googleアカウント認証が未完了

**解決方法**:
1. http://localhost:3000 にアクセス
2. 「ログイン」ボタンをクリック
3. Googleアカウントで認証
4. Gmail APIアクセス権限を許可

### Ollama・AI機能エラー

#### Error: "Ollama がインストールされていません"

**原因**: Ollamaが未インストール

**解決方法**:
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# https://ollama.ai/ からダウンロード

# 起動確認
ollama --version
ollama serve
```

#### Error: "Ollama接続に失敗しました"

**原因**: Ollamaサービスが起動していない

**解決方法**:
```bash
# Ollamaサービス起動
ollama serve

# 別ターミナルで接続確認
curl http://localhost:11434/api/tags

# バックグラウンド起動
nohup ollama serve &

# サービス登録（systemd）
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### Error: "qwen3:30b モデルが見つかりません"

**原因**: AIモデルが未ダウンロード

**解決方法**:
```bash
# モデルダウンロード（数GB、時間がかかります）
ollama pull qwen3:30b

# ダウンロード状況確認
ollama list

# 軽量モデルを試す場合
ollama pull qwen3:7b

# .envファイルでモデル名変更
OLLAMA_MODEL=qwen3:7b
```

### Docker関連エラー

#### Error: "Docker がインストールされていません"

**原因**: Dockerが未インストール

**解決方法**:
```bash
# macOS
# Docker Desktop for Mac をダウンロード
# https://docs.docker.com/desktop/mac/install/

# Windows
# Docker Desktop for Windows をダウンロード
# https://docs.docker.com/desktop/windows/install/

# Ubuntu
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER

# インストール確認
docker --version
docker-compose --version
```

#### Error: "Docker デーモンが起動していません"

**原因**: Dockerサービスが未起動

**解決方法**:
```bash
# macOS/Windows
# Docker Desktop を起動

# Linux
sudo systemctl start docker
sudo systemctl enable docker

# 状態確認
docker info
docker ps
```

#### Error: "メモリ不足" (Docker)

**原因**: Docker利用可能メモリが不足

**解決方法**:
1. Docker Desktopの設定を開く
2. Resources → Advanced
3. Memory を 8GB 以上に設定
4. Apply & Restart

```bash
# 不要なコンテナ・イメージ削除
docker system prune -a -f

# 大きなイメージ確認
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### ネットワーク・ファイアウォールエラー

#### Error: "Connection refused"

**原因**: ファイアウォール、プロキシ、ネットワーク問題

**解決方法**:
```bash
# ファイアウォール確認（macOS）
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# ポート開放確認
telnet localhost 3000
telnet localhost 3001
telnet localhost 11434

# プロキシ設定（企業環境）
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1

# DNS確認
nslookup github.com
ping github.com
```

## 🔧 高度なトラブルシューティング

### デバッグモードでの実行

```bash
# Node.js デバッグモード
NODE_ENV=development DEBUG=* npm run dev

# TypeScript詳細エラー
npx tsc --noEmit --listFiles

# npm 詳細ログ
npm run dev --loglevel verbose
```

### システム要件の詳細確認

```bash
# システム情報
uname -a                    # OS確認
free -h                     # メモリ確認
df -h                       # ディスク容量確認
cat /proc/cpuinfo          # CPU確認（Linux）
sysctl -n hw.ncpu          # CPU確認（macOS）

# Node.js メモリ使用量
node --max-old-space-size=8192 --inspect app.js
```

### ログレベルの調整

```bash
# 環境変数でログレベル設定
export LOG_LEVEL=debug
export NODE_ENV=development

# バックエンドのログ設定
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

## 📧 サポート依頼時の情報収集

問題解決のために以下の情報を収集してください:

```bash
# システム情報収集スクリプト
cat > debug-info.sh << 'EOF'
#!/bin/bash
echo "=== Gmail Assistant - Debug Information ==="
echo "Date: $(date)"
echo "OS: $(uname -a)"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Ollama: $(ollama --version 2>/dev/null || echo 'Not installed')"
echo "Memory: $(free -h 2>/dev/null || echo 'N/A')"
echo "Disk: $(df -h . | tail -1)"
echo ""
echo "=== Process Status ==="
ps aux | grep -E "(node|ollama|docker)" | grep -v grep
echo ""
echo "=== Port Status ==="
lsof -i :3000 2>/dev/null || echo "Port 3000: Not in use"
lsof -i :3001 2>/dev/null || echo "Port 3001: Not in use"
lsof -i :11434 2>/dev/null || echo "Port 11434: Not in use"
echo ""
echo "=== Environment ==="
if [ -f "backend/.env" ]; then
    echo "Environment file exists"
    grep -v "SECRET\|PASSWORD\|TOKEN" backend/.env || echo "No safe env vars to show"
else
    echo "No environment file found"
fi
EOF

chmod +x debug-info.sh
./debug-info.sh
```

## 🔗 関連リソース

- **クイックスタートガイド**: [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)
- **Gmail API設定**: [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)
- **Node.js公式サイト**: https://nodejs.org/
- **Docker公式サイト**: https://docker.com/
- **Ollama公式サイト**: https://ollama.ai/ 