import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { IKnowledgeItem } from '@shared/types';

interface KnowledgeEditorProps {
  item?: IKnowledgeItem;
  onSave: (item: Partial<IKnowledgeItem>) => void;
  onClose: () => void;
}

export default function KnowledgeEditor({ item, onSave, onClose }: KnowledgeEditorProps) {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [category, setCategory] = useState(item?.category || '');
  const [tagsInput, setTagsInput] = useState(item?.tags?.join(', ') || '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || '未分类',
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={item ? '编辑知识条目' : '新建知识条目'}
    >
      <div className="p-6 space-y-4">
        <Input
          label="标题"
          placeholder="输入知识标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            内容 (支持 Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="输入知识内容，支持 Markdown 格式..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="分类"
            placeholder="如：前端技术"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="标签 (逗号分隔)"
            placeholder="如：React, JavaScript"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {item ? '保存' : '创建'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
