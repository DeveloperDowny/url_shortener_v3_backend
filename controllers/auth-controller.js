const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const { promisify } = require("util");

const User = require("../models/user-model");
const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/app-error");
const StatusCode = require("../utils/status-code");

/**
 * Generated a token based on provided id.
 * @param {String} id
 * @returns {String}
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/**
 * Create and send new token to user
 * @param {mongoose.Document} user
 * @param {Number} statusCode
 * @param {express.Response} res
 */
const createAndSendToken = (user, statusCode, res) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  const token = signToken(user._id);

  // Set cookie
  res.cookie("jwt", token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: "user",
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  createAndSendToken(user, StatusCode.CREATED, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Fetch email and password from req.body
  const { email, password } = req.body;

  // Check if both are not null
  if (!email || !password) {
    return next(
      new AppError(
        "Please provide both email and password",
        StatusCode.BAD_REQUEST
      )
    );
  }

  // Check if the user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(
      new AppError(
        "Email doesn't exists or password is incorrect!",
        StatusCode.UNAUTHORIZED
      )
    );
  }

  // If everything goes well, send token and user details
  createAndSendToken(user, StatusCode.OK, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Fetch token from req.headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // If no token found, send an error message
  if (!token) {
    return next(
      new AppError(
        "You are not logged in! Please login to continue",
        StatusCode.UNAUTHORIZED
      )
    );
  }

  // Verify if the token is valid or not
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if the user still exists
  const user = await User.findById(decode.id);

  // If no user found, send error message
  if (!user) {
    return next(
      new AppError(
        "User belonging to this token no longer exists!",
        StatusCode.UNAUTHORIZED
      )
    );
  }

  // Check if user has changed his/her password after assigning token
  if (user.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError(
        "User recently changed password! Please login again to continue",
        StatusCode.UNAUTHORIZED
      )
    );
  }

  // Save user on request object
  req.user = user;
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Check if currentPassword, password and confirmPassword are their
  const { currentPassword, password, confirmPassword } = req.body;

  // Send error message if anyone of them is absent
  if (!currentPassword || !password || !confirmPassword) {
    return next(
      new AppError(
        "Please provide currentPassword, password and confirmPassword to continue!",
        StatusCode.BAD_REQUEST
      )
    );
  }

  // Get user by Id
  const user = await User.findById(req.user._id).select("+password");

  // Check if old password matches current provided password
  if (!(await user.verifyPassword(currentPassword, user.password))) {
    return next(
      new AppError(
        "Your current password is not matching!",
        StatusCode.UNAUTHORIZED
      )
    );
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  await user.save();

  // Send new token and logged in the user
  createAndSendToken(user, StatusCode.OK, res);
});

exports.githubAuth = passport.authenticate("github");

exports.githubAuthCallback = passport.authenticate("github", {
  // TODO: Change failureRedirect url based on frontend.
  failureRedirect: "/login",
  session: false,
});
