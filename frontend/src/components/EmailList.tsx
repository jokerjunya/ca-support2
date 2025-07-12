'use client';

import { Clock, Mail, MailOpen } from 'lucide-react';
import { Email } from '../types/email';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onEmailSelect: (email: Email) => void;
}

export default function EmailList({ 
  emails, 
  selectedEmail, 
  onEmailSelect
}: EmailListProps) {
  
  const formatDate = (date: Date | string) => {
    const emailDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - emailDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return emailDate.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return emailDate.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleEmailClick = (email: Email) => {
    onEmailSelect(email);
  };

  if (emails.length === 0) {
    return (
      <div className="p-4 text-center">
        <Mail className="w-12 h-12 text-spotify-light-gray mx-auto mb-3" />
        <p className="text-spotify-light-gray">メールがありません</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-spotify-gray">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => handleEmailClick(email)}
          className={`p-4 cursor-pointer hover:bg-spotify-gray transition-colors ${
            selectedEmail?.id === email.id ? 'bg-spotify-gray' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Read/Unread Icon */}
            <div className="mt-1">
              {email.read ? (
                <MailOpen className="w-4 h-4 text-read-gray" />
              ) : (
                <Mail className="w-4 h-4 text-unread-blue" />
              )}
            </div>
            
            {/* Email Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm truncate ${
                  email.read ? 'text-spotify-light-gray' : 'text-spotify-white font-semibold'
                }`}>
                  {email.from.includes('<') 
                    ? email.from.split('<')[0].trim().replace(/"/g, '')
                    : email.from
                  }
                </p>
                <div className="flex items-center space-x-2 ml-2">
                  <Clock className="w-3 h-3 text-spotify-light-gray" />
                  <span className="text-xs text-spotify-light-gray">
                    {formatDate(email.date)}
                  </span>
                </div>
              </div>
              
              {/* Subject */}
              <p className={`text-sm mb-1 truncate ${
                email.read ? 'text-spotify-light-gray' : 'text-spotify-white font-medium'
              }`}>
                {email.subject || '(件名なし)'}
              </p>
              
              {/* Snippet */}
              <p className="text-xs text-spotify-light-gray line-clamp-2">
                {email.snippet}
              </p>
              
              {/* Labels */}
              {email.important && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-important-red/20 text-important-red">
                    重要
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 