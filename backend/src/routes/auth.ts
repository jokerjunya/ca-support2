import { Router } from 'express';
import passport from 'passport';
import { AuthUser } from '../types/auth';

const router = Router();

// Google OAuth2.0認証開始
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'] 
}));

// Google OAuth2.0認証コールバック
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // 認証成功後、フロントエンドにリダイレクト
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  }
);

// ログアウト
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'ログアウトに失敗しました' });
    }
    return res.json({ message: 'ログアウトしました' });
  });
});

// 現在のユーザー情報取得
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user as AuthUser;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: '認証されていません' 
    });
  }
});

// 認証状態確認
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.user : null
  });
});

export default router; 