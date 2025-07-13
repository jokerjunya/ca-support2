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

export interface GenerateReplyResponse {
  reply: string;
  tone: string;
  confidence: number;
  processing_time: number;
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
        console.log(`🔄 フォールバック3適用 - デフォルトメッセージ使用`);
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
}

/**
 * LLMサービスインスタンスを作成
 */
export const createLLMService = (): LLMService => {
  return new LLMService();
}; 