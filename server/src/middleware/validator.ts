import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

/**
 * 请求参数校验中间件工厂
 * 支持校验 req.body / req.query / req.params
 */
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new ValidationError(errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * 只校验 body 的简写
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * 只校验 query 的简写
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * 只校验 params 的简写
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
