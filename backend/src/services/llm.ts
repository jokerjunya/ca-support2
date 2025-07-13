import axios from 'axios';
import { ParsedEmail } from '../types/gmail';

export interface LLMRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: 'json' | 'text';
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stop?: string[];
  };
}

export interface LLMResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface GenerateReplyRequest {
  originalEmail: ParsedEmail;
  replyType: 'business' | 'casual' | 'polite';
  customInstructions?: string;
  language?: 'ja' | 'en';
}

export interface GenerateThreadReplyRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  replyType: 'business' | 'casual' | 'polite';
  customInstructions?: string;
  language?: 'ja' | 'en';
}

export interface GenerateReplyResponse {
  reply: string;
  tone: string;
  confidence: number;
  processing_time: number;
}

export interface GenerateMultipleRepliesRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  replyTypes?: ('business' | 'casual' | 'polite')[];
  replyLengths?: ('brief' | 'medium' | 'detailed')[];
  customInstructions?: string;
  language?: 'ja' | 'en';
  candidateCount?: number;
}

export interface GenerateMultipleRepliesResponse {
  candidates: Array<{
    reply: string;
    tone: string;
    length: string;
    confidence: number;
    reasoning?: string;
  }>;
  processing_time: number;
  source: string;
}

export interface ConversationSummaryRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  maxSummaryLength?: 'brief' | 'medium' | 'detailed';
  language?: 'ja' | 'en';
}

export interface ConversationSummaryResponse {
  summary: {
    overview: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: string[];
    questions: string[];
    deadlines: string[];
    participants: string[];
  };
  processing_time: number;
  source: string;
}

export interface GenerateReplyWithSummaryRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  conversationSummary: ConversationSummaryResponse['summary'];
  replyType: 'business' | 'casual' | 'polite';
  customInstructions?: string;
  language?: 'ja' | 'en';
}

export interface SmartReplySuggestionsRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  suggestionCount?: number;
  language?: 'ja' | 'en';
}

export interface SmartReplySuggestionsResponse {
  suggestions: Array<{
    text: string;
    category: 'acknowledgment' | 'agreement' | 'question' | 'action' | 'polite' | 'casual';
    confidence: number;
    reasoning?: string;
  }>;
  processing_time: number;
  source: string;
}

export interface ContextAwareToneAnalysisRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  language?: 'ja' | 'en';
}

export interface ContextAwareToneAnalysisResponse {
  analysis: {
    formality: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
    tone: 'business' | 'friendly' | 'polite' | 'casual' | 'urgent' | 'neutral';
    keyPhrases: string[];
    recommendedTone: 'business' | 'casual' | 'polite';
    consistency: number;
  };
  processing_time: number;
  source: string;
}

export interface ContextAwareToneReplyRequest {
  normalizedThread: {
    threadId: string;
    messages: Array<{
      messageId: string;
      date: string;
      from: string;
      to: string[];
      subject: string;
      body: string;
    }>;
  };
  toneAnalysis: ContextAwareToneAnalysisResponse['analysis'];
  customInstructions?: string;
  language?: 'ja' | 'en';
}

