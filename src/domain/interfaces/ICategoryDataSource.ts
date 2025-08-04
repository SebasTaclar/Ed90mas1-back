import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../entities/Category';

export interface ICategoryDataSource {
  create(category: CreateCategoryRequest): Promise<Category>;
  findById(id: number): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  update(id: number, category: UpdateCategoryRequest): Promise<Category>;
  delete(id: number): Promise<void>;
}
