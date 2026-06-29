import path from 'path';
import fs from 'fs';
// 实际项目中安装: npm install pdf-parse mammoth
// import pdfParse from 'pdf-parse';
// import mammoth from 'mammoth';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

export const fileService = {
  validateExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  },

  async parseContent(filePath: string, originalName: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();

    switch (ext) {
      case '.txt':
      case '.md':
        return fs.readFileSync(filePath, 'utf-8');

      case '.pdf':
        // TODO: 安装 pdf-parse 后启用
        // const pdfData = await pdfParse(fs.readFileSync(filePath));
        // return pdfData.text;
        return `[PDF文件内容: ${originalName}] (需要安装 pdf-parse 解析)`;

      case '.docx':
        // TODO: 安装 mammoth 后启用
        // const result = await mammoth.extractRawText({ path: filePath });
        // return result.value;
        return `[Word文件内容: ${originalName}] (需要安装 mammoth 解析)`;

      default:
        return '';
    }
  },
};
