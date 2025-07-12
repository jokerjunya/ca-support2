// 返信テンプレートデータ

import { ReplyTemplate, ReplyTone, TemplateCategory } from '../types/template';

const createTemplate = (
  id: string,
  title: string,
  category: TemplateCategory,
  tone: ReplyTone,
  content: string
): ReplyTemplate => ({
  id,
  title,
  category,
  tone,
  content,
  isCustom: false,
  createdAt: new Date(),
  usageCount: 0
});

export const DEFAULT_TEMPLATES: ReplyTemplate[] = [
  // 確認・承認系
  createTemplate('conf_business_01', '内容確認済み', 'confirmation', 'business',
    'お疲れ様です。\n\nご連絡いただきありがとうございます。\n内容を確認いたしました。問題ございません。\n\nよろしくお願いいたします。'),
  
  createTemplate('conf_casual_01', '了解しました', 'confirmation', 'casual',
    'お疲れ様です！\n\n確認しました。大丈夫です。\nありがとうございます。'),
  
  createTemplate('conf_polite_01', '承知いたしました', 'confirmation', 'polite',
    'いつもお世話になっております。\n\nご丁寧にご連絡いただき、誠にありがとうございます。\n内容を拝見し、承知いたしました。\n\n何卒よろしくお願い申し上げます。'),

  // お礼・感謝系
  createTemplate('thanks_business_01', '資料提供のお礼', 'thanks', 'business',
    'お疲れ様です。\n\n貴重な資料をご提供いただき、ありがとうございました。\n大変参考になります。\n\n今後ともよろしくお願いいたします。'),
  
  createTemplate('thanks_casual_01', 'ありがとうございます', 'thanks', 'casual',
    'ありがとうございます！\n\nとても助かります。\nまた何かあればよろしくお願いします。'),
  
  createTemplate('thanks_polite_01', '深謝申し上げます', 'thanks', 'polite',
    'いつもお世話になっております。\n\nこの度は貴重なお時間を割いてご対応いただき、心より感謝申し上げます。\n\n今後ともご指導のほど、何卒よろしくお願い申し上げます。'),

  // 依頼・質問系
  createTemplate('request_business_01', '資料の確認依頼', 'request', 'business',
    'お疲れ様です。\n\n添付の資料をご確認いただけますでしょうか。\nご不明な点がございましたら、お気軽にお声がけください。\n\nよろしくお願いいたします。'),
  
  createTemplate('request_casual_01', 'ちょっとお聞きしたいことが', 'request', 'casual',
    'お疲れ様です！\n\n1つ質問があります。\nお時間のある時に教えていただけますか？\n\nよろしくお願いします。'),
  
  createTemplate('request_polite_01', 'ご確認のお願い', 'request', 'polite',
    'いつもお世話になっております。\n\nお忙しい中恐れ入りますが、ご確認いただきたい件がございます。\nお手すきの際にご対応いただければ幸いです。\n\n何卒よろしくお願い申し上げます。'),

  // お断り・謝罪系
  createTemplate('decline_business_01', '申し訳ございません', 'decline', 'business',
    'お疲れ様です。\n\nせっかくのお誘いですが、都合により参加が難しい状況です。\n申し訳ございません。\n\n次の機会がございましたら、ぜひよろしくお願いいたします。'),
  
  createTemplate('decline_casual_01', 'ごめんなさい', 'decline', 'casual',
    'お疲れ様です。\n\nごめんなさい、その日は予定が入っていて参加できません。\nまた次の機会によろしくお願いします。'),
  
  createTemplate('decline_polite_01', '深くお詫び申し上げます', 'decline', 'polite',
    'いつもお世話になっております。\n\nせっかくのお誘いをいただきながら、都合により参加が叶いません。\n深くお詫び申し上げます。\n\n次回の機会がございましたら、ぜひお声がけいただければと存じます。'),

  // 会議・打ち合わせ系
  createTemplate('meeting_business_01', '会議日程調整', 'meeting', 'business',
    'お疲れ様です。\n\n会議の件でご連絡いたします。\n以下の日程でいかがでしょうか。\n\n・〇月〇日（〇）〇時～\n・〇月〇日（〇）〇時～\n\nご都合をお聞かせください。'),
  
  createTemplate('meeting_casual_01', '打ち合わせしませんか', 'meeting', 'casual',
    'お疲れ様です！\n\n一度打ち合わせしませんか？\n来週のご都合はいかがですか？\n\nお時間のある時にお聞かせください。'),
  
  createTemplate('meeting_polite_01', 'お打ち合わせのお願い', 'meeting', 'polite',
    'いつもお世話になっております。\n\nお忙しい中恐れ入りますが、お打ち合わせのお時間をいただければと存じます。\nご都合のよろしい日程をお聞かせいただけますでしょうか。\n\n何卒よろしくお願い申し上げます。'),

  // フォローアップ系
  createTemplate('follow_business_01', '進捗確認', 'follow_up', 'business',
    'お疲れ様です。\n\n先日の件について、進捗はいかがでしょうか。\nご不明な点がございましたら、お気軽にご連絡ください。\n\nよろしくお願いいたします。'),
  
  createTemplate('follow_casual_01', '調子はどうですか', 'follow_up', 'casual',
    'お疲れ様です！\n\n例の件、調子はどうですか？\n何かあればいつでも連絡してくださいね。'),
  
  createTemplate('follow_polite_01', 'ご進捗のお伺い', 'follow_up', 'polite',
    'いつもお世話になっております。\n\n先日お願いいたしました件について、ご進捗をお伺いできればと存じます。\nお忙しい中恐れ入りますが、よろしくお願い申し上げます。')
];

// カテゴリ別にテンプレートを取得
export const getTemplatesByCategory = (category: TemplateCategory): ReplyTemplate[] => {
  return DEFAULT_TEMPLATES.filter(template => template.category === category);
};

// 語調別にテンプレートを取得
export const getTemplatesByTone = (tone: ReplyTone): ReplyTemplate[] => {
  return DEFAULT_TEMPLATES.filter(template => template.tone === tone);
};

// カテゴリと語調でテンプレートを取得
export const getTemplatesByCategoryAndTone = (category: TemplateCategory, tone: ReplyTone): ReplyTemplate[] => {
  return DEFAULT_TEMPLATES.filter(template => 
    template.category === category && template.tone === tone
  );
}; 