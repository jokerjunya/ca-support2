/**
 * Gmail Thread Normalizer Unit Tests
 * threadNormalizer.ts の機能をテストするユニットテスト
 */

import {
  normalizeGmailThread,
  normalizeGmailMessages,
  validateThreadData,
  validateGmailMessages,
  validateOptions,
  ThreadNormalizerError
} from '../../utils/threadNormalizer';
import { EmailThread, GmailMessage, ThreadNormalizerOptions } from '../../types/gmail';

// モックデータ
const mockEmailThread: EmailThread = {
  id: 'thread_123',
  subject: 'Test Thread',
  emails: [
    {
      id: 'message_1',
      threadId: 'thread_123',
      subject: 'Test Message 1',
      from: 'sender1@example.com',
      to: 'recipient@example.com',
      body: '<p>This is <strong>HTML</strong> content</p>',
      bodyHtml: '<p>This is <strong>HTML</strong> content</p>',
      date: new Date('2024-01-15T10:00:00Z'),
      isRead: false,
      labels: ['INBOX', 'UNREAD'],
      attachments: []
    },
    {
      id: 'message_2',
      threadId: 'thread_123',
      subject: 'Re: Test Message 1',
      from: 'recipient@example.com',
      to: 'sender1@example.com',
      body: 'This is plain text content',
      date: new Date('2024-01-15T11:00:00Z'),
      isRead: true,
      labels: ['INBOX'],
      attachments: []
    }
  ],
  lastMessageDate: new Date('2024-01-15T11:00:00Z'),
  messageCount: 2,
  participants: ['sender1@example.com', 'recipient@example.com']
};

const mockGmailMessages: GmailMessage[] = [
  {
    id: 'gmail_message_1',
    threadId: 'thread_456',
    labelIds: ['INBOX', 'UNREAD'],
    snippet: 'Test message snippet',
    internalDate: '1705312800000', // 2024-01-15T10:00:00Z
    payload: {
      headers: [
        { name: 'From', value: 'sender2@example.com' },
        { name: 'To', value: 'recipient2@example.com' },
        { name: 'Subject', value: 'Gmail Test Message' }
      ],
      body: {
        data: 'VGhpcyBpcyBhIHRlc3QgbWVzc2FnZQ==' // Base64: "This is a test message"
      }
    }
  },
  {
    id: 'gmail_message_2',
    threadId: 'thread_456',
    labelIds: ['INBOX'],
    snippet: 'Another test message',
    internalDate: '1705316400000', // 2024-01-15T11:00:00Z
    payload: {
      headers: [
        { name: 'From', value: 'recipient2@example.com' },
        { name: 'To', value: 'sender2@example.com, cc@example.com' },
        { name: 'Subject', value: 'Re: Gmail Test Message' }
      ],
      body: {
        data: 'UmVwbHkgdG8gdGVzdCBtZXNzYWdl' // Base64: "Reply to test message"
      }
    }
  }
];

