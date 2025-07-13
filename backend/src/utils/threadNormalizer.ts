/**
 * Gmail Thread Normalizer
 * Gmail APIから返されるスレッドデータを、LLMに渡しやすいJSON形式に正規化するユーティリティ
 */

import stophtml from 'stophtml';
import { format } from 'date-fns';
import { 
  GmailMessage,
  EmailThread,
  NormalizedThread,
  NormalizedThreadMessage,
  ThreadNormalizerOptions,
  ThreadNormalizerResult 
} from '../types/gmail';

/**
 * デフォルトオプション
 */
const DEFAULT_OPTIONS: Required<ThreadNormalizerOptions> = {
  convertHtmlToText: true,
  sortMessages: true,
  excludeEmptyMessages: true
};

/**
 * カスタムエラークラス
 */
export class ThreadNormalizerError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: any) {
    super(message);
    this.name = 'ThreadNormalizerError';
  }
}

/**
 * 入力データバリデーション関数
 */
export function validateThreadData(threadData: any): threadData is EmailThread {
  if (!threadData) {
    throw new ThreadNormalizerError('Thread data is required', 'MISSING_THREAD_DATA');
  }

  if (typeof threadData !== 'object') {
    throw new ThreadNormalizerError('Thread data must be an object', 'INVALID_THREAD_DATA_TYPE');
  }

  if (!threadData.id || typeof threadData.id !== 'string') {
    throw new ThreadNormalizerError('Thread ID is required and must be a string', 'INVALID_THREAD_ID');
  }

  if (!Array.isArray(threadData.emails)) {
    throw new ThreadNormalizerError('Thread emails must be an array', 'INVALID_EMAILS_ARRAY');
  }

  return true;
}

/**
 * Gmail メッセージデータバリデーション関数
 */
export function validateGmailMessages(gmailMessages: any): gmailMessages is GmailMessage[] {
  if (!Array.isArray(gmailMessages)) {
    throw new ThreadNormalizerError('Gmail messages must be an array', 'INVALID_MESSAGES_ARRAY');
  }

  for (const message of gmailMessages) {
    if (!message || typeof message !== 'object') {
      throw new ThreadNormalizerError('Each message must be an object', 'INVALID_MESSAGE_OBJECT');
    }

    if (!message.id || typeof message.id !== 'string') {
      throw new ThreadNormalizerError('Message ID is required and must be a string', 'INVALID_MESSAGE_ID');
    }

    if (!message.threadId || typeof message.threadId !== 'string') {
      throw new ThreadNormalizerError('Message threadId is required and must be a string', 'INVALID_MESSAGE_THREAD_ID');
    }

    if (!message.internalDate || typeof message.internalDate !== 'string') {
      throw new ThreadNormalizerError('Message internalDate is required and must be a string', 'INVALID_INTERNAL_DATE');
    }
  }

  return true;
}

/**
 * オプションバリデーション関数
 */
export function validateOptions(options: any): options is ThreadNormalizerOptions {
  if (options === null || options === undefined) {
    return true; // オプションは省略可能
  }

  if (typeof options !== 'object') {
    throw new ThreadNormalizerError('Options must be an object', 'INVALID_OPTIONS_TYPE');
  }

  const validOptionKeys = ['convertHtmlToText', 'sortMessages', 'excludeEmptyMessages'];
  const providedKeys = Object.keys(options);
  
  for (const key of providedKeys) {
    if (!validOptionKeys.includes(key)) {
      throw new ThreadNormalizerError(`Invalid option key: ${key}`, 'INVALID_OPTION_KEY', { validKeys: validOptionKeys });
    }

    if (typeof options[key] !== 'boolean') {
      throw new ThreadNormalizerError(`Option ${key} must be a boolean`, 'INVALID_OPTION_VALUE', { key, value: options[key] });
    }
  }

  return true;
}

/**
 * Gmail APIのスレッドデータを正規化してLLM向けJSON形式に変換
 * @param threadData Gmail APIから取得したスレッドデータ（EmailThread形式）
 * @param options 正規化オプション
 * @returns 正規化されたスレッドデータ
 */
