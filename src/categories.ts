// ============================================================
// MoneyMate API — Categories Service
// ============================================================

import { Category, ApiError } from './types';
import { store } from './store';
import { logger } from './logger';

export interface ICategoryRepository {
  findAll(): Category[];
  findById(id: string): Category | undefined;
  findByName(name: string): Category | undefined;
}

export class CategoryRepository implements ICategoryRepository {
  findAll(): Category[] {
    return store.categories;
  }

  findById(id: string): Category | undefined {
    return store.categories.find(c => c.id === id);
  }

  findByName(name: string): Category | undefined {
    return store.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
  }
}

export class CategoryService {
  constructor(private readonly repo: ICategoryRepository) {}

  getAll(): Category[] {
    logger.info('Fetching all categories');
    return this.repo.findAll();
  }

  getById(id: string): Category | ApiError {
    const category = this.repo.findById(id);
    if (!category) {
      return { error: 'Category not found', code: 'NOT_FOUND', statusCode: 404 };
    }
    return category;
  }
}

export const categoryService = new CategoryService(new CategoryRepository());