describe('threadNormalizer', () => {
  describe('validateThreadData', () => {
    test('有効なスレッドデータの場合はtrueを返す', () => {
      expect(validateThreadData(mockEmailThread)).toBe(true);
    });

    test('スレッドデータがnullの場合はエラーを投げる', () => {
      expect(() => validateThreadData(null)).toThrow(ThreadNormalizerError);
      expect(() => validateThreadData(null)).toThrow('Thread data is required');
    });

    test('スレッドデータがオブジェクト以外の場合はエラーを投げる', () => {
      expect(() => validateThreadData('invalid')).toThrow(ThreadNormalizerError);
      expect(() => validateThreadData('invalid')).toThrow('Thread data must be an object');
    });

    test('スレッドIDが無効な場合はエラーを投げる', () => {
      const invalidThread = { ...mockEmailThread, id: null };
      expect(() => validateThreadData(invalidThread)).toThrow(ThreadNormalizerError);
      expect(() => validateThreadData(invalidThread)).toThrow('Thread ID is required and must be a string');
    });

    test('emailsが配列でない場合はエラーを投げる', () => {
      const invalidThread = { ...mockEmailThread, emails: 'not array' };
      expect(() => validateThreadData(invalidThread)).toThrow(ThreadNormalizerError);
      expect(() => validateThreadData(invalidThread)).toThrow('Thread emails must be an array');
    });
  });

  describe('validateGmailMessages', () => {
    test('有効なGmailメッセージ配列の場合はtrueを返す', () => {
      expect(validateGmailMessages(mockGmailMessages)).toBe(true);
    });

    test('配列でない場合はエラーを投げる', () => {
      expect(() => validateGmailMessages('not array')).toThrow(ThreadNormalizerError);
      expect(() => validateGmailMessages('not array')).toThrow('Gmail messages must be an array');
    });

    test('メッセージIDが無効な場合はエラーを投げる', () => {
      const invalidMessages = [{ ...mockGmailMessages[0], id: null }];
      expect(() => validateGmailMessages(invalidMessages)).toThrow(ThreadNormalizerError);
      expect(() => validateGmailMessages(invalidMessages)).toThrow('Message ID is required and must be a string');
    });

    test('internalDateが無効な場合はエラーを投げる', () => {
      const invalidMessages = [{ ...mockGmailMessages[0], internalDate: null }];
      expect(() => validateGmailMessages(invalidMessages)).toThrow(ThreadNormalizerError);
      expect(() => validateGmailMessages(invalidMessages)).toThrow('Message internalDate is required and must be a string');
    });
  });

  describe('validateOptions', () => {
    test('有効なオプションの場合はtrueを返す', () => {
      const validOptions: ThreadNormalizerOptions = {
        convertHtmlToText: true,
        sortMessages: false,
        excludeEmptyMessages: true
      };
      expect(validateOptions(validOptions)).toBe(true);
    });

    test('オプションがnullまたはundefinedの場合はtrueを返す', () => {
      expect(validateOptions(null)).toBe(true);
      expect(validateOptions(undefined)).toBe(true);
    });

    test('無効なオプションキーの場合はエラーを投げる', () => {
      const invalidOptions = { invalidKey: true };
      expect(() => validateOptions(invalidOptions)).toThrow(ThreadNormalizerError);
      expect(() => validateOptions(invalidOptions)).toThrow('Invalid option key: invalidKey');
    });

    test('オプション値がboolean以外の場合はエラーを投げる', () => {
      const invalidOptions = { convertHtmlToText: 'not boolean' };
      expect(() => validateOptions(invalidOptions)).toThrow(ThreadNormalizerError);
      expect(() => validateOptions(invalidOptions)).toThrow('Option convertHtmlToText must be a boolean');
    });
  });

  describe('normalizeGmailThread', () => {
    test('正常なスレッドデータを正規化できる', () => {
      const result = normalizeGmailThread(mockEmailThread);
      
      expect(result.normalizedThread.threadId).toBe('thread_123');
      expect(result.normalizedThread.messages).toHaveLength(2);
      expect(result.processedMessageCount).toBe(2);
      expect(result.errors).toBeUndefined();
    });

    test('メッセージが日付順（昇順）でソートされる', () => {
      const result = normalizeGmailThread(mockEmailThread);
      const messages = result.normalizedThread.messages;
      
      expect(messages).toHaveLength(2);
      expect(new Date(messages[0]!.date).getTime()).toBeLessThan(new Date(messages[1]!.date).getTime());
    });

    test('HTMLがプレーンテキストに変換される', () => {
      const result = normalizeGmailThread(mockEmailThread);
      const firstMessage = result.normalizedThread.messages[0]!;
      
      // HTMLタグが除去されていることを確認
      expect(firstMessage.body).toBe('This is HTML content');
      expect(firstMessage.body).not.toContain('<p>');
      expect(firstMessage.body).not.toContain('<strong>');
    });

    test('メッセージフィールドが正しく抽出される', () => {
      const result = normalizeGmailThread(mockEmailThread);
      const firstMessage = result.normalizedThread.messages[0]!;
      
      expect(firstMessage.messageId).toBe('message_1');
      expect(firstMessage.from).toBe('sender1@example.com');
      expect(firstMessage.to).toEqual(['recipient@example.com']);
      expect(firstMessage.subject).toBe('Test Message 1');
      expect(firstMessage.date).toBe('2024-01-15T10:00:00.000Z');
    });

    test('空のメッセージが除外される', () => {
      const threadWithEmptyMessage: EmailThread = {
        ...mockEmailThread,
        emails: [
          ...mockEmailThread.emails,
          {
            id: 'empty_message',
            threadId: 'thread_123',
            subject: '',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            body: '', // 空の本文
            date: new Date('2024-01-15T12:00:00Z'),
            isRead: false,
            labels: ['INBOX'],
            attachments: []
          }
        ]
      };

      const result = normalizeGmailThread(threadWithEmptyMessage, { excludeEmptyMessages: true });
      expect(result.normalizedThread.messages).toHaveLength(2); // 空のメッセージは除外される
    });

    test('オプションでHTMLからテキストへの変換を無効にできる', () => {
      const result = normalizeGmailThread(mockEmailThread, { convertHtmlToText: false });
      const firstMessage = result.normalizedThread.messages[0]!;
      
      // HTMLタグがそのまま残っていることを確認
      expect(firstMessage.body).toContain('<p>');
      expect(firstMessage.body).toContain('<strong>');
    });

    test('オプションでメッセージソートを無効にできる', () => {
      // 日付順が逆になるようにスレッドデータを準備
      const reversedThread: EmailThread = {
        ...mockEmailThread,
        emails: [...mockEmailThread.emails].reverse()
      };

      const result = normalizeGmailThread(reversedThread, { sortMessages: false });
      const messages = result.normalizedThread.messages;
      
      // ソートが無効化されているので元の順序が保持される
      expect(messages).toHaveLength(2);
      expect(new Date(messages[0]!.date).getTime()).toBeGreaterThan(new Date(messages[1]!.date).getTime());
    });

    test('無効なスレッドデータの場合はエラーが含まれる', () => {
      const invalidThread = { id: null, emails: [] };
      const result = normalizeGmailThread(invalidThread as any);
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(error => error.includes('Validation error'))).toBe(true);
      expect(result.normalizedThread.messages).toHaveLength(0);
    });
  });

  describe('normalizeGmailMessages', () => {
    test('正常なGmailメッセージを正規化できる', () => {
      const result = normalizeGmailMessages(mockGmailMessages, 'thread_456');
      
      expect(result.normalizedThread.threadId).toBe('thread_456');
      expect(result.normalizedThread.messages).toHaveLength(2);
      expect(result.processedMessageCount).toBe(2);
      expect(result.errors).toBeUndefined();
    });

    test('Base64エンコードされた本文がデコードされる', () => {
      const result = normalizeGmailMessages(mockGmailMessages, 'thread_456');
      const firstMessage = result.normalizedThread.messages[0]!;
      
      expect(firstMessage.body).toBe('This is a test message');
    });

    test('ヘッダーからメタデータが正しく抽出される', () => {
      const result = normalizeGmailMessages(mockGmailMessages, 'thread_456');
      const firstMessage = result.normalizedThread.messages[0]!;
      
      expect(firstMessage.messageId).toBe('gmail_message_1');
      expect(firstMessage.from).toBe('sender2@example.com');
      expect(firstMessage.to).toEqual(['recipient2@example.com']);
      expect(firstMessage.subject).toBe('Gmail Test Message');
    });

    test('複数の宛先が正しく解析される', () => {
      const result = normalizeGmailMessages(mockGmailMessages, 'thread_456');
      const secondMessage = result.normalizedThread.messages[1]!;
      
      expect(secondMessage.to).toEqual(['sender2@example.com', 'cc@example.com']);
    });

    test('internalDateがISO形式に変換される', () => {
      const result = normalizeGmailMessages(mockGmailMessages, 'thread_456');
      const firstMessage = result.normalizedThread.messages[0]!;
      
      expect(firstMessage.date).toBe('2024-01-15T10:00:00.000Z');
    });

    test('threadIdが必須である', () => {
      const result = normalizeGmailMessages(mockGmailMessages, '');
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(error => error.includes('Thread ID is required'))).toBe(true);
    });

    test('無効なinternalDateの場合はエラーが記録される', () => {
      const invalidMessages: GmailMessage[] = [
        { ...mockGmailMessages[0], internalDate: 'invalid_date' } as GmailMessage
      ];
      
      const result = normalizeGmailMessages(invalidMessages, 'thread_456');
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(error => error.includes('Invalid internalDate format'))).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('予期しないエラーが適切に処理される', () => {
      // 意図的に無効なデータを渡してエラーをトリガー
      const malformedThread = {
        id: 'valid_id',
        subject: 'Test Subject',
        emails: [
          {
            id: null, // 無効なメッセージID
            threadId: 'valid_id',
            subject: 'Test Subject',
            from: 'test@example.com',
            to: 'recipient@example.com',
            body: 'Test body',
            date: new Date('2024-01-15T10:00:00Z'),
            isRead: false,
            labels: []
          }
        ],
        lastMessageDate: new Date(),
        messageCount: 1,
        participants: []
      };

      const result = normalizeGmailThread(malformedThread as any);
      
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.processedMessageCount).toBe(0);
      expect(result.normalizedThread.messages).toHaveLength(0);
    });

    test('部分的な成功時にエラーと成功が混在する', () => {
      const mixedThread: EmailThread = {
        ...mockEmailThread,
        emails: [
          mockEmailThread.emails[0]!, // 正常なメッセージ
          {
            id: null as any, // 無効なメッセージ
            threadId: 'thread_123',
            subject: 'Invalid Message',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            body: 'This message has invalid ID',
            date: new Date('2024-01-15T12:00:00Z'),
            isRead: false,
            labels: ['INBOX'],
            attachments: []
          }
        ]
      };

      const result = normalizeGmailThread(mixedThread);
      
      expect(result.processedMessageCount).toBe(1); // 1つのメッセージが処理成功
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.normalizedThread.messages).toHaveLength(1);
    });
  });

  describe('ThreadNormalizerError', () => {
    test('カスタムエラーが正しくコードと詳細を含む', () => {
      const error = new ThreadNormalizerError('Test error', 'TEST_CODE', { detail: 'test detail' });
      
      expect(error.name).toBe('ThreadNormalizerError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'test detail' });
    });
  });
}); 