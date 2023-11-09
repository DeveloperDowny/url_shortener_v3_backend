const router = require("express").Router();
const authController = require("../controllers/auth-controller");
const analyticsController = require("../controllers/analytics-controller");

router.use(authController.protect);

router.route("/").get(analyticsController.getAnalytics);
router.route("/group-by/:group").get(analyticsController.getAnalyticsByGroup);

// router.use("/:shortCode", analyticsController.restrictTo);

router.route("/ms/:shortCode").get(analyticsController.getAnalyticsOfShortCode);
router.route("/ms/:shortCode").post(analyticsController.storeAnalytics);

router.route("/store_a_v2/:short_code").post(analyticsController.storeAnalytics_v2)
router.route("/get_a_v2").get(analyticsController.getAnalytics)

module.exports = router;
