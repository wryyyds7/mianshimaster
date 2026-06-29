import fs from 'fs/promises';
import path from 'path';

/**
 * 文件内容提取结果
 */
export interface ParsedContent {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount?: number;
  };
}

/**
 * 提取文件文本内容（支持 PDF、Word、TXT、Markdown）
 */
export async function parseFile(filePath: string): Promise<ParsedContent> {
  const stat = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  let text = '';

  switch (ext) {
    case '.txt':
    case '.md':
    case '.markdown':
      text = await fs.readFile(filePath, 'utf-8');
      break;

    case '.pdf':
      text = await parsePdf(filePath);
      break;

    case '.docx':
      text = await parseDocx(filePath);
      break;

    case '.doc':
      // .doc 格式需要额外工具（如 antiword），暂仅提示
      text =
        '[旧版 .doc 格式暂不支持文本提取，请转换为 .docx 或 PDF 后重试]';
      break;

    default:
      text =
        `[不支持的文件格式: ${ext}，支持的格式: .txt, .md, .pdf, .docx]`;
  }

  const wordCount = text
    ? text.replace(/[\s\n\r]+/g, ' ').trim().split(/\s+/).length
    : 0;

  return {
    text,
    metadata: {
      fileName,
      fileType: ext.replace('.', ''),
      fileSize: stat.size,
      wordCount,
    },
  };
}

/**
 * 解析 PDF 文件为纯文本
 */
async function parsePdf(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch {
    // PDF 解析库可能不可用，返回提示
    return '[PDF 解析失败：请确保 pdf-parse 已安装，或文件未被加密]';
  }
}

/**
 * 解析 DOCX 文件为纯文本
 */
async function parseDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch {
    return '[DOCX 解析失败：请确保 mammoth 已安装]';
  }
}