export class LLMService {
  private ollamaUrl: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen3:30b';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT || '60000'); // 60秒
    this.maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES || '3');
  }

  /**
   * Ollama APIとの通信テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Ollama接続テスト開始: ${this.ollamaUrl}/api/tags`);
      
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Ollama接続テスト成功: ${response.status}`);
      console.log(`📋 利用可能モデル数: ${response.data.models?.length || 0}`);
      
      if (response.data.models?.length > 0) {
        const modelNames = response.data.models.map((m: any) => m.name);
        console.log(`📋 モデル一覧: ${modelNames.join(', ')}`);
        
        if (modelNames.includes(this.defaultModel)) {
          console.log(`✅ 使用モデル ${this.defaultModel} が利用可能`);
        } else {
          console.warn(`⚠️ 使用モデル ${this.defaultModel} が見つかりません`);
        }
      }
      
      return response.status === 200;
    } catch (error) {
      console.error('❌ Ollama接続テスト失敗:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('❌ Axiosエラー詳細:');
        console.error(`   - コード: ${error.code}`);
        console.error(`   - メッセージ: ${error.message}`);
        console.error(`   - レスポンス: ${error.response?.status} ${error.response?.statusText}`);
        console.error(`   - データ: ${JSON.stringify(error.response?.data)}`);
      }
      
      return false;
    }
  }

  /**
   * 利用可能なモデルを取得
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('モデル取得エラー:', error);
      return [];
    }
  }

  /**
   * LLMにリクエストを送信
   */
  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 LLM API呼び出し開始:`);
      console.log(`   - URL: ${this.ollamaUrl}/api/generate`);
      console.log(`   - モデル: ${request.model || this.defaultModel}`);
      console.log(`   - プロンプト長: ${request.prompt.length} 文字`);
      console.log(`   - 温度: ${request.options?.temperature || 'デフォルト'}`);
      console.log(`   - タイムアウト: ${this.timeout}ms`);
      
      // Ollama API の正確な形式に合わせる
      const requestBody = {
        model: request.model || this.defaultModel,
        prompt: request.prompt,
        stream: false, // 強制的にfalseに設定
        think: false, // Qwen3のthinking無効化（最新Ollama対応）
        options: {
          temperature: request.options?.temperature || 0.7,
          top_p: request.options?.top_p || 0.9,
          num_predict: request.options?.max_tokens || 1000
        }
      };
      
      // format パラメータは削除（Ollamaでは使用しない）
      console.log(`📤 リクエストボディ: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        requestBody,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`✅ LLM API呼び出し成功: ${processingTime}ms`);
      console.log(`📥 レスポンスステータス: ${response.status}`);
      console.log(`📥 レスポンスサイズ: ${JSON.stringify(response.data).length} 文字`);
      
      if (response.data.response) {
        console.log(`📥 生成されたテキスト長: ${response.data.response.length} 文字`);
        console.log(`📥 テキストプレビュー: ${response.data.response.substring(0, 100)}...`);
      }
      
      return response.data;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ LLM API呼び出し失敗 (${processingTime}ms):`, error);
      
      if (axios.isAxiosError(error)) {
        console.error('❌ LLM Axiosエラー詳細:');
        console.error(`   - コード: ${error.code}`);
        console.error(`   - メッセージ: ${error.message}`);
        console.error(`   - URL: ${error.config?.url}`);
        console.error(`   - レスポンス: ${error.response?.status} ${error.response?.statusText}`);
        if (error.response?.data) {
          console.error(`   - レスポンスデータ: ${JSON.stringify(error.response.data)}`);
        }
      }
      
      throw new Error(`LLM生成に失敗しました: ${error}`);
    }
  }

  /**
   * メール返信を生成
   */
  async generateReply(request: GenerateReplyRequest): Promise<GenerateReplyResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 LLM返信生成開始: ${request.replyType}, モデル: ${this.defaultModel}`);
      
      // 接続テストを実行
      console.log(`🔍 Ollama接続テスト実行中...`);
      const isConnected = await this.testConnection();
      console.log(`🔍 Ollama接続テスト結果: ${isConnected}`);
      
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック応答を使用');
        return this.generateFallbackReply(request);
      }
      
      const prompt = this.buildReplyPrompt(request);
      console.log(`📝 プロンプト長: ${prompt.length} 文字`);
      console.log(`📝 プロンプトプレビュー: ${prompt.substring(0, 100)}...`);
      
      console.log(`🚀 Ollama API呼び出し開始...`);
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'text',
        options: {
          temperature: this.getTemperatureForTone(request.replyType),
          top_p: 0.9,
          max_tokens: 1000
        }
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ LLM返信生成完了: ${processingTime}ms`);
      console.log(`📧 生成されたレスポンス長: ${llmResponse.response.length} 文字`);
      
      // レスポンスから実際の返信内容を抽出
      const reply = this.extractReplyFromResponse(llmResponse.response);
      console.log(`📧 抽出された返信長: ${reply.length} 文字`);
      console.log(`📧 返信プレビュー: ${reply.substring(0, 100)}...`);
      
      return {
        reply,
        tone: request.replyType,
        confidence: this.calculateConfidence(llmResponse),
        processing_time: processingTime
      };
    } catch (error) {
      console.error('❌ 返信生成エラー:', error);
      console.error('❌ エラー詳細:', error instanceof Error ? error.stack : String(error));
      
      // エラーの場合はフォールバック応答を生成
      return this.generateFallbackReply(request);
    }
  }

  /**
   * スレッドコンテキストを考慮したメール返信を生成
   */
  async generateThreadReply(request: GenerateThreadReplyRequest): Promise<GenerateReplyResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🧵 スレッドコンテキスト返信生成開始: ${request.replyType}, モデル: ${this.defaultModel}`);
      console.log(`🧵 スレッドメッセージ数: ${request.normalizedThread.messages.length}`);
      
      // 接続テストを実行
      console.log(`🔍 Ollama接続テスト実行中...`);
      const isConnected = await this.testConnection();
      console.log(`🔍 Ollama接続テスト結果: ${isConnected}`);
      
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック応答を使用');
        return this.generateThreadFallbackReply(request);
      }
      
      const prompt = this.buildThreadReplyPrompt(request);
      console.log(`📝 スレッドプロンプト長: ${prompt.length} 文字`);
      console.log(`📝 スレッドプロンプトプレビュー: ${prompt.substring(0, 200)}...`);
      
      console.log(`🚀 Ollama API呼び出し開始...`);
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'text',
        options: {
          temperature: this.getTemperatureForTone(request.replyType),
          top_p: 0.9,
          max_tokens: 1200 // スレッドコンテキストがあるので少し多めに
        }
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ スレッドコンテキスト返信生成完了: ${processingTime}ms`);
      console.log(`📧 生成されたレスポンス長: ${llmResponse.response.length} 文字`);
      
      // レスポンスから実際の返信内容を抽出
      const reply = this.extractReplyFromResponse(llmResponse.response);
      console.log(`📧 抽出された返信長: ${reply.length} 文字`);
      console.log(`📧 返信プレビュー: ${reply.substring(0, 100)}...`);
      
      return {
        reply,
        tone: request.replyType,
        confidence: this.calculateConfidence(llmResponse),
        processing_time: processingTime
      };
    } catch (error) {
      console.error('❌ スレッドコンテキスト返信生成エラー:', error);
      console.error('❌ エラー詳細:', error instanceof Error ? error.stack : String(error));
      
      // エラーの場合はフォールバック応答を生成
      return this.generateThreadFallbackReply(request);
    }
  }

  /**
   * 複数の返信候補を生成（Superhuman AI / Gmail Smart Reply 方式）
   */
  async generateMultipleReplies(request: GenerateMultipleRepliesRequest): Promise<GenerateMultipleRepliesResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 複数返信候補生成開始 - ThreadID: ${request.normalizedThread.threadId}, 候補数: ${request.candidateCount || 3}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック応答を使用');
        return this.generateMultipleFallbackReplies(request);
      }
      
      // 生成する組み合わせを決定
      const combinations = this.generateCombinations(request);
      console.log(`🎯 生成する候補組み合わせ数: ${combinations.length}`);
      
      // 各組み合わせで並列に返信を生成
      const candidates = await Promise.all(
        combinations.map(async (combo) => {
          try {
            const prompt = this.buildMultipleRepliesPrompt(request, combo);
            const llmResponse = await this.generateText({
              model: this.defaultModel,
              prompt,
              format: 'text',
              options: {
                temperature: this.getTemperatureForTone(combo.tone),
                top_p: 0.9,
                max_tokens: this.getMaxTokensForLength(combo.length)
              }
            });
            
            const reply = this.extractReplyFromResponse(llmResponse.response);
            return {
              reply,
              tone: combo.tone,
              length: combo.length,
              confidence: this.calculateConfidence(llmResponse),
              reasoning: this.generateReasoning(combo, request.normalizedThread)
            };
          } catch (error) {
            console.error(`❌ 候補生成エラー (${combo.tone}/${combo.length}):`, error);
            return this.generateFallbackCandidate(combo);
          }
        })
      );
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ 複数返信候補生成完了: ${processingTime}ms, ${candidates.length}候補`);
      
      return {
        candidates,
        processing_time: processingTime,
        source: 'llm'
      };
    } catch (error) {
      console.error('❌ 複数返信候補生成エラー:', error);
      return this.generateMultipleFallbackReplies(request);
    }
  }

  /**
   * 会話要約を生成
   */
  async summarizeConversation(request: ConversationSummaryRequest): Promise<ConversationSummaryResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 会話要約生成開始 - ThreadID: ${request.normalizedThread.threadId}, メッセージ数: ${request.normalizedThread.messages.length}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック要約を使用');
        return this.generateFallbackSummary(request);
      }
      
      const prompt = this.buildSummaryPrompt(request);
      console.log(`📝 要約プロンプト長: ${prompt.length} 文字`);
      
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'json',
        options: {
          temperature: 0.1, // 要約は低温度で一貫性を保つ
          top_p: 0.9,
          max_tokens: 1500
        }
      });
      
      const summary = this.parseSummaryResponse(llmResponse.response);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 会話要約生成完了: ${processingTime}ms`);
      console.log(`📝 要約概要: ${summary.overview.substring(0, 100)}...`);
      console.log(`📝 主要ポイント数: ${summary.keyPoints.length}`);
      console.log(`📝 決定事項数: ${summary.decisions.length}`);
      console.log(`📝 アクションアイテム数: ${summary.actionItems.length}`);
      
      return {
        summary,
        processing_time: processingTime,
        source: 'llm'
      };
    } catch (error) {
      console.error('❌ 会話要約生成エラー:', error);
      return this.generateFallbackSummary(request);
    }
  }

  /**
   * 要約を活用した返信生成
   */
  async generateReplyWithSummary(request: GenerateReplyWithSummaryRequest): Promise<GenerateReplyResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 要約付き返信生成開始: ${request.replyType}, ThreadID: ${request.normalizedThread.threadId}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック応答を使用');
        const lastMessage = request.normalizedThread.messages[request.normalizedThread.messages.length - 1];
        if (!lastMessage) {
          throw new Error('No messages found in thread');
        }
        
        return this.generateFallbackReply({
          originalEmail: {
            id: lastMessage.messageId,
            threadId: request.normalizedThread.threadId,
            subject: lastMessage.subject,
            from: lastMessage.from,
            to: lastMessage.to.join(', '),
            date: new Date(lastMessage.date),
            body: lastMessage.body,
            read: true,
            important: false,
            labels: [],
            snippet: '',
            attachments: []
          },
          replyType: request.replyType,
          ...(request.customInstructions && { customInstructions: request.customInstructions }),
          language: request.language || 'ja'
        });
      }
      
      const prompt = this.buildReplyWithSummaryPrompt(request);
      console.log(`📝 要約付きプロンプト長: ${prompt.length} 文字`);
      
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'text',
        options: {
          temperature: this.getTemperatureForTone(request.replyType),
          top_p: 0.9,
          max_tokens: 1000
        }
      });
      
      const reply = this.extractReplyFromResponse(llmResponse.response);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 要約付き返信生成完了: ${processingTime}ms`);
      console.log(`📧 生成された返信長: ${reply.length} 文字`);
      
      return {
        reply,
        tone: request.replyType,
        confidence: this.calculateConfidence(llmResponse),
        processing_time: processingTime
      };
    } catch (error) {
      console.error('❌ 要約付き返信生成エラー:', error);
      const lastMessage = request.normalizedThread.messages[request.normalizedThread.messages.length - 1];
      if (!lastMessage) {
        throw new Error('No messages found in thread');
      }
      
      return this.generateFallbackReply({
        originalEmail: {
          id: lastMessage.messageId,
          threadId: request.normalizedThread.threadId,
          subject: lastMessage.subject,
          from: lastMessage.from,
          to: lastMessage.to.join(', '),
          date: new Date(lastMessage.date),
          body: lastMessage.body,
          read: true,
          important: false,
          labels: [],
          snippet: '',
          attachments: []
        },
        replyType: request.replyType,
        ...(request.customInstructions && { customInstructions: request.customInstructions }),
        language: request.language || 'ja'
      });
    }
  }

  /**
   * クイック返信提案を生成（Gmail Smart Reply方式）
   */
  async generateSmartReplySuggestions(request: SmartReplySuggestionsRequest): Promise<SmartReplySuggestionsResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`⚡ クイック返信提案生成開始 - ThreadID: ${request.normalizedThread.threadId}, 提案数: ${request.suggestionCount || 3}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック提案を使用');
        return this.generateFallbackSmartReplies(request);
      }
      
      const prompt = this.buildSmartReplyPrompt(request);
      console.log(`📝 クイック返信プロンプト長: ${prompt.length} 文字`);
      
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'json',
        options: {
          temperature: 0.2, // 定型返信は低温度で一貫性を保つ
          top_p: 0.9,
          max_tokens: 500
        }
      });
      
      const suggestions = this.parseSmartReplyResponse(llmResponse.response);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ クイック返信提案生成完了: ${processingTime}ms`);
      console.log(`⚡ 提案数: ${suggestions.length}`);
      suggestions.forEach((suggestion, index) => {
        console.log(`⚡ 提案${index + 1}: [${suggestion.category}] "${suggestion.text}" (信頼度: ${suggestion.confidence})`);
      });
      
      return {
        suggestions,
        processing_time: processingTime,
        source: 'llm'
      };
    } catch (error) {
      console.error('❌ クイック返信提案生成エラー:', error);
      return this.generateFallbackSmartReplies(request);
    }
  }

  /**
   * 文脈依存語調分析を実行
   */
  async analyzeContextAwareTone(request: ContextAwareToneAnalysisRequest): Promise<ContextAwareToneAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🎭 文脈依存語調分析開始 - ThreadID: ${request.normalizedThread.threadId}, メッセージ数: ${request.normalizedThread.messages.length}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック分析を使用');
        return this.generateFallbackToneAnalysis(request);
      }
      
      const prompt = this.buildToneAnalysisPrompt(request);
      console.log(`📝 語調分析プロンプト長: ${prompt.length} 文字`);
      
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'json',
        options: {
          temperature: 0.1, // 分析は低温度で一貫性を保つ
          top_p: 0.9,
          max_tokens: 800
        }
      });
      
      const analysis = this.parseToneAnalysisResponse(llmResponse.response);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 文脈依存語調分析完了: ${processingTime}ms`);
      console.log(`🎭 フォーマルレベル: ${analysis.formality}`);
      console.log(`🎭 語調: ${analysis.tone}`);
      console.log(`🎭 推奨語調: ${analysis.recommendedTone}`);
      console.log(`🎭 一貫性: ${analysis.consistency}`);
      
      return {
        analysis,
        processing_time: processingTime,
        source: 'llm'
      };
    } catch (error) {
      console.error('❌ 文脈依存語調分析エラー:', error);
      return this.generateFallbackToneAnalysis(request);
    }
  }

  /**
   * 文脈依存語調に基づく返信生成
   */
  async generateContextAwareToneReply(request: ContextAwareToneReplyRequest): Promise<GenerateReplyResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🎭 文脈依存語調返信生成開始 - ThreadID: ${request.normalizedThread.threadId}, 推奨語調: ${request.toneAnalysis.recommendedTone}`);
      
      // 接続テストを実行
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Ollama接続失敗 → フォールバック応答を使用');
        const lastMessage = request.normalizedThread.messages[request.normalizedThread.messages.length - 1];
        if (!lastMessage) {
          throw new Error('No messages found in thread');
        }
        
        return this.generateFallbackReply({
          originalEmail: {
            id: lastMessage.messageId,
            threadId: request.normalizedThread.threadId,
            subject: lastMessage.subject,
            from: lastMessage.from,
            to: lastMessage.to.join(', '),
            date: new Date(lastMessage.date),
            body: lastMessage.body,
            read: true,
            important: false,
            labels: [],
            snippet: '',
            attachments: []
          },
          replyType: request.toneAnalysis.recommendedTone,
          ...(request.customInstructions && { customInstructions: request.customInstructions }),
          language: request.language || 'ja'
        });
      }
      
      const prompt = this.buildContextAwareToneReplyPrompt(request);
      console.log(`📝 文脈依存語調プロンプト長: ${prompt.length} 文字`);
      
      const llmResponse = await this.generateText({
        model: this.defaultModel,
        prompt,
        format: 'text',
        options: {
          temperature: this.getTemperatureForTone(request.toneAnalysis.recommendedTone),
          top_p: 0.9,
          max_tokens: 1000
        }
      });
      
      const reply = this.extractReplyFromResponse(llmResponse.response);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 文脈依存語調返信生成完了: ${processingTime}ms`);
      console.log(`📧 生成された返信長: ${reply.length} 文字`);
      
      return {
        reply,
        tone: request.toneAnalysis.recommendedTone,
        confidence: this.calculateConfidence(llmResponse),
        processing_time: processingTime
      };
    } catch (error) {
      console.error('❌ 文脈依存語調返信生成エラー:', error);
      const lastMessage = request.normalizedThread.messages[request.normalizedThread.messages.length - 1];
      if (!lastMessage) {
        throw new Error('No messages found in thread');
      }
      
      return this.generateFallbackReply({
        originalEmail: {
          id: lastMessage.messageId,
          threadId: request.normalizedThread.threadId,
          subject: lastMessage.subject,
          from: lastMessage.from,
          to: lastMessage.to.join(', '),
          date: new Date(lastMessage.date),
          body: lastMessage.body,
          read: true,
          important: false,
          labels: [],
          snippet: '',
          attachments: []
        },
        replyType: request.toneAnalysis.recommendedTone,
        ...(request.customInstructions && { customInstructions: request.customInstructions }),
        language: request.language || 'ja'
      });
    }
  }

  /**
   * 返信用プロンプトを構築
   */
  private buildReplyPrompt(request: GenerateReplyRequest): string {
    const { originalEmail, replyType, customInstructions, language = 'ja' } = request;
    
    const toneInstructions = {
      business: '丁寧でビジネスライクな語調',
      casual: 'カジュアルで親しみやすい語調', 
      polite: '非常に丁寧で敬語を使った語調'
    };

    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';

    return `
