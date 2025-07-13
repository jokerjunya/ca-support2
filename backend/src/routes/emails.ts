import { Router } from 'express';
import { AuthUser } from '../types/auth';
import { EmailSendRequest } from '../types/gmail';
import { createGmailService } from '../services/gmail';
import { createLLMService } from '../services/llm';

const router = Router();

// 開発環境用の認証チェック（モックデータアクセス用）
const requireAuth = (req: any, res: any, next: any) => {
  // 開発環境ではモックデータアクセスを許可
  if (process.env.NODE_ENV === 'development' && !req.isAuthenticated()) {
    console.log('🔧 開発モード: 認証なしでモックデータアクセスを許可');
    req.user = null; // モックユーザー
    return next();
  }
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      error: '認証が必要です' 
    });
  }
  next();
};

// メール一覧取得（高度な検索対応）
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const maxResults = parseInt(req.query.maxResults as string) || 10;
    
    // 高度な検索フィルター
    const searchFilters = {
      query: req.query.query as string,
      sender: req.query.sender as string,
      subject: req.query.subject as string,
      hasAttachment: req.query.hasAttachment === 'true',
      dateStart: req.query.dateStart as string,
      dateEnd: req.query.dateEnd as string,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      isImportant: req.query.isImportant ? req.query.isImportant === 'true' : undefined,
    };

    console.log('🔍 高度な検索リクエスト:', searchFilters);
    
    const emails = await gmailService.searchEmails(maxResults, searchFilters);
    
    return res.json({
      success: true,
      data: emails,
      count: emails.length,
      filters: searchFilters
    });
  } catch (error) {
    console.error('メール検索エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'メール検索に失敗しました'
    });
  }
});

// 未読メール取得
router.get('/unread', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const emails = await gmailService.getUnreadEmails();
    
    return res.json({
      success: true,
      data: emails,
      count: emails.length
    });
  } catch (error) {
    console.error('未読メール取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: '未読メール取得に失敗しました'
    });
  }
});

// 特定のメールを取得
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const email = await gmailService.getEmailById(id);
    
    if (!email) {
      return res.status(404).json({ error: 'メールが見つかりません' });
    }

    // 🔥 新機能: メール詳細表示時に自動的に既読状態にする
    if (!email.read) {
      console.log(`📖 メール ${id} を自動的に既読にします`);
      await gmailService.markAsRead(id);
      // 既読状態を更新
      email.read = true;
      email.labels = email.labels.filter(label => label !== 'UNREAD');
    }

    return res.json(email);
  } catch (error) {
    console.error('メール取得エラー:', error);
    return res.status(500).json({ error: 'メールの取得に失敗しました' });
  }
});

// メールを既読にする
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const success = await gmailService.markAsRead(id);
    
    if (!success) {
      return res.status(404).json({ error: 'メールが見つかりません' });
    }

    return res.json({ success: true, message: 'メールを既読にしました' });
  } catch (error) {
    console.error('既読処理エラー:', error);
    return res.status(500).json({ error: '既読処理に失敗しました' });
  }
});

// 🗑️ メール削除（ゴミ箱へ移動）
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const success = await gmailService.deleteEmail(id);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'メールが見つかりません' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'メールをゴミ箱に移動しました' 
    });
  } catch (error) {
    console.error('メール削除エラー:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'メール削除に失敗しました' 
    });
  }
});

// 📦 メールアーカイブ
router.patch('/:id/archive', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const success = await gmailService.archiveEmail(id);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'メールが見つかりません' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'メールをアーカイブしました' 
    });
  } catch (error) {
    console.error('メールアーカイブエラー:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'メールアーカイブに失敗しました' 
    });
  }
});

// メール送信
router.post('/send', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    const emailData: EmailSendRequest = req.body;
    
    // 📧 デバッグ: リクエストボディの詳細ログ
    console.log('📧 メール送信リクエスト受信:');
    console.log(`📧 to: "${emailData.to}"`);
    console.log(`📧 subject: "${emailData.subject}"`);
    console.log(`📧 body length: ${emailData.body ? emailData.body.length : 'undefined'}`);
    console.log(`📧 body content: "${emailData.body}"`);
    console.log(`📧 cc: "${emailData.cc || 'なし'}"`);
    console.log(`📧 bcc: "${emailData.bcc || 'なし'}"`);
    console.log(`📧 threadId: "${emailData.threadId || 'なし'}"`);
    console.log(`📧 raw request body:`, JSON.stringify(req.body, null, 2));
    
    // バリデーション
    if (!emailData.to || !emailData.subject || !emailData.body) {
      console.error('📧 バリデーションエラー:', {
        to: !!emailData.to,
        subject: !!emailData.subject,
        body: !!emailData.body
      });
      return res.status(400).json({
        success: false,
        error: '必須フィールドが不足しています (to, subject, body)'
      });
    }
    
    const result = await gmailService.sendEmail(emailData);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'メール送信に失敗しました'
      });
    }
    
    return res.json({
      success: true,
      data: result,
      message: 'メールを送信しました'
    });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'メール送信に失敗しました'
    });
  }
});

