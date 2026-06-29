import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Upload, X, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '../../utils/constants';
import type { IFileInfo } from '@shared/types';

interface FileUploaderProps {
  onComplete: (files: IFileInfo[], contextText: string) => void;
  onCancel: () => void;
}

export default function FileUploader({ onComplete, onCancel }: FileUploaderProps) {
  const [files, setFiles] = useState<IFileInfo[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setError(null);

    const newFiles: IFileInfo[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // 检查扩展名
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        setError(`不支持的文件类型: ${file.name}`);
        return;
      }

      // 检查大小
      if (file.size > MAX_FILE_SIZE) {
        setError(`文件过大: ${file.name} (最大50MB)`);
        return;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // 移除文件
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 解析文件内容
  const handleParseAndContinue = async () => {
    if (files.length === 0) return;
    setIsParsing(true);
    setError(null);

    try {
      // TODO: 实际项目中使用 electron ipc 或 Web API 解析文件
      // 这里用模拟内容
      const contextText = files
        .map((f) => `[文件: ${f.name}]\n(文件内容解析中...)\n`)
        .join('\n---\n');

      // 模拟解析延迟
      await new Promise((r) => setTimeout(r, 500));

      onComplete(files, contextText);
    } catch (err) {
      setError('文件解析失败，请重试');
      setIsParsing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <label
        className={cn(
          'flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500',
          'bg-gray-50 dark:bg-gray-800/50'
        )}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          拖拽文件到此处或<span className="text-indigo-600 dark:text-indigo-400">点击上传</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          支持 PDF、Word、TXT、Markdown（最大50MB）
        </p>
      </label>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 已选文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            已选择 {files.length} 个文件
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isParsing}>
          取消
        </Button>
        <Button
          onClick={handleParseAndContinue}
          disabled={files.length === 0 || isParsing}
          isLoading={isParsing}
          className="flex-1"
        >
          {isParsing ? '解析中...' : '开始回答'}
        </Button>
      </div>
    </div>
  );
}
