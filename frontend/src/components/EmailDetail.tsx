'use client';

import { Reply, Forward, Archive, Trash2, Star, MoreVertical, Paperclip } from 'lucide-react';
import AttachmentList from './AttachmentList';
import { Email } from '../types/email';

interface EmailDetailProps {
  email: Email;
  onReply: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export default function EmailDetail({ email, onReply, onDelete, onArchive }: EmailDetailProps) {
  
  const formatFullDate = (date: Date | string) => {
    const emailDate = new Date(date);
    return emailDate.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });
  };

  const extractEmail = (emailString: string) => {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString;
  };

  const extractName = (emailString: string) => {
    if (emailString.includes('<')) {
      return emailString.split('<')[0].trim().replace(/"/g, '');
    }
    return emailString.split('@')[0];
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
      return;
    }
    
    if (confirm('このメールをゴミ箱に移動しますか？')) {
      try {
        const response = await fetch(`/api/emails/${email.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('メール削除成功');
          // 削除後にページを更新またはリダイレクト
          window.location.reload();
        } else {
          const errorData = await response.json();
          alert(`メール削除に失敗しました: ${errorData.error}`);
        }
      } catch (error) {
        console.error('メール削除エラー:', error);
        alert('メール削除に失敗しました。');
      }
    }
  };

  const handleArchive = async () => {
    if (onArchive) {
      onArchive();
      return;
    }
    
    if (confirm('このメールをアーカイブしますか？')) {
      try {
        const response = await fetch(`/api/emails/${email.id}/archive`, {
          method: 'PATCH',
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('メールアーカイブ成功');
          // アーカイブ後にページを更新またはリダイレクト
          window.location.reload();
        } else {
          const errorData = await response.json();
          alert(`メールアーカイブに失敗しました: ${errorData.error}`);
        }
      } catch (error) {
        console.error('メールアーカイブエラー:', error);
        alert('メールアーカイブに失敗しました。');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-spotify-dark">
      {/* Header */}
      <div className="border-b border-spotify-gray p-6 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-spotify-white mb-2">
              {email.subject || '(件名なし)'}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-spotify-light-gray">
              <div>
                <span className="font-semibold text-spotify-white">
                  {extractName(email.from)}
                </span>
                <span className="ml-1">
                  &lt;{extractEmail(email.from)}&gt;
                </span>
              </div>
              <div>
                宛先: <span className="text-spotify-white">{extractEmail(email.to)}</span>
              </div>
              <div>
                {formatFullDate(email.date)}
              </div>
            </div>

            {/* Labels */}
            <div className="flex items-center space-x-2 mt-3">
              {email.labels.includes('IMPORTANT') && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-important-red/20 text-important-red">
                  重要
                </span>
              )}
              {!email.read && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-unread-blue/20 text-unread-blue">
                  未読
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onReply}
              className="flex items-center space-x-2 px-4 py-2 bg-spotify-green text-spotify-black rounded-lg hover:bg-spotify-green-hover transition-colors font-semibold"
            >
              <Reply className="w-4 h-4" />
              <span>返信</span>
            </button>
            
            <button className="p-2 hover:bg-spotify-gray rounded-lg transition-colors">
              <Forward className="w-5 h-5 text-spotify-light-gray" />
            </button>
            
            <button className="p-2 hover:bg-spotify-gray rounded-lg transition-colors">
              <Star className="w-5 h-5 text-spotify-light-gray" />
            </button>
            
            <button 
              onClick={handleArchive}
              className="p-2 hover:bg-spotify-gray rounded-lg transition-colors"
              title="アーカイブ"
            >
              <Archive className="w-5 h-5 text-spotify-light-gray hover:text-spotify-green" />
            </button>
            
            <button 
              onClick={handleDelete}
              className="p-2 hover:bg-spotify-gray rounded-lg transition-colors"
              title="ゴミ箱に移動"
            >
              <Trash2 className="w-5 h-5 text-spotify-light-gray hover:text-red-500" />
            </button>
            
            <button className="p-2 hover:bg-spotify-gray rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-spotify-light-gray" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-4">
          <div className="bg-spotify-dark-gray rounded-lg p-6 border border-spotify-gray">
            <pre className="whitespace-pre-wrap font-sans text-spotify-white leading-relaxed">
              {email.body}
            </pre>
          </div>
          
          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <AttachmentList attachments={email.attachments} emailId={email.id} />
          )}
        </div>
      </div>
    </div>
  );
} 