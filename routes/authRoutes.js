const router = require("express").Router();
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/signup", signup);       // public
router.post("/login",  login);        // public
router.get("/me",      protect, getMe); // must be logged in

module.exports = router;
