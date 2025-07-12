// 共通型定義ファイル - Gmail Assistant

export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  isRead: boolean;
  labels: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  emails: Email[];
  lastMessageDate: Date;
  messageCount: number;
  participants: string[];
}

export interface LLMResponse {
  generatedReply: string;
  tone: ReplyTone;
  confidence: number;
  timestamp: Date;
  processingTime: number;
}

export type ReplyTone = 'business' | 'casual' | 'polite' | 'brief';

export interface UserSettings {
  defaultReplyTone: ReplyTone;
  autoGenerateReplies: boolean;
  emailRefreshInterval: number;
  language: 'ja' | 'en';
  theme: 'light' | 'dark';
}

export interface GmailAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  repliedEmails: number;
  averageResponseTime: number;
  dailyProcessed: number;
}

export interface EmailFilter {
  isRead?: boolean;
  labels?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sender?: string;
  subject?: string;
} 