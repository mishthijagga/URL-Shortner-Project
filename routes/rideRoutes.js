const router = require("express").Router();
const { protect, allow } = require("../middlewares/authMiddleware");
const {
  createRide,
  getMyRides,
  getPendingRides,
  acceptRide,
  completeRide,
  cancelRide,
} = require("../controllers/rideController");

// All ride routes require login
router.use(protect);

router.post("/",               allow("rider"),           createRide);      // rider books a ride
router.get("/my-rides",        allow("rider", "driver"), getMyRides);      // see my ride history
router.get("/pending",         allow("driver"),          getPendingRides); // driver sees available rides
router.patch("/:id/accept",    allow("driver"),          acceptRide);      // driver accepts
router.patch("/:id/complete",  allow("driver"),          completeRide);    // driver completes
router.patch("/:id/cancel",    allow("rider"),           cancelRide);      // rider cancels

module.exports = router;
