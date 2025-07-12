'use client';

import { useState } from 'react';
import { ReplyTemplate, TemplateCategory, ReplyTone, TEMPLATE_CATEGORIES } from '../types/template';
import { DEFAULT_TEMPLATES, getTemplatesByCategoryAndTone } from '../data/templates';

interface TemplateSelectorProps {
  currentTone: ReplyTone;
  onTemplateSelect: (template: ReplyTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({ currentTone, onTemplateSelect, onClose }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('confirmation');
  const [previewTemplate, setPreviewTemplate] = useState<ReplyTemplate | null>(null);

  // 現在の語調とカテゴリに基づいてテンプレートを取得
  const availableTemplates = getTemplatesByCategoryAndTone(selectedCategory, currentTone);

  const handleTemplateClick = (template: ReplyTemplate) => {
    setPreviewTemplate(template);
  };

  const handleTemplateSelect = (template: ReplyTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-spotify-dark-gray rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden">
        {/* ヘッダー */}
        <div className="absolute top-0 left-0 right-0 bg-spotify-dark border-b border-spotify-gray p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">返信テンプレート選択</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-spotify-light-gray">
                現在の語調: {currentTone === 'business' && '💼 ビジネス'}
                {currentTone === 'casual' && '😊 カジュアル'}
                {currentTone === 'polite' && '🙏 丁寧語'}
              </span>
              <button
                onClick={onClose}
                className="text-spotify-light-gray hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex w-full pt-20">
          {/* カテゴリ選択 */}
          <div className="w-1/4 bg-spotify-dark border-r border-spotify-gray p-4">
            <h3 className="text-lg font-semibold text-white mb-4">カテゴリ</h3>
            <div className="space-y-2">
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as TemplateCategory)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === key
                      ? 'bg-spotify-green text-black font-semibold'
                      : 'text-spotify-light-gray hover:bg-spotify-gray hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.emoji}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs opacity-75">{category.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* テンプレート一覧 */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {TEMPLATE_CATEGORIES[selectedCategory].emoji} {TEMPLATE_CATEGORIES[selectedCategory].name}
            </h3>
            
            {availableTemplates.length === 0 ? (
              <div className="text-center text-spotify-light-gray py-8">
                <p>この語調に対応したテンプレートがありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      previewTemplate?.id === template.id
                        ? 'border-spotify-green bg-spotify-green bg-opacity-10'
                        : 'border-spotify-gray hover:border-spotify-green hover:bg-spotify-gray hover:bg-opacity-30'
                    }`}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{template.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                        className="px-3 py-1 bg-spotify-green text-black text-sm rounded font-semibold hover:bg-spotify-green-hover transition-colors"
                      >
                        使用
                      </button>
                    </div>
                    <p className="text-sm text-spotify-light-gray overflow-hidden">
                      <span className="line-clamp-2 block">
                        {template.content.substring(0, 100)}...
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* プレビュー */}
          <div className="w-1/4 p-4 border-l border-spotify-gray">
            <h3 className="text-lg font-semibold text-white mb-4">プレビュー</h3>
            
            {previewTemplate ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">{previewTemplate.title}</h4>
                  <div className="flex items-center space-x-2 text-sm text-spotify-light-gray mb-4">
                    <span className="bg-spotify-gray px-2 py-1 rounded">
                      {previewTemplate.tone === 'business' && '💼 ビジネス'}
                      {previewTemplate.tone === 'casual' && '😊 カジュアル'}
                      {previewTemplate.tone === 'polite' && '🙏 丁寧語'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-spotify-dark p-4 rounded-lg border border-spotify-gray">
                  <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                    {previewTemplate.content}
                  </pre>
                </div>
                
                <button
                  onClick={() => handleTemplateSelect(previewTemplate)}
                  className="w-full px-4 py-3 bg-spotify-green text-black font-semibold rounded-lg hover:bg-spotify-green-hover transition-colors"
                >
                  このテンプレートを使用
                </button>
              </div>
            ) : (
              <div className="text-center text-spotify-light-gray py-8">
                <p>テンプレートを選択してプレビューを表示</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 