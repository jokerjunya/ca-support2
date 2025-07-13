#!/bin/bash

# Gmail Assistant - ワンクリック・セットアップ＆起動スクリプト
# 使用方法: ./setup.sh

set -e  # エラーが発生したら停止

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ロゴ表示
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📧 Gmail Assistant                         ║${NC}"
echo -e "${BLUE}║              ワンクリック・セットアップ＆起動                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# システム要件チェック
echo -e "${CYAN}🔍 システム要件をチェック中...${NC}"

# Node.js チェック
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js がインストールされていません${NC}"
    echo -e "${YELLOW}💡 解決方法:${NC}"
    echo -e "   • https://nodejs.org/ からNode.js 18以上をインストールしてください"
    echo -e "   • または: brew install node (macOS)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js のバージョンが古すぎます (現在: $(node -v), 必要: v18+)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# npm チェック
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm がインストールされていません${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

# Git チェック
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git がインストールされていません（推奨）${NC}"
else
    echo -e "${GREEN}✅ Git: $(git --version | cut -d' ' -f3)${NC}"
fi

echo ""

# ディレクトリ確認
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ エラー: プロジェクトルートディレクトリから実行してください${NC}"
    echo -e "${RED}   backend/ と frontend/ フォルダが見つかりません${NC}"
    exit 1
fi

# 実行権限の確認・付与
echo -e "${CYAN}🔧 スクリプトの実行権限を確認中...${NC}"
chmod +x "$0" 2>/dev/null || true
if [ -f "start-dev.sh" ]; then
    chmod +x start-dev.sh 2>/dev/null || true
fi

# 環境変数ファイルの確認・作成
echo -e "${CYAN}📝 環境設定をチェック中...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  環境変数ファイルが見つかりません。作成します...${NC}"
    if [ -f "backend/.env.template" ]; then
        cp "backend/.env.template" "backend/.env"
        echo -e "${GREEN}✅ .env ファイルを作成しました${NC}"
        echo -e "${YELLOW}💡 Gmail API を使用する場合は、backend/.env を編集してください${NC}"
    else
        echo -e "${RED}❌ .env.template が見つかりません${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 環境変数ファイルが見つかりました${NC}"
fi

# Ollama チェック
echo -e "${CYAN}🤖 Ollama (AI機能) をチェック中...${NC}"
if command -v ollama &> /dev/null; then
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama が起動中です${NC}"
        
        # モデルチェック
        if ollama list | grep -q "qwen3:30b"; then
            echo -e "${GREEN}✅ Qwen3:30B モデルが利用可能です${NC}"
        else
            echo -e "${YELLOW}⚠️  Qwen3:30B モデルが見つかりません${NC}"
            echo -e "${BLUE}💡 AI機能を使用するには: ollama pull qwen3:30b${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Ollama はインストール済みですが起動していません${NC}"
        echo -e "${BLUE}💡 起動方法: ollama serve${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama がインストールされていません${NC}"
    echo -e "${BLUE}💡 AI機能を使用するには:${NC}"
    echo -e "   • https://ollama.ai/ からOllamaをインストール"
    echo -e "   • ollama pull qwen3:30b でモデルをダウンロード"
fi

echo ""

# 依存関係の自動インストール
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo -e "${CYAN}📦 $name の依存関係をインストール中...${NC}"
    cd "$dir"
    
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo -e "${BLUE}   npm install を実行中...${NC}"
        npm install --silent
        
        # フロントエンドの場合、追加パッケージもインストール
        if [ "$dir" = "frontend" ]; then
            npm install @tailwindcss/forms @tailwindcss/typography --silent
        fi
        
        echo -e "${GREEN}✅ $name の依存関係インストール完了${NC}"
    else
        echo -e "${GREEN}✅ $name の依存関係は最新です${NC}"
    fi
    cd ..
}

install_dependencies "backend" "バックエンド"
install_dependencies "frontend" "フロントエンド"

echo ""

# TypeScript エラーチェック
echo -e "${CYAN}🔍 TypeScript エラーチェック中...${NC}"
cd backend
if npx tsc --noEmit --pretty 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript エラーなし${NC}"
else
    echo -e "${RED}❌ TypeScript エラーが検出されました${NC}"
    echo -e "${YELLOW}💡 修正が必要です。エラー詳細:${NC}"
    npx tsc --noEmit --pretty
    cd ..
    exit 1
fi
cd ..

echo ""

# 起動オプションの選択
echo -e "${PURPLE}🚀 起動モードを選択してください:${NC}"
echo -e "${BLUE}1) 完全起動 (バックエンド + フロントエンド) - 推奨${NC}"
echo -e "${BLUE}2) バックエンドのみ${NC}"
echo -e "${BLUE}3) フロントエンドのみ${NC}"
echo -e "${BLUE}4) 診断モードのみ (起動しない)${NC}"
echo ""

read -p "選択してください (1-4) [1]: " choice
choice=${choice:-1}

case $choice in
    1)
        echo -e "${GREEN}🚀 完全起動モードを開始します...${NC}"
        MODE="both"
        ;;
    2)
        echo -e "${GREEN}🚀 バックエンドのみを起動します...${NC}"
        MODE="backend"
        ;;
    3)
        echo -e "${GREEN}🚀 フロントエンドのみを起動します...${NC}"
        MODE="frontend"
        ;;
    4)
        echo -e "${GREEN}✅ 診断が完了しました。${NC}"
        echo -e "${BLUE}💡 起動したい場合は ./start-dev.sh を実行してください${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 無効な選択です${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 セットアップが完了しました！${NC}"
echo ""
echo -e "${BLUE}📋 アクセス情報:${NC}"
if [ "$MODE" = "both" ] || [ "$MODE" = "frontend" ]; then
    echo -e "${GREEN}   🌐 フロントエンド: http://localhost:3000${NC}"
fi
if [ "$MODE" = "both" ] || [ "$MODE" = "backend" ]; then
    echo -e "${GREEN}   🔧 バックエンド: http://localhost:3001${NC}"
    echo -e "${GREEN}   💊 ヘルスチェック: http://localhost:3001/health${NC}"
fi
echo ""
echo -e "${BLUE}🛑 停止方法: Ctrl+C を押してください${NC}"
echo ""

# クリーンアップ関数
cleanup() {
    echo -e "\n${YELLOW}🛑 アプリケーションを終了しています...${NC}"
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "ts-node.*src/index.ts" 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ 終了完了${NC}"
    exit 0
}

# シグナルハンドラー
trap cleanup SIGINT SIGTERM

# 開発サーバー起動
if [ -f "start-dev.sh" ]; then
    ./start-dev.sh "$MODE"
else
    echo -e "${RED}❌ start-dev.sh が見つかりません${NC}"
    exit 1
fi 