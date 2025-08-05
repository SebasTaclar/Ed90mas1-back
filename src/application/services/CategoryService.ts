import { ICategoryDataSource } from '../../domain/interfaces/ICategoryDataSource';
import { ITournamentDataSource } from '../../domain/interfaces/ITournamentDataSource';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../domain/entities/Category';
import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError, ConflictError } from '../../shared/exceptions';

export class CategoryService {
  constructor(
    private categoryDataSource: ICategoryDataSource,
    private tournamentDataSource: ITournamentDataSource,
    private logger: Logger
  ) {}

  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    this.logger.logInfo('CategoryService: Creating category', { name: categoryData.name });

    // Validate input
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    if (categoryData.name.trim().length < 2) {
      throw new ValidationError('Category name must be at least 2 characters long');
    }

    if (categoryData.name.trim().length > 100) {
      throw new ValidationError('Category name cannot exceed 100 characters');
    }

    // Check if category name already exists
    const existingCategory = await this.categoryDataSource.findByName(categoryData.name.trim());
    if (existingCategory) {
      throw new ConflictError('Category name already exists');
    }

    const category = await this.categoryDataSource.create({
      name: categoryData.name.trim(),
      description: categoryData.description?.trim(),
    });

    this.logger.logInfo('CategoryService: Category created successfully', { id: category.id });
    return category;
  }

  async getCategoryById(id: number): Promise<Category> {
    this.logger.logInfo('CategoryService: Getting category by ID', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid category ID is required');
    }

    const category = await this.categoryDataSource.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    this.logger.logInfo('CategoryService: Getting all categories');

    const categories = await this.categoryDataSource.findAll();

    this.logger.logInfo('CategoryService: Categories retrieved', { count: categories.length });
    return categories;
  }

  async updateCategory(id: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    this.logger.logInfo('CategoryService: Updating category', { id, data: categoryData });

    if (!id || id <= 0) {
      throw new Error('Valid category ID is required');
    }

    // Validate name if provided
    if (categoryData.name !== undefined) {
      if (!categoryData.name || categoryData.name.trim().length === 0) {
        throw new Error('Category name cannot be empty');
      }

      if (categoryData.name.trim().length < 2) {
        throw new Error('Category name must be at least 2 characters long');
      }

      if (categoryData.name.trim().length > 100) {
        throw new Error('Category name cannot exceed 100 characters');
      }

      // Check if new name already exists (but not for the same category)
      const existingCategory = await this.categoryDataSource.findByName(categoryData.name.trim());
      if (existingCategory && existingCategory.id !== id) {
        throw new Error('Category name already exists');
      }
    }

    // Check if category exists
    const existingCategory = await this.categoryDataSource.findById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    const updateData: UpdateCategoryRequest = {};
    if (categoryData.name !== undefined) {
      updateData.name = categoryData.name.trim();
    }
    if (categoryData.description !== undefined) {
      updateData.description = categoryData.description?.trim();
    }

    const category = await this.categoryDataSource.update(id, updateData);

    this.logger.logInfo('CategoryService: Category updated successfully', { id });
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    this.logger.logInfo('CategoryService: Deleting category', { id });

    if (!id || id <= 0) {
      throw new Error('Valid category ID is required');
    }

    // Check if category exists
    const existingCategory = await this.categoryDataSource.findById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if category is associated with any tournaments
    const associatedTournaments = await this.tournamentDataSource.findByCategory(id);
    if (associatedTournaments.length > 0) {
      const tournamentNames = associatedTournaments.map((t) => t.name).join(', ');
      throw new Error(
        `Cannot delete category "${existingCategory.name}" because it is associated with ${associatedTournaments.length} tournament(s): ${tournamentNames}. Please remove the category from these tournaments first.`
      );
    }

    await this.categoryDataSource.delete(id);

    this.logger.logInfo('CategoryService: Category deleted successfully', { id });
  }
}
