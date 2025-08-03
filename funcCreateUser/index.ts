import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getAuthService } from '../src/shared/serviceProvider';

const funcCreateUser = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const authService = getAuthService(log);
  const userInfo = await authService.createUser(req.body);
  return ApiResponseBuilder.success(userInfo, 'User created successfully');
};

export default withApiHandler(funcCreateUser);
