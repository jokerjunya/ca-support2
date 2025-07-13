'use client';

import { Clock, Mail, MailOpen, Users, MessageSquare, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { EmailThread, Email, ThreadViewProps } from '../types/email';

export default function ThreadView({
  threads,
  selectedThread,
  onThreadSelect,
  onEmailSelect
}: ThreadViewProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  
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

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleThreadClick = (thread: EmailThread) => {
    onThreadSelect(thread);
    toggleThread(thread.id);
  };

  const handleEmailClick = (email: Email) => {
    onEmailSelect(email);
  };

  const getUnreadCount = (thread: EmailThread) => {
    return thread.emails.filter(email => !email.read).length;
  };

  const getLatestEmail = (thread: EmailThread) => {
    return thread.emails[thread.emails.length - 1];
  };

  const getParticipantsText = (participants: string[]) => {
    if (participants.length === 0) return '';
    if (participants.length === 1) return participants[0];
    if (participants.length === 2) return participants.join(', ');
    return `${participants[0]} 他${participants.length - 1}人`;
  };

  if (threads.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="w-12 h-12 text-spotify-light-gray mx-auto mb-3" />
        <p className="text-spotify-light-gray">スレッドがありません</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-spotify-gray">
      {threads.map((thread) => {
        const isExpanded = expandedThreads.has(thread.id);
        const isSelected = selectedThread?.id === thread.id;
        const unreadCount = getUnreadCount(thread);
        const latestEmail = getLatestEmail(thread);
        
        return (
          <div key={thread.id} className="group">
            {/* Thread Header */}
            <div
              onClick={() => handleThreadClick(thread)}
              className={`p-4 cursor-pointer hover:bg-spotify-gray transition-colors ${
                isSelected ? 'bg-spotify-gray' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Expand/Collapse Icon */}
                <div className="mt-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-spotify-light-gray" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-spotify-light-gray" />
                  )}
                </div>
                
                {/* Thread Icon */}
                <div className="mt-1">
                  {unreadCount > 0 ? (
                    <Mail className="w-4 h-4 text-unread-blue" />
                  ) : (
                    <MailOpen className="w-4 h-4 text-read-gray" />
                  )}
                </div>
                
                {/* Thread Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'text-spotify-white font-semibold' : 'text-spotify-light-gray'
                      }`}>
                        {getParticipantsText(thread.participants)}
                      </p>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3 text-spotify-light-gray" />
                        <span className="text-xs text-spotify-light-gray">
                          {thread.messageCount}
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-unread-blue text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Clock className="w-3 h-3 text-spotify-light-gray" />
                      <span className="text-xs text-spotify-light-gray">
                        {formatDate(thread.lastMessageDate)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Subject */}
                  <p className={`text-sm mb-1 truncate ${
                    unreadCount > 0 ? 'text-spotify-white font-medium' : 'text-spotify-light-gray'
                  }`}>
                    {thread.subject || '(件名なし)'}
                  </p>
                  
                  {/* Latest Email Snippet */}
                  <p className="text-xs text-spotify-light-gray line-clamp-2">
                    {latestEmail.snippet}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Thread Emails (Expanded) */}
            {isExpanded && (
              <div className="bg-spotify-black border-l-2 border-spotify-green ml-8">
                {thread.emails.map((email, index) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className="p-3 cursor-pointer hover:bg-spotify-gray transition-colors border-b border-spotify-gray last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Email Icon */}
                      <div className="mt-1">
                        {email.read ? (
                          <MailOpen className="w-3 h-3 text-read-gray" />
                        ) : (
                          <Mail className="w-3 h-3 text-unread-blue" />
                        )}
                      </div>
                      
                      {/* Email Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs truncate ${
                            email.read ? 'text-spotify-light-gray' : 'text-spotify-white font-semibold'
                          }`}>
                            {email.from.includes('<') 
                              ? email.from.split('<')[0].trim().replace(/"/g, '')
                              : email.from
                            }
                          </p>
                          <span className="text-xs text-spotify-light-gray ml-2">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        
                        {/* Snippet */}
                        <p className="text-xs text-spotify-light-gray line-clamp-1">
                          {email.snippet}
                        </p>
                        
                        {/* Labels */}
                        {email.important && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-important-red/20 text-important-red">
                              重要
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 