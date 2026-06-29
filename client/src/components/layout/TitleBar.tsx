import React, { useState } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => window.electronAPI?.window.minimize();
  const handleMaximize = async () => {
    const result = await window.electronAPI?.window.maximize();
    setIsMaximized(result ?? false);
  };
  const handleClose = () => window.electronAPI?.window.close();

  return (
    <div className="drag-region h-9 bg-gray-100 dark:bg-gray-950 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 select-none">
      {/* 左侧 - 拖拽区域 */}
      <div className="flex-1 px-3">
        <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">面试大师</span>
      </div>

      {/* 右侧 - 窗口控制按钮 */}
      <div className="no-drag flex h-full">
        <button
          onClick={handleMinimize}
          className="w-10 h-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          {isMaximized ? (
            <Square className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
