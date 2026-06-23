import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { RESPONSE_CODES } from "../../constants/statusCode";

export const validate = (schema: { body?: Joi.ObjectSchema; query?: Joi.ObjectSchema; params?: Joi.ObjectSchema }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`DEBUG: Validating ${req.method} ${req.url}`);
      console.log(`DEBUG: Request Body:`, JSON.stringify(req.body));
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
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: RESPONSE_CODES.BAD_REQUEST,
          message: error.details.map((err) => err.message).join(", "),
        });
      }
      next(error);
    }
  };
};
