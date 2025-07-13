'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, FileText, MessageSquare, Clock, Mail, MailOpen, Zap, Brain, Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { EmailThread, Email } from '../types/email';
import { ReplyTemplate } from '../types/template';
import TemplateSelector from './TemplateSelector';

interface ThreadIntegratedReplyComposerProps {
  thread: EmailThread;
  onBack: () => void;
}

interface ConversationSummary {
  keyPoints: string[];
  participants: string[];
  currentStatus: string;
  suggestedActions: string[];
}

interface SmartReplyItem {
  text: string;
  category: string;
}

interface ToneAnalysis {
  formality: string;
  recommendedTone: string;
  confidence: number;
}

export default function ThreadIntegratedReplyComposer({ thread, onBack }: ThreadIntegratedReplyComposerProps) {
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyType, setReplyType] = useState<'business' | 'casual' | 'polite'>('business');
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [smartReplies, setSmartReplies] = useState<SmartReplyItem[]>([]);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);
  const [loadingToneAnalysis, setLoadingToneAnalysis] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const toneSelectorRef = useRef<HTMLDivElement>(null);

  const latestEmail = thread.emails[thread.emails.length - 1];

  // 初期化時にスレッドデータを取得
  useEffect(() => {
    if (thread.id) {
      fetchConversationSummary();
      fetchSmartReplies();
      fetchToneAnalysis();
    }
  }, [thread.id]);

  // ドロップダウンの外側をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toneSelectorRef.current && !toneSelectorRef.current.contains(event.target as Node)) {
        setShowToneSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const fetchConversationSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await fetch(`/api/emails/threads/${thread.id}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSummary({
          keyPoints: data.keyPoints || [],
          participants: data.participants || [],
          currentStatus: data.currentStatus || '',
          suggestedActions: data.suggestedActions || []
        });
      } else {
        throw new Error('会話要約の取得に失敗しました');
      }
    } catch (error) {
      console.error('会話要約取得エラー:', error);
      setError('会話要約の取得に失敗しました。再試行してください。');
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchSmartReplies = async () => {
    setLoadingSmartReplies(true);
    try {
      const response = await fetch(`/api/emails/threads/${thread.id}/smart-reply-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          maxSuggestions: 6,
          categories: ['acknowledgment', 'agreement', 'question', 'action', 'polite', 'casual']
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSmartReplies(data.suggestions || []);
      } else {
        throw new Error('スマートリプライの取得に失敗しました');
      }
    } catch (error) {
      console.error('スマートリプライ取得エラー:', error);
      // エラーは表示しないが、フォールバック候補を提供
      setSmartReplies([
        { text: '了解しました', category: 'acknowledgment' },
        { text: 'ありがとうございます', category: 'polite' },
        { text: '確認いたします', category: 'action' },
        { text: '承知いたしました', category: 'agreement' },
        { text: '検討いたします', category: 'action' },
        { text: 'お疲れ様です', category: 'casual' }
      ]);
    } finally {
      setLoadingSmartReplies(false);
    }
  };

  const fetchToneAnalysis = async () => {
    setLoadingToneAnalysis(true);
    try {
      const response = await fetch(`/api/emails/threads/${thread.id}/analyze-tone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setToneAnalysis(data);
        
        // 推奨されたトーンに基づいてreplyTypeを自動設定
        const recommendedTone = data.recommendedTone?.toLowerCase();
        if (recommendedTone?.includes('business') || recommendedTone?.includes('formal')) {
          setReplyType('business');
        } else if (recommendedTone?.includes('casual')) {
          setReplyType('casual');
        } else if (recommendedTone?.includes('polite')) {
          setReplyType('polite');
        }
      } else {
        throw new Error('トーン解析の取得に失敗しました');
      }
    } catch (error) {
      console.error('トーン解析取得エラー:', error);
      // エラーは表示しないが、デフォルト値を設定
      setToneAnalysis({
        formality: 'neutral',
        recommendedTone: 'business',
        confidence: 0.5
      });
    } finally {
      setLoadingToneAnalysis(false);
    }
  };

  const generateContextAwareAIReply = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/emails/threads/${thread.id}/generate-context-aware-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tonePreference: replyType,
          customInstructions: '返信は簡潔で要点を押さえた内容にしてください',
          language: 'ja'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReplyText(data.reply);
      } else {
        throw new Error('AI返信生成に失敗しました');
      }
    } catch (error) {
      console.error('AI返信生成エラー:', error);
      setError('AI返信生成に失敗しました。フォールバック返信を使用します。');
      // フォールバック
      const fallbackReplies = {
        business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
        casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
        polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
      };
      setReplyText(fallbackReplies[replyType]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReplyWithSummary = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/emails/threads/${thread.id}/generate-reply-with-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          replyType: replyType,
          customInstructions: '返信は簡潔で要点を押さえた内容にしてください',
          language: 'ja'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReplyText(data.reply);
      } else {
        throw new Error('要約付きAI返信生成に失敗しました');
      }
    } catch (error) {
      console.error('要約付きAI返信生成エラー:', error);
      setError('要約付きAI返信生成に失敗しました。通常のAI返信を試してください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSmartReplySelect = (smartReply: SmartReplyItem) => {
    setReplyText(smartReply.text);
  };

  const handleTemplateSelect = (template: ReplyTemplate) => {
    setReplyText(template.content);
    setShowTemplateSelector(false);
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          to: latestEmail.from,
          subject: latestEmail.subject.startsWith('Re: ') ? latestEmail.subject : `Re: ${latestEmail.subject}`,
          body: replyText,
          threadId: thread.id
        })
      });
      
      if (response.ok) {
        onBack();
      } else {
        throw new Error('メール送信に失敗しました');
      }
    } catch (error) {
      console.error('送信エラー:', error);
      setError('メール送信に失敗しました。再試行してください。');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const emailDate = new Date(date);
    return emailDate.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractName = (emailString: string) => {
    if (emailString.includes('<')) {
      return emailString.split('<')[0].trim().replace(/"/g, '');
    }
    return emailString.split('@')[0];
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'very_formal': return 'text-purple-400';
      case 'formal': return 'text-blue-400';
      case 'neutral': return 'text-gray-400';
      case 'casual': return 'text-green-400';
      case 'very_casual': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const refreshAllData = () => {
    fetchConversationSummary();
    fetchSmartReplies();
    fetchToneAnalysis();
  };

  return (
    <div className="h-full flex flex-col bg-spotify-dark">
      {/* 統合ヘッダー */}
      <div className="bg-spotify-dark-gray border-b border-spotify-gray p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-spotify-gray rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-spotify-light-gray" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">スレッド返信作成</h1>
              <p className="text-sm text-spotify-light-gray">
                {thread.subject} • {thread.messageCount}件のメッセージ
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshAllData}
              disabled={loadingSummary || loadingSmartReplies || loadingToneAnalysis}
              className="p-2 hover:bg-spotify-gray rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-spotify-light-gray ${(loadingSummary || loadingSmartReplies || loadingToneAnalysis) ? 'animate-spin' : ''}`} />
            </button>
            {/* 語調選択 */}
            <div className="relative" ref={toneSelectorRef}>
              <button
                onClick={() => setShowToneSelector(!showToneSelector)}
                className="flex items-center space-x-2 px-3 py-2 bg-spotify-dark text-spotify-light-gray border border-spotify-gray rounded-lg hover:border-spotify-green transition-colors"
              >
                <span className="text-sm">
                  {replyType === 'business' && '💼 ビジネス'}
                  {replyType === 'casual' && '😊 カジュアル'}
                  {replyType === 'polite' && '🙏 丁寧語'}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showToneSelector && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-spotify-dark-gray border border-spotify-gray rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => { setReplyType('business'); setShowToneSelector(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-t-lg transition-colors ${replyType === 'business' ? 'bg-spotify-green text-black' : 'text-spotify-light-gray hover:bg-spotify-gray'}`}
                  >
                    💼 ビジネス調
                  </button>
                  <button
                    onClick={() => { setReplyType('casual'); setShowToneSelector(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${replyType === 'casual' ? 'bg-spotify-green text-black' : 'text-spotify-light-gray hover:bg-spotify-gray'}`}
                  >
                    😊 カジュアル調
                  </button>
                  <button
                    onClick={() => { setReplyType('polite'); setShowToneSelector(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-b-lg transition-colors ${replyType === 'polite' ? 'bg-spotify-green text-black' : 'text-spotify-light-gray hover:bg-spotify-gray'}`}
                  >
                    🙏 丁寧語調
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側: スレッド会話パネル */}
        <div className="w-1/2 flex flex-col border-r border-spotify-gray">
          {/* AI分析セクション */}
          <div className="border-b border-spotify-gray">
            {/* 会話要約 */}
            <div className="bg-spotify-gray">
              <button
                onClick={() => toggleSection('summary')}
                className="w-full flex items-center justify-between p-3 hover:bg-spotify-light-gray transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-spotify-green" />
                  <h3 className="text-sm font-semibold text-white">会話要約</h3>
                  {loadingSummary && <div className="w-3 h-3 border border-spotify-green border-t-transparent rounded-full animate-spin"></div>}
                </div>
                {collapsedSections.has('summary') ? (
                  <ChevronDown className="w-4 h-4 text-spotify-light-gray" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-spotify-light-gray" />
                )}
              </button>
              
              {!collapsedSections.has('summary') && summary && (
                <div className="px-3 pb-3 space-y-2">
                  {summary.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs text-spotify-light-gray mb-1">重要なポイント:</p>
                      <ul className="text-xs text-white space-y-1">
                        {summary.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-spotify-green">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.currentStatus && (
                    <div>
                      <p className="text-xs text-spotify-light-gray mb-1">現在の状況:</p>
                      <p className="text-xs text-white">{summary.currentStatus}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* トーン解析 */}
            <div className="bg-spotify-gray">
              <button
                onClick={() => toggleSection('tone')}
                className="w-full flex items-center justify-between p-3 hover:bg-spotify-light-gray transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-spotify-green" />
                  <h3 className="text-sm font-semibold text-white">トーン解析</h3>
                  {loadingToneAnalysis && <div className="w-3 h-3 border border-spotify-green border-t-transparent rounded-full animate-spin"></div>}
                </div>
                {collapsedSections.has('tone') ? (
                  <ChevronDown className="w-4 h-4 text-spotify-light-gray" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-spotify-light-gray" />
                )}
              </button>
              
              {!collapsedSections.has('tone') && toneAnalysis && (
                <div className="px-3 pb-3 flex items-center space-x-4">
                  <div>
                    <p className="text-xs text-spotify-light-gray">フォーマル度:</p>
                    <p className={`text-xs font-semibold ${getToneColor(toneAnalysis.formality)}`}>
                      {toneAnalysis.formality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-spotify-light-gray">推奨トーン:</p>
                    <p className="text-xs font-semibold text-spotify-green">
                      {toneAnalysis.recommendedTone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* スレッドメッセージ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {thread.emails.map((email, index) => (
              <div
                key={email.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id
                    ? 'border-spotify-green bg-spotify-green/10'
                    : 'border-spotify-gray bg-spotify-dark-gray hover:bg-spotify-gray'
                }`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {email.read ? (
                      <MailOpen className="w-4 h-4 text-read-gray" />
                    ) : (
                      <Mail className="w-4 h-4 text-unread-blue" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {extractName(email.from)}
                      </p>
                      <span className="text-xs text-spotify-light-gray">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p className="text-xs text-spotify-light-gray line-clamp-2">
                      {email.snippet}
                    </p>
                    {index === thread.emails.length - 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-spotify-green/20 text-spotify-green mt-2">
                        最新
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側: 返信作成パネル */}
        <div className="w-1/2 flex flex-col">
          {/* AI機能ボタン */}
          <div className="border-b border-spotify-gray p-4 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-spotify-green" />
              <h3 className="text-sm font-semibold text-white">AI機能</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateContextAwareAIReply}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-3 py-2 bg-spotify-green hover:bg-spotify-green-hover disabled:bg-spotify-green-hover text-black disabled:text-gray-600 rounded-lg transition-colors font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">{isGenerating ? 'AI生成中...' : 'AI返信生成'}</span>
              </button>
              <button
                onClick={generateReplyWithSummary}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm">要約付き生成</span>
              </button>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">テンプレート</span>
              </button>
            </div>
          </div>

          {/* スマートリプライ */}
          {smartReplies.length > 0 && (
            <div className="border-b border-spotify-gray p-4 flex-shrink-0">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-4 h-4 text-spotify-green" />
                <h3 className="text-sm font-semibold text-white">クイック返信</h3>
                {loadingSmartReplies && <div className="w-3 h-3 border border-spotify-green border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <div className="flex flex-wrap gap-2">
                {smartReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSmartReplySelect(reply)}
                    className="px-3 py-2 bg-spotify-dark-gray border border-spotify-gray rounded-lg hover:border-spotify-green hover:bg-spotify-gray transition-colors text-sm text-white"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 返信先情報 */}
          <div className="bg-spotify-gray p-4 border-b border-spotify-gray flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-spotify-light-gray mb-1">返信先:</p>
                <p className="text-white font-medium">{latestEmail.from}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-spotify-light-gray mb-1">件名:</p>
                <p className="text-white text-sm">{latestEmail.subject.startsWith('Re: ') ? latestEmail.subject : `Re: ${latestEmail.subject}`}</p>
              </div>
            </div>
          </div>

          {/* 返信作成エリア */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="返信を入力してください..."
              className="flex-1 bg-spotify-dark-gray text-white p-4 rounded-lg border border-spotify-gray focus:border-spotify-green focus:outline-none resize-none"
            />
          </div>

          {/* 送信ボタン */}
          <div className="p-4 border-t border-spotify-gray flex-shrink-0">
            <button
              onClick={sendReply}
              disabled={isSending || !replyText.trim()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-semibold"
            >
              <Send className="w-5 h-5" />
              <span>{isSending ? '送信中...' : '返信を送信'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* テンプレート選択モーダル */}
      {showTemplateSelector && (
        <TemplateSelector
          currentTone={replyType}
          onTemplateSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
} 