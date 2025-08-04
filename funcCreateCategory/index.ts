import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getCategoryService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcCreateCategory = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Creating category - Requested by: ${user.email} (Role: ${user.role})`);

  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can create categories', 403);
  }

  const categoryService = getCategoryService(log);
  const category = await categoryService.createCategory(req.body);
  return ApiResponseBuilder.success(category, 'Category created successfully');
};

export default withAuthenticatedApiHandler(funcCreateCategory);
