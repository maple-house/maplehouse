export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(message: string, isOperational: boolean = false) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}