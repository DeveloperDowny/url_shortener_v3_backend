const crc32 = require("crc-32");
const axios = require("axios");

const ShortUrl = require("../models/shorturl-model");
const AppError = require("../utils/app-error");
const Analytics = require("../models/analytics-model");

const catchAsync = require("../utils/catch-async");
const StatusCode = require("../utils/status-code");
const APIFeatures = require("../utils/api-features");

exports.restrictShortUrl = catchAsync(async (req, res, next) => {
  const { shortCode } = req.params;
  const shortUrlInstance = await ShortUrl.findOne({
    shortCode,
  });

  if (!shortUrlInstance) {
    return next(
      new AppError("No url found with this short code.", StatusCode.NOT_FOUND)
    );
  } else if (shortUrlInstance.userId.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "You don't have right to access this path.",
        StatusCode.FORBIDDEN
      )
    );
  }

  next();
});

exports.createShortUrl = catchAsync(async (req, res, next) => {
  console.log("her ein crea of shofturl");
  // Get url from req.body
  const { longUrl, description, mshortCode } = req.body;
  console.log({ longUrl, description, mshortCode });

  // Check if long url exists in req.body
  if (!longUrl) {
    return res.json({
      status: "error",
      message: "Please provide a long url.",
    });
    return next(
      new AppError("Please provide a long url.", StatusCode.BAD_REQUEST)
    );
  }

  // Check if the long url already exists by the current user
  // const existsLongUrl = await ShortUrl.findOne({
  //   longUrl,
  //   userId: req.user._id,
  // });
  // if (existsLongUrl) {
  //   return next(
  //     new AppError(
  //       "You already have a short url for the given long url.",
  //       StatusCode.BAD_REQUEST
  //     )
  //   );
  // }

  // Generate short code combining userId + longUrl
  // let shortCode = crc32
  //   .buf(Buffer.from(`${req.user._id}-${longUrl}`, "binary"), 0)
  //   .toString(16);

  // let shortCode = uuid

  let shortCode = mshortCode || "test";
  console.log({ shortCode });

  const shortUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/shorturls/s/${shortCode}`;

  // Store into database
  const shortUrlInstance = await ShortUrl.create({
    userId: req.user._id,
    shortCode,
    description,
    shortUrl,
    longUrl,
  });

  // Send short url
  res.status(StatusCode.CREATED).json({
    status: "success",
    data: {
      shortUrl,
      ...shortUrlInstance.toObject(),
    },
  });
});

exports.getAllShortUrls = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    ShortUrl.find({ userId: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .fieldLimit()
    .pagination();
  const shortUrls = await features.query;

  res.status(StatusCode.OK).json({
    status: "success",
    results: shortUrls.length,
    data: shortUrls,
  });
});

exports.getShortUrl = catchAsync(async (req, res, next) => {
  const { shortCode } = req.params;
  const shortUrl = await ShortUrl.findOne({ shortCode, userId: req.user._id });

  if (!shortUrl) {
    return next(
      new AppError("No short url found with this code.", StatusCode.NOT_FOUND)
    );
  }

  res.status(StatusCode.OK).json({
    status: "success",
    data: shortUrl,
  });
});

exports.redirectShortUrl = catchAsync(async (req, res, next) => {
  // Redirect user
  res.status(StatusCode.MOVED_TEMPORARILY).redirect(req.longUrl);
});

exports.updateShortUrl = catchAsync(async (req, res, next) => {
  const { params, body } = req;
  const updatesList = [
    "shortCode",
    "shortUrl",
    "longUrl",
    "description",
    "active",
  ];

  // Filter out other attributes and null values
  const object = {};
  Object.keys(body).forEach((e) => {
    if (body[e] || updatesList.includes(e)) object[e] = body[e];
  });

  // Check if shortCode already exists
  if (body.shortCode) {
    const IsExistingShortCode = await ShortUrl.findOne({
      shortCode: body.shortCode,
    });

    if (IsExistingShortCode) {
      return next(
        new AppError(
          "Short code with this name already exists",
          StatusCode.FORBIDDEN
        )
      );
    }
  }

  // If shortCode is updated, update shortUrl
  if (body.shortCode) {
    object.shortUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/shorturls/s/${body.shortCode}`;

    // Update all the shortCode in Analytics Model
    await Analytics.updateMany(
      {
        shortCode: params.shortCode,
      },
      { shortCode: body.shortCode }
    );
  }

  const shortUrl = await ShortUrl.findOneAndUpdate(
    { shortCode: params.shortCode },
    object,
    {
      runValidators: true,
      new: true,
    }
  );

  res.status(StatusCode.OK).json({
    status: "success",
    data: shortUrl,
  });
});

// Update the status of shorturl from active to inactive
exports.deleteShortUrl = catchAsync(async (req, res, next) => {
  const { shortCode } = req.params;
  const shortUrlInstance = await ShortUrl.findOneAndDelete({ shortCode });

  if (!shortUrlInstance) {
    return next(
      new AppError(
        "No short url found with that short code.",
        StatusCode.NOT_FOUND
      )
    );
  }

  const analyticsInstance = await Analytics.deleteMany({ shortCode });
  if (!analyticsInstance) {
    return next(
      new AppError(
        "Something went wrong while delete analytics log.",
        StatusCode.NOT_FOUND
      )
    );
  }

  res.status(StatusCode.NO_CONTENT).json({
    status: "success",
    data: null,
  });
});

exports.generateQRCode = catchAsync(async (req, res, next) => {
  const { message } = req.params;

  if (!message) {
    return next(
      new AppError(
        "Please provide message to generate QR Code.",
        StatusCode.BAD_REQUEST
      )
    );
  }

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${message}`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data, "base64");

  res.setHeader("Content-Type", "image/png");
  res.status(StatusCode.OK).send(imageBuffer);
});
