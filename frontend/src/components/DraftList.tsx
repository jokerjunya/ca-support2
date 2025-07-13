'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, Trash2, Edit3, X } from 'lucide-react';
import { DraftEmail, getAllDrafts, deleteDraft, getStorageInfo } from '../utils/draftStorage';

interface DraftListProps {
  onLoadDraft: (draftId: string) => void;
  onClose: () => void;
}

export default function DraftList({ onLoadDraft, onClose }: DraftListProps) {
  const [drafts, setDrafts] = useState<DraftEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // 下書き一覧を読み込み
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const allDrafts = getAllDrafts();
      const info = getStorageInfo();
      setDrafts(allDrafts);
      setStorageInfo(info);
    } catch (error) {
      console.error('下書き読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('この下書きを削除しますか？')) {
      try {
        deleteDraft(draftId);
        loadDrafts(); // リストを更新
        console.log('🗑️ 下書き削除完了:', draftId);
      } catch (error) {
        console.error('下書き削除エラー:', error);
        alert('下書きの削除に失敗しました。');
      }
    }
  };

  const handleLoadDraft = (draftId: string) => {
    onLoadDraft(draftId);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨日 ' + date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-spotify-dark-gray rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green mx-auto"></div>
          <p className="text-white text-center mt-4">下書きを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-spotify-dark-gray rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-spotify-dark border-b border-spotify-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">下書き一覧</h2>
              {storageInfo && (
                <p className="text-sm text-spotify-light-gray">
                  {storageInfo.draftCount}件の下書き ({storageInfo.storageSize})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-spotify-light-gray hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 下書き一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-spotify-light-gray mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">下書きがありません</h3>
              <p className="text-spotify-light-gray">
                メール作成時に自動保存された下書きがここに表示されます。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft.id)}
                  className="group p-4 bg-spotify-gray rounded-lg hover:bg-spotify-light-gray transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* ヘッダー情報 */}
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {draft.isReply ? (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              返信
                            </span>
                          ) : (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              新規
                            </span>
                          )}
                          <span className="text-xs bg-spotify-dark-gray text-spotify-light-gray px-2 py-1 rounded">
                            {draft.replyType === 'business' && '💼 ビジネス'}
                            {draft.replyType === 'casual' && '😊 カジュアル'}
                            {draft.replyType === 'polite' && '🙏 丁寧語'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-spotify-light-gray">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatDate(draft.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* 宛先 */}
                      {draft.to && (
                        <p className="text-sm text-spotify-light-gray mb-1">
                          宛先: <span className="text-white">{truncateText(draft.to)}</span>
                        </p>
                      )}

                      {/* 件名 */}
                      <p className="text-sm font-medium text-white mb-2">
                        {draft.subject || '(件名なし)'}
                      </p>

                      {/* 本文プレビュー */}
                      <p className="text-xs text-spotify-light-gray line-clamp-2">
                        {truncateText(draft.body.replace(/\n/g, ' '), 100)}
                      </p>
                    </div>

                    {/* アクション */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadDraft(draft.id);
                        }}
                        className="p-2 hover:bg-spotify-green/20 rounded transition-colors"
                        title="編集"
                      >
                        <Edit3 className="w-4 h-4 text-spotify-light-gray hover:text-spotify-green" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="p-2 hover:bg-red-500/20 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4 text-spotify-light-gray hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-spotify-dark border-t border-spotify-gray p-4">
          <div className="text-center text-xs text-spotify-light-gray">
            下書きは30日間自動的に保存されます。ストレージ容量: {storageInfo?.storageSize || '0 KB'}
          </div>
        </div>
      </div>
    </div>
  );
} 