#!/bin/bash

# Gmail Assistant - 環境診断・チェックツール
# 使用方法: ./diagnose.sh

set -e

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 診断結果カウンター
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
ERRORS=0

# ログファイル
LOG_FILE="diagnosis_$(date +%Y%m%d_%H%M%S).log"

# ログ関数
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# チェック関数
check_item() {
    local name="$1"
    local command="$2"
    local required="$3"  # true/false
    local suggestion="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" &>/dev/null; then
        log "${GREEN}✅ $name${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log "${RED}❌ $name${NC}"
            if [ -n "$suggestion" ]; then
                log "${YELLOW}   💡 $suggestion${NC}"
            fi
            ERRORS=$((ERRORS + 1))
            return 1
        else
            log "${YELLOW}⚠️  $name (オプション)${NC}"
            if [ -n "$suggestion" ]; then
                log "${BLUE}   💡 $suggestion${NC}"
            fi
            WARNINGS=$((WARNINGS + 1))
            return 1
        fi
    fi
}

# ヘッダー表示
log "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
log "${BLUE}║                   📊 Gmail Assistant 診断ツール                ║${NC}"
log "${BLUE}║              システム要件・環境設定の包括的チェック               ║${NC}"
log "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
log ""
log "${CYAN}🕐 診断開始時刻: $(date)${NC}"
log "${CYAN}📝 ログファイル: $LOG_FILE${NC}"
log ""

# システム情報
log "${PURPLE}📋 システム情報${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"
log "OS: $(uname -s) $(uname -r)"
log "アーキテクチャ: $(uname -m)"
log "ホスト名: $(hostname)"
log "現在のユーザー: $(whoami)"
log "作業ディレクトリ: $(pwd)"
log ""

# システム要件チェック
log "${PURPLE}🔍 システム要件チェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

# Node.js
check_item "Node.js インストール確認" "command -v node" "true" "https://nodejs.org/ からインストールしてください"
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//')
    log "   バージョン: $NODE_VERSION"
    if [[ $(echo "$NODE_VERSION" | cut -d. -f1) -ge 18 ]]; then
        log "${GREEN}   ✅ Node.js バージョンOK (v18+)${NC}"
    else
        log "${RED}   ❌ Node.js バージョンが古い (v18+ が必要)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# npm
check_item "npm インストール確認" "command -v npm" "true" "Node.js と一緒にインストールされます"
if command -v npm &>/dev/null; then
    NPM_VERSION=$(npm -v)
    log "   バージョン: $NPM_VERSION"
fi

# Git
check_item "Git インストール確認" "command -v git" "false" "git-scm.com からインストール（推奨）"
if command -v git &>/dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    log "   バージョン: $GIT_VERSION"
fi

# Docker
check_item "Docker インストール確認" "command -v docker" "false" "Docker使用時に必要: https://docker.com/"
if command -v docker &>/dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    log "   バージョン: $DOCKER_VERSION"
    
    if docker info &>/dev/null; then
        log "${GREEN}   ✅ Docker デーモン起動中${NC}"
    else
        log "${YELLOW}   ⚠️  Docker デーモンが起動していません${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Docker Compose
if command -v docker &>/dev/null; then
    if command -v docker-compose &>/dev/null; then
        check_item "Docker Compose 確認" "docker-compose --version" "false" ""
    elif docker compose version &>/dev/null; then
        check_item "Docker Compose (プラグイン) 確認" "docker compose version" "false" ""
    else
        log "${YELLOW}⚠️  Docker Compose が見つかりません${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Ollama
check_item "Ollama インストール確認" "command -v ollama" "false" "AI機能使用時に必要: https://ollama.ai/"
if command -v ollama &>/dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null | head -1 || echo "不明")
    log "   バージョン: $OLLAMA_VERSION"
    
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        log "${GREEN}   ✅ Ollama サービス起動中${NC}"
        
        # モデル確認
        if ollama list | grep -q "qwen3:30b"; then
            log "${GREEN}   ✅ Qwen3:30B モデル利用可能${NC}"
        else
            log "${YELLOW}   ⚠️  Qwen3:30B モデルが見つかりません${NC}"
            log "${BLUE}   💡 ollama pull qwen3:30b でダウンロード${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        log "${YELLOW}   ⚠️  Ollama サービスが起動していません${NC}"
        log "${BLUE}   💡 ollama serve で起動${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

log ""

# プロジェクト構成チェック
log "${PURPLE}📁 プロジェクト構成チェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

