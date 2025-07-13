'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Sparkles, FileText, X, Plus, Save } from 'lucide-react';
import { ReplyTemplate } from '../types/template';
import TemplateSelector from './TemplateSelector';
import { DraftEmail, saveDraft, updateDraft, deleteDraft, createAutoSave } from '../utils/draftStorage';

interface NewEmailComposerProps {
  onBack: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  loadDraftId?: string;
}

export default function NewEmailComposer({ 
  onBack, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '',
  loadDraftId
}: NewEmailComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyType, setReplyType] = useState<'business' | 'casual' | 'polite'>('business');
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(loadDraftId || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toneSelectorRef = useRef<HTMLDivElement>(null);

  // 下書きデータを取得する関数
  const getDraftData = useCallback(() => ({
    to: to.trim(),
    cc: cc.trim(),
    bcc: bcc.trim(),
    subject: subject.trim(),
    body: body.trim(),
    replyType,
    isReply: false
  }), [to, cc, bcc, subject, body, replyType]);

  // 自動保存関数を作成
  const autoSave = useCallback(
    createAutoSave(draftId, getDraftData, setDraftId, 3000),
    [draftId, getDraftData]
  );

  // 下書き読み込み
  useEffect(() => {
    if (loadDraftId) {
      import('../utils/draftStorage').then(({ getDraft }) => {
        const draft = getDraft(loadDraftId);
        if (draft) {
          setTo(draft.to);
          setCc(draft.cc || '');
          setBcc(draft.bcc || '');
          setSubject(draft.subject);
          setBody(draft.body);
          setReplyType(draft.replyType);
          setLastSaved(new Date(draft.updatedAt));
          console.log('📥 下書き読み込み完了:', loadDraftId);
        }
      });
    }
  }, [loadDraftId]);

  // 自動保存のトリガー
  useEffect(() => {
    autoSave();
  }, [to, cc, bcc, subject, body, replyType, autoSave]);

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

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      console.log(`🤖 AI新規メール生成開始 - 語調: ${replyType}`);
      
      // 新規メール用のAI生成API（将来的に実装）
      // 現在はフォールバック応答を使用
      const fallbackContent = {
        business: 'お疲れ様です。\n\n[件名に関する内容をここに記入してください]\n\nご確認のほど、よろしくお願いいたします。',
        casual: 'お疲れ様です！\n\n[件名について]\n\nよろしくお願いします。',
        polite: 'いつもお世話になっております。\n\n[件名に関してご連絡いたします]\n\nお忙しい中恐れ入りますが、ご確認いただけますと幸いです。\n\n何卒よろしくお願い申し上げます。'
      };
      
      setBody(fallbackContent[replyType]);
      
      console.log(`✅ AI新規メール生成完了 - 語調: ${replyType}`);
    } catch (error) {
      console.error('AI生成エラー:', error);
      const fallbackContent = {
        business: 'お疲れ様です。\n\n[件名に関する内容をここに記入してください]\n\nご確認のほど、よろしくお願いいたします。',
        casual: 'お疲れ様です！\n\n[件名について]\n\nよろしくお願いします。',
        polite: 'いつもお世話になっております。\n\n[件名に関してご連絡いたします]\n\nお忙しい中恐れ入りますが、ご確認いただけますと幸いです。\n\n何卒よろしくお願い申し上げます。'
      };
      setBody(fallbackContent[replyType]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (template: ReplyTemplate) => {
    setBody(template.content);
    setShowTemplateSelector(false);
  };

  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      const draftData = getDraftData();
      
      if (!draftData.to.trim() && !draftData.subject.trim() && !draftData.body.trim()) {
        alert('保存する内容がありません。');
        return;
      }
      
      if (draftId) {
        updateDraft(draftId, draftData);
      } else {
        const newId = saveDraft(draftData);
        setDraftId(newId);
      }
      
      setLastSaved(new Date());
      console.log('💾 手動保存完了');
    } catch (error) {
      console.error('手動保存エラー:', error);
      alert('下書きの保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('宛先、件名、本文は必須項目です。');
      return;
    }
    
    setIsSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          body: body.trim()
        })
      });
      
      if (response.ok) {
        console.log('メール送信成功');
        
        // 送信成功後に下書きを削除
        if (draftId) {
          try {
            deleteDraft(draftId);
            console.log('📧 送信後の下書き削除完了');
          } catch (error) {
            console.error('下書き削除エラー:', error);
          }
        }
        
        onBack();
      } else {
        const errorData = await response.json();
        console.error('メール送信エラー:', errorData);
        alert(`メール送信に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      alert('メール送信に失敗しました。');
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
            <div>
              <h2 className="text-lg font-semibold text-white">新規メール作成</h2>
              {lastSaved && (
                <p className="text-xs text-spotify-light-gray">
                  最終保存: {lastSaved.toLocaleTimeString('ja-JP')}
                </p>
              )}
            </div>
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
              onClick={() => setShowTemplateSelector(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" />
              <span>テンプレート</span>
            </button>

            <button
              onClick={generateAIContent}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-spotify-green hover:bg-spotify-green-hover disabled:bg-spotify-green-hover text-black disabled:text-gray-600 rounded-lg transition-colors font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'AI生成中...' : 'AI下書き生成'}</span>
            </button>
            
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '下書き保存'}</span>
            </button>
            
            <button
              onClick={sendEmail}
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? '送信中...' : '送信'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Form */}
      <div className="bg-spotify-gray p-4 border-b border-spotify-gray">
        {/* To Field */}
        <div className="mb-3">
          <label className="text-sm text-spotify-light-gray mb-1 block">宛先 *</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="example@example.com"
            className="w-full bg-spotify-dark-gray text-white p-2 rounded border border-spotify-gray focus:border-spotify-green focus:outline-none"
          />
        </div>

        {/* CC/BCC Toggle */}
        {!showCcBcc && (
          <div className="mb-3">
            <button
              onClick={() => setShowCcBcc(true)}
              className="flex items-center space-x-2 text-sm text-spotify-light-gray hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>CC/BCC</span>
            </button>
          </div>
        )}

        {/* CC/BCC Fields */}
        {showCcBcc && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-spotify-light-gray min-w-10">CC</label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 bg-spotify-dark-gray text-white p-2 rounded border border-spotify-gray focus:border-spotify-green focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-spotify-light-gray min-w-10">BCC</label>
              <input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="flex-1 bg-spotify-dark-gray text-white p-2 rounded border border-spotify-gray focus:border-spotify-green focus:outline-none"
              />
              <button
                onClick={() => setShowCcBcc(false)}
                className="p-2 hover:bg-spotify-gray rounded transition-colors"
              >
                <X className="w-4 h-4 text-spotify-light-gray" />
              </button>
            </div>
          </div>
        )}

        {/* Subject Field */}
        <div className="mb-3">
          <label className="text-sm text-spotify-light-gray mb-1 block">件名 *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="件名を入力してください"
            className="w-full bg-spotify-dark-gray text-white p-2 rounded border border-spotify-gray focus:border-spotify-green focus:outline-none"
          />
        </div>
      </div>

      {/* Compose Area */}
      <div className="flex-1 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="メール本文を入力してください..."
          className="w-full h-full bg-spotify-dark-gray text-white p-4 rounded-lg border border-spotify-gray focus:border-spotify-green focus:outline-none resize-none"
        />
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