import { useState, useCallback } from 'react';

interface UseFileUploadOptions {
  maxSize?: number; // bytes
  accept?: string;
  onComplete?: (text: string, fileName: string) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  fileName: string | null;
}

/**
 * 文件上传 Hook
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxSize = 50 * 1024 * 1024, accept, onComplete, onError } = options;
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    fileName: null,
  });

  const upload = useCallback(
    async (file: File) => {
      if (maxSize && file.size > maxSize) {
        const err = new Error(
          `文件过大，最大支持 ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
        );
        setState((s) => ({ ...s, error: err.message }));
        onError?.(err);
        return;
      }

      setState({
        isUploading: true,
        progress: 0,
        error: null,
        fileName: file.name,
      });

      try {
        const formData = new FormData();
        formData.append('file', file);

        // 使用 XMLHttpRequest 支持进度回调
        const text = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            'POST',
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/files/upload`,
          );

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setState((s) => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              resolve(res.data?.contentText || '');
            } else {
              reject(new Error('上传失败'));
            }
          };

          xhr.onerror = () => reject(new Error('网络错误'));

          // 添加认证头
          const token = localStorage.getItem('mianshimaster-auth');
          if (token) {
            try {
              const parsed = JSON.parse(token);
              if (parsed.state?.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${parsed.state.token}`);
              }
            } catch {}
          }

          xhr.send(formData);
        });

        setState((s) => ({ ...s, isUploading: false, progress: 100 }));
        onComplete?.(text, file.name);
      } catch (err) {
        const error = err as Error;
        setState((s) => ({
          ...s,
          isUploading: false,
          error: error.message,
        }));
        onError?.(error);
      }
    },
    [maxSize, onComplete, onError],
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      fileName: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}
