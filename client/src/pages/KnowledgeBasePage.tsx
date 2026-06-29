import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import KnowledgeEditor from '../components/knowledge/KnowledgeEditor';
import { Plus, Search, Edit, Trash2, BookOpen, FolderTree } from 'lucide-react';
import { cn } from '../utils/cn';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import type { IKnowledgeItem } from '@shared/types';

export default function KnowledgeBasePage() {
  const {
    items, categories, selectedCategory, searchQuery, editingItem,
    addItem, updateItem, deleteItem,
    setSearchQuery, setSelectedCategory, setEditingItem,
    getFilteredItems,
  } = useKnowledgeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredItems = getFilteredItems();

  const handleSaveItem = (item: Partial<IKnowledgeItem>) => {
    if (editingItem) {
      updateItem(editingItem.id, item);
      setEditingItem(null);
    } else {
      const newItem: IKnowledgeItem = {
        id: Date.now().toString(),
        userId: 'local-user',
        title: item.title || '',
        content: item.content || '',
        category: item.category || '未分类',
        tags: item.tags || [],
        sourceFile: null,
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addItem(newItem);
      setIsCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">知识库</h1>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-1" />
            新建条目
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
                !selectedCategory
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
              )}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">知识库为空</p>
            <p className="text-sm mt-1">点击"新建条目"添加知识内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-indigo-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                  {item.content?.replace(/[#*`]/g, '').slice(0, 150)}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <FolderTree className="w-3 h-3" />
                    {item.category}
                  </div>
                  {item.tags?.length > 0 && (
                    <div className="flex gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {(isCreating || editingItem) && (
        <KnowledgeEditor
          item={editingItem || undefined}
          onSave={handleSaveItem}
          onClose={() => {
            setIsCreating(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* 删除确认 */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="确认删除"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            确定要删除这条知识条目吗？此操作不可撤销。
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) deleteItem(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
