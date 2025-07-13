# 📧 Gmail API統合 - 設定ガイド

## 🎯 概要

実際のGmailメールを扱うため、Google Cloud Console でのプロジェクト設定とOAuth2.0認証の設定を行います。

## 📋 必要な手順

### 1️⃣ Google Cloud Console でのプロジェクト作成

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/
   - Googleアカウントでログイン

2. **新しいプロジェクトを作成**
   ```
   プロジェクト名: Gmail Assistant
   組織: 個人の場合は「組織なし」
   場所: デフォルト
   ```

3. **プロジェクトを選択**
   - 作成されたプロジェクトが選択されていることを確認

### 2️⃣ Gmail API の有効化

1. **APIライブラリにアクセス**
   - 左メニュー > 「APIとサービス」 > 「ライブラリ」

2. **Gmail API を検索・有効化**
   ```
   検索: "Gmail API"
   → Gmail API を選択
   → 「有効にする」をクリック
   ```

### 3️⃣ OAuth2.0 認証情報の作成

1. **認証情報ページにアクセス**
   - 左メニュー > 「APIとサービス」 > 「認証情報」

2. **OAuth 同意画面の設定**
   ```
   ユーザータイプ: 外部（個人の場合）
   アプリ名: Gmail Assistant
   ユーザーサポートメール: あなたのGmailアドレス
   デベロッパーの連絡先情報: 同上
   
   スコープ設定:
   - ../auth/userinfo.email
   - ../auth/userinfo.profile
   - https://www.googleapis.com/auth/gmail.readonly
   - https://www.googleapis.com/auth/gmail.send
   ```

3. **OAuth2.0 クライアントIDの作成**
   ```
   アプリケーションの種類: ウェブアプリケーション
   名前: Gmail Assistant Client
   
   承認済みのリダイレクトURI:
   - http://localhost:3001/api/auth/google/callback
   ```

4. **認証情報をダウンロード**
   - 作成されたクライアントIDの「ダウンロード」ボタンをクリック
   - JSONファイルが保存される

### 4️⃣ 環境変数の設定

1. **backend/.env ファイルを作成**
   ```bash
   cd backend
   cp .env.example .env  # テンプレートをコピー
   ```

2. **認証情報を .env ファイルに設定**
   ```env
   # Google OAuth2.0 & Gmail API 設定
   GOOGLE_CLIENT_ID=あなたのクライアントID.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=あなたのクライアントシークレット
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   
   # Gmail API を有効化
   GMAIL_API_ENABLED=true
   
   # その他の設定
   NODE_ENV=development
   PORT=3001
   CLIENT_URL=http://localhost:3000
   SESSION_SECRET=ランダムな秘密キー
   
   # Ollama設定
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:30b
   OLLAMA_TIMEOUT=60000
   OLLAMA_MAX_RETRIES=3
   ```

### 5️⃣ 権限スコープの説明

設定する Gmail API スコープ：

| スコープ | 説明 | 必要性 |
|---------|------|--------|
| `gmail.readonly` | メール読み取り | ✅ 必須 |
| `gmail.send` | メール送信 | ✅ 必須 |
| `userinfo.email` | ユーザーメールアドレス | ✅ 必須 |
| `userinfo.profile` | ユーザープロフィール | ✅ 必須 |

## 🧪 テスト手順

### 1. 環境変数確認
```bash
cd backend
node -e "require('dotenv').config(); console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ 設定済み' : '❌ 未設定')"
```

### 2. 開発サーバー起動
```bash
# プロジェクトルートで
./start-dev.sh both
```

### 3. 認証テスト
```bash
# ブラウザで以下にアクセス
http://localhost:3000

# 「Googleでログイン」ボタンをクリック
# Gmail権限の承認画面が表示されることを確認
```

### 4. API接続テスト
```bash
# 認証後、実際のGmailメールが取得できることを確認
curl -X GET "http://localhost:3001/api/emails" \
  -H "Cookie: connect.sid=あなたのセッションID"
```

## 🔒 セキュリティ設定

### 本番環境用の追加設定

1. **HTTPS化**
   - 本番環境では必ずHTTPS使用
   - リダイレクトURIもHTTPS に変更

2. **環境変数の保護**
   ```bash
   # .env ファイルの権限制限
   chmod 600 backend/.env
   
   # Gitignore確認
   echo "backend/.env" >> .gitignore
   ```

3. **OAuth同意画面の本番化**
   - テスト段階から本番公開に変更
   - プライバシーポリシー設定

## 🚨 トラブルシューティング

### よくある問題と解決策

1. **認証エラー: invalid_client**
   ```
   原因: CLIENT_ID または CLIENT_SECRET が間違っている
   解決: Google Cloud Console で認証情報を再確認
   ```

2. **権限エラー: insufficient_scope**
   ```
   原因: 必要な権限スコープが設定されていない
   解決: OAuth同意画面でスコープを追加
   ```

3. **API エラー: Daily Limit Exceeded**
   ```
   原因: Gmail API の使用量制限に達した
   解決: Google Cloud Console で使用量を確認
   ```

4. **リダイレクトエラー: redirect_uri_mismatch**
   ```
   原因: リダイレクトURIが正確に設定されていない
   解決: OAuth2.0設定でURIを正確に入力
   ```

## 📊 使用量監視

### API使用量の確認方法

1. **Google Cloud Console で監視**
   - 「APIとサービス」 > 「ダッシュボード」
   - Gmail API の使用状況を確認

2. **制限設定**
   ```
   デフォルト制限:
   - 1日あたり 1,000,000,000 クォータ単位
   - 1秒あたり 250 クォータ単位
   ```

## 🎉 完了確認

以下が全て✅になれば設定完了：

- [ ] Google Cloud Console プロジェクト作成
- [ ] Gmail API 有効化  
- [ ] OAuth2.0 認証情報作成
- [ ] 環境変数設定
- [ ] 認証テスト成功
- [ ] 実際のメール取得成功

---

**次のステップ**: モックデータから実際のGmail APIへの切り替え実装 