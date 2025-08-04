import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getCategoryService } from '../src/shared/serviceProvider';

const funcGetCategories = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  log.logInfo('Getting all categories - Public endpoint');

  const categoryService = getCategoryService(log);
  const categories = await categoryService.getAllCategories();

  return ApiResponseBuilder.success(categories, 'Categories retrieved successfully');
};

export default withApiHandler(funcGetCategories);
