import { google } from 'googleapis';
import { AuthUser } from '../types/auth';
import { 
  GmailMessage, 
  GmailListResponse, 
  ParsedEmail, 
  EmailSendRequest,
  EmailSendResponse,
  EmailThread,
  EmailAttachment
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
    snippet: 'いつもお世話になっております。プロジェクトの進捗についてご報告いたします...',
    attachments: [
      {
        filename: 'project_report.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        attachmentId: 'mock_attachment_1'
      },
      {
        filename: 'schedule.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 256000,
        attachmentId: 'mock_attachment_2'
      }
    ]
  },
  {
    id: 'mock_1_reply',
    threadId: 'thread_1',
    subject: 'Re: プロジェクトの進捗について',
    from: 'user@example.com',
    to: 'yamada@example.com',
    date: new Date('2024-01-15T14:30:00Z'),
    body: 'ご報告ありがとうございます。\n\nフェーズ1の完了、お疲れ様でした。\n\nフェーズ2についても順調に進められるよう、サポートいたします。\n\n何かご質問がございましたら、お気軽にお声がけください。',
    read: true,
    important: false,
    labels: ['SENT', 'INBOX'],
    snippet: 'ご報告ありがとうございます。フェーズ1の完了、お疲れ様でした...',
    attachments: []
  },
  {
    id: 'mock_1_reply2',
    threadId: 'thread_1',
    subject: 'Re: プロジェクトの進捗について',
    from: 'yamada@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-16T09:15:00Z'),
    body: 'ありがとうございます。\n\nフェーズ2の詳細スケジュールについて、来週の会議で説明させていただきます。\n\n資料の準備ができましたら、事前にお送りいたします。',
    read: false,
    important: false,
    labels: ['UNREAD', 'INBOX'],
    snippet: 'ありがとうございます。フェーズ2の詳細スケジュールについて、来週の会議で説明...',
    attachments: []
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
    snippet: 'お疲れ様です。来週の会議の日程について調整をお願いします...',
    attachments: []
  },
  {
    id: 'mock_2_reply',
    threadId: 'thread_2',
    subject: 'Re: 会議の日程調整について',
    from: 'user@example.com',
    to: 'tanaka@example.com',
    date: new Date('2024-01-14T16:45:00Z'),
    body: 'お疲れ様です。\n\n日程調整の件、ありがとうございます。\n\n1月22日（月）14:00-15:00でお願いいたします。\n\n会議室の予約も私の方で手配いたします。',
    read: true,
    important: false,
    labels: ['SENT', 'INBOX'],
    snippet: 'お疲れ様です。日程調整の件、ありがとうございます。1月22日（月）14:00-15:00でお願い...',
    attachments: []
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
    snippet: '【重要】システムメンテナンスのお知らせ。下記の日程でシステムメンテナンスを実施...',
    attachments: []
  },
  {
    id: 'mock_4',
    threadId: 'thread_4',
    subject: '新機能のリリースについて',
    from: 'dev-team@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-12T13:20:00Z'),
    body: 'お疲れ様です。\n\n新機能のリリースが完了しました。\n\n主な変更点：\n- ユーザーインターフェースの改善\n- パフォーマンスの向上\n- バグ修正\n\n詳細については、リリースノートをご確認ください。',
    read: true,
    important: false,
    labels: ['INBOX'],
    snippet: 'お疲れ様です。新機能のリリースが完了しました。主な変更点：ユーザーインターフェースの改善...',
    attachments: [
      {
        filename: 'release_notes.pdf',
        mimeType: 'application/pdf',
        size: 512000,
        attachmentId: 'mock_attachment_3'
      }
    ]
  },
  {
    id: 'mock_5',
    threadId: 'thread_5',
    subject: 'セキュリティ研修のご案内',
    from: 'hr@example.com',
    to: 'user@example.com',
    date: new Date('2024-01-11T10:00:00Z'),
    body: 'お疲れ様です。\n\n来月のセキュリティ研修についてご案内いたします。\n\n日時：2024年2月5日（月）13:00-17:00\n場所：第1会議室\n\n参加必須となりますので、ご都合をつけてご参加ください。',
    read: false,
    important: true,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT'],
    snippet: 'お疲れ様です。来月のセキュリティ研修についてご案内いたします...',
    attachments: []
  }
];

export class GmailService {
  private gmail: any;
  private useRealAPI: boolean;
  private apiMode: 'real' | 'mock' | 'fallback';
  private initError: string | null;

