import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validate = (schema: { body?: Joi.ObjectSchema; query?: Joi.ObjectSchema; params?: Joi.ObjectSchema }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const value = await schema.body.validateAsync(req.body, { abortEarly: false });
        req.body = value;
      }

      if (schema.query) {
        const value = await schema.query.validateAsync(req.query, { abortEarly: false });
        req.query = value;
      }

      if (schema.params) {
        const value = await schema.params.validateAsync(req.params, { abortEarly: false });
        req.params = value;
      }

      next();
    } catch (error: any) {
      if (error instanceof Joi.ValidationError) {
        return res.status(400).json({
          status: 400,
          message: error.details.map((err) => err.message).join(", "),
        });
      }
      next(error);
    }
  };
};
