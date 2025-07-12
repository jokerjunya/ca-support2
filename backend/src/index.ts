import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import session from 'express-session';
import passport from 'passport';

// 環境変数の読み込み
dotenv.config();

// 認証設定
import { configureGoogleAuth } from './services/auth';
import authRouter from './routes/auth';
import emailsRouter from './routes/emails';

// Google OAuth2.0設定
configureGoogleAuth();

const app = express();
const port = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());

// JSON パーシング
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// パスポート設定
app.use(passport.initialize());
app.use(passport.session());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Gmail Assistant Backend'
  });
});

// API ルート
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// 認証ルート
app.use('/api/auth', authRouter);

// メールAPIルート
app.use('/api/emails', emailsRouter);

// 404 ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// エラーハンドラー
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// サーバー起動
const server = createServer(app);

server.listen(port, () => {
  console.log(`🚀 Gmail Assistant Backend Server is running on port ${port}`);
  console.log(`📝 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app; 