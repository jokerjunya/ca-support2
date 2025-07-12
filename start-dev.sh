#!/bin/bash

# Gmail Assistant - 開発サーバー起動スクリプト
# 使用方法: ./start-dev.sh [frontend|backend|both]

set -e  # エラーが発生したら停止

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ表示
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}    Gmail Assistant - 開発環境起動    ${NC}"
echo -e "${BLUE}======================================${NC}"

# 実行権限の確認
if [ ! -x "$0" ]; then
    echo -e "${YELLOW}実行権限を付与しています...${NC}"
    chmod +x "$0"
fi

# 現在のディレクトリの確認
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}エラー: プロジェクトルートディレクトリから実行してください${NC}"
    echo -e "${RED}backend/とfrontend/フォルダが見つかりません${NC}"
    exit 1
fi

# 引数の処理
TARGET=${1:-both}

# 関数定義
check_dependencies() {
    echo -e "${BLUE}📦 依存関係の確認中...${NC}"
    
    # フロントエンドの依存関係チェック
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}フロントエンドの依存関係をインストールしています...${NC}"
        cd frontend
        npm install
        npm install @tailwindcss/forms @tailwindcss/typography
        cd ..
    fi
    
    # バックエンドの依存関係チェック
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}バックエンドの依存関係をインストールしています...${NC}"
        cd backend
        npm install
        cd ..
    fi
}

# TypeScriptエラーをチェック
check_typescript() {
    echo -e "${BLUE}🔍 TypeScriptエラーをチェック中...${NC}"
    cd backend
    if ! npx tsc --noEmit; then
        echo -e "${RED}TypeScriptエラーが検出されました。修正が必要です。${NC}"
        cd ..
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ TypeScriptエラーなし${NC}"
}

# プロセス終了処理
cleanup() {
    echo -e "\n${YELLOW}🛑 開発サーバーを終了しています...${NC}"
    pkill -f "next dev" || true
    pkill -f "nodemon" || true
    pkill -f "ts-node" || true
    exit 0
}

# Ctrl+Cでクリーンアップ
trap cleanup SIGINT SIGTERM

# 依存関係の確認
check_dependencies

# TypeScriptエラーチェック
check_typescript

# Ollamaの確認
echo -e "${BLUE}🤖 Ollama接続確認中...${NC}"
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ollamaが起動していません。AI機能は無効になります。${NC}"
else
    echo -e "${GREEN}✅ Ollama接続OK${NC}"
fi

# 既存のプロセスを終了
pkill -f "next dev" || true
pkill -f "nodemon" || true
pkill -f "ts-node" || true

# 実行対象に応じて起動
case $TARGET in
    "frontend")
        echo -e "${GREEN}🚀 フロントエンドサーバーを起動中...${NC}"
        echo -e "${BLUE}URL: http://localhost:3000${NC}"
        cd frontend
        npm run dev
        ;;
    "backend")
        echo -e "${GREEN}🚀 バックエンドサーバーを起動中...${NC}"
        echo -e "${BLUE}URL: http://localhost:3001${NC}"
        cd backend
        npm run dev
        ;;
    "both")
        echo -e "${GREEN}🚀 両方のサーバーを起動中...${NC}"
        echo -e "${BLUE}フロントエンド: http://localhost:3000${NC}"
        echo -e "${BLUE}バックエンド: http://localhost:3001${NC}"
        
        # バックエンドをバックグラウンドで起動
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        # 2秒待機
        sleep 2
        
        # フロントエンドを起動
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        
        # 両方の起動を待機
        wait $BACKEND_PID $FRONTEND_PID
        ;;
    *)
        echo -e "${RED}使用方法: $0 [frontend|backend|both]${NC}"
        exit 1
        ;;
esac 