// AI返信生成
router.post('/generate-reply', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const { messageId, replyType = 'business', customInstructions, language = 'ja' } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ error: 'メッセージIDが必要です' });
    }

    // 元メールを取得
    const gmailService = createGmailService(user);
    const originalEmail = await gmailService.getEmailById(messageId);
    
    if (!originalEmail) {
      return res.status(404).json({ error: 'メールが見つかりません' });
    }

    // 🚀 新機能: 実際のLLMサービスを使用して返信を生成
    console.log(`🤖 AI返信生成リクエスト開始 - メッセージID: ${messageId}, 語調: ${replyType}`);
    
    const llmService = createLLMService();
    
    // LLMで返信を生成（内部で接続テストを実行）
    const generateReplyResponse = await llmService.generateReply({
      originalEmail,
      replyType,
      customInstructions,
      language
    });

    console.log(`✅ AI返信生成完了 - 処理時間: ${generateReplyResponse.processing_time}ms, 信頼度: ${generateReplyResponse.confidence}`);

    return res.json({
      reply: generateReplyResponse.reply,
      tone: generateReplyResponse.tone,
      confidence: generateReplyResponse.confidence,
      processing_time: generateReplyResponse.processing_time,
      source: generateReplyResponse.processing_time > 0 ? 'llm' : 'fallback'
    });

  } catch (error) {
    console.error('AI返信生成エラー:', error);
    return res.status(500).json({ error: 'AI返信生成に失敗しました' });
  }
});

// 🧵 新機能: スレッドコンテキストを考慮したAI返信生成
router.post('/threads/:threadId/generate-reply', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user as AuthUser;
    const { replyType = 'business', customInstructions, language = 'ja' } = req.body;
    
    if (!threadId) {
      return res.status(400).json({ error: 'スレッドIDが必要です' });
    }

    console.log(`🧵 スレッドコンテキスト返信生成開始 - ThreadID: ${threadId}, 語調: ${replyType}`);

    // スレッド全体を取得して正規化
    const gmailService = createGmailService(user);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId, {
      convertHtmlToText: true,
      sortMessages: true,
      excludeEmptyMessages: true
    });
    
    if (!normalizedThreadResult || normalizedThreadResult.normalizedThread.messages.length === 0) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // 最新メッセージを取得（返信対象）
    const latestMessage = normalizedThread.messages[normalizedThread.messages.length - 1];
    
    if (!latestMessage) {
      return res.status(400).json({ error: 'スレッドに有効なメッセージがありません' });
    }

    // LLMで返信を生成（スレッドコンテキスト付き）
    const llmService = createLLMService();
    const generateReplyResponse = await llmService.generateThreadReply({
      normalizedThread,
      replyType,
      customInstructions,
      language
    });

    console.log(`✅ スレッドコンテキスト返信生成完了 - 処理時間: ${generateReplyResponse.processing_time}ms, 信頼度: ${generateReplyResponse.confidence}`);

    return res.json({
      reply: generateReplyResponse.reply,
      tone: generateReplyResponse.tone,
      confidence: generateReplyResponse.confidence,
      processing_time: generateReplyResponse.processing_time,
      source: generateReplyResponse.processing_time > 0 ? 'llm' : 'fallback',
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount,
        errors: normalizedThreadResult.errors
      }
    });

  } catch (error) {
    console.error('スレッドコンテキスト返信生成エラー:', error);
    return res.status(500).json({ error: 'スレッドコンテキスト返信生成に失敗しました' });
  }
});

