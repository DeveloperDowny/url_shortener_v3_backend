const express = require("express");
const morgan = require("morgan");
const expressRateLimiter = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const useragent = require("express-useragent");
const cors = require("cors");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

const AppError = require("./utils/app-error");

const app = express();

const globalErrorHandler = require("./controllers/error-controller");
const userRouter = require("./routes/user-routes");
const shortUrlRouter = require("./routes/shorturl-routes");
const analyticsRouter = require("./routes/analytics-routes");

const StatusCode = require("./utils/status-code");

// Body parser, reading data from request.body
// Limiting amount of data comes in the body
app.use(express.json({ limit: "5kb" }));
app.use(express.urlencoded({ extended: true, limit: "5kb" }));

// Use cors
app.use(cors());

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

// Data sanitization against CROSS-SITE scripting attacks
app.use(xss());

// Get useragent details
app.use(useragent.express());

// Passport configuration
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log({ accessToken, refreshToken, profile });
      console.log(profile.emails);
      return cb(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Initialize passport
app.use(passport.initialize());

// Log every request in development mode
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/shorturls", shortUrlRouter);
app.use("/api/v1/analytics", analyticsRouter);

// Handle unknown routes
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server`,
      StatusCode.NOT_FOUND
    )
  );
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
