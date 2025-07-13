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
  cc?: string;
  bcc?: string;
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

// Thread Normalizer 用の型定義

/**
 * 正規化されたメッセージの型定義
 * LLMに渡しやすい形式で構造化されたメッセージ情報
 */
export interface NormalizedThreadMessage {
  /** メッセージID */
  messageId: string;
  /** ISO8601形式の日付文字列 (YYYY-MM-DDThh:mm:ssZ) */
  date: string;
  /** 送信者メールアドレス/表示名 */
  from: string;
  /** 宛先メールアドレスの配列 */
  to: string[];
  /** 件名 */
  subject: string;
  /** プレーンテキスト本文 */
  body: string;
}

/**
 * 正規化されたスレッドの型定義
 * Gmail APIから取得したスレッドを正規化した形式
 */
export interface NormalizedThread {
  /** スレッドID */
  threadId: string;
  /** 日時順（昇順）にソートされたメッセージ配列 */
  messages: NormalizedThreadMessage[];
}

/**
 * Thread Normalizer のオプション設定
 */
export interface ThreadNormalizerOptions {
  /** HTMLからプレーンテキストへの変換を行うかどうか（デフォルト: true） */
  convertHtmlToText?: boolean;
  /** メッセージのソートを行うかどうか（デフォルト: true） */
  sortMessages?: boolean;
  /** 空のメッセージを除外するかどうか（デフォルト: true） */
  excludeEmptyMessages?: boolean;
}

/**
 * Thread Normalizer の結果型
 */
export interface ThreadNormalizerResult {
  /** 正規化されたスレッド */
  normalizedThread: NormalizedThread;
  /** 処理されたメッセージ数 */
  processedMessageCount: number;
  /** エラー情報（存在する場合） */
  errors?: string[];
} 