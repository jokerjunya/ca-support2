FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# TypeScript用の開発依存関係もインストール
RUN npm install -D typescript ts-node @types/node nodemon

# アプリケーションコードをコピー
COPY . .

# ポートを公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 開発モードで起動
CMD ["npm", "run", "dev"] 