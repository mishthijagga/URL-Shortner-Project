const jwt = require("jsonwebtoken");
const User = require("../models/User");

/*
  protect  →  checks JWT, attaches req.user
  allow    →  checks role  (always use after protect)

  Usage:
    router.post("/create",  protect, allow("rider"),          rideController.createRide)
    router.get("/pending",  protect, allow("driver"),         rideController.getPendingRides)
    router.get("/mine",     protect, allow("rider","driver"), rideController.getMyRides)
*/

const protect = async (req, res, next) => {
  try {
    // Token must come as:  Authorization: Bearer <token>
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token. Please log in." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user; // available in every controller that follows
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid token. Please log in.";
    res.status(401).json({ success: false, message: msg });
  }
};

// Role-based guard — use after protect
const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Only ${roles.join(" or ")} can do this.`,
    });
  }
  next();
};

module.exports = { protect, allow };