check_item "プロジェクトルート確認" "[ -f package.json ] || ([ -d backend ] && [ -d frontend ])" "true" "プロジェクトルートディレクトリで実行してください"
check_item "バックエンドディレクトリ" "[ -d backend ]" "true" ""
check_item "フロントエンドディレクトリ" "[ -d frontend ]" "true" ""
check_item "共有型定義ディレクトリ" "[ -d shared ]" "false" ""
check_item "起動スクリプト" "[ -f start-dev.sh ]" "false" ""
check_item "セットアップスクリプト" "[ -f setup.sh ]" "false" ""

# バックエンド詳細チェック
if [ -d backend ]; then
    log ""
    log "${PURPLE}🔧 バックエンド詳細チェック${NC}"
    log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"
    
    check_item "backend/package.json" "[ -f backend/package.json ]" "true" ""
    check_item "backend/tsconfig.json" "[ -f backend/tsconfig.json ]" "true" ""
    check_item "backend/src/index.ts" "[ -f backend/src/index.ts ]" "true" ""
    check_item "環境変数テンプレート" "[ -f backend/.env.template ]" "false" ""
    check_item "環境変数ファイル" "[ -f backend/.env ]" "false" "backend/.env.template をコピーして作成"
    check_item "node_modules (backend)" "[ -d backend/node_modules ]" "false" "npm install を実行"
fi

# フロントエンド詳細チェック
if [ -d frontend ]; then
    log ""
    log "${PURPLE}🎨 フロントエンド詳細チェック${NC}"
    log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"
    
    check_item "frontend/package.json" "[ -f frontend/package.json ]" "true" ""
    check_item "frontend/next.config.js" "[ -f frontend/next.config.js ]" "true" ""
    check_item "frontend/tailwind.config.js" "[ -f frontend/tailwind.config.js ]" "true" ""
    check_item "node_modules (frontend)" "[ -d frontend/node_modules ]" "false" "npm install を実行"
fi

log ""