export function normalizeGmailThread(
  threadData: EmailThread,
  options: ThreadNormalizerOptions = {}
): ThreadNormalizerResult {
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // 入力データのバリデーション
    validateThreadData(threadData);
    validateOptions(options);

    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // スレッドIDの取得
    const threadId = threadData.id;

    // メッセージの処理
    const messages: NormalizedThreadMessage[] = [];
    
    for (const email of threadData.emails) {
      try {
        // 個別メッセージのバリデーション
        if (!email || typeof email !== 'object') {
          errors.push(`Invalid email object at index ${messages.length}`);
          continue;
        }

        if (!email.id || typeof email.id !== 'string') {
          errors.push(`Email missing valid ID at index ${messages.length}`);
          continue;
        }

        const normalizedMessage = normalizeMessage(email, opts);
        
        // 空のメッセージを除外するかチェック
        if (opts.excludeEmptyMessages && isEmptyMessage(normalizedMessage)) {
          continue;
        }
        
        messages.push(normalizedMessage);
        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process message ${email?.id || 'unknown'}: ${errorMessage}`);
      }
    }

    // メッセージのソート（internalDate昇順）
    if (opts.sortMessages) {
      messages.sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch (error) {
          errors.push(`Failed to sort messages: ${error}`);
          return 0;
        }
      });
    }

    const normalizedThread: NormalizedThread = {
      threadId,
      messages
    };

    const result: ThreadNormalizerResult = {
      normalizedThread,
      processedMessageCount: processedCount
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;

  } catch (error) {
    if (error instanceof ThreadNormalizerError) {
      errors.push(`Validation error: ${error.message} (${error.code})`);
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to normalize thread: ${errorMessage}`);
    }
    
    return {
      normalizedThread: {
        threadId: threadData?.id || 'unknown',
        messages: []
      },
      processedMessageCount: processedCount,
      errors
    };
  }
}

/**
 * Gmail APIのメッセージデータを正規化してLLM向けJSON形式に変換
 * @param gmailMessages Gmail APIから取得したメッセージ配列
 * @param threadId スレッドID
 * @param options 正規化オプション
 * @returns 正規化されたスレッドデータ
 */
export function normalizeGmailMessages(
  gmailMessages: GmailMessage[],
  threadId: string,
  options: ThreadNormalizerOptions = {}
): ThreadNormalizerResult {
  const errors: string[] = [];
  let processedCount = 0;

  try {
    // 入力データのバリデーション
    if (!threadId || typeof threadId !== 'string') {
      throw new ThreadNormalizerError('Thread ID is required and must be a string', 'INVALID_THREAD_ID');
    }

    validateGmailMessages(gmailMessages);
    validateOptions(options);

    const opts = { ...DEFAULT_OPTIONS, ...options };

    // メッセージの処理
    const messages: NormalizedThreadMessage[] = [];
    
    for (const gmailMessage of gmailMessages) {
      try {
        const normalizedMessage = normalizeGmailMessage(gmailMessage, opts);
        
        // 空のメッセージを除外するかチェック
        if (opts.excludeEmptyMessages && isEmptyMessage(normalizedMessage)) {
          continue;
        }
        
        messages.push(normalizedMessage);
        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process message ${gmailMessage.id}: ${errorMessage}`);
      }
    }

    // メッセージのソート（internalDate昇順）
    if (opts.sortMessages) {
      messages.sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch (error) {
          errors.push(`Failed to sort messages: ${error}`);
          return 0;
        }
      });
    }

    const normalizedThread: NormalizedThread = {
      threadId,
      messages
    };

    const result: ThreadNormalizerResult = {
      normalizedThread,
      processedMessageCount: processedCount
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;

  } catch (error) {
    if (error instanceof ThreadNormalizerError) {
      errors.push(`Validation error: ${error.message} (${error.code})`);
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to normalize messages: ${errorMessage}`);
    }
    
    return {
      normalizedThread: {
        threadId,
        messages: []
      },
      processedMessageCount: processedCount,
      errors
    };
  }
}

/**
 * 単一メッセージの正規化（EmailThread形式から）
 */
