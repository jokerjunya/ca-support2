'use client';

import { Download, FileText, File, Image, Archive, Music, Video, FileSpreadsheet, FileX } from 'lucide-react';
import { EmailAttachment } from '../types/email';

interface AttachmentListProps {
  attachments: EmailAttachment[];
  emailId: string;
  onDownload?: (attachment: EmailAttachment) => void;
}

export default function AttachmentList({ attachments, emailId, onDownload }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (mimeType: string) => {
    const iconProps = { className: "w-5 h-5" };
    
    if (mimeType.startsWith('image/')) {
      return <Image {...iconProps} className="w-5 h-5 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video {...iconProps} className="w-5 h-5 text-red-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music {...iconProps} className="w-5 h-5 text-green-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText {...iconProps} className="w-5 h-5 text-red-600" />;
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet {...iconProps} className="w-5 h-5 text-green-600" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      return <Archive {...iconProps} className="w-5 h-5 text-yellow-600" />;
    } else if (mimeType.includes('text/')) {
      return <FileText {...iconProps} className="w-5 h-5 text-gray-500" />;
    } else {
      return <File {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDescription = (mimeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF文書',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文書',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel文書',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint文書',
      'application/zip': 'ZIP圧縮ファイル',
      'application/x-rar-compressed': 'RAR圧縮ファイル',
      'text/plain': 'テキストファイル',
      'text/csv': 'CSVファイル',
      'image/jpeg': 'JPEG画像',
      'image/png': 'PNG画像',
      'image/gif': 'GIF画像',
      'video/mp4': 'MP4動画',
      'audio/mpeg': 'MP3音声',
    };
    
    return typeMap[mimeType] || 'ファイル';
  };

  const handleDownload = async (attachment: EmailAttachment) => {
    if (onDownload) {
      onDownload(attachment);
      return;
    }

    try {
      console.log(`📎 添付ファイルダウンロード開始: ${attachment.filename}`);
      
      const response = await fetch(`/api/emails/${emailId}/attachments/${attachment.attachmentId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました');
      }

      // ファイルのダウンロード
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ 添付ファイルダウンロード完了: ${attachment.filename}`);
    } catch (error) {
      console.error('添付ファイルダウンロードエラー:', error);
      alert('添付ファイルのダウンロードに失敗しました。');
    }
  };

  return (
    <div className="bg-spotify-gray rounded-lg p-4 border border-spotify-light-gray">
      <div className="flex items-center space-x-2 mb-3">
        <svg className="w-4 h-4 text-spotify-light-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span className="text-sm font-medium text-spotify-light-gray">
          添付ファイル ({attachments.length}件)
        </span>
      </div>
      
      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div
            key={`${attachment.attachmentId}-${index}`}
            className="flex items-center justify-between p-3 bg-spotify-dark-gray rounded-lg hover:bg-spotify-gray transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(attachment.mimeType)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white truncate">
                    {attachment.filename}
                  </p>
                  <span className="text-xs text-spotify-light-gray bg-spotify-gray px-2 py-1 rounded">
                    {getFileTypeDescription(attachment.mimeType)}
                  </span>
                </div>
                <p className="text-xs text-spotify-light-gray">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDownload(attachment)}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-spotify-green hover:bg-spotify-green-hover text-black rounded-lg transition-colors font-medium"
            >
              <Download className="w-3 h-3" />
              <span>ダウンロード</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 