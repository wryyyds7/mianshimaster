/**
 * 语音输入模块 —— 封装 Web Speech API 及其他 STT 提供商
 * 
 * 当前使用浏览器内置 Web Speech API（免费，无需额外 API Key）
 * 后续可扩展 OpenAI Whisper、腾讯云 ASR 等
 */
import type { ISTTApiConfig } from '@shared/types';

export type STTProvider = 'web-speech' | 'openai-whisper' | 'tencent-asr';

interface STTImpl {
  start(): Promise<void>;
  stop(): Promise<string>;
  abort(): void;
  readonly isSupported: boolean;
}

/**
 * Web Speech API 实现
 * 使用浏览器内置的 SpeechRecognition
 */
class WebSpeechSTT implements STTImpl {
  private recognition: any = null;
  private resolvePromise: ((text: string) => void) | null = null;
  private rejectPromise: ((err: Error) => void) | null = null;

  get isSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  async start(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('当前浏览器不支持语音识别');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.resolvePromise?.(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.rejectPromise?.(new Error(`语音识别错误: ${event.error}`));
    };

    this.recognition.start();
  }

  async stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      if (this.recognition) {
        this.recognition.stop();
      } else {
        reject(new Error('录音未开始'));
      }
    });
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    this.rejectPromise?.(new Error('已取消'));
  }
}

/**
 * OpenAI Whisper API 实现 (占位)
 */
class WhisperSTT implements STTImpl {
  private config: ISTTApiConfig;

  constructor(config: ISTTApiConfig) {
    this.config = config;
  }

  get isSupported(): boolean {
    return true; // 只要网络可达即可
  }

  async start(): Promise<void> {
    // TODO: 实现音频录制 + Whisper API 调用
    throw new Error('Whisper STT 尚未实现');
  }

  async stop(): Promise<string> {
    throw new Error('Whisper STT 尚未实现');
  }

  abort(): void {
    // noop
  }
}

/**
 * 腾讯云 ASR 实现 (占位)
 */
class TencentASR implements STTImpl {
  private config: ISTTApiConfig;

  constructor(config: ISTTApiConfig) {
    this.config = config;
  }

  get isSupported(): boolean {
    return true;
  }

  async start(): Promise<void> {
    throw new Error('腾讯云 ASR 尚未实现');
  }

  async stop(): Promise<string> {
    throw new Error('腾讯云 ASR 尚未实现');
  }

  abort(): void {
    // noop
  }
}

/**
 * STT 工厂
 */
export function createSTT(provider: STTProvider, config: ISTTApiConfig): STTImpl {
  switch (provider) {
    case 'web-speech':
      return new WebSpeechSTT();
    case 'openai-whisper':
      return new WhisperSTT(config);
    case 'tencent-asr':
      return new TencentASR(config);
    default:
      return new WebSpeechSTT();
  }
}

/**
 * 检测当前环境是否支持语音输入
 */
export function isSpeechSupported(): boolean {
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// 扩展 window 类型
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
