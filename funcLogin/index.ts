import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { AuthService } from '../src/application/services/AuthService';

const funcLogin: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const logger = new Logger(context.log);

  try {
    logger.logInfo(`Login request received from ${req.url}`);

    // Crear instancia del servicio de autenticación
    const authService = new AuthService(logger);

    // Procesar login
    const loginResult = await authService.login(req.body);

    if (loginResult.success) {
      context.res = {
        status: 200,
        body: {
          token: loginResult.token,
        },
      };
    } else {
      context.res = {
        status: 401,
        body: {
          error: loginResult.error,
        },
      };
    }
  } catch (error) {
    logger.logError(`Unexpected error in login function: ${error.message}`);
    context.res = {
      status: 500,
      body: {
        error: 'Internal server error',
      },
    };
  }
};

export default funcLogin;