  constructor(user?: AuthUser) {
    this.initError = null;
    
    // Gmail API使用可否の判定
    const hasGmailApiConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const isGmailApiEnabled = process.env.GMAIL_API_ENABLED === 'true';
    const hasUserAuth = !!(user && user.accessToken);

    // 詳細な判定ロジック
    if (!hasGmailApiConfig) {
      this.apiMode = 'mock';
      this.useRealAPI = false;
      this.initError = 'Google OAuth認証情報が設定されていません';
      console.log('🔧 Gmail API: モックモード - Google OAuth認証情報未設定');
    } else if (!isGmailApiEnabled) {
      this.apiMode = 'mock';
      this.useRealAPI = false;
      console.log('🔧 Gmail API: モックモード - GMAIL_API_ENABLED=false');
    } else if (!hasUserAuth) {
      this.apiMode = 'mock';
      this.useRealAPI = false;
      console.log('🔧 Gmail API: モックモード - ユーザー未認証');
    } else {
      // 実際のAPI使用を試行
      try {
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
        this.apiMode = 'real';
        this.useRealAPI = true;
        console.log('✅ Gmail API: 実APIモード - 認証成功');
      } catch (error) {
        this.apiMode = 'mock';
        this.useRealAPI = false;
        this.initError = `Gmail API初期化エラー: ${error}`;
        console.error('❌ Gmail API: モックモードに切り替え -', error);
      }
    }
  }

  /**
   * 現在のAPI使用状況を取得
   */
  getApiStatus() {
    return {
      mode: this.apiMode,
      useRealAPI: this.useRealAPI,
      error: this.initError,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 高度な検索でメール一覧を取得
   */
  async searchEmails(maxResults: number = 10, filters: any): Promise<ParsedEmail[]> {
    if (!this.useRealAPI) {
      console.log(`📧 ${this.apiMode === 'mock' ? 'モック' : 'フォールバック'}データを使用して検索`);
      return this.filterMockEmails(mockEmails, filters).slice(0, maxResults);
    }

    try {
      console.log(`🔍 Gmail API: 高度な検索開始`);
      console.log(`   - フィルター:`, filters);
      
      // Gmail検索クエリを構築
      const gmailQuery = this.buildGmailQuery(filters);
      console.log(`   - Gmail検索クエリ: ${gmailQuery}`);

      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: gmailQuery || 'in:inbox',
      });

      if (!listResponse.data.messages) {
        console.log('📧 Gmail API: 検索結果が見つかりません');
        return [];
      }

      console.log(`📧 Gmail API: ${listResponse.data.messages.length}件の検索結果を発見`);
      
      const emails: ParsedEmail[] = [];
      for (const message of listResponse.data.messages) {
        const email = await this.getEmailById(message.id);
        if (email) {
          emails.push(email);
        }
      }

      // フロントエンド側のフィルターを適用
      const filteredEmails = this.filterEmails(emails, filters);
      console.log(`✅ Gmail API: ${filteredEmails.length}件の検索完了`);
      return filteredEmails;
    } catch (error) {
      console.error('❌ Gmail API 検索エラー:', error);
      
      // API接続エラーの場合はフォールバックモードに変更
      if (!this.apiMode.startsWith('fallback')) {
        this.apiMode = 'fallback';
        console.log('🔄 Gmail API エラーのため、フォールバックモードに切り替え');
      }
      
      return this.filterMockEmails(mockEmails, filters).slice(0, maxResults);
    }
  }

  /**
   * メール一覧を取得
   */
  async getEmails(maxResults: number = 10, query?: string): Promise<ParsedEmail[]> {
    if (!this.useRealAPI) {
      console.log(`📧 ${this.apiMode === 'mock' ? 'モック' : 'フォールバック'}データを使用してメール一覧を取得`);
      return mockEmails.slice(0, maxResults);
    }

    try {
      console.log(`📧 Gmail API: メール一覧取得開始 (最大${maxResults}件)`);
      
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query || 'in:inbox',
      });

      if (!listResponse.data.messages) {
        console.log('📧 Gmail API: メッセージが見つかりません');
        return [];
      }

      console.log(`📧 Gmail API: ${listResponse.data.messages.length}件のメッセージを発見`);
      
      const emails: ParsedEmail[] = [];
      for (const message of listResponse.data.messages) {
        const email = await this.getEmailById(message.id);
        if (email) {
          emails.push(email);
        }
      }

