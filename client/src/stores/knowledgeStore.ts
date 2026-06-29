import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IKnowledgeItem } from '@shared/types';

interface KnowledgeState {
  items: IKnowledgeItem[];
  categories: string[];
  selectedCategory: string | null;
  searchQuery: string;
  editingItem: IKnowledgeItem | null;
  isLoading: boolean;

  setItems: (items: IKnowledgeItem[]) => void;
  addItem: (item: IKnowledgeItem) => void;
  updateItem: (id: string, updates: Partial<IKnowledgeItem>) => void;
  deleteItem: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setEditingItem: (item: IKnowledgeItem | null) => void;
  setLoading: (loading: boolean) => void;

  // 计算属性
  getFilteredItems: () => IKnowledgeItem[];
  getCategories: () => string[];
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      items: [],
      categories: [],
      selectedCategory: null,
      searchQuery: '',
      editingItem: null,
      isLoading: false,

      setItems: (items) => {
        const categories = [...new Set(items.map((i) => i.category))];
        set({ items, categories });
      },

      addItem: (item) =>
        set((state) => {
          const newCategories = state.categories.includes(item.category)
            ? state.categories
            : [...state.categories, item.category];
          return {
            items: [item, ...state.items],
            categories: newCategories,
          };
        }),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
          ),
        })),

      deleteItem: (id) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== id);
          const newCategories = [...new Set(newItems.map((i) => i.category))];
          return { items: newItems, categories: newCategories };
        }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setEditingItem: (item) => set({ editingItem: item }),
      setLoading: (loading) => set({ isLoading: loading }),

      getFilteredItems: () => {
        const { items, selectedCategory, searchQuery } = get();
        let filtered = items;

        if (selectedCategory) {
          filtered = filtered.filter((i) => i.category === selectedCategory);
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.content.toLowerCase().includes(q) ||
              i.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        return filtered;
      },

      getCategories: () => get().categories,
    }),
    {
      name: 'mianshimaster-knowledge',
      partialize: (state) => ({ items: state.items, categories: state.categories }),
    }
  )
);
