'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmailList from '../../components/EmailList';
import EmailDetail from '../../components/EmailDetail';
import ReplyComposer from '../../components/ReplyComposer';
import ThreadView from '../../components/ThreadView';
import { Email, EmailThread } from '../../types/email';
import LoginButton from '../../components/LoginButton';
import { List, MessageSquare, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [viewMode, setViewMode] = useState<'emails' | 'threads'>('emails');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
        if (data.isAuthenticated) {
          setAuthStatus('authenticated');
          // 認証済みの場合はデータ取得
          fetchData();
        } else {
          setAuthStatus('unauthenticated');
          // 認証されていない場合はホーム画面にリダイレクト
          router.push('/');
        }
      } else {
        setAuthStatus('unauthenticated');
        router.push('/');
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setAuthStatus('unauthenticated');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchEmails(),
      fetchThreads()
    ]);
  };

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/emails', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmails(data.data || []);
      } else {
        console.error('メール取得エラー');
      }
    } catch (error) {
      console.error('メール取得エラー:', error);
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/emails/threads', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setThreads(data.data || []);
      } else {
        console.error('スレッド取得エラー');
      }
    } catch (error) {
      console.error('スレッド取得エラー:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    setIsReplyMode(false);
  };

  const handleThreadSelect = (thread: EmailThread) => {
    setSelectedThread(thread);
    // スレッドの最新メールを選択
    if (thread.emails.length > 0) {
      setSelectedEmail(thread.emails[thread.emails.length - 1]);
    }
    setIsReplyMode(false);
  };

  const handleReplyClick = () => {
    setIsReplyMode(true);
  };

  const handleBackToEmail = () => {
    setIsReplyMode(false);
  };

  const handleViewModeChange = (mode: 'emails' | 'threads') => {
    setViewMode(mode);
    setSelectedEmail(null);
    setSelectedThread(null);
    setIsReplyMode(false);
  };

  // 認証状態確認中
  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-spotify-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-spotify-light-gray">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合（リダイレクト前の一瞬表示される可能性があるため）
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-spotify-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">認証が必要です</h1>
          <p className="text-spotify-light-gray mb-8">ダッシュボードにアクセスするには、ログインしてください。</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spotify-dark">
      {/* ヘッダー */}
      <header className="bg-spotify-dark-gray border-b border-spotify-gray p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Gmail Assistant</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-spotify-gray hover:bg-spotify-light-gray text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>更新</span>
            </button>
            <LoginButton />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* サイドバー - 統計情報 */}
        <div className="w-64 bg-spotify-dark-gray border-r border-spotify-gray p-4">
          <div className="space-y-4">
            <div className="bg-spotify-gray p-4 rounded-lg">
              <h3 className="text-sm font-medium text-spotify-light-gray mb-2">統計情報</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-spotify-light-gray">総メール数</span>
                  <span className="text-white">{emails.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-spotify-light-gray">未読メール</span>
                  <span className="text-unread-blue">{emails.filter(e => !e.read).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-spotify-light-gray">重要メール</span>
                  <span className="text-important-red">{emails.filter(e => e.important).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-spotify-light-gray">スレッド数</span>
                  <span className="text-white">{threads.length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-spotify-gray p-4 rounded-lg">
              <h3 className="text-sm font-medium text-spotify-light-gray mb-2">表示モード</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleViewModeChange('emails')}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    viewMode === 'emails' 
                      ? 'bg-spotify-green text-white' 
                      : 'text-spotify-light-gray hover:text-white hover:bg-spotify-light-gray'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>メール一覧</span>
                </button>
                <button 
                  onClick={() => handleViewModeChange('threads')}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    viewMode === 'threads' 
                      ? 'bg-spotify-green text-white' 
                      : 'text-spotify-light-gray hover:text-white hover:bg-spotify-light-gray'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>スレッド表示</span>
                </button>
              </div>
            </div>
            
            <div className="bg-spotify-gray p-4 rounded-lg">
              <h3 className="text-sm font-medium text-spotify-light-gray mb-2">クイックアクション</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-spotify-light-gray hover:text-white transition-colors">
                  未読メール表示
                </button>
                <button className="w-full text-left text-sm text-spotify-light-gray hover:text-white transition-colors">
                  重要メール表示
                </button>
                <button className="w-full text-left text-sm text-spotify-light-gray hover:text-white transition-colors">
                  新規メール作成
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 flex">
          {/* メール一覧 / スレッド一覧 */}
          <div className="w-1/3 border-r border-spotify-gray">
            <div className="p-4 border-b border-spotify-gray">
              <h2 className="text-lg font-semibold text-white">
                {viewMode === 'threads' ? 'スレッド' : 'メール'}
              </h2>
            </div>
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              {viewMode === 'threads' ? (
                <ThreadView
                  threads={threads}
                  selectedThread={selectedThread}
                  onThreadSelect={handleThreadSelect}
                  onEmailSelect={handleEmailSelect}
                />
              ) : (
                <EmailList 
                  emails={emails}
                  selectedEmail={selectedEmail}
                  onEmailSelect={handleEmailSelect}
                />
              )}
            </div>
          </div>

          {/* メール詳細 / 返信作成 */}
          <div className="flex-1">
            {isReplyMode && selectedEmail ? (
              <ReplyComposer
                email={selectedEmail}
                onBack={handleBackToEmail}
              />
            ) : selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                onReply={handleReplyClick}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-spotify-dark">
                <div className="text-center">
                  <div className="text-6xl text-spotify-gray mb-4">📧</div>
                  <p className="text-spotify-light-gray">
                    {viewMode === 'threads' ? 'スレッドを選択してください' : 'メールを選択してください'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 