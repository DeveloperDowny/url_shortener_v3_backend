const node_fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

function generate4LetterCode() {
  const code = uniqueId.slice(0, 4);
  return code;
}

const Analytics = require("../models/analytics-model");
const ShortUrl = require("../models/shorturl-model");

const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/app-error");
const StatusCode = require("../utils/status-code");
const { extractString, formatDate } = require("../utils/utils");
const APIFeatures = require("../utils/api-features");

exports.restrictTo = catchAsync(async (req, res, next) => {
  const { shortCode } = req.params;
  const analyticsInstance = await Analytics.findOne({ shortCode });
  if (!analyticsInstance) {
    return next(
      new AppError("No short url found with this code.", StatusCode.NOT_FOUND)
    );
  } else if (analyticsInstance.ownerId.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "Only owner of this short url has access to this route.",
        StatusCode.FORBIDDEN
      )
    );
  }

  next();
});

exports.storeAnalytics = catchAsync(async (req, res, next) => {
  // make shit here

  // Get shortcode from params
  const { shortCode } = req.params;
  // const { ip } = req.query;
  const ipData = req.body.data;

  // Check if short code exists
  const shortUrlInstance = await ShortUrl.findOne({ shortCode });

  // If not found, send error message
  if (!shortUrlInstance) {
    return next(
      new AppError(
        "Invalid short url! Please provide a valid one.",
        StatusCode.NOT_FOUND
      )
    );
  }

  req.longUrl = shortUrlInstance.longUrl;

  // Get geolocation details
  // const response = await node_fetch(
  //   `http://ip-api.com/json/${ip}?fields=continent,country,regionName,city,query,lat,lon`
  // );
  // const data = await response.json();

  // Store log into database
  await Analytics.create({
    shortCode,
    ownerId: shortUrlInstance.userId,
    ...ipData,
    // latitude: data.lat,
    // longitude: data.lon,
    // city: data.city,
    // region: data.regionName,
    // country: data.country,
    // continent: data.continent,
    platform: req.useragent.platform,
    browser: extractString(req.useragent.browser),
    os: extractString(req.useragent.os),
  });

  // Move ahead
  next();
});
exports.storeAnalytics_v2 = async (req, res) => {
  console.log("her ein crea analytics");
  // make shit here

  console.log("print req", req);

  // Get shortcode from params short_code
  const { short_code } = req.params;

  const shortCode = short_code;
  console.log("shortcode", shortCode);
  // const { ip } = req.query;
  const ipData = req.body.data;
  console.log("ipData", ipData);

  // Check if short code exists
  const shortUrlInstance = await ShortUrl.findOne({ shortCode });
  console.log("short url instance", shortUrlInstance);

  // If not found, send error message
  if (!shortUrlInstance) {
    return res.json({
      status: 0,
      link: "https://www.javatpoint.com/k-medoids-clustering-theoretical-explanation",
    });
    // return next(
    //   new AppError(
    //     "Invalid short url! Please provide a valid one.",
    //     StatusCode.NOT_FOUND
    //   )
    // );
  }

  req.longUrl = shortUrlInstance.longUrl;

  // Get geolocation details
  // const response = await node_fetch(
  //   `http://ip-api.com/json/${ip}?fields=continent,country,regionName,city,query,lat,lon`
  // );
  // const data = await response.json();

  // Store log into database
  await Analytics.create({
    shortCode,
    ownerId: shortUrlInstance.userId,
    ...ipData,
    latitude: ipData.loc.split(",")[0],
    longitude: ipData.loc.split(",")[1],
    // latitude: data.lat,
    // longitude: data.lon,
    // city: data.city,
    // region: data.regionName,
    // country: data.country,
    // continent: data.continent,
    platform: req.useragent.platform,
    browser: extractString(req.useragent.browser),
    os: extractString(req.useragent.os),
  });

  // Move ahead
  // next();
  res.json({
    link: shortUrlInstance.longUrl,
  });
};

// exports.getAnalytics = catchAsync(async (req, res, next) => {
//   console.log("her ein get analytics");
//   const features = new APIFeatures(
//     Analytics.find({ ownerId: req.user._id }),
//     req.query
//   )
//     .filter()
//     .sort()
//     .fieldLimit()
//     .pagination();
//   const stats = await features.query;

//   res.status(StatusCode.OK).json({
//     status: "success",
//     results: stats.length,
//     data: stats,
//   });
// });

exports.getAnalytics = catchAsync(async (req, res, next) => {
  try {
    console.log("here in get analytics");

    const stats = await Analytics.aggregate([
      {
        $lookup: {
          from: "shorturls",
          localField: "shortCode",
          foreignField: "shortCode",
          as: "shortUrlData",
        },
      },
      {
        $match: {
          ownerId: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order (newest first)
        },
      },
      // Add other aggregation stages as needed (filter, sort, fieldLimit, pagination)
    ]);

    res.status(StatusCode.OK).json({
      status: "success",
      results: stats.length,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getAnalytics:", error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});
exports.getAnalyticsByGroup = catchAsync(async (req, res, next) => {
  const { group = "country" } = req.params;
  const { skip = 0, limit = 10 } = req.query;

  const stats = await Analytics.aggregate([
    {
      $match: { ownerId: { $eq: req.user._id } },
    },
    {
      $group: {
        _id: `$${group}`,
        count: { $sum: 1 },
        countries: { $addToSet: "$country" },
        os: { $addToSet: "$os" },
        region: { $addToSet: "$region" },
        city: { $addToSet: "$city" },
      },
    },
    {
      $skip: +skip,
    },
    {
      $limit: +limit,
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  res.status(StatusCode.OK).json({
    status: "success",
    results: stats.length,
    data: stats,
  });
});

exports.getAnalyticsOfShortCode = catchAsync(async (req, res, next) => {
  const { shortCode } = req.params;
  const { groupBy = "normal" } = req.query;

  const aggregatePipeline = [
    {
      $match: { shortCode: { $eq: shortCode } },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  // If groupBy is NOT normal, send grouped response
  if (groupBy !== "normal") {
    aggregatePipeline.push({
      $group: {
        _id: `$${groupBy}`,
        count: { $sum: 1 },
        countries: { $addToSet: "$country" },
        os: { $addToSet: "$os" },
        region: { $addToSet: "$region" },
        city: { $addToSet: "$city" },
      },
    });
  }

  const stats = await Analytics.aggregate(aggregatePipeline);

  res.status(StatusCode.OK).json({
    status: "success",
    data: stats,
  });
});
