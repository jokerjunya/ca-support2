// Gmail API関連の型定義

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  read: boolean;
  important: boolean;
  labels: string[];
  snippet: string;
}

export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
}

export interface EmailSendResponse {
  id: string;
  threadId: string;
  labelIds: string[];
}

export interface EmailThread {
  id: string;
  subject: string;
  emails: Array<{
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
    attachments?: Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId: string;
    }>;
  }>;
  lastMessageDate: Date;
  messageCount: number;
  participants: string[];
} 