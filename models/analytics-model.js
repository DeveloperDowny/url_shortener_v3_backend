const mongoose = require("mongoose");
const validator = require("validator");

const analyticsSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      trim: true,
      ref: "Shorturl",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    latitude: {
      type: String,
      trim: true,
    },
    longitude: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      
    },
    region: {
      type: String,
      trim: true,
      
    },
    country: {
      type: String,
      trim: true,
      
    },
    continent: {
      type: String,
      trim: true,
      
    },
    platform: {
      type: String,
      trim: true,
      
    },
    browser: {
      type: String,
      trim: true,
      
    },
    os: {
      type: String,
      trim: true,
      
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    ip: {
      type: String,
      trim: true,
    },
    timeZone: {
      type: String,
      trim: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
