import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { GoogleProfile, AuthUser } from '../types/auth';

// インメモリーユーザーストア（本番環境では適切なDBに変更）
const users: Map<string, AuthUser> = new Map();

export const configureGoogleAuth = () => {
  // 環境変数が設定されていない場合はGoogle認証を無効化
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth2.0認証情報が設定されていません。認証機能は無効化されます。');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleProfile = profile as any;
          
          const user: AuthUser = {
            id: googleProfile.id,
            email: googleProfile.emails[0].value,
            name: googleProfile.displayName,
            picture: googleProfile.photos[0].value,
            accessToken,
            refreshToken,
            tokenExpiry: new Date(Date.now() + 3600000) // 1時間後
          };

          // ユーザーを保存
          users.set(user.id, user);

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    const user = users.get(id);
    done(null, user || false);
  });
};

export const getAuthUser = (userId: string): AuthUser | null => {
  return users.get(userId) || null;
};

export const updateUserTokens = (userId: string, accessToken: string, refreshToken: string): void => {
  const user = users.get(userId);
  if (user) {
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.tokenExpiry = new Date(Date.now() + 3600000);
    users.set(userId, user);
  }
}; 