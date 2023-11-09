const mongoose = require("mongoose");
const validator = require("validator");

const shortUrlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shortCode: {
      type: String,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    shortUrl: {
      type: String,
      trim: true,
      unique: true,
    },
    longUrl: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String, // base-64 encoded string
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

/*****************************************************/
/* PRE HOOK FOR SHORT URL MODEL */
/*****************************************************/

// Helps to filter inactive urls
shortUrlSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const ShortUrl = mongoose.model("shorturl", shortUrlSchema);

module.exports = ShortUrl;
