// 返信テンプレートシステムの型定義

export type ReplyTone = 'business' | 'casual' | 'polite';

export type TemplateCategory = 
  | 'confirmation'    // 確認・承認
  | 'thanks'         // お礼・感謝  
  | 'request'        // 依頼・質問
  | 'decline'        // お断り・謝罪
  | 'meeting'        // 会議・打ち合わせ
  | 'follow_up'      // フォローアップ
  | 'custom';        // カスタム

export interface ReplyTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  tone: ReplyTone;
  content: string;
  isCustom: boolean;
  createdAt: Date;
  usageCount: number;
}

export interface TemplateGroup {
  category: TemplateCategory;
  name: string;
  emoji: string;
  description: string;
  templates: ReplyTemplate[];
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; emoji: string; description: string }> = {
  confirmation: {
    name: '確認・承認',
    emoji: '✅',
    description: '承認や確認の返事'
  },
  thanks: {
    name: 'お礼・感謝',
    emoji: '🙏',
    description: 'お礼や感謝を伝える'
  },
  request: {
    name: '依頼・質問',
    emoji: '📝',
    description: '依頼や質問をする'
  },
  decline: {
    name: 'お断り・謝罪',
    emoji: '🙇',
    description: 'お断りや謝罪を伝える'
  },
  meeting: {
    name: '会議・打ち合わせ',
    emoji: '📅',
    description: 'スケジュール調整など'
  },
  follow_up: {
    name: 'フォローアップ',
    emoji: '🔄',
    description: '進捗確認や催促'
  },
  custom: {
    name: 'カスタム',
    emoji: '⭐',
    description: '独自のテンプレート'
  }
}; 