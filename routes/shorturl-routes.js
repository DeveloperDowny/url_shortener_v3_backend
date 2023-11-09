const router = require("express").Router();

const shortUrlController = require("../controllers/shorturl-controller");
const authController = require("../controllers/auth-controller");
const analyticsController = require("../controllers/analytics-controller");

router.get(
  "/s/:shortCode",
  analyticsController.storeAnalytics,
  shortUrlController.redirectShortUrl
);

router.get("/qrcode/:message", shortUrlController.generateQRCode);

router.use(authController.protect);

router
  .route("/")
  .post(shortUrlController.createShortUrl)
  .get(shortUrlController.getAllShortUrls);

router.use("/:shortCode", shortUrlController.restrictShortUrl);

router
  .route("/:shortCode")
  .get(shortUrlController.getShortUrl)
  .patch(shortUrlController.updateShortUrl)
  .delete(shortUrlController.deleteShortUrl);

module.exports = router;
