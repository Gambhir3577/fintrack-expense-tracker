import { create } from 'zustand';
import { Category } from '../types';
import { db } from '../db';
import { DEFAULT_CATEGORIES } from '../utils/constants';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      let cats = await db.categories.toArray();
      if (cats.length === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES);
        cats = DEFAULT_CATEGORIES;
      }
      set({ categories: cats, isLoading: false });
    } catch (error) {
      console.error('Failed to load categories:', error);
      set({ isLoading: false });
    }
  },

  addCategory: async (categoryData) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isDefault: false,
    };
    await db.categories.put(newCategory);
    set((state) => ({ categories: [...state.categories, newCategory] }));
    return newCategory;
  },

  updateCategory: async (category) => {
    await db.categories.put(category);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === category.id ? category : c)),
    }));
  },

  deleteCategory: async (id) => {
    await db.categories.delete(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  getCategoryById: (id: string) => {
    return get().categories.find((c) => c.id === id);
  },
}));
