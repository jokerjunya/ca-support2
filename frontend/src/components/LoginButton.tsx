'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginButtonProps {
  className?: string;
}

export default function LoginButton({ className = '' }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 認証状態確認
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', // セッションクッキーを含める
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          setAuthStatus('authenticated');
          setUser(data.user);
        } else {
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setAuthStatus('unauthenticated');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Google OAuth認証を開始
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('ログインエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setAuthStatus('unauthenticated');
        setUser(null);
        router.push('/');
      }
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態確認中
  if (authStatus === 'loading') {
    return (
      <button 
        disabled
        className={`flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg ${className}`}
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        確認中...
      </button>
    );
  }

  // 認証済みの場合はログアウトボタン
  if (authStatus === 'authenticated') {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user?.picture && (
            <img 
              src={user.picture} 
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-white">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors ${className}`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ログアウト中...
            </>
          ) : (
            'ログアウト'
          )}
        </button>
      </div>
    );
  }

  // 未認証の場合はログインボタン
  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`flex items-center justify-center px-6 py-3 bg-spotify-green hover:bg-spotify-green-hover disabled:bg-spotify-green-hover text-white rounded-lg transition-colors ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ログイン中...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </>
      )}
    </button>
  );
} 