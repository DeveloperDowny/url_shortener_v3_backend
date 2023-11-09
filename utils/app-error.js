/**
 * A custom class which throws error and helps to identify if the error was operational or other.
 */
module.exports = class AppError extends Error {
  /**
   *
   * @param {String} message
   * @param {Number} statusCode
   */
  constructor(message, statusCode) {
    super(message);

    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
};
