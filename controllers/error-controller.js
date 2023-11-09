const express = require("express");

const AppError = require("../utils/app-error");
const StatusCode = require("../utils/status-code");

/**
 * Handle type cast error
 * @param {Error} error
 * @returns {AppError}
 */
const handleCastError = (error) => {
  const message = `Invalid value for ${error.value} for attribute ${error.path}`;
  return new AppError(message, StatusCode.BAD_REQUEST);
};

/**
 * Handle duplication value(s) error
 * @param {Error} error
   @return {AppError}
 */
const handleDuplicateFields = (error) => {
  const values = error.keyValue;
  const message = `Duplicate field value(s) for ${JSON.stringify(
    values
  )}. Please use another value.`;
  return new AppError(message, StatusCode.BAD_REQUEST);
};

/**
 * Handle validation error
 * @param {Error} error
 * @returns {AppError}
 */
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(
    (element, index) => `${index + 1}. ${element.message}`
  );
  const message = `Invalid inputs fields for ${errors.join(". ")}`;
  return new AppError(message, StatusCode.BAD_REQUEST);
};

/**
 * Handles expired json web token
 * @returns {AppError}
 */
const handleTokenExpiredError = () => {
  return new AppError(
    "Your token has been expired! Please login again to continue.",
    StatusCode.UNAUTHORIZED
  );
};

/**
 * Handle invalid token
 * @returns {AppError}
 */
const handleJsonWebTokenError = () => {
  return new AppError(
    "Invalid token! Please login again to continue",
    StatusCode.UNAUTHORIZED
  );
};

/**
 * Send development errors
 * @param {Error} error
 * @param {express.Response} res
 * @return {express.Response<any, Record<string, any>>}
 */
const sendErrorForDevelopment = (error, res) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: error.stack,
    error,
  });
};

/**
 * Send production error
 * @param {Error} error
 * @param {express.Response} res
 * @return {express.Response<any, Record<string, any>>}
 */
const sendErrorForProduction = (error, res) => {
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // For unknown errors, send generic error message
  console.log("An error occured 💣", error);
  return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: "Something went very wrong at server side",
  });
};

/**
 * A global error handler to handle errors at a centralized place and throw different errors for different node environment.
 * @param {Error} error
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || StatusCode.INTERNAL_SERVER_ERROR;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDevelopment(error, res);
  } else if (process.env.NODE_ENV === "production") {
    let err = { ...error };
    err.message = error.message;
    err.name = error.name;

    if (err.code === 11000) err = handleDuplicateFields(err);

    switch (err.name) {
      case "CastError":
        err = handleCastError(err);
        break;
      case "ValidationError":
        err = handleValidationError(err);
        break;
      case "TokenExpiredError":
        err = handleTokenExpiredError();
        break;
      case "JsonWebTokenError":
        err = handleJsonWebTokenError();
        break;
    }

    sendErrorForProduction(err, res);
  }

  next();
};
