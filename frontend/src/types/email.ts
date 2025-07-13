export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  read: boolean;
  important: boolean;
  labels: string[];
  snippet: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string; // base64 encoded data
}

export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  readEmails: number;
  todayEmails: number;
}

export interface EmailThread {
  id: string;
  subject: string;
  emails: Email[];
  lastMessageDate: Date;
  messageCount: number;
  participants: string[];
}

export interface ThreadViewProps {
  threads: EmailThread[];
  selectedThread: EmailThread | null;
  onThreadSelect: (thread: EmailThread) => void;
  onEmailSelect: (email: Email) => void;
} 