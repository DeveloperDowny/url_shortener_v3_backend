const router = require("express").Router();

const authController = require("../controllers/auth-controller");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.get("/github", authController.githubAuth);
router.get(
  "/github/callback",
  authController.githubAuthCallback,
  (req, res) => {
    // Successful authentication, redirect or handle as needed
    // TODO: REDIRECT USER TO FrontEnd Dashboard Page
    res.redirect("/");
  }
);

router.patch(
  "/update-my-password",
  authController.protect,
  authController.updatePassword
);

module.exports = router;
