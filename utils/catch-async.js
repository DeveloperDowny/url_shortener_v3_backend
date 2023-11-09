const express = require("express");

/**
 * A wrapper for async function. Catch and throw error to global error handler.
 * @async
 * @param {function(req: express.Request, res: express.Response, next: express.NextFunction)} func
 * @returns {function(req: express.Request, res: express.Response, next: express.NextFunction)}
 */
module.exports = catchAsync = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((error) => next(error));
  };
};
