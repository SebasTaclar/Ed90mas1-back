import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getCategoryService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';

const funcDeleteCategory = async (
  context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  log.logInfo(`Deleting category - Requested by: ${user.email} (Role: ${user.role})`);

  // Verificar permisos basados en el rol del usuario autenticado
  if (user.role !== 'admin') {
    return ApiResponseBuilder.error('Forbidden: Only admins can delete categories', 403);
  }

  // Obtener el ID de la categoría desde los parámetros de la URL
  const categoryId = parseInt(req.params?.id);
  if (!categoryId || categoryId <= 0) {
    return ApiResponseBuilder.error('Valid category ID is required', 400);
  }

  const categoryService = getCategoryService(log);
  await categoryService.deleteCategory(categoryId);
  return ApiResponseBuilder.success(null, 'Category deleted successfully');
};

export default withAuthenticatedApiHandler(funcDeleteCategory);