// 🎯 新機能: 複数返信候補生成（Superhuman AI / Gmail Smart Reply 方式）
router.post('/threads/:threadId/generate-multiple-replies', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { 
      replyTypes = ['business', 'casual', 'polite'], 
      replyLengths = ['brief', 'medium', 'detailed'],
      candidateCount = 3,
      customInstructions, 
      language = 'ja' 
    } = req.body;
    
    if (!threadId) {
      return res.status(400).json({ error: 'スレッドIDが必要です' });
    }

    console.log(`🎯 複数返信候補生成開始 - ThreadID: ${threadId}, 候補数: ${candidateCount}`);

    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId, {
      convertHtmlToText: true,
      sortMessages: true,
      excludeEmptyMessages: true
    });
    
    if (!normalizedThreadResult || normalizedThreadResult.normalizedThread.messages.length === 0) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // LLMで複数返信候補を生成
    const llmService = createLLMService();
    const generateMultipleRepliesResponse = await llmService.generateMultipleReplies({
      normalizedThread,
      replyTypes,
      replyLengths,
      candidateCount,
      customInstructions,
      language
    });

    console.log(`✅ 複数返信候補生成完了 - 処理時間: ${generateMultipleRepliesResponse.processing_time}ms, 候補数: ${generateMultipleRepliesResponse.candidates.length}`);

    return res.json({
      candidates: generateMultipleRepliesResponse.candidates,
      processing_time: generateMultipleRepliesResponse.processing_time,
      source: generateMultipleRepliesResponse.source,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount,
        errors: normalizedThreadResult.errors
      }
    });

  } catch (error) {
    console.error('複数返信候補生成エラー:', error);
    return res.status(500).json({ error: '複数返信候補生成に失敗しました' });
  }
});

// 会話要約生成
router.post('/threads/:threadId/summarize', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { maxSummaryLength, language } = req.body;
    
    console.log(`📝 会話要約生成開始 - ThreadID: ${threadId}, 長さ: ${maxSummaryLength || 'medium'}`);
    
    // threadIdの妥当性確認
    if (!threadId || threadId.trim() === '') {
      return res.status(400).json({ error: '無効なスレッドIDです' });
    }

    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId);
    
    if (!normalizedThreadResult || !normalizedThreadResult.normalizedThread) {
      console.warn(`⚠️ スレッドが見つかりません - ThreadID: ${threadId}`);
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // 会話要約を生成
    const summarizeRequest = {
      normalizedThread,
      maxSummaryLength: maxSummaryLength || 'medium',
      language: language || 'ja'
    };
    
    const llmService = createLLMService();
    const response = await llmService.summarizeConversation(summarizeRequest);
    
    console.log(`✅ 会話要約生成完了 - 処理時間: ${response.processing_time}ms`);
    
    return res.json({
      ...response,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount
      }
    });
  } catch (error) {
    console.error('会話要約生成エラー:', error);
    return res.status(500).json({ error: '会話要約生成に失敗しました' });
  }
});

// 要約を活用した返信生成
router.post('/threads/:threadId/generate-reply-with-summary', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { conversationSummary, replyType, customInstructions, language } = req.body;
    
    console.log(`🤖 要約付き返信生成開始 - ThreadID: ${threadId}, 語調: ${replyType}`);
    
    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId);
    
    if (!normalizedThreadResult || !normalizedThreadResult.normalizedThread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // 要約を活用した返信を生成
    const generateRequest = {
      normalizedThread,
      conversationSummary: conversationSummary || {
        overview: '',
        keyPoints: [],
        decisions: [],
        actionItems: [],
        questions: [],
        deadlines: [],
        participants: []
      },
      replyType: replyType || 'business',
      customInstructions,
      language: language || 'ja'
    };
    
    const llmService = createLLMService();
    const response = await llmService.generateReplyWithSummary(generateRequest);
    
    console.log(`✅ 要約付き返信生成完了 - 処理時間: ${response.processing_time}ms`);
    
    return res.json({
      ...response,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount
      }
    });
  } catch (error) {
    console.error('要約付き返信生成エラー:', error);
    return res.status(500).json({ error: '要約付き返信生成に失敗しました' });
  }
});

// クイック返信提案生成（Gmail Smart Reply方式）
router.post('/threads/:threadId/smart-reply-suggestions', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { suggestionCount, language } = req.body;
    
    console.log(`⚡ クイック返信提案生成開始 - ThreadID: ${threadId}, 提案数: ${suggestionCount || 3}`);
    
    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId);
    
    if (!normalizedThreadResult || !normalizedThreadResult.normalizedThread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // クイック返信提案を生成
    const suggestionsRequest = {
      normalizedThread,
      suggestionCount: suggestionCount || 3,
      language: language || 'ja'
    };
    
    const llmService = createLLMService();
    const response = await llmService.generateSmartReplySuggestions(suggestionsRequest);
    
    console.log(`✅ クイック返信提案生成完了 - 処理時間: ${response.processing_time}ms`);
    
    return res.json({
      ...response,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount
      }
    });
  } catch (error) {
    console.error('クイック返信提案生成エラー:', error);
    return res.status(500).json({ error: 'クイック返信提案生成に失敗しました' });
  }
});