# ポート使用状況チェック
log "${PURPLE}🌐 ポート使用状況チェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        local process=$(lsof -i :$port | tail -1 | awk '{print $1, $2}')
        log "${YELLOW}⚠️  ポート $port ($service) が使用中: $process${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        log "${GREEN}✅ ポート $port ($service) 利用可能${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

check_port 3000 "フロントエンド"
check_port 3001 "バックエンド"
check_port 11434 "Ollama"

log ""

# メモリ・ディスク容量チェック
log "${PURPLE}💾 システムリソースチェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

# メモリチェック
if command -v free >/dev/null 2>&1; then
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    log "利用可能メモリ: ${MEMORY_GB}GB"
    if [ "$MEMORY_GB" -ge 8 ]; then
        log "${GREEN}✅ メモリ容量OK (8GB+)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log "${YELLOW}⚠️  メモリ容量が少ない (8GB推奨)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
elif [[ "$OSTYPE" == "darwin"* ]]; then
    MEMORY_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
    log "利用可能メモリ: ${MEMORY_GB}GB"
    if [ "$MEMORY_GB" -ge 8 ]; then
        log "${GREEN}✅ メモリ容量OK (8GB+)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log "${YELLOW}⚠️  メモリ容量が少ない (8GB推奨)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

# ディスク容量チェック
DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G.*//')
if [ "$DISK_AVAIL" -ge 10 ]; then
    log "${GREEN}✅ ディスク容量OK (${DISK_AVAIL}GB利用可能)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    log "${YELLOW}⚠️  ディスク容量が少ない (${DISK_AVAIL}GB、10GB推奨)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

log ""

# ネットワーク接続チェック
log "${PURPLE}🌍 ネットワーク接続チェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

check_item "インターネット接続" "ping -c 1 8.8.8.8" "true" "インターネット接続を確認してください"
check_item "GitHub接続" "curl -s https://github.com" "true" "GitHubへの接続を確認してください"
check_item "npm レジストリ接続" "curl -s https://registry.npmjs.org/" "true" "npmレジストリへの接続を確認してください"

if command -v ollama >/dev/null 2>&1; then
    check_item "Ollama Hub接続" "curl -s https://ollama.ai/" "false" "Ollamaモデルダウンロード時に必要"
fi

log ""

# 権限チェック
log "${PURPLE}🔐 権限・セキュリティチェック${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

check_item "ディレクトリ書き込み権限" "[ -w . ]" "true" "現在のディレクトリへの書き込み権限が必要"
check_item "実行ファイル権限" "[ -x setup.sh ] || [ ! -f setup.sh ]" "false" "chmod +x setup.sh で実行権限を付与"

# 設定ファイルの妥当性チェック
if [ -f backend/.env ]; then
    log ""
    log "${PURPLE}⚙️  設定ファイル妥当性チェック${NC}"
    log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"
    
    check_item "GMAIL_API_ENABLED設定" "grep -q 'GMAIL_API_ENABLED' backend/.env" "false" "Gmail API使用時に必要"
    check_item "Google OAuth設定" "grep -q 'GOOGLE_CLIENT_ID' backend/.env" "false" "Gmail認証時に必要"
    check_item "Ollama設定" "grep -q 'OLLAMA_URL' backend/.env" "false" "AI機能使用時に必要"
fi

log ""

# TypeScript設定チェック
if [ -f backend/tsconfig.json ] && command -v node >/dev/null 2>&1; then
    log "${PURPLE}📝 TypeScript設定チェック${NC}"
    log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"
    
    if [ -d backend/node_modules ]; then
        cd backend
        if npx tsc --noEmit &>/dev/null; then
            log "${GREEN}✅ TypeScript コンパイル成功${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log "${RED}❌ TypeScript コンパイルエラー${NC}"
            log "${YELLOW}   💡 npx tsc --noEmit --pretty でエラー詳細を確認${NC}"
            ERRORS=$((ERRORS + 1))
        fi
        cd ..
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    else
        log "${YELLOW}⚠️  backend/node_modules が見つかりません${NC}"
        log "${BLUE}   💡 cd backend && npm install を実行${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

log ""

# 診断結果サマリー
log "${PURPLE}📊 診断結果サマリー${NC}"
log "${BLUE}══════════════════════════════════════════════════════════════════${NC}"

# 成功率計算
if [ "$TOTAL_CHECKS" -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
else
    SUCCESS_RATE=0
fi

log "総チェック項目: $TOTAL_CHECKS"
log "${GREEN}✅ 成功: $PASSED_CHECKS${NC}"
log "${YELLOW}⚠️  警告: $WARNINGS${NC}"
log "${RED}❌ エラー: $ERRORS${NC}"
log "成功率: $SUCCESS_RATE%"

log ""

# 推奨アクション
if [ "$ERRORS" -gt 0 ]; then
    log "${RED}🚨 重要: $ERRORS 個のエラーが検出されました${NC}"
    log "${YELLOW}📋 次のアクションを実行してください:${NC}"
    log "   1. 上記のエラー項目を確認・修正"
    log "   2. 必要なソフトウェアをインストール"
    log "   3. 再度診断を実行: ./diagnose.sh"
    log ""
    
    OVERALL_STATUS="FAIL"
    OVERALL_COLOR="${RED}"
elif [ "$WARNINGS" -gt 0 ]; then
    log "${YELLOW}⚠️  注意: $WARNINGS 個の警告があります${NC}"
    log "${BLUE}📋 推奨アクション:${NC}"
    log "   1. 警告項目を確認（必須ではありません）"
    log "   2. 必要に応じて設定を調整"
    log "   3. ./setup.sh で起動を試行"
    log ""
    
    OVERALL_STATUS="WARNING"
    OVERALL_COLOR="${YELLOW}"
else
    log "${GREEN}🎉 すべてのチェックに合格しました！${NC}"
    log "${BLUE}📋 次のステップ:${NC}"
    log "   1. ./setup.sh でアプリケーションを起動"
    log "   2. または ./docker-start.sh でDocker起動"
    log "   3. ブラウザで http://localhost:3000 にアクセス"
    log ""
    
    OVERALL_STATUS="PASS"
    OVERALL_COLOR="${GREEN}"
fi

# 最終結果
log "${OVERALL_COLOR}╔════════════════════════════════════════════════════════════════╗${NC}"
log "${OVERALL_COLOR}║                    診断結果: $OVERALL_STATUS                    ║${NC}"
log "${OVERALL_COLOR}╚════════════════════════════════════════════════════════════════╝${NC}"

log ""
log "${CYAN}🕐 診断完了時刻: $(date)${NC}"
log "${CYAN}📝 詳細ログ: $LOG_FILE${NC}"

# 終了コード設定
if [ "$ERRORS" -gt 0 ]; then
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    exit 2
else
    exit 0
fi 