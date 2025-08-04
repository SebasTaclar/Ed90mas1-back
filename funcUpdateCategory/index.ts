import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getCategoryService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcUpdateCategory = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Updating category - Requested by: ${user.email} (Role: ${user.role})`);

  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can update categories', 403);
  }

  const categoryId = parseInt(req.params?.id);
  if (!categoryId || categoryId <= 0) {
    return ApiResponseBuilder.error('Valid category ID is required', 400);
  }

  const categoryService = getCategoryService(log);
  const category = await categoryService.updateCategory(categoryId, req.body);
  return ApiResponseBuilder.success(category, 'Category updated successfully');
};

export default withAuthenticatedApiHandler(funcUpdateCategory);