// 文脈依存語調分析
router.post('/threads/:threadId/analyze-tone', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { language } = req.body;
    
    console.log(`🎭 文脈依存語調分析開始 - ThreadID: ${threadId}`);
    
    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId);
    
    if (!normalizedThreadResult || !normalizedThreadResult.normalizedThread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // 文脈依存語調分析を実行
    const analysisRequest = {
      normalizedThread,
      language: language || 'ja'
    };
    
    const llmService = createLLMService();
    const response = await llmService.analyzeContextAwareTone(analysisRequest);
    
    console.log(`✅ 文脈依存語調分析完了 - 処理時間: ${response.processing_time}ms`);
    
    return res.json({
      ...response,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount
      }
    });
  } catch (error) {
    console.error('文脈依存語調分析エラー:', error);
    return res.status(500).json({ error: '文脈依存語調分析に失敗しました' });
  }
});

// 文脈依存語調に基づく返信生成
router.post('/threads/:threadId/generate-context-aware-reply', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { toneAnalysis, customInstructions, language } = req.body;
    
    console.log(`🎭 文脈依存語調返信生成開始 - ThreadID: ${threadId}`);
    
    // スレッド全体を取得して正規化
    const gmailService = createGmailService(req.user as AuthUser);
    const normalizedThreadResult = await gmailService.getNormalizedThread(threadId);
    
    if (!normalizedThreadResult || !normalizedThreadResult.normalizedThread) {
      return res.status(404).json({ error: 'スレッドが見つかりません' });
    }

    const normalizedThread = normalizedThreadResult.normalizedThread;
    console.log(`📧 スレッド正規化完了 - ${normalizedThread.messages.length}件のメッセージを処理`);

    // 文脈依存語調に基づく返信を生成
    const generateRequest = {
      normalizedThread,
      toneAnalysis: toneAnalysis || {
        formality: 'neutral',
        tone: 'business',
        keyPhrases: [],
        recommendedTone: 'business',
        consistency: 0.7
      },
      customInstructions,
      language: language || 'ja'
    };
    
    const llmService = createLLMService();
    const response = await llmService.generateContextAwareToneReply(generateRequest);
    
    console.log(`✅ 文脈依存語調返信生成完了 - 処理時間: ${response.processing_time}ms`);
    
    return res.json({
      ...response,
      thread_context: {
        threadId,
        messageCount: normalizedThread.messages.length,
        processedMessages: normalizedThreadResult.processedMessageCount
      }
    });
  } catch (error) {
    console.error('文脈依存語調返信生成エラー:', error);
    return res.status(500).json({ error: '文脈依存語調返信生成に失敗しました' });
  }
});

// 🧵 新機能: スレッド一覧取得
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const threads = await gmailService.getThreads(maxResults);
    
    return res.json({
      success: true,
      data: threads,
      count: threads.length
    });
  } catch (error) {
    console.error('スレッド取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'スレッド取得に失敗しました'
    });
  }
});

// 🧵 新機能: 特定のスレッドを取得
router.get('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const thread = await gmailService.getThreadById(threadId);
    
    if (!thread) {
      return res.status(404).json({ 
        success: false, 
        error: 'スレッドが見つかりません' 
      });
    }

    return res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('スレッド取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'スレッド取得に失敗しました'
    });
  }
});

// 📎 新機能: 添付ファイルダウンロード
router.get('/:messageId/attachments/:attachmentId', requireAuth, async (req, res) => {
  try {
    const { messageId, attachmentId } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const attachmentData = await gmailService.getAttachment(messageId, attachmentId);
    
    if (!attachmentData) {
      return res.status(404).json({ 
        success: false, 
        error: '添付ファイルが見つかりません' 
      });
    }

    // Base64デコードしてファイルデータを返す
    if (!attachmentData.data) {
      return res.status(500).json({ 
        success: false, 
        error: '添付ファイルデータが空です' 
      });
    }
    
    const fileBuffer = Buffer.from(attachmentData.data, 'base64');
    
    res.setHeader('Content-Type', attachmentData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentData.filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    return res.send(fileBuffer);
  } catch (error) {
    console.error('添付ファイル取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: '添付ファイル取得に失敗しました'
    });
  }
});

