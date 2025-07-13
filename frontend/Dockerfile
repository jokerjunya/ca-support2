FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci && npm cache clean --force

# Tailwind CSS関連パッケージをインストール
RUN npm install @tailwindcss/forms @tailwindcss/typography

# アプリケーションコードをコピー
COPY . .

# ポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# 開発モードで起動
CMD ["npm", "run", "dev"] 