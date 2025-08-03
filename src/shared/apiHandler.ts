import { withErrorHandler } from './errorMiddleware';
import { withApiResponse } from './apiResponseMiddleware';
import { withLogger, HandlerWithLogger } from './loggerMiddleware';

/**
 * Middleware compuesto que combina el manejo de errores, formateo de respuestas
 * e inyección de logger automática
 * Uso: export default withApiHandler((context, req, logger) => { ... });
 */
export const withApiHandler = (handler: HandlerWithLogger) => {
  // Aplicamos los middlewares en orden: logger -> errores -> respuesta
  return withApiResponse(withErrorHandler(withLogger(handler)));
};