// 🧵 新機能: スレッドのメール一覧取得
router.get('/threads/:threadId/emails', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const emails = await gmailService.getEmailsByThread(threadId);
    
    return res.json({
      success: true,
      data: emails,
      count: emails.length
    });
  } catch (error) {
    console.error('スレッドメール取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'スレッドメール取得に失敗しました'
    });
  }
});

// 🔧 新機能: Gmail API接続状況確認
router.get('/api-status', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    const status = gmailService.getApiStatus();
    
    return res.json({
      success: true,
      data: {
        ...status,
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          GMAIL_API_ENABLED: process.env.GMAIL_API_ENABLED || 'false',
          HAS_GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
          HAS_GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
          USER_AUTHENTICATED: !!user,
          USER_HAS_ACCESS_TOKEN: !!(user && user.accessToken)
        }
      }
    });
  } catch (error) {
    console.error('API状況確認エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'API状況確認に失敗しました'
    });
  }
});

// 🧪 新機能: Gmail API接続テスト
router.get('/test-gmail-connection', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    // 基本情報取得テスト
    const profile = await gmailService.getProfile();
    
    return res.json({
      success: true,
      message: 'Gmail API接続テスト成功',
      data: {
        emailAddress: profile.emailAddress,
        totalMessages: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId
      }
    });
  } catch (error) {
    console.error('Gmail API接続テストエラー:', error);
    return res.status(500).json({
      success: false,
      error: 'Gmail API接続テストに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 統計情報取得
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const allEmails = await gmailService.getEmails(50);
    const unreadEmails = await gmailService.getUnreadEmails();
    
    const stats = {
      totalEmails: allEmails.length,
      unreadEmails: unreadEmails.length,
      readEmails: allEmails.length - unreadEmails.length,
      todayEmails: allEmails.filter(email => {
        const today = new Date();
        const emailDate = new Date(email.date);
        return emailDate.toDateString() === today.toDateString();
      }).length
    };
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('統計取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: '統計取得に失敗しました'
    });
  }
});

// ===========================================
// 🔥 NEW: スレッド正規化エンドポイント
// ===========================================

/**
 * LLM向けに正規化されたスレッドを取得
 * GET /api/emails/threads/:threadId/normalized
 */
router.get('/threads/:threadId/normalized', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    console.log(`🔧 正規化スレッド取得リクエスト - ThreadID: ${threadId}`);
    
    // クエリパラメータからオプションを取得
    const options = {
      convertHtmlToText: req.query.convertHtml !== 'false', // デフォルト: true
      sortMessages: req.query.sortMessages !== 'false',     // デフォルト: true
      excludeEmptyMessages: req.query.excludeEmpty !== 'false' // デフォルト: true
    };
    
    console.log(`🔧 正規化オプション:`, options);
    
    const result = await gmailService.getNormalizedThread(threadId, options);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'スレッドが見つかりません'
      });
    }
    
    return res.json({
      success: true,
      data: result.normalizedThread,
      meta: {
        processedMessageCount: result.processedMessageCount,
        errors: result.errors,
        threadId: threadId,
        options: options
      }
    });
  } catch (error) {
    console.error('正規化スレッド取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: '正規化スレッドの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * LLM向けに正規化されたスレッドを取得（POST版・詳細オプション指定可能）
 * POST /api/emails/threads/:threadId/normalized
 */
router.post('/threads/:threadId/normalized', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    console.log(`🔧 正規化スレッド取得リクエスト（POST）- ThreadID: ${threadId}`);
    
    // リクエストボディからオプションを取得
    const options = {
      convertHtmlToText: req.body.convertHtmlToText !== false,
      sortMessages: req.body.sortMessages !== false,
      excludeEmptyMessages: req.body.excludeEmptyMessages !== false,
      ...req.body.options // 追加オプション
    };
    
    console.log(`🔧 正規化オプション（POST）:`, options);
    
    const result = await gmailService.getNormalizedThread(threadId, options);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'スレッドが見つかりません'
      });
    }
    
    return res.json({
      success: true,
      data: result.normalizedThread,
      meta: {
        processedMessageCount: result.processedMessageCount,
        errors: result.errors,
        threadId: threadId,
        options: options
      }
    });
  } catch (error) {
    console.error('正規化スレッド取得エラー（POST）:', error);
    return res.status(500).json({
      success: false,
      error: '正規化スレッドの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 