import { PrismaClient } from '@prisma/client';
import { ICategoryDataSource } from '../../domain/interfaces/ICategoryDataSource';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../domain/entities/Category';
import { Logger } from '../../shared/Logger';
import { ConflictError, NotFoundError } from '../../shared/exceptions';

export class CategoryPrismaAdapter implements ICategoryDataSource {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  async create(categoryData: CreateCategoryRequest): Promise<Category> {
    try {
      this.logger.logInfo('Creating new category', { name: categoryData.name });

      const category = await this.prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
        },
      });

      this.logger.logInfo('Category created successfully', {
        id: category.id,
        name: category.name,
      });
      return category;
    } catch (error) {
      this.logger.logError('Error creating category', error);
      if (error.code === 'P2002') {
        throw new ConflictError('Category name already exists');
      }
      throw new Error('Failed to create category');
    }
  }

  async findById(id: number): Promise<Category | null> {
    try {
      this.logger.logInfo('Finding category by ID', { id });

      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      return category;
    } catch (error) {
      this.logger.logError('Error finding category by ID', error);
      throw new Error('Failed to find category');
    }
  }

  async findByName(name: string): Promise<Category | null> {
    try {
      this.logger.logInfo('Finding category by name', { name });

      const category = await this.prisma.category.findUnique({
        where: { name },
      });

      return category;
    } catch (error) {
      this.logger.logError('Error finding category by name', error);
      throw new Error('Failed to find category');
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      this.logger.logInfo('Finding all categories');

      const categories = await this.prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
      });

      this.logger.logInfo('Categories retrieved successfully', { count: categories.length });
      return categories;
    } catch (error) {
      this.logger.logError('Error finding all categories', error);
      throw new Error('Failed to retrieve categories');
    }
  }

  async update(id: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    try {
      this.logger.logInfo('Updating category', { id, data: categoryData });

      const category = await this.prisma.category.update({
        where: { id },
        data: categoryData,
      });

      this.logger.logInfo('Category updated successfully', { id: category.id });
      return category;
    } catch (error) {
      this.logger.logError('Error updating category', error);
      if (error.code === 'P2002') {
        throw new ConflictError('Category name already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundError('Category not found');
      }
      throw new Error('Failed to update category');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      this.logger.logInfo('Deleting category', { id });

      await this.prisma.category.delete({
        where: { id },
      });

      this.logger.logInfo('Category deleted successfully', { id });
    } catch (error) {
      this.logger.logError('Error deleting category', error);
      if (error.code === 'P2025') {
        throw new NotFoundError('Category not found');
      }
      throw new Error('Failed to delete category');
    }
  }
}