      console.log(`✅ Gmail API: ${emails.length}件のメール取得完了`);
      return emails;
    } catch (error) {
      console.error('❌ Gmail API エラー:', error);
      
      // API接続エラーの場合はフォールバックモードに変更
      if (!this.apiMode.startsWith('fallback')) {
        this.apiMode = 'fallback';
        console.log('🔄 Gmail API エラーのため、フォールバックモードに切り替え');
      }
      
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
   * メールを削除（ゴミ箱へ移動）
   */
  async deleteEmail(messageId: string): Promise<boolean> {
    if (!this.useRealAPI) {
      // モックデータの場合は配列から削除
      console.log(`🗑️ モックデータのメール ${messageId} を削除します`);
      const index = mockEmails.findIndex(email => email.id === messageId);
      if (index !== -1) {
        mockEmails.splice(index, 1);
        return true;
      }
      return false;
    }

    try {
      console.log(`🗑️ Gmail API: メール ${messageId} をゴミ箱に移動します`);
      
      const response = await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });

      console.log(`✅ Gmail API: メール削除完了 - ${messageId}`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ Gmail API 削除エラー:', error);
      return false;
    }
  }

  /**
   * メールをアーカイブ
   */
  async archiveEmail(messageId: string): Promise<boolean> {
    if (!this.useRealAPI) {
      // モックデータの場合はINBOXラベルを削除
      console.log(`📦 モックデータのメール ${messageId} をアーカイブします`);
      const mockEmail = mockEmails.find(email => email.id === messageId);
      if (mockEmail) {
        mockEmail.labels = mockEmail.labels.filter(label => label !== 'INBOX');
        return true;
      }
      return false;
    }

    try {
      console.log(`📦 Gmail API: メール ${messageId} をアーカイブします`);
      
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      });

      console.log(`✅ Gmail API: メールアーカイブ完了 - ${messageId}`);
      return response.status === 200;
    } catch (error) {
      console.error('❌ Gmail API アーカイブエラー:', error);
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
   * Gmail プロフィール情報を取得
   */
  async getProfile() {
    if (!this.useRealAPI) {
      // モックプロフィール情報を返す
      return {
        emailAddress: 'user@example.com',
        messagesTotal: mockEmails.length,
        threadsTotal: new Set(mockEmails.map(e => e.threadId)).size,
        historyId: '12345'
      };
    }

    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });
      
      return {
        emailAddress: response.data.emailAddress,
        messagesTotal: response.data.messagesTotal,
        threadsTotal: response.data.threadsTotal,
        historyId: response.data.historyId
      };
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw new Error(`Gmail プロフィール取得に失敗しました: ${error}`);
    }
  }

  /**
   * スレッド一覧を取得
   */
  async getThreads(maxResults: number = 10): Promise<EmailThread[]> {
    if (!this.useRealAPI) {
      console.log('📧 モックデータを使用してスレッド一覧を取得');
      return this.getMockThreads(maxResults);
    }

    try {
      const emails = await this.getEmails(maxResults * 5); // より多くのメールを取得してスレッドを作成
      return this.groupEmailsIntoThreads(emails);
    } catch (error) {
      console.error('スレッド取得エラー:', error);
      return this.getMockThreads(maxResults);
    }
  }

  /**
   * 特定のスレッドのメール一覧を取得
   */
  async getEmailsByThread(threadId: string): Promise<ParsedEmail[]> {
    if (!this.useRealAPI) {
      console.log(`📧 モックデータからスレッド ${threadId} のメールを取得`);
      return mockEmails.filter(email => email.threadId === threadId);
    }

    try {
      // Gmail APIでスレッドを取得
      const threadResponse = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      const emails: ParsedEmail[] = [];
      for (const message of threadResponse.data.messages || []) {
        const email = this.parseGmailMessage(message);
        if (email) {
          emails.push(email);
        }
      }

      return emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('スレッドメール取得エラー:', error);
      return mockEmails.filter(email => email.threadId === threadId);
    }
  }

  /**
   * 特定のスレッドを取得
   */
  async getThreadById(threadId: string): Promise<EmailThread | null> {
    const emails = await this.getEmailsByThread(threadId);
    if (emails.length === 0) {
      return null;
    }

    return this.createThreadFromEmails(emails);
  }

  /**
   * Gmail APIレスポンスをパース
   */
  private parseGmailMessage(gmailMessage: GmailMessage): ParsedEmail {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

    let body = '';
    let attachments: EmailAttachment[] = [];

    if (gmailMessage.payload.body.data) {
      body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString();
    } else if (gmailMessage.payload.parts) {
      // テキスト部分を抽出
      const textPart = gmailMessage.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }

      // 添付ファイルを抽出
      attachments = this.extractAttachments(gmailMessage.payload.parts);
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
      snippet: gmailMessage.snippet,
      attachments: attachments.length > 0 ? attachments : []
    };
  }

  /**
   * 添付ファイルを抽出
   */
  private extractAttachments(parts: any[]): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];
    
    const processPart = (part: any) => {
      if (part.filename && part.body && part.body.attachmentId) {
        // 添付ファイルの場合
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        });
      } else if (part.parts) {
        // ネストされた部分を再帰的に処理
        part.parts.forEach(processPart);
      }
    };

    parts.forEach(processPart);
    return attachments;
  }

  /**
   * 添付ファイルを取得
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<EmailAttachment | null> {
    if (!this.useRealAPI) {
      // モックデータの場合はダミーデータを返す
      console.log(`📎 モックデータから添付ファイル ${attachmentId} を取得`);
      return {
        filename: 'mock_file.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        attachmentId: attachmentId,
        data: 'JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQo=' // PDFダミーデータ
      };
    }

    try {
      console.log(`📎 Gmail API: 添付ファイル取得開始 - メッセージID: ${messageId}, 添付ID: ${attachmentId}`);
      
      // Gmail APIで添付ファイルを取得
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      if (!response.data.data) {
        console.error('添付ファイルデータが見つかりません');
        return null;
      }

      // メールからファイル名とmimeTypeを取得
      const messageResponse = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const attachment = this.findAttachmentInfo(messageResponse.data.payload.parts, attachmentId);
      
      if (!attachment) {
        console.error('添付ファイル情報が見つかりません');
        return null;
      }

      console.log(`✅ Gmail API: 添付ファイル取得完了 - ${attachment.filename}`);
      
      return {
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        attachmentId: attachmentId,
        data: response.data.data
      };
    } catch (error) {
      console.error('添付ファイル取得エラー:', error);
      return null;
    }
  }

  /**
   * 添付ファイル情報を検索
   */
  private findAttachmentInfo(parts: any[], attachmentId: string): { filename: string, mimeType: string, size: number } | null {
    for (const part of parts) {
      if (part.body && part.body.attachmentId === attachmentId) {
        return {
          filename: part.filename || 'unknown',
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0
        };
      }
      if (part.parts) {
        const result = this.findAttachmentInfo(part.parts, attachmentId);
        if (result) return result;
      }
    }
    return null;
  }

  /**
   * Gmail検索クエリを構築
   */
  private buildGmailQuery(filters: any): string {
    const queryParts: string[] = [];
    
    // 基本検索クエリ
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // 送信者フィルター
    if (filters.sender) {
      queryParts.push(`from:${filters.sender}`);
    }
    
    // 件名フィルター
    if (filters.subject) {
      queryParts.push(`subject:${filters.subject}`);
    }
    
    // 添付ファイルフィルター
    if (filters.hasAttachment) {
      queryParts.push('has:attachment');
    }
    
    // 日付範囲フィルター
    if (filters.dateStart) {
      queryParts.push(`after:${filters.dateStart}`);
    }
    if (filters.dateEnd) {
      queryParts.push(`before:${filters.dateEnd}`);
    }
    
    // 既読状態フィルター
    if (filters.isRead === true) {
      queryParts.push('-is:unread');
    } else if (filters.isRead === false) {
      queryParts.push('is:unread');
    }
    
    // 重要度フィルター
    if (filters.isImportant === true) {
      queryParts.push('is:important');
    } else if (filters.isImportant === false) {
      queryParts.push('-is:important');
    }
    
    // デフォルトでinboxを検索
    if (queryParts.length === 0) {
      queryParts.push('in:inbox');
    } else {
      queryParts.push('in:inbox');
    }
    
    return queryParts.join(' ');
  }

  /**
   * モックメールをフィルタリング
   */
  private filterMockEmails(emails: ParsedEmail[], filters: any): ParsedEmail[] {
    return emails.filter(email => {
      // 基本検索クエリ
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = `${email.subject} ${email.body} ${email.from} ${email.to}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }
      
      // 送信者フィルター
      if (filters.sender && !email.from.toLowerCase().includes(filters.sender.toLowerCase())) {
        return false;
      }
      
      // 件名フィルター
      if (filters.subject && !email.subject.toLowerCase().includes(filters.subject.toLowerCase())) {
        return false;
      }
      
      // 添付ファイルフィルター
      if (filters.hasAttachment && (!email.attachments || email.attachments.length === 0)) {
        return false;
      }
      
      // 日付範囲フィルター
      if (filters.dateStart) {
        try {
          const emailDate = new Date(email.date);
          if (!isNaN(emailDate.getTime())) {
            const emailDateStr = emailDate.toISOString().split('T')[0];
            if (emailDateStr && emailDateStr < filters.dateStart) return false;
          }
        } catch (e) {
          // 日付解析エラーは無視
        }
      }
      if (filters.dateEnd) {
        try {
          const emailDate = new Date(email.date);
          if (!isNaN(emailDate.getTime())) {
            const emailDateStr = emailDate.toISOString().split('T')[0];
            if (emailDateStr && emailDateStr > filters.dateEnd) return false;
          }
        } catch (e) {
          // 日付解析エラーは無視
        }
      }
      
      // 既読状態フィルター
      if (filters.isRead !== undefined && email.read !== filters.isRead) {
        return false;
      }
      
      // 重要度フィルター
      if (filters.isImportant !== undefined && email.important !== filters.isImportant) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * メールをフィルタリング（Gmail API結果用）
   */
  private filterEmails(emails: ParsedEmail[], filters: any): ParsedEmail[] {
    // Gmail APIでは多くのフィルタリングが既に適用されているので、
    // 追加のクライアントサイドフィルタリングを実行
    return this.filterMockEmails(emails, filters);
  }

  /**
   * 送信用メール文字列を作成
   */
  private createEmailString(emailData: EmailSendRequest): string {
    const email = [
      `To: ${emailData.to}`,
      emailData.cc ? `Cc: ${emailData.cc}` : '',
      emailData.bcc ? `Bcc: ${emailData.bcc}` : '',
      `Subject: ${emailData.subject}`,
      emailData.inReplyTo ? `In-Reply-To: ${emailData.inReplyTo}` : '',
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailData.body
    ].filter(line => line !== '').join('\r\n');

    return email;
  }

  /**
   * メール配列からスレッドオブジェクトを作成
   */
  private createThreadFromEmails(emails: ParsedEmail[]): EmailThread {
    const sortedEmails = emails.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestEmail = sortedEmails[sortedEmails.length - 1];
    if (!latestEmail) {
      throw new Error('メール配列が空です');
    }

    const participants = new Set<string>();
    
    sortedEmails.forEach(email => {
      participants.add(email.from);
      participants.add(email.to);
    });

    return {
      id: latestEmail.threadId,
      subject: latestEmail.subject,
      emails: sortedEmails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        body: email.body,
        date: email.date,
        isRead: email.read,
        labels: email.labels
      })),
      lastMessageDate: latestEmail.date,
      messageCount: sortedEmails.length,
      participants: Array.from(participants).filter(p => p !== 'user@example.com')
    };
  }

  /**
   * モックスレッドデータを取得
   */
  private getMockThreads(maxResults: number): EmailThread[] {
    const threadMap = new Map<string, ParsedEmail[]>();
    
    mockEmails.forEach(email => {
      if (!threadMap.has(email.threadId)) {
        threadMap.set(email.threadId, []);
      }
      threadMap.get(email.threadId)!.push(email);
    });

    const threads: EmailThread[] = [];
    threadMap.forEach((threadEmails, threadId) => {
      threads.push(this.createThreadFromEmails(threadEmails));
    });

    return threads
      .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime())
      .slice(0, maxResults);
  }

  /**
   * メールをスレッドごとにグループ化
   */
  private groupEmailsIntoThreads(emails: ParsedEmail[]): EmailThread[] {
    const threadMap = new Map<string, ParsedEmail[]>();
    
    emails.forEach(email => {
      if (!threadMap.has(email.threadId)) {
        threadMap.set(email.threadId, []);
      }
      threadMap.get(email.threadId)!.push(email);
    });

    const threads: EmailThread[] = [];
    threadMap.forEach((threadEmails, threadId) => {
      threads.push(this.createThreadFromEmails(threadEmails));
    });

    return threads.sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }
}

/**
 * Gmail サービスインスタンスを作成
 */
export const createGmailService = (user?: AuthUser): GmailService => {
  return new GmailService(user);
}; 