'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Email } from '../types/email';

interface ReplyComposerProps {
  email: Email;
  onBack: () => void;
}

export default function ReplyComposer({ email, onBack }: ReplyComposerProps) {
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyType, setReplyType] = useState<'business' | 'casual' | 'polite'>('business');
  const [showToneSelector, setShowToneSelector] = useState(false);
  const toneSelectorRef = useRef<HTMLDivElement>(null);

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

  const generateAIReply = async () => {
    setIsGenerating(true);
    try {
      console.log(`🤖 AI返信生成開始 - 語調: ${replyType}`);
      
      const response = await fetch('/api/emails/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId: email.id,
          replyType: replyType,
          customInstructions: '返信は簡潔で要点を押さえた内容にしてください',
          language: 'ja'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ AI返信生成完了 - 処理時間: ${data.processing_time}ms, 信頼度: ${data.confidence}`);
        setReplyText(data.reply);
      } else {
        const errorData = await response.json();
        console.error('AI返信生成エラー:', errorData);
        
        // フォールバック: エラー時は定型文を使用
        const fallbackReplies = {
          business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
          casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
          polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
        };
        setReplyText(fallbackReplies[replyType]);
      }
    } catch (error) {
      console.error('AI返信生成エラー:', error);
      
      // フォールバック: エラー時は定型文を使用
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

  const sendReply = async () => {
    if (!replyText.trim()) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          to: email.from,
          subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          body: replyText,
          threadId: email.threadId
        })
      });
      
      if (response.ok) {
        onBack();
      } else {
        console.error('送信エラー');
      }
    } catch (error) {
      console.error('送信エラー:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-spotify-dark">
      {/* Header */}
      <div className="bg-spotify-dark-gray border-b border-spotify-gray p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-spotify-gray rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-spotify-light-gray" />
            </button>
            <h2 className="text-lg font-semibold text-white">返信作成</h2>
          </div>
          <div className="flex items-center space-x-3">
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
                <div className="absolute top-full left-0 mt-1 w-40 bg-spotify-dark-gray border border-spotify-gray rounded-lg shadow-lg z-10">
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

            <button
              onClick={generateAIReply}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover disabled:bg-spotify-green-hover text-black disabled:text-gray-600 rounded-lg transition-colors font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'AI生成中...' : 'AI返信生成'}</span>
            </button>
            <button
              onClick={sendReply}
              disabled={isSending || !replyText.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? '送信中...' : '送信'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Original Email Info */}
      <div className="bg-spotify-gray p-4 border-b border-spotify-gray">
        <p className="text-sm text-spotify-light-gray mb-1">返信先:</p>
        <p className="text-white font-medium">{email.from}</p>
        <p className="text-sm text-spotify-light-gray mt-2">件名:</p>
        <p className="text-white">{email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`}</p>
      </div>

      {/* Compose Area */}
      <div className="flex-1 p-4">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="返信を入力してください..."
          className="w-full h-full bg-spotify-dark-gray text-white p-4 rounded-lg border border-spotify-gray focus:border-spotify-green focus:outline-none resize-none"
        />
      </div>

      {/* Original Email Preview */}
      <div className="bg-spotify-gray p-4 border-t border-spotify-gray">
        <p className="text-sm text-spotify-light-gray mb-2">元のメール:</p>
        <div className="bg-spotify-dark-gray p-3 rounded-lg">
          <p className="text-sm text-spotify-light-gray mb-1">
            {new Date(email.date).toLocaleString('ja-JP')}
          </p>
          <p className="text-white text-sm">{email.snippet}</p>
        </div>
      </div>
    </div>
  );
} 