function normalizeMessage(
  email: EmailThread['emails'][0],
  options: Required<ThreadNormalizerOptions>
): NormalizedThreadMessage {
  try {
    // 日付の正規化（ISO8601形式）
    const date = formatDateToISO(email.date);
    
    // 送信者の抽出
    const from = email.from || '';
    
    // 宛先の抽出（文字列から配列に変換）
    const to = parseEmailAddresses(email.to || '');
    
    // 件名の抽出
    const subject = email.subject || '';
    
    // 本文の処理（HTMLからプレーンテキストへの変換）
    let body = email.body || '';
    if (options.convertHtmlToText && body) {
      body = convertHtmlToPlainText(body);
    }
    
    return {
      messageId: email.id,
      date,
      from,
      to,
      subject,
      body: body.trim()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ThreadNormalizerError(`Failed to normalize message: ${errorMessage}`, 'MESSAGE_NORMALIZATION_ERROR', { messageId: email?.id });
  }
}

/**
 * 単一メッセージの正規化（GmailMessage形式から）
 */
function normalizeGmailMessage(
  gmailMessage: GmailMessage,
  options: Required<ThreadNormalizerOptions>
): NormalizedThreadMessage {
  try {
    // 日付の正規化（UNIX ミリ秒からISO8601形式）
    const internalDate = parseInt(gmailMessage.internalDate);
    if (isNaN(internalDate)) {
      throw new ThreadNormalizerError('Invalid internalDate format', 'INVALID_INTERNAL_DATE', { internalDate: gmailMessage.internalDate });
    }
    
    const date = formatDateToISO(new Date(internalDate));
    
    // ヘッダーから情報を抽出
    const headers = gmailMessage.payload?.headers || [];
    const getHeader = (name: string): string => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };
    
    // 送信者・宛先・件名の抽出
    const from = getHeader('From');
    const toHeader = getHeader('To');
    const to = parseEmailAddresses(toHeader);
    const subject = getHeader('Subject');
    
    // 本文の抽出
    let body = extractMessageBody(gmailMessage.payload);
    
    // HTMLからプレーンテキストへの変換
    if (options.convertHtmlToText && body) {
      body = convertHtmlToPlainText(body);
    }
    
    return {
      messageId: gmailMessage.id,
      date,
      from,
      to,
      subject,
      body: body.trim()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ThreadNormalizerError(`Failed to normalize Gmail message: ${errorMessage}`, 'GMAIL_MESSAGE_NORMALIZATION_ERROR', { messageId: gmailMessage?.id });
  }
}

/**
 * Gmail APIのpayloadから本文を抽出
 */
function extractMessageBody(payload: GmailMessage['payload']): string {
  if (!payload) return '';
  
  try {
    // シンプルなメッセージの場合
    if (payload.body?.data) {
      return decodeBase64(payload.body.data);
    }
    
    // マルチパートメッセージの場合
    if (payload.parts) {
      // text/plain を優先的に探す
      const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        return decodeBase64(textPart.body.data);
      }
      
      // text/html を次に探す
      const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        return decodeBase64(htmlPart.body.data);
      }
      
      // その他のテキスト系パートを探す
      for (const part of payload.parts) {
        if (part.mimeType?.startsWith('text/') && part.body?.data) {
          return decodeBase64(part.body.data);
        }
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to extract message body:', error);
    return '';
  }
}

/**
 * Base64デコード（URLセーフ）
 */
function decodeBase64(data: string): string {
  try {
    if (!data || typeof data !== 'string') {
      return '';
    }

    // URLセーフBase64をノーマルBase64に変換
    const normalBase64 = data.replace(/-/g, '+').replace(/_/g, '/');
    
    // パディングを追加
    const padded = normalBase64 + '='.repeat((4 - normalBase64.length % 4) % 4);
    
    return Buffer.from(padded, 'base64').toString('utf-8');
  } catch (error) {
    console.warn('Failed to decode base64 data:', error);
    return '';
  }
}

/**
 * HTMLをプレーンテキストに変換
 */
function convertHtmlToPlainText(html: string): string {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // stophtmlを使用してHTMLタグを除去
    const textSegments = stophtml(html);
    return textSegments.join(' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.warn('Failed to convert HTML to plain text:', error);
    return html; // 変換に失敗した場合は元のHTMLを返す
  }
}

/**
 * メールアドレス文字列を配列に分割
 */
function parseEmailAddresses(addressString: string): string[] {
  try {
    if (!addressString || typeof addressString !== 'string') {
      return [];
    }
    
    // カンマまたはセミコロンで分割
    return addressString
      .split(/[,;]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
  } catch (error) {
    console.warn('Failed to parse email addresses:', error);
    return [];
  }
}

/**
 * 日付をISO8601形式の文字列に変換
 */
function formatDateToISO(date: Date): string {
  try {
    if (!date || !(date instanceof Date)) {
      throw new Error('Invalid date object');
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }

    return date.toISOString();
  } catch (error) {
    console.warn('Failed to format date to ISO:', error);
    return new Date().toISOString(); // フォールバック
  }
}

/**
 * 空のメッセージかどうかをチェック
 */
function isEmptyMessage(message: NormalizedThreadMessage): boolean {
  try {
    return !message.body || message.body.trim().length === 0;
  } catch (error) {
    console.warn('Failed to check if message is empty:', error);
    return true; // エラーの場合は空として扱う
  }
} 