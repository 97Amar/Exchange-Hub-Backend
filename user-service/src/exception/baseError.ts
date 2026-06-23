class BaseError extends Error {
  public statusCode;
  public isOperational;
  constructor(
    message: string,
    statusCode: number,
    description: string,
    isOperational: boolean,
  ) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

export default BaseError;
