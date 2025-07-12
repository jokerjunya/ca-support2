'use client';

import { useState } from 'react';
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

  const generateAIReply = async () => {
    setIsGenerating(true);
    try {
      // モック AI 返信生成
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockReplies = [
        'ありがとうございます。確認いたします。',
        'お疲れ様です。内容を拝見し、対応いたします。',
        'ご連絡いただきありがとうございます。詳細を確認して返信いたします。',
        '承知いたしました。確認後、改めてご連絡いたします。'
      ];
      
      const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
      setReplyText(reply);
    } catch (error) {
      console.error('AI返信生成エラー:', error);
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
          <div className="flex items-center space-x-2">
            <button
              onClick={generateAIReply}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover disabled:bg-spotify-green-hover text-white rounded-lg transition-colors"
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