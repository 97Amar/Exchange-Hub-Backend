import { ERROR_MESSAGES } from "../../constants/messages";
import { RESPONSE_CODES } from "../../constants/statusCode";
import BaseError from "./baseError";

class Api400Error extends BaseError {
  constructor(
    name: string,
    statusCode = RESPONSE_CODES.BAD_REQUEST,
    description = ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    isOperational = true,
  ) {
    super(name, statusCode, description, isOperational);
  }
}

export default Api400Error;
