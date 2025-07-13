# 📧 環境変数設定テンプレート - Gmail Assistant

## 🔧 backend/.env ファイルの作成

以下の内容で `backend/.env` ファイルを作成してください：

```env
# ==========================================
# Gmail Assistant - 環境変数設定
# ==========================================

# アプリケーション設定
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
SESSION_SECRET=your-super-secret-session-key-change-this-to-random-string

# ==========================================
# Google OAuth2.0 & Gmail API 設定
# ==========================================
# Google Cloud Console で取得した認証情報を設定
# 設定手順: GMAIL_SETUP_GUIDE.md を参照

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Gmail API を有効化するフラグ
# 開発時: false (モックデータ使用)
# 本番時: true (実際のGmail API使用)
GMAIL_API_ENABLED=true

# ==========================================
# Ollama & LLM 設定
# ==========================================
# ローカルLLM（Ollama）設定

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:30b
OLLAMA_TIMEOUT=60000
OLLAMA_MAX_RETRIES=3

# ==========================================
# 開発用設定
# ==========================================
# 開発時のフラグ設定例:
# GMAIL_API_ENABLED=false  # モックデータで開発
# GMAIL_API_ENABLED=true   # 実際のGmail APIで開発
```

## 🚀 設定手順

### 1. ファイル作成
```bash
cd backend
touch .env
```

### 2. 権限設定（セキュリティ強化）
```bash
chmod 600 .env  # 所有者のみ読み書き可能
```

### 3. Google Cloud Console 設定
`GMAIL_SETUP_GUIDE.md` の手順に従って：
- Google Cloud プロジェクト作成
- Gmail API 有効化
- OAuth2.0 認証情報作成
- クライアントID・シークレット取得

### 4. 環境変数設定
取得した認証情報を .env ファイルに記入：
```env
GOOGLE_CLIENT_ID=実際のクライアントID
GOOGLE_CLIENT_SECRET=実際のクライアントシークレット
```

### 5. セッション秘密キー生成
```bash
# ランダムな秘密キーを生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔍 設定確認

### 環境変数チェック
```bash
cd backend
node -e "
require('dotenv').config();
console.log('✅ 設定確認:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ 設定済み' : '❌ 未設定');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ 設定済み' : '❌ 未設定');
console.log('GMAIL_API_ENABLED:', process.env.GMAIL_API_ENABLED);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ 設定済み' : '❌ 未設定');
"
```

### API接続状況確認
```bash
# サーバー起動後
curl -X GET "http://localhost:3001/api/emails/api-status" \
  -H "Cookie: connect.sid=your_session_id"
```

## 🚨 注意事項

### セキュリティ
- **絶対に .env ファイルをGitにコミットしないでください**
- `.gitignore` に `backend/.env` が含まれていることを確認
- 本番環境では必ずHTTPSを使用
- SESSION_SECRET は十分に複雑なランダム文字列を使用

### 開発vs本番
```env
# 開発環境
NODE_ENV=development
GMAIL_API_ENABLED=false  # または true

# 本番環境  
NODE_ENV=production
GMAIL_API_ENABLED=true
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
CLIENT_URL=https://yourdomain.com
```

## 🐛 トラブルシューティング

### 認証エラー
```
Error: Google OAuth認証情報が設定されていません
→ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET を確認
```

### API無効エラー
```
Error: Gmail API has not been used in project
→ Google Cloud Console でGmail API有効化を確認
```

### 権限エラー
```
Error: insufficient_scope
→ OAuth同意画面でスコープ設定を確認
```

---

**次のステップ**: `GMAIL_SETUP_GUIDE.md` でGoogle Cloud Console設定を完了 