あなたは優秀なメールアシスタントです。以下のメールに対する適切な返信を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【元メール情報】
件名: ${originalEmail.subject}
送信者: ${originalEmail.from}
内容: ${originalEmail.body}

【返信指示】
- 語調: ${toneInstructions[replyType]}
- 言語: ${languageInstruction}
- 返信は簡潔で要点を押さえた内容にしてください
- 相手のメールの内容を理解し、適切に対応してください
${customInstructions ? `- 追加指示: ${customInstructions}` : ''}

【出力形式】
- 返信内容のみを出力してください
- 挨拶から始めて、要点を述べ、適切な結びの文で終わってください
- 件名は含めないでください
- 思考過程や分析は含めないでください

返信内容:
`;
  }

  /**
   * スレッドコンテキストを考慮した返信プロンプトを構築
   */
  private buildThreadReplyPrompt(request: GenerateThreadReplyRequest): string {
    const { normalizedThread, replyType, customInstructions, language = 'ja' } = request;
    
    const toneInstructions = {
      business: '丁寧でビジネスライクな語調',
      casual: 'カジュアルで親しみやすい語調', 
      polite: '非常に丁寧で敬語を使った語調'
    };
 
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
 
    return `
 あなたは優秀なメールアシスタントです。以下のスレッドコンテキストに基づいて、適切な返信を生成してください。
 
 /no_think
 
 【重要指示】
 - 思考プロセスを出力しないでください
 - <think>タグや<thinking>タグを使用しないでください  
 - 分析や検討過程を記述しないでください
 - 直接的な返信内容のみを出力してください
 
 【スレッドコンテキスト】
 ${normalizedThread.messages.map((msg, index) => `
 ${index + 1}. メッセージID: ${msg.messageId}
   送信者: ${msg.from}
   日時: ${msg.date}
   件名: ${msg.subject}
   内容: ${msg.body}
 `).join('\n')}
 
 【返信指示】
 - 語調: ${toneInstructions[replyType]}
 - 言語: ${languageInstruction}
 - スレッド全体の会話の流れを理解し、適切に対応してください
 - 最新のメッセージに対する返信でありながら、スレッドの文脈を考慮してください
 - 返信は簡潔で要点を押さえた内容にしてください
 - 同じ内容の繰り返しは避け、新しい価値を提供してください
 ${customInstructions ? `- 追加指示: ${customInstructions}` : ''}
 
 【出力形式】
 - 返信内容のみを出力してください
 - 挨拶から始めて、要点を述べ、適切な結びの文で終わってください
 - 件名は含めないでください
 - 思考過程や分析は含めないでください
 - スレッドの文脈に基づいた自然な返信を心がけてください
 
 返信内容:
 `;
   }

  /**
   * 語調に応じた温度パラメータを取得
   */
  private getTemperatureForTone(replyType: string): number {
    switch (replyType) {
      case 'business':
        return 0.3; // より保守的で一貫性のある応答
      case 'casual':
        return 0.7; // より創造的で自然な応答
      case 'polite':
        return 0.4; // 丁寧だが保守的な応答
      default:
        return 0.5;
    }
  }

  /**
   * LLMレスポンスから返信内容を抽出（改善版）
   */
  private extractReplyFromResponse(response: string): string {
    console.log(`🔍 返信抽出開始 - 元の応答長: ${response.length}`);
    console.log(`🔍 元の応答プレビュー: ${response.substring(0, 200)}...`);
    
    let cleanResponse = response;
    
    // 1. 世の中の事例に基づく強力な思考ブロック除去
    // <think>...</think>タグを除去（複数行、大文字小文字無視、入れ子対応）
    cleanResponse = cleanResponse.replace(/<think[\s\S]*?<\/think>/gi, '');
    
    // 2. 思考関連の別パターンも除去
    cleanResponse = cleanResponse.replace(/<thinking[\s\S]*?<\/thinking>/gi, '');
    cleanResponse = cleanResponse.replace(/```thinking[\s\S]*?```/gi, '');
    
    // 3. 思考プロセスの開始パターンを除去
    cleanResponse = cleanResponse.replace(/^(思考|考え|分析|検討)[:：]\s*/gim, '');
    cleanResponse = cleanResponse.replace(/^(Let me think|I need to think|思考プロセス)[\s\S]*?^(答え|回答|返信|Reply)[:：]\s*/gim, '');
    
    // 4. 一般的な思考プロセス文章パターンを除去
    cleanResponse = cleanResponse.replace(/^(まず|最初に|それでは|さて|では|よって|つまり|そこで)[、，]\s*/, '');
    cleanResponse = cleanResponse.replace(/^(これは|この場合|この状況では|この問題について)[、，]\s*/, '');
    
    // 5. 不要なプレフィックスを除去
    cleanResponse = cleanResponse.replace(/^(返信内容|返信|回答|答え)[:：]\s*/gim, '');
    cleanResponse = cleanResponse.replace(/^(reply|response|answer)[:：]\s*/gim, '');
    
    // 6. 行頭の不要な記号を除去
    cleanResponse = cleanResponse.replace(/^[-–—>\s]+/gm, '');
    
    // 7. 連続する改行を整理
    cleanResponse = cleanResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanResponse = cleanResponse.trim();
    
    console.log(`🔍 思考ブロック除去後の長さ: ${cleanResponse.length}`);
    
    // 8. 抽出結果の検証と改善
    if (cleanResponse.length < 10) {
      console.log('⚠️ 抽出結果が短すぎます。フォールバック処理を実行');
      
      // フォールバック1: 最後の文章を抽出
      const sentences = response.split(/[。！？\n]/).filter(s => s.trim().length > 5);
      if (sentences.length > 0) {
        const lastSentence = sentences[sentences.length - 1];
        if (lastSentence && lastSentence.trim()) {
          cleanResponse = lastSentence.trim();
          console.log(`🔄 フォールバック1適用 - 最後の文章: ${cleanResponse}`);
        }
      }
      
      // フォールバック2: 最初の実質的な内容を抽出
      if (cleanResponse.length < 10) {
        const lines = response.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 10 && 
                 !trimmed.startsWith('<') && 
                 !trimmed.includes('思考') && 
                 !trimmed.includes('考え') &&
                 !trimmed.includes('分析');
        });
        if (lines.length > 0) {
          const firstLine = lines[0];
          if (firstLine && firstLine.trim()) {
            cleanResponse = firstLine.trim();
            console.log(`🔄 フォールバック2適用 - 実質的内容: ${cleanResponse}`);
          }
        }
      }
      
      // フォールバック3: デフォルトメッセージ
      if (cleanResponse.length < 10) {
        cleanResponse = 'ご連絡いただき、ありがとうございます。詳細についてお聞かせください。';
        console.log(`�� フォールバック3適用 - デフォルトメッセージ使用`);
      }
    }
    
    // 9. 最終的な整理
    cleanResponse = cleanResponse.replace(/^\s*["'`]|["'`]\s*$/g, ''); // 引用符除去
    cleanResponse = cleanResponse.replace(/\s+/g, ' '); // 余分なスペース除去
    cleanResponse = cleanResponse.trim();
    
    console.log(`✅ 最終抽出結果 - 長さ: ${cleanResponse.length}`);
    console.log(`✅ 最終内容プレビュー: ${cleanResponse.substring(0, 100)}...`);
    
    return cleanResponse;
  }

  /**
   * スレッドコンテキスト返信生成のフォールバック応答を生成
   */
  private generateThreadFallbackReply(request: GenerateThreadReplyRequest): GenerateReplyResponse {
    console.log(`🔄 スレッドコンテキスト返信生成のフォールバックを生成: ${request.replyType}`);
    
    const fallbackReplies = {
      business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
      casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
      polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
    };

    return {
      reply: fallbackReplies[request.replyType],
      tone: request.replyType,
      confidence: 0.5,
      processing_time: 0
    };
  }

  /**
   * 複数返信候補生成のフォールバック応答を生成
   */
  private generateMultipleFallbackReplies(request: GenerateMultipleRepliesRequest): GenerateMultipleRepliesResponse {
    console.log(`🔄 複数返信候補生成のフォールバックを生成: ${request.replyTypes || ['business']}, ${request.replyLengths || ['medium']}`);
    
    const fallbackReplies: Record<string, string> = {
      business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
      casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
      polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
    };
 
    const replyType = request.replyTypes?.[0] || 'business';
    const replyLength = request.replyLengths?.[0] || 'medium';
    
    const candidates = Array.from({ length: request.candidateCount || 3 }).map(() => ({
      reply: (fallbackReplies[replyType] || fallbackReplies['business']) as string,
      tone: replyType,
      length: replyLength,
      confidence: 0.5,
      reasoning: 'フォールバック応答'
    }));
 
    return {
      candidates,
      processing_time: 0,
      source: 'llm'
    };
  }

  /**
   * 複数返信候補生成の理由を生成
   */
  private generateReasoning(combo: { tone: string; length: string }, thread: GenerateMultipleRepliesRequest['normalizedThread']): string {
    const lastMessage = thread.messages[thread.messages.length - 1];
    
    if (!lastMessage) {
      return 'スレッドにメッセージがありません';
    }
    
    const lastMessageDate = new Date(lastMessage.date).toLocaleDateString();
    const lastMessageSubject = lastMessage.subject;
 
    return `
この返信は以下の理由により生成されました：

1. 最新のメッセージ（件名: "${lastMessageSubject}", 日時: ${lastMessageDate}）に対して、${combo.tone}で${combo.length}の返信を生成しました。
2. スレッドの文脈を考慮し、${combo.tone}な返信を生成しました。
3. 返信は${combo.length}で、要点を押さえた内容にしました。
`;
  }

  /**
   * 複数返信候補生成のフォールバック候補を生成
   */
  private generateFallbackCandidate(combo: { tone: string; length: string }): { reply: string; tone: string; length: string; confidence: number; reasoning?: string } {
    console.log(`🔄 複数返信候補生成のフォールバック候補を生成: ${combo.tone}, ${combo.length}`);
    
    const fallbackReplies: Record<string, string> = {
      business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
      casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
      polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
    };
 
    return {
      reply: (fallbackReplies[combo.tone] || fallbackReplies['business']) as string,
      tone: combo.tone,
      length: combo.length,
      confidence: 0.5,
      reasoning: 'フォールバック候補'
    };
  }

  /**
   * 複数返信候補生成のプロンプトを構築
   */
  private buildMultipleRepliesPrompt(request: GenerateMultipleRepliesRequest, combo: { tone: string; length: string }): string {
    const { normalizedThread, customInstructions, language = 'ja' } = request;
    
    const toneInstructions: Record<string, string> = {
      business: '丁寧でビジネスライクな語調',
      casual: 'カジュアルで親しみやすい語調', 
      polite: '非常に丁寧で敬語を使った語調'
    };
 
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
 
    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストに基づいて、${combo.tone}で${combo.length}の返信を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
 ${index + 1}. メッセージID: ${msg.messageId}
   送信者: ${msg.from}
   日時: ${msg.date}
   件名: ${msg.subject}
   内容: ${msg.body}
 `).join('\n')}

【返信指示】
- 語調: ${toneInstructions[combo.tone] || toneInstructions['business']}
- 言語: ${languageInstruction}
- 返信は${combo.length}で、要点を押さえた内容にしてください
- スレッド全体の会話の流れを理解し、適切に対応してください
- 最新のメッセージに対する返信でありながら、スレッドの文脈を考慮してください
- 返信は簡潔で要点を押さえた内容にしてください
- 同じ内容の繰り返しは避け、新しい価値を提供してください
${customInstructions ? `- 追加指示: ${customInstructions}` : ''}

【出力形式】
- 返信内容のみを出力してください
- 挨拶から始めて、要点を述べ、適切な結びの文で終わってください
- 件名は含めないでください
- 思考過程や分析は含めないでください
- スレッドの文脈に基づいた自然な返信を心がけてください

返信内容:
`;
  }

  /**
   * 返信候補の長さに応じた最大トークン数を取得
   */
  private getMaxTokensForLength(length: string): number {
    switch (length) {
      case 'brief':
        return 300;
      case 'medium':
        return 500;
      case 'detailed':
        return 1000;
      default:
        return 500;
    }
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(llmResponse: LLMResponse): number {
    // 簡単な信頼度計算（より高度なロジックに置き換え可能）
    const responseLength = llmResponse.response.length;
    const hasThinking = llmResponse.response.includes('<think>');
    
    let confidence = 0.7; // ベース信頼度
    
    // 長すぎる・短すぎる応答は信頼度を下げる
    if (responseLength > 50 && responseLength < 500) {
      confidence += 0.1;
    }
    
    // 思考プロセスがある場合は信頼度を上げる
    if (hasThinking) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * フォールバック応答を生成
   */
  private generateFallbackReply(request: GenerateReplyRequest): GenerateReplyResponse {
    console.log(`🔄 フォールバック応答を生成: ${request.replyType}`);
    
    const fallbackReplies = {
      business: 'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認させていただき、後日改めてご連絡いたします。\n\nよろしくお願いいたします。',
      casual: 'お疲れ様！\n\nメールありがとうございます。\n確認して後で返信しますね。',
      polite: 'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、改めてご連絡させていただきます。\n\n何卒よろしくお願い申し上げます。'
    };

    return {
      reply: fallbackReplies[request.replyType],
      tone: request.replyType,
      confidence: 0.5,
      processing_time: 0
    };
  }

  /**
   * 会話要約のフォールバック応答を生成
   */
  private generateFallbackSummary(request: ConversationSummaryRequest): ConversationSummaryResponse {
    console.log(`🔄 会話要約のフォールバックを生成: ${request.normalizedThread.threadId}`);
    
    const fallbackOverview = 'このスレッドの要約はありませんでした。';
    const fallbackKeyPoints: string[] = [];
    const fallbackDecisions: string[] = [];
    const fallbackActionItems: string[] = [];
    const fallbackQuestions: string[] = [];
    const fallbackDeadlines: string[] = [];
    const fallbackParticipants: string[] = [];

    return {
      summary: {
        overview: fallbackOverview,
        keyPoints: fallbackKeyPoints,
        decisions: fallbackDecisions,
        actionItems: fallbackActionItems,
        questions: fallbackQuestions,
        deadlines: fallbackDeadlines,
        participants: fallbackParticipants
      },
      processing_time: 0,
      source: 'llm'
    };
  }

  /**
   * 会話要約のプロンプトを構築
   */
  private buildSummaryPrompt(request: ConversationSummaryRequest): string {
    const { normalizedThread, maxSummaryLength = 'medium', language = 'ja' } = request;
    
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';

    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストに基づいて、${maxSummaryLength}の要約を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
 ${index + 1}. メッセージID: ${msg.messageId}
   送信者: ${msg.from}
   日時: ${msg.date}
   件名: ${msg.subject}
   内容: ${msg.body}
 `).join('\n')}

【要約指示】
- 返信内容のみを出力してください
- 要点を押さえた概要を${maxSummaryLength}で生成してください
- 決定事項、アクションアイテム、質問、締切などを識別してください
- 返信は簡潔で要点を押さえた内容にしてください
- 同じ内容の繰り返しは避け、新しい価値を提供してください
- 言語: ${languageInstruction}

要約:
`;
  }

  /**
   * 要約レスポンスを解析
   */
  private parseSummaryResponse(response: string): ConversationSummaryResponse['summary'] {
    const overviewMatch = response.match(/要約:\s*(.*?)\s*$/i);
    const overview = overviewMatch?.[1]?.trim() || '要約はありませんでした。';

    const keyPointsMatch = response.match(/主要ポイント:\s*(.*?)\s*$/i);
    const keyPoints = keyPointsMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    const decisionsMatch = response.match(/決定事項:\s*(.*?)\s*$/i);
    const decisions = decisionsMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    const actionItemsMatch = response.match(/アクションアイテム:\s*(.*?)\s*$/i);
    const actionItems = actionItemsMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    const questionsMatch = response.match(/質問:\s*(.*?)\s*$/i);
    const questions = questionsMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    const deadlinesMatch = response.match(/締切:\s*(.*?)\s*$/i);
    const deadlines = deadlinesMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    const participantsMatch = response.match(/参加者:\s*(.*?)\s*$/i);
    const participants = participantsMatch?.[1]?.trim().split('\n').map(s => s.trim()).filter(s => s.length > 0) || [];

    return {
      overview,
      keyPoints,
      decisions,
      actionItems,
      questions,
      deadlines,
      participants
    };
  }

  /**
   * 要約付き返信生成のプロンプトを構築
   */
  private buildReplyWithSummaryPrompt(request: GenerateReplyWithSummaryRequest): string {
    const { normalizedThread, conversationSummary, replyType, customInstructions, language = 'ja' } = request;
    
    const toneInstructions = {
      business: '丁寧でビジネスライクな語調',
      casual: 'カジュアルで親しみやすい語調', 
      polite: '非常に丁寧で敬語を使った語調'
    };
 
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
 
    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストと会話要約に基づいて、${replyType}で返信を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
 ${index + 1}. メッセージID: ${msg.messageId}
   送信者: ${msg.from}
   日時: ${msg.date}
   件名: ${msg.subject}
   内容: ${msg.body}
 `).join('\n')}

【会話要約】
${conversationSummary.overview}

【返信指示】
- 語調: ${toneInstructions[replyType]}
- 言語: ${languageInstruction}
- 返信は${replyType}で、要点を押さえた内容にしてください
- スレッド全体の会話の流れを理解し、適切に対応してください
- 最新のメッセージに対する返信でありながら、スレッドの文脈を考慮してください
- 返信は簡潔で要点を押さえた内容にしてください
- 同じ内容の繰り返しは避け、新しい価値を提供してください
${customInstructions ? `- 追加指示: ${customInstructions}` : ''}

【出力形式】
- 返信内容のみを出力してください
- 挨拶から始めて、要点を述べ、適切な結びの文で終わってください
- 件名は含めないでください
- 思考過程や分析は含めないでください
- スレッドの文脈に基づいた自然な返信を心がけてください

返信内容:
`;
  }

  /**
   * クイック返信提案のフォールバック応答を生成
   */
  private generateFallbackSmartReplies(request: SmartReplySuggestionsRequest): SmartReplySuggestionsResponse {
    console.log(`🔄 クイック返信提案のフォールバックを生成: ${request.normalizedThread.threadId}`);
    
    const fallbackSuggestions = [
      { text: 'ありがとうございます', category: 'acknowledgment' as const, confidence: 0.8, reasoning: 'フォールバック提案' },
      { text: '了解しました', category: 'agreement' as const, confidence: 0.8, reasoning: 'フォールバック提案' },
      { text: '確認いたします', category: 'action' as const, confidence: 0.8, reasoning: 'フォールバック提案' }
    ];
    
    return {
      suggestions: fallbackSuggestions.slice(0, request.suggestionCount || 3),
      processing_time: 0,
      source: 'llm'
    };
  }

  /**
   * クイック返信提案のプロンプトを構築
   */
  private buildSmartReplyPrompt(request: SmartReplySuggestionsRequest): string {
    const { normalizedThread, suggestionCount = 3, language = 'ja' } = request;
    
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
    
    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストに基づいて、${suggestionCount}個のクイック返信提案を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
${index + 1}. メッセージID: ${msg.messageId}
  送信者: ${msg.from}
  日時: ${msg.date}
  件名: ${msg.subject}
  内容: ${msg.body}
`).join('\n')}

【返信提案指示】
- 言語: ${languageInstruction}
- 短い定型返信候補を${suggestionCount}個生成してください
- 各提案は15文字以内に収めてください
- 最新のメッセージに対する適切な返信を提案してください
- 以下のカテゴリから選択してください：
  - acknowledgment（謝意・感謝）
  - agreement（同意・了解）
  - question（質問・確認）
  - action（行動・対応）
  - polite（丁寧・敬語）
  - casual（カジュアル）

【出力形式】
JSON形式で以下の構造で出力してください：
{
  "suggestions": [
    {
      "text": "返信テキスト",
      "category": "カテゴリ",
      "confidence": 0.9,
      "reasoning": "選択理由"
    }
  ]
}

返信提案:
`;
  }

  /**
   * クイック返信提案のレスポンスを解析
   */
  private parseSmartReplyResponse(response: string): SmartReplySuggestionsResponse['suggestions'] {
    try {
      // JSONレスポンスをパース
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON構造が見つかりません');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('suggestions配列が見つかりません');
      }
      
      return parsed.suggestions.map((suggestion: any) => ({
        text: suggestion.text || 'ありがとうございます',
        category: suggestion.category || 'acknowledgment',
        confidence: typeof suggestion.confidence === 'number' ? suggestion.confidence : 0.7,
        reasoning: suggestion.reasoning || '自動生成'
      }));
    } catch (error) {
      console.error('クイック返信提案のパースエラー:', error);
      
      // パースエラーの場合はフォールバック提案を返す
      return [
        { text: 'ありがとうございます', category: 'acknowledgment' as const, confidence: 0.7, reasoning: 'パースエラー時のフォールバック' },
        { text: '了解しました', category: 'agreement' as const, confidence: 0.7, reasoning: 'パースエラー時のフォールバック' },
        { text: '確認いたします', category: 'action' as const, confidence: 0.7, reasoning: 'パースエラー時のフォールバック' }
      ];
    }
  }

  /**
   * 候補の組み合わせを生成
   */
  private generateCombinations(request: GenerateMultipleRepliesRequest): { tone: string; length: string }[] {
    const replyTypes = request.replyTypes || ['business', 'casual', 'polite'];
    const replyLengths = request.replyLengths || ['brief', 'medium', 'detailed'];
    const candidateCount = request.candidateCount || 3;
    
    const combinations: { tone: string; length: string }[] = [];
    
    // 組み合わせを生成
    for (const tone of replyTypes) {
      for (const length of replyLengths) {
        combinations.push({ tone, length });
      }
    }
    
    // 指定された候補数まで制限
    return combinations.slice(0, candidateCount);
  }

  /**
   * 文脈依存語調分析のフォールバック応答を生成
   */
  private generateFallbackToneAnalysis(request: ContextAwareToneAnalysisRequest): ContextAwareToneAnalysisResponse {
    console.log(`🔄 文脈依存語調分析のフォールバックを生成: ${request.normalizedThread.threadId}`);
    
    return {
      analysis: {
        formality: 'neutral',
        tone: 'business',
        keyPhrases: [],
        recommendedTone: 'business',
        consistency: 0.7
      },
      processing_time: 0,
      source: 'llm'
    };
  }

  /**
   * 文脈依存語調分析のプロンプトを構築
   */
  private buildToneAnalysisPrompt(request: ContextAwareToneAnalysisRequest): string {
    const { normalizedThread, language = 'ja' } = request;
    
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
    
    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストに基づいて、語調と文体を分析してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
${index + 1}. メッセージID: ${msg.messageId}
  送信者: ${msg.from}
  日時: ${msg.date}
  件名: ${msg.subject}
  内容: ${msg.body}
`).join('\n')}

【分析指示】
- 言語: ${languageInstruction}
- スレッド内の相手の語調とフォーマルさを分析してください
- 敬語の使用頻度、カジュアルな表現、ビジネス用語の使用を評価してください
- 最適な返信語調を推奨してください
- 語調の一貫性を0.0-1.0で評価してください

【出力形式】
JSON形式で以下の構造で出力してください：
{
  "formality": "very_formal|formal|neutral|casual|very_casual",
  "tone": "business|friendly|polite|casual|urgent|neutral",
  "keyPhrases": ["特徴的な語句1", "特徴的な語句2"],
  "recommendedTone": "business|casual|polite",
  "consistency": 0.8
}

語調分析結果:
`;
  }

  /**
   * 文脈依存語調分析のレスポンスを解析
   */
  private parseToneAnalysisResponse(response: string): ContextAwareToneAnalysisResponse['analysis'] {
    try {
      // JSONレスポンスをパース
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON構造が見つかりません');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        formality: parsed.formality || 'neutral',
        tone: parsed.tone || 'business',
        keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases : [],
        recommendedTone: parsed.recommendedTone || 'business',
        consistency: typeof parsed.consistency === 'number' ? parsed.consistency : 0.7
      };
    } catch (error) {
      console.error('語調分析レスポンスのパースエラー:', error);
      
      // パースエラーの場合はフォールバック分析を返す
      return {
        formality: 'neutral',
        tone: 'business',
        keyPhrases: [],
        recommendedTone: 'business',
        consistency: 0.7
      };
    }
  }

  /**
   * 文脈依存語調返信のプロンプトを構築
   */
  private buildContextAwareToneReplyPrompt(request: ContextAwareToneReplyRequest): string {
    const { normalizedThread, toneAnalysis, customInstructions, language = 'ja' } = request;
    
    const toneInstructions = {
      business: '丁寧でビジネスライクな語調',
      casual: 'カジュアルで親しみやすい語調', 
      polite: '非常に丁寧で敬語を使った語調'
    };
    
    const formalityGuide = {
      very_formal: '極めて正式で敬語を多用する',
      formal: '正式で丁寧な表現を使用する',
      neutral: '標準的な丁寧語を使用する',
      casual: 'カジュアルで親しみやすい表現を使用する',
      very_casual: '非常にカジュアルで親近感のある表現を使用する'
    };
    
    const languageInstruction = language === 'ja' ? '日本語で回答してください。' : 'Please respond in English.';
    
    return `
あなたは優秀なメールアシスタントです。以下のスレッドコンテキストと語調分析に基づいて、相手の語調に合わせた返信を生成してください。

/no_think

【重要指示】
- 思考プロセスを出力しないでください
- <think>タグや<thinking>タグを使用しないでください  
- 分析や検討過程を記述しないでください
- 直接的な返信内容のみを出力してください

【スレッドコンテキスト】
${normalizedThread.messages.map((msg, index) => `
${index + 1}. メッセージID: ${msg.messageId}
  送信者: ${msg.from}
  日時: ${msg.date}
  件名: ${msg.subject}
  内容: ${msg.body}
`).join('\n')}

【語調分析結果】
- フォーマルレベル: ${toneAnalysis.formality} (${formalityGuide[toneAnalysis.formality]})
- 語調: ${toneAnalysis.tone}
- 推奨語調: ${toneAnalysis.recommendedTone}
- 特徴的な語句: ${toneAnalysis.keyPhrases.join(', ')}
- 一貫性: ${toneAnalysis.consistency}

【返信指示】
- 語調: ${toneInstructions[toneAnalysis.recommendedTone]}
- 言語: ${languageInstruction}
- 相手の語調とフォーマルさに合わせて返信してください
- スレッド全体の会話の流れを理解し、適切に対応してください
- 最新のメッセージに対する返信でありながら、スレッドの文脈を考慮してください
- 返信は簡潔で要点を押さえた内容にしてください
- 相手の使用する語彙レベルと敬語レベルに合わせてください
${customInstructions ? `- 追加指示: ${customInstructions}` : ''}

【出力形式】
- 返信内容のみを出力してください
- 挨拶から始めて、要点を述べ、適切な結びの文で終わってください
- 件名は含めないでください
- 思考過程や分析は含めないでください
- 相手の語調に合わせた自然な返信を心がけてください

返信内容:
`;
  }
}

/**
 * LLMサービスインスタンスを作成
 */
export const createLLMService = (): LLMService => {
  return new LLMService();
}; 