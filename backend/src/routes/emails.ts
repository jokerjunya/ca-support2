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

// メール一覧取得
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    
    const maxResults = parseInt(req.query.maxResults as string) || 10;
    const query = req.query.query as string;
    
    const emails = await gmailService.getEmails(maxResults, query);
    
    return res.json({
      success: true,
      data: emails,
      count: emails.length
    });
  } catch (error) {
    console.error('メール取得エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'メール取得に失敗しました'
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

// メール送信
router.post('/send', requireAuth, async (req, res) => {
  try {
    const user = req.user as AuthUser;
    const gmailService = createGmailService(user);
    const emailData: EmailSendRequest = req.body;
    
    // バリデーション
    if (!emailData.to || !emailData.subject || !emailData.body) {
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

export default router; 