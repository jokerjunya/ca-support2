'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Bot, Shield, Zap, ArrowRight, Play, Star } from 'lucide-react';
import LoginButton from '../components/LoginButton';

export default function Home() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();

  // 認証状態確認
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data.isAuthenticated ? 'authenticated' : 'unauthenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setAuthStatus('unauthenticated');
    }
  };

  const handleGetStarted = () => {
    if (authStatus === 'authenticated') {
      router.push('/dashboard');
    } else {
      // 認証されていない場合は自動的に認証フローに入る
      window.location.href = '/api/auth/google';
    }
  };

  const handleDashboardAccess = () => {
    router.push('/dashboard');
  };

  const getStartedButtonText = () => {
    if (authStatus === 'loading') return '確認中...';
    if (authStatus === 'authenticated') return 'ダッシュボードを開く';
    return 'Googleでログインして開始';
  };

  const isButtonDisabled = authStatus === 'loading';

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-dark-gray to-spotify-dark">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-spotify-dark-gray border-b border-spotify-gray p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-8 h-8 text-spotify-green" />
              <h1 className="text-2xl font-bold text-spotify-white">Gmail Assistant</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#features" className="text-spotify-light-gray hover:text-spotify-white transition-colors">
                機能
              </a>
              <a href="#about" className="text-spotify-light-gray hover:text-spotify-white transition-colors">
                About
              </a>
              {authStatus === 'authenticated' ? (
                <button
                  onClick={handleDashboardAccess}
                  className="bg-spotify-green hover:bg-spotify-green-hover text-spotify-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>ダッシュボード</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <LoginButton />
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-16">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="flex items-center bg-spotify-green/10 text-spotify-green px-3 py-1 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 mr-1" />
                  新機能
                </div>
              </div>
              
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-spotify-green to-spotify-green-hover bg-clip-text text-transparent">
                Gmail Assistant
              </h1>
              
              <p className="text-2xl text-spotify-light-gray mb-8 max-w-3xl mx-auto leading-relaxed">
                ローカルLLM搭載のGmailラッパーアプリケーション<br />
                <span className="text-spotify-white font-medium">メール処理を自動化し、安全かつ高速に返信を生成</span>
              </p>

              {/* Primary CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={handleGetStarted}
                  disabled={isButtonDisabled}
                  className="group bg-spotify-green hover:bg-spotify-green-hover disabled:bg-gray-600 text-spotify-black disabled:text-white font-bold text-lg px-10 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-spotify-hover flex items-center justify-center space-x-3"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>確認中...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <span>{getStartedButtonText()}</span>
                    </>
                  )}
                </button>
                
                <button className="group bg-transparent border-2 border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-spotify-black font-semibold text-lg px-10 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3">
                  <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>デモを見る</span>
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center space-x-8 text-sm text-spotify-light-gray">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-spotify-green" />
                  <span>100% ローカル処理</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-spotify-green" />
                  <span>高速AI生成</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-spotify-green" />
                  <span>Gmail API連携</span>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="group bg-spotify-dark-gray p-8 rounded-spotify border border-spotify-gray hover:border-spotify-green transition-all duration-300 hover:transform hover:scale-105">
                <Mail className="w-12 h-12 text-spotify-green mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3 text-white">Gmail 連携</h3>
                <p className="text-spotify-light-gray leading-relaxed">
                  Gmail APIを通じて安全にメールを取得・管理
                </p>
              </div>

              <div className="group bg-spotify-dark-gray p-8 rounded-spotify border border-spotify-gray hover:border-spotify-green transition-all duration-300 hover:transform hover:scale-105">
                <Bot className="w-12 h-12 text-spotify-green mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3 text-white">ローカル LLM</h3>
                <p className="text-spotify-light-gray leading-relaxed">
                  プライバシーを守りながら高品質な返信を生成
                </p>
              </div>

              <div className="group bg-spotify-dark-gray p-8 rounded-spotify border border-spotify-gray hover:border-spotify-green transition-all duration-300 hover:transform hover:scale-105">
                <Shield className="w-12 h-12 text-spotify-green mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3 text-white">セキュリティ</h3>
                <p className="text-spotify-light-gray leading-relaxed">
                  データはすべてローカルで処理、外部送信なし
                </p>
              </div>

              <div className="group bg-spotify-dark-gray p-8 rounded-spotify border border-spotify-gray hover:border-spotify-green transition-all duration-300 hover:transform hover:scale-105">
                <Zap className="w-12 h-12 text-spotify-green mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-3 text-white">高速処理</h3>
                <p className="text-spotify-light-gray leading-relaxed">
                  Spotify風UIで直感的で高速な操作体験
                </p>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-spotify-dark-gray p-8 rounded-spotify border border-spotify-gray mb-16">
              <h3 className="text-2xl font-semibold mb-6 text-white">開発状況</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-spotify-green/20 text-spotify-green rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    ✓
                  </div>
                  <p className="text-sm text-spotify-light-gray">プロジェクトセットアップ</p>
                  <p className="text-xs text-spotify-green font-semibold">完了</p>
                </div>
                <div className="text-center">
                  <div className="bg-spotify-green/20 text-spotify-green rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    ✓
                  </div>
                  <p className="text-sm text-spotify-light-gray">基本UIレイアウト</p>
                  <p className="text-xs text-spotify-green font-semibold">完了</p>
                </div>
                <div className="text-center">
                  <div className="bg-spotify-green/20 text-spotify-green rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    ✓
                  </div>
                  <p className="text-sm text-spotify-light-gray">Gmail API連携</p>
                  <p className="text-xs text-spotify-green font-semibold">完了</p>
                </div>
                <div className="text-center">
                  <div className="bg-yellow-500/20 text-yellow-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    ⏳
                  </div>
                  <p className="text-sm text-spotify-light-gray">ローカルLLM統合</p>
                  <p className="text-xs text-yellow-500 font-semibold">準備中</p>
                </div>
              </div>
            </div>

            {/* Secondary CTA Section */}
            <div className="bg-gradient-to-r from-spotify-green/10 to-spotify-green-hover/10 p-12 rounded-2xl border border-spotify-green/20 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                今すぐGmail Assistantを体験
              </h2>
              <p className="text-xl text-spotify-light-gray mb-8 max-w-2xl mx-auto">
                数クリックでセットアップ完了。<br />
                AIによる高品質な返信生成を今すぐお試しください。
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  disabled={isButtonDisabled}
                  className="group bg-spotify-green hover:bg-spotify-green-hover disabled:bg-gray-600 text-spotify-black disabled:text-white font-bold text-lg px-10 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-spotify-hover flex items-center justify-center space-x-3"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>確認中...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <span>{getStartedButtonText()}</span>
                    </>
                  )}
                </button>

                {authStatus === 'authenticated' && (
                  <button
                    onClick={handleDashboardAccess}
                    className="group bg-transparent border-2 border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-spotify-black font-semibold text-lg px-10 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3"
                  >
                    <Mail className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>メール管理を開始</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-spotify-dark-gray border-t border-spotify-gray p-6 text-center">
          <p className="text-spotify-light-gray">
            © 2024 Gmail Assistant - ローカルLLM搭載メールアシスタント
          </p>
        </footer>
      </div>
    </div>
  );
} 