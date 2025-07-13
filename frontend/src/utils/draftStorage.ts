export interface DraftEmail {
  id: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  replyType: 'business' | 'casual' | 'polite';
  isReply: boolean;
  originalEmailId?: string;
  createdAt: string;
  updatedAt: string;
}

const DRAFT_STORAGE_KEY = 'gmail-assistant-drafts';

/**
 * 下書きを保存
 */
export const saveDraft = (draft: Omit<DraftEmail, 'id' | 'createdAt' | 'updatedAt'>): string => {
  try {
    const drafts = getAllDrafts();
    const id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newDraft: DraftEmail = {
      id,
      ...draft,
      createdAt: now,
      updatedAt: now
    };
    
    drafts.push(newDraft);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    
    console.log('💾 下書き保存完了:', id);
    return id;
  } catch (error) {
    console.error('下書き保存エラー:', error);
    throw new Error('下書きの保存に失敗しました');
  }
};

/**
 * 下書きを更新
 */
export const updateDraft = (id: string, updates: Partial<Omit<DraftEmail, 'id' | 'createdAt'>>): void => {
  try {
    const drafts = getAllDrafts();
    const index = drafts.findIndex(draft => draft.id === id);
    
    if (index === -1) {
      throw new Error('下書きが見つかりません');
    }
    
    drafts[index] = {
      ...drafts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    console.log('💾 下書き更新完了:', id);
  } catch (error) {
    console.error('下書き更新エラー:', error);
    throw new Error('下書きの更新に失敗しました');
  }
};

/**
 * 下書きを取得
 */
export const getDraft = (id: string): DraftEmail | null => {
  try {
    const drafts = getAllDrafts();
    return drafts.find(draft => draft.id === id) || null;
  } catch (error) {
    console.error('下書き取得エラー:', error);
    return null;
  }
};

/**
 * 全ての下書きを取得
 */
export const getAllDrafts = (): DraftEmail[] => {
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return [];
    
    const drafts = JSON.parse(stored) as DraftEmail[];
    
    // 古い下書きを自動削除（30日以上）
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffTime = cutoffDate.getTime();
    
    const validDrafts = drafts.filter(draft => {
      const draftTime = new Date(draft.createdAt).getTime();
      return draftTime > cutoffTime;
    });
    
    // 変更があった場合は保存
    if (validDrafts.length !== drafts.length) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(validDrafts));
    }
    
    return validDrafts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('下書き一覧取得エラー:', error);
    return [];
  }
};

/**
 * 下書きを削除
 */
export const deleteDraft = (id: string): void => {
  try {
    const drafts = getAllDrafts();
    const filteredDrafts = drafts.filter(draft => draft.id !== id);
    
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filteredDrafts));
    console.log('🗑️ 下書き削除完了:', id);
  } catch (error) {
    console.error('下書き削除エラー:', error);
    throw new Error('下書きの削除に失敗しました');
  }
};

/**
 * 全ての下書きを削除
 */
export const clearAllDrafts = (): void => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    console.log('🗑️ 全下書き削除完了');
  } catch (error) {
    console.error('全下書き削除エラー:', error);
    throw new Error('下書きの削除に失敗しました');
  }
};

/**
 * 自動保存用のデバウンス関数
 */
export const createAutoSave = (
  draftId: string | null,
  getDraftData: () => Omit<DraftEmail, 'id' | 'createdAt' | 'updatedAt'>,
  setDraftId: (id: string) => void,
  delay: number = 2000
) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const draftData = getDraftData();
        
        // 空の下書きは保存しない
        if (!draftData.to.trim() && !draftData.subject.trim() && !draftData.body.trim()) {
          return;
        }
        
        if (draftId) {
          updateDraft(draftId, draftData);
        } else {
          const newId = saveDraft(draftData);
          setDraftId(newId);
        }
      } catch (error) {
        console.error('自動保存エラー:', error);
      }
    }, delay);
  };
};

/**
 * ストレージの使用状況を取得
 */
export const getStorageInfo = () => {
  try {
    const drafts = getAllDrafts();
    const storageData = localStorage.getItem(DRAFT_STORAGE_KEY) || '';
    const sizeInBytes = new Blob([storageData]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024 * 100) / 100;
    
    return {
      draftCount: drafts.length,
      storageSize: `${sizeInKB} KB`,
      oldestDraft: drafts.length > 0 ? drafts[drafts.length - 1].createdAt : null,
      newestDraft: drafts.length > 0 ? drafts[0].updatedAt : null
    };
  } catch (error) {
    console.error('ストレージ情報取得エラー:', error);
    return {
      draftCount: 0,
      storageSize: '0 KB',
      oldestDraft: null,
      newestDraft: null
    };
  }
}; 