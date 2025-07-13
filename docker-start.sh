#!/bin/bash

# Gmail Assistant - Docker ワンクリック起動スクリプト
# 使用方法: ./docker-start.sh

set -e

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  🐳 Gmail Assistant - Docker                  ║${NC}"
echo -e "${BLUE}║              ワンクリック・コンテナ起動システム                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Docker確認
echo -e "${CYAN}🔍 Docker環境をチェック中...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker がインストールされていません${NC}"
    echo -e "${YELLOW}💡 解決方法:${NC}"
    echo -e "   • https://docker.com からDockerをインストールしてください"
    echo -e "   • macOS: Docker Desktop for Mac"
    echo -e "   • Windows: Docker Desktop for Windows"
    echo -e "   • Linux: 各ディストリビューションのパッケージマネージャーを使用"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker デーモンが起動していません${NC}"
    echo -e "${YELLOW}💡 Docker Desktop を起動してから再実行してください${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"
elif docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (プラグイン): $(docker compose version --short)${NC}"
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}❌ Docker Compose が見つかりません${NC}"
    exit 1
fi

COMPOSE_CMD=${COMPOSE_CMD:-"docker-compose"}

echo ""

# 実行権限付与
chmod +x "$0" 2>/dev/null || true

# 環境変数ファイル確認
echo -e "${CYAN}📝 環境設定をチェック中...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  環境変数ファイルが見つかりません。作成します...${NC}"
    if [ -f "backend/.env.template" ]; then
        cp "backend/.env.template" "backend/.env"
        echo -e "${GREEN}✅ .env ファイルを作成しました${NC}"
    else
        echo -e "${RED}❌ .env.template が見つかりません${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 環境変数ファイルが見つかりました${NC}"
fi

# 起動モード選択
echo -e "${PURPLE}🚀 起動モードを選択してください:${NC}"
echo -e "${BLUE}1) 完全起動 (推奨) - Ollama + バックエンド + フロントエンド${NC}"
echo -e "${BLUE}2) 軽量起動 - バックエンド + フロントエンドのみ (既存Ollama使用)${NC}"
echo -e "${BLUE}3) 初期セットアップ - Ollamaモデルのダウンロード${NC}"
echo -e "${BLUE}4) 停止・クリーンアップ${NC}"
echo ""

read -p "選択してください (1-4) [1]: " choice
choice=${choice:-1}

case $choice in
    1)
        echo -e "${GREEN}🚀 完全起動モードを開始します...${NC}"
        
        # 既存コンテナを停止
        echo -e "${CYAN}🛑 既存のコンテナを停止中...${NC}"
        $COMPOSE_CMD down 2>/dev/null || true
        
        # コンテナをビルド・起動
        echo -e "${CYAN}🔨 コンテナをビルド中...${NC}"
        $COMPOSE_CMD build
        
        echo -e "${CYAN}🚀 全サービスを起動中...${NC}"
        $COMPOSE_CMD up -d
        
        # Ollamaモデルの初期セットアップ
        echo -e "${CYAN}🤖 Ollamaモデルをセットアップ中... (初回は時間がかかります)${NC}"
        $COMPOSE_CMD --profile setup up model-setup
        
        ;;
    2)
        echo -e "${GREEN}🚀 軽量起動モードを開始します...${NC}"
        
        # Ollamaが外部で起動しているかチェック
        if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Ollamaが起動していません${NC}"
            echo -e "${BLUE}💡 別ターミナルで 'ollama serve' を実行してください${NC}"
            read -p "Ollamaが起動したらEnterを押してください..."
        fi
        
        # バックエンドとフロントエンドのみ起動
        $COMPOSE_CMD down 2>/dev/null || true
        $COMPOSE_CMD up -d backend frontend
        ;;
    3)
        echo -e "${GREEN}🤖 初期セットアップモードを開始します...${NC}"
        
        # Ollamaサービスのみ起動
        $COMPOSE_CMD up -d ollama
        
        # モデルダウンロード
        echo -e "${CYAN}📥 Qwen3:30Bモデルをダウンロード中... (数GB、時間がかかります)${NC}"
        $COMPOSE_CMD --profile setup up model-setup
        
        echo -e "${GREEN}✅ セットアップ完了！${NC}"
        echo -e "${BLUE}💡 次回は選択肢1で完全起動してください${NC}"
        exit 0
        ;;
    4)
        echo -e "${YELLOW}🛑 サービスを停止・クリーンアップ中...${NC}"
        $COMPOSE_CMD down
        
        read -p "未使用のDockerリソースも削除しますか？ (y/N): " cleanup
        if [[ $cleanup =~ ^[Yy]$ ]]; then
            docker system prune -f
            echo -e "${GREEN}✅ クリーンアップ完了${NC}"
        fi
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 無効な選択です${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 起動処理が完了しました！${NC}"
echo ""

# サービス状態確認
echo -e "${CYAN}📊 サービス状態確認中...${NC}"
sleep 5

# ヘルスチェック
check_service() {
    local service=$1
    local url=$2
    local name=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ $name: $url${NC}"
    else
        echo -e "${RED}   ❌ $name: $url (起動中...)${NC}"
    fi
}

check_service "ollama" "http://localhost:11434/api/tags" "Ollama AI"
check_service "backend" "http://localhost:3001/health" "バックエンド"
check_service "frontend" "http://localhost:3000" "フロントエンド"

echo ""
echo -e "${BLUE}📋 アクセス情報:${NC}"
echo -e "${GREEN}   🌐 Gmail Assistant: http://localhost:3000${NC}"
echo -e "${GREEN}   🔧 API サーバー: http://localhost:3001${NC}"
echo -e "${GREEN}   🤖 Ollama AI: http://localhost:11434${NC}"
echo ""

echo -e "${BLUE}🔧 管理コマンド:${NC}"
echo -e "${YELLOW}   ログ確認: $COMPOSE_CMD logs -f${NC}"
echo -e "${YELLOW}   状態確認: $COMPOSE_CMD ps${NC}"
echo -e "${YELLOW}   停止: $COMPOSE_CMD down${NC}"
echo -e "${YELLOW}   再起動: $COMPOSE_CMD restart${NC}"
echo ""

echo -e "${PURPLE}🚀 Gmail Assistant が起動しました！${NC}"
echo -e "${BLUE}   ブラウザで http://localhost:3000 にアクセスしてください${NC}"

# ログ追跡オプション
read -p "リアルタイムログを表示しますか？ (y/N): " show_logs
if [[ $show_logs =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}📝 リアルタイムログ表示中... (Ctrl+C で終了)${NC}"
    $COMPOSE_CMD logs -f
fi 