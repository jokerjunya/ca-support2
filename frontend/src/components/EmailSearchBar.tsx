'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Paperclip, ChevronDown } from 'lucide-react';

export interface SearchFilters {
  query: string;
  sender: string;
  subject: string;
  hasAttachment: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  isRead?: boolean;
  isImportant?: boolean;
}

interface EmailSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  initialFilters?: Partial<SearchFilters>;
}

export default function EmailSearchBar({ onSearch, onClear, initialFilters }: EmailSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sender: '',
    subject: '',
    hasAttachment: false,
    dateRange: { start: '', end: '' },
    isRead: undefined,
    isImportant: undefined,
    ...initialFilters
  });
  
  const searchRef = useRef<HTMLDivElement>(null);

  // 外側クリックで検索バーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    setIsExpanded(false);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      sender: '',
      subject: '',
      hasAttachment: false,
      dateRange: { start: '', end: '' },
      isRead: undefined,
      isImportant: undefined
    });
    onClear();
  };

  const hasActiveFilters = filters.query || filters.sender || filters.subject || 
                          filters.hasAttachment || filters.dateRange.start || 
                          filters.dateRange.end || filters.isRead !== undefined || 
                          filters.isImportant !== undefined;

  return (
    <div ref={searchRef} className="relative">
      {/* メイン検索バー */}
      <div className="relative">
        <div className="flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-spotify-light-gray" />
          <input
            type="text"
            placeholder="メールを検索..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-20 py-2 bg-spotify-dark-gray text-white placeholder-spotify-light-gray border border-spotify-gray rounded-lg focus:border-spotify-green focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-colors ${
                isExpanded ? 'bg-spotify-green text-black' : 'hover:bg-spotify-gray text-spotify-light-gray'
              }`}
              title="高度な検索"
            >
              <Filter className="w-4 h-4" />
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClear}
                className="p-2 rounded-lg hover:bg-spotify-gray text-spotify-light-gray"
                title="フィルターをクリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* 検索ボタン */}
        {(isExpanded || hasActiveFilters) && (
          <button
            onClick={handleSearch}
            className="absolute right-2 top-full mt-2 px-4 py-2 bg-spotify-green text-black rounded-lg hover:bg-spotify-green-hover transition-colors font-semibold"
          >
            検索
          </button>
        )}
      </div>

      {/* 高度な検索フィルター */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-spotify-dark-gray border border-spotify-gray rounded-lg shadow-lg p-4 z-10">
          <div className="space-y-4">
            {/* 送信者フィルター */}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-spotify-light-gray" />
              <label className="text-sm text-spotify-light-gray min-w-16">送信者:</label>
              <input
                type="text"
                placeholder="yamada@example.com"
                value={filters.sender}
                onChange={(e) => handleFilterChange('sender', e.target.value)}
                className="flex-1 px-3 py-2 bg-spotify-dark text-white placeholder-spotify-light-gray border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              />
            </div>

            {/* 件名フィルター */}
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-spotify-light-gray" />
              <label className="text-sm text-spotify-light-gray min-w-16">件名:</label>
              <input
                type="text"
                placeholder="会議について"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="flex-1 px-3 py-2 bg-spotify-dark text-white placeholder-spotify-light-gray border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              />
            </div>

            {/* 日付範囲フィルター */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-spotify-light-gray" />
              <label className="text-sm text-spotify-light-gray min-w-16">期間:</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="px-3 py-2 bg-spotify-dark text-white border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              />
              <span className="text-spotify-light-gray">〜</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="px-3 py-2 bg-spotify-dark text-white border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              />
            </div>

            {/* チェックボックスフィルター */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasAttachment}
                  onChange={(e) => handleFilterChange('hasAttachment', e.target.checked)}
                  className="rounded text-spotify-green focus:ring-spotify-green"
                />
                <Paperclip className="w-4 h-4 text-spotify-light-gray" />
                <span className="text-sm text-spotify-light-gray">添付ファイル有り</span>
              </label>
            </div>

            {/* 読み取り状態フィルター */}
            <div className="flex items-center space-x-4">
              <label className="text-sm text-spotify-light-gray min-w-16">状態:</label>
              <select
                value={filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread'}
                onChange={(e) => handleFilterChange('isRead', 
                  e.target.value === 'all' ? undefined : e.target.value === 'read'
                )}
                className="px-3 py-2 bg-spotify-dark text-white border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              >
                <option value="all">すべて</option>
                <option value="unread">未読のみ</option>
                <option value="read">既読のみ</option>
              </select>
              
              <select
                value={filters.isImportant === undefined ? 'all' : filters.isImportant ? 'important' : 'normal'}
                onChange={(e) => handleFilterChange('isImportant', 
                  e.target.value === 'all' ? undefined : e.target.value === 'important'
                )}
                className="px-3 py-2 bg-spotify-dark text-white border border-spotify-gray rounded focus:border-spotify-green focus:outline-none"
              >
                <option value="all">すべて</option>
                <option value="important">重要のみ</option>
                <option value="normal">通常のみ</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 