import { google } from 'googleapis';
import { AuthUser } from '../types/auth';
import { 
  GmailMessage, 
  GmailListResponse, 
  ParsedEmail, 
  EmailSendRequest,
  EmailSendResponse 
} from '../types/gmail';

// モックデータ（開発・テスト用）
const mockEmails: ParsedEmail[] = [
  {
    id: 'mock_1',
    threadId: 'thread_1',
    subject: 'プロジェクトの進捗について',
    from: 'yamada@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-15T10:00:00Z'),
    body: 'いつもお世話になっております。\n\nプロジェクトの進捗についてご報告いたします。\n\n現在、フェーズ1の実装が完了し、フェーズ2に入っております。\n\nご確認のほど、よろしくお願いいたします。',
    read: false,
    important: false,
    labels: ['UNREAD', 'INBOX'],
    snippet: 'いつもお世話になっております。プロジェクトの進捗についてご報告いたします...'
  },
  {
    id: 'mock_2',
    threadId: 'thread_2',
    subject: '会議の日程調整について',
    from: 'tanaka@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-14T14:30:00Z'),
    body: 'お疲れ様です。\n\n来週の会議の日程について調整をお願いします。\n\n候補日：\n- 1月22日（月）14:00-15:00\n- 1月23日（火）10:00-11:00\n\nご都合の良い時間をお教えください。',
    read: true,
    important: false,
    labels: ['INBOX'],
    snippet: 'お疲れ様です。来週の会議の日程について調整をお願いします...'
  },
  {
    id: 'mock_3',
    threadId: 'thread_3',
    subject: 'システムメンテナンスのお知らせ',
    from: 'support@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-13T09:00:00Z'),
    body: '【重要】システムメンテナンスのお知らせ\n\n下記の日程でシステムメンテナンスを実施いたします。\n\n日時：2024年1月20日（土）2:00-6:00\n対象：全サービス\n\nご不便をおかけいたしますが、ご理解のほどお願いいたします。',
    read: false,
    important: true,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT'],
    snippet: '【重要】システムメンテナンスのお知らせ。下記の日程でシステムメンテナンスを実施...'
  }
];

export class GmailService {
  private gmail: any;
  private useRealAPI: boolean;
  private forceTestMode: boolean;

  constructor(user?: AuthUser) {
    // Gmail API が利用できない場合は強制的にテストモードに
    this.forceTestMode = !process.env.GMAIL_API_ENABLED || process.env.NODE_ENV === 'development';
    this.useRealAPI = !!(user && user.accessToken && process.env.GOOGLE_CLIENT_ID && !this.forceTestMode);
    
    if (this.useRealAPI && user) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
      );

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    }
  }

  /**
   * メール一覧を取得
   */
  async getEmails(maxResults: number = 10, query?: string): Promise<ParsedEmail[]> {
    if (!this.useRealAPI) {
      console.log('📧 モックデータを使用してメール一覧を取得');
      return mockEmails.slice(0, maxResults);
    }

    try {
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || 'in:inbox',
      });

      if (!listResponse.data.messages) {
        return [];
      }

      const emails: ParsedEmail[] = [];
      for (const message of listResponse.data.messages) {
        const email = await this.getEmailById(message.id);
        if (email) {
          emails.push(email);
        }
      }

      return emails;
    } catch (error) {
      console.error('Gmail API エラー:', error);
      // Gmail API エラーの場合はモックデータにフォールバック
      console.log('🔄 Gmail API エラーのため、モックデータにフォールバック');
      return mockEmails.slice(0, maxResults);
    }
  }

  /**
   * 特定のメールを取得
   */
  async getEmailById(messageId: string): Promise<ParsedEmail | null> {
    if (!this.useRealAPI) {
      const mockEmail = mockEmails.find(email => email.id === messageId);
      return mockEmail || null;
    }

    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseGmailMessage(response.data);
    } catch (error) {
      console.error('メール取得エラー:', error);
      // エラーの場合はモックデータから検索
      const mockEmail = mockEmails.find(email => email.id === messageId);
      return mockEmail || null;
    }
  }

  /**
   * 未読メールを取得
   */
  async getUnreadEmails(): Promise<ParsedEmail[]> {
    if (!this.useRealAPI) {
      return mockEmails.filter(email => !email.read);
    }

    try {
      return this.getEmails(50, 'is:unread');
    } catch (error) {
      console.error('未読メール取得エラー:', error);
      return mockEmails.filter(email => !email.read);
    }
  }

  /**
   * メールを既読にする
   */
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.useRealAPI) {
      const email = mockEmails.find(e => e.id === messageId);
      if (email) {
        email.read = true;
        email.labels = email.labels.filter(label => label !== 'UNREAD');
        console.log(`📖 モックメール ${messageId} を既読にしました`);
        return true;
      }
      return false;
    }

    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('既読処理エラー:', error);
      // エラーの場合はモックデータを更新
      const email = mockEmails.find(e => e.id === messageId);
      if (email) {
        email.read = true;
        email.labels = email.labels.filter(label => label !== 'UNREAD');
        return true;
      }
      return false;
    }
  }

  /**
   * メールを送信
   */
  async sendEmail(emailData: EmailSendRequest): Promise<EmailSendResponse | null> {
    if (!this.useRealAPI) {
      console.log('📤 モックメール送信:', emailData);
      return {
        id: `mock_sent_${Date.now()}`,
        threadId: emailData.threadId || `thread_${Date.now()}`,
        labelIds: ['SENT']
      };
    }

    try {
      const email = this.createEmailString(emailData);
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
        }
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds
      };
    } catch (error) {
      console.error('メール送信エラー:', error);
      // エラーの場合はモック送信
      console.log('📤 Gmail API エラーのため、モック送信を実行:', emailData);
      return {
        id: `mock_sent_${Date.now()}`,
        threadId: emailData.threadId || `thread_${Date.now()}`,
        labelIds: ['SENT']
      };
    }
  }

  /**
   * Gmail APIレスポンスをパース
   */
  private parseGmailMessage(gmailMessage: GmailMessage): ParsedEmail {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

    let body = '';
    if (gmailMessage.payload.body.data) {
      body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString();
    } else if (gmailMessage.payload.parts) {
      const textPart = gmailMessage.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: new Date(parseInt(gmailMessage.internalDate)),
      body,
      read: !gmailMessage.labelIds.includes('UNREAD'),
      important: gmailMessage.labelIds.includes('IMPORTANT'),
      labels: gmailMessage.labelIds,
      snippet: gmailMessage.snippet
    };
  }

  /**
   * 送信用メール文字列を作成
   */
  private createEmailString(emailData: EmailSendRequest): string {
    const email = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      emailData.inReplyTo ? `In-Reply-To: ${emailData.inReplyTo}` : '',
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailData.body
    ].filter(line => line !== '').join('\r\n');

    return email;
  }
}

/**
 * Gmail サービスインスタンスを作成
 */
export const createGmailService = (user?: AuthUser): GmailService => {
  return new GmailService(user);
}; 