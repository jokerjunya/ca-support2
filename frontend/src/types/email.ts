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