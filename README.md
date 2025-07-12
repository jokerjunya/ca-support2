# 📧 Gmail Assistant

ローカルLLM搭載のGmailラッパーアプリケーション

## 🎯 概要

Gmail Assistantは、日常のメール処理を自動化し、安全かつ高速にメール返信を生成するアプリケーションです。

### 主要機能

- 📨 Gmail APIを通じた未読メール自動取得
- 🤖 ローカルLLMによる返信文自動生成
- 🎨 Spotify風の直感的なUI
- 🔒 プライバシー重視（データはローカルで処理）
- ⚡ 高速なメール処理体験

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    フロントエンド                           │
│               Next.js + TypeScript + Tailwind CSS          │
├─────────────────────────────────────────────────────────────┤
│                    バックエンド                           │
│              Node.js + Express + TypeScript               │
│                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Gmail API     │  │  ローカルLLM    │  │  ローカルDB  │ │
│  │   ラッパー      │  │  (Qwen2.5-7B)  │  │  (SQLite)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 プロジェクト構造

```
ca-support5/
├── backend/                 # バックエンド（Node.js + Express）
│   ├── src/
│   │   ├── routes/         # API ルート
│   │   ├── services/       # ビジネスロジック
│   │   ├── types/          # 型定義
│   │   └── utils/          # ユーティリティ
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # フロントエンド（Next.js + React）
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── services/       # API通信
│   │   ├── types/          # 型定義
│   │   └── utils/          # ユーティリティ
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # 共通型定義
│   └── types/
├── PROJECT_PLAN.md         # 詳細プロジェクト計画
├── PAIR_PROGRAMMING_GUIDE.md # 開発ガイド
└── README.md              # このファイル
```

## 🚀 セットアップ

### 前提条件

- Node.js (v18以上)
- npm または yarn
- Gmail API認証情報
- ローカルLLM環境（Ollama推奨）

### インストール

1. **プロジェクトクローン**
   ```bash
   git clone <repository-url>
   cd ca-support5
   ```

2. **バックエンドセットアップ**
   ```bash
   cd backend
   npm install
   ```

3. **フロントエンドセットアップ**
   ```bash
   cd ../frontend
   npm install
   ```

4. **環境変数設定**
   ```bash
   # backend/.env
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   
   # Google OAuth2.0設定
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   
   # セッション設定
   SESSION_SECRET=your_session_secret_here
   
   # ローカルLLM設定
   OLLAMA_URL=http://localhost:11434
   LLM_MODEL=qwen2.5:7b-instruct
   ```

5. **Google Cloud Console設定**
   - Google Cloud Console (https://console.cloud.google.com/) でプロジェクトを作成
   - Gmail API を有効化
   - OAuth 2.0 認証情報を作成
   - リダイレクトURIに `http://localhost:3001/api/auth/google/callback` を設定

### 起動

1. **バックエンド起動**
   ```bash
   cd backend
   npm run dev
   ```

2. **フロントエンド起動**
   ```bash
   cd frontend
   npm run dev
   ```

3. **アプリケーションアクセス**
   - フロントエンド: http://localhost:3000
   - バックエンドAPI: http://localhost:3001

## 🔧 開発

### 開発フェーズ

#### フェーズ1: 基盤構築
- [x] プロジェクトセットアップ
- [ ] Gmail API連携
- [ ] 基本UI構築

#### フェーズ2: LLM統合
- [ ] ローカルLLM環境構築
- [ ] 返信生成機能
- [ ] UI改善

#### フェーズ3: 高度な機能
- [ ] スレッド管理
- [ ] 統計ダッシュボード
- [ ] パフォーマンス最適化

### 開発ガイド

詳細な開発ガイドラインについては、[PAIR_PROGRAMMING_GUIDE.md](./PAIR_PROGRAMMING_GUIDE.md)を参照してください。

## 📊 技術スタック

### フロントエンド
- **Next.js**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Lucide React**: アイコン

### バックエンド
- **Node.js**: サーバー実行環境
- **Express**: Webフレームワーク
- **TypeScript**: 型安全性
- **googleapis**: Gmail API クライアント

### データベース
- **SQLite**: ローカルデータストレージ

### LLM
- **Ollama**: ローカルLLM実行環境
- **Qwen2.5-7B-Instruct**: 言語モデル

## 🔒 セキュリティ

- OAuth2.0による安全な認証
- データはローカルで処理（外部送信なし）
- 送信履歴の暗号化保存

## 📈 パフォーマンス目標

- メール処理時間: 従来比50%削減
- 返信品質: 人間による修正率30%以下
- ユーザビリティ: SUS 80点以上

## 🤝 コントリビューション

プロジェクトへの貢献をお待ちしています！

## 📄 ライセンス

MIT License

## 🆘 サポート

問題や質問がある場合は、Issueを作成してください。

---

**Gmail Assistant** - 効率的なメール処理で、あなたの時間を大切にします。 