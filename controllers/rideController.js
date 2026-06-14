const Ride = require("../models/Ride");

/*
  All DB logic lives directly here — no separate service layer.
  Simple, readable, and easy to explain in interviews.

  Socket.IO instance is accessed via req.app.get("io")
  so we can emit real-time events without importing anything extra.
*/

// ─── Create Ride ─────────────────────────────────────────────────────────────
// POST /api/rides
// Access: RIDER only
// Body: { pickupLocation, dropLocation, fare }
const createRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, fare } = req.body;

    if (!pickupLocation || !dropLocation || !fare) {
      return res.status(400).json({
        success: false,
        message: "pickupLocation, dropLocation and fare are required.",
      });
    }

    // Block rider from booking if they already have an active ride
    const activeRide = await Ride.findOne({
      rider: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });
    if (activeRide) {
      return res.status(409).json({
        success: false,
        message: "You already have an active ride. Complete or cancel it first.",
      });
    }

    const ride = await Ride.create({
      rider: req.user._id,
      pickupLocation,
      dropLocation,
      fare,
    });

    // Notify all connected drivers in real time
    const io = req.app.get("io");
    io.to("drivers").emit("new_ride", {
      rideId: ride._id,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation,
      fare: ride.fare,
    });

    res.status(201).json({ success: true, message: "Ride created. Waiting for a driver.", ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── View My Rides ───────────────────────────────────────────────────────────
// GET /api/rides/my-rides
// Access: RIDER and DRIVER
const getMyRides = async (req, res) => {
  try {
    // Riders see rides they booked; drivers see rides they accepted
    const filter =
      req.user.role === "rider"
        ? { rider: req.user._id }
        : { driver: req.user._id };

    const rides = await Ride.find(filter)
      .populate("rider", "name email")    // replace ObjectId with name+email
      .populate("driver", "name email")
      .sort({ createdAt: -1 });           // newest first

    res.status(200).json({ success: true, count: rides.length, rides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── View Pending Rides ──────────────────────────────────────────────────────
// GET /api/rides/pending
// Access: DRIVER only
// Shows all rides that haven't been accepted yet
const getPendingRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: "pending" })
      .populate("rider", "name email")
      .sort({ createdAt: 1 }); // oldest first so driver picks in order

    res.status(200).json({ success: true, count: rides.length, rides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Accept Ride ─────────────────────────────────────────────────────────────
// PATCH /api/rides/:id/accept
// Access: DRIVER only
const acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found." });
    }
    if (ride.status !== "pending") {
      return res.status(400).json({ success: false, message: "This ride is no longer available." });
    }

    // Check driver doesn't already have an active ride
    const activeRide = await Ride.findOne({
      driver: req.user._id,
      status: "accepted",
    });
    if (activeRide) {
      return res.status(409).json({
        success: false,
        message: "Complete your current ride before accepting a new one.",
      });
    }

    ride.driver = req.user._id;
    ride.status = "accepted";
    await ride.save();

    await ride.populate("rider", "name email");
    await ride.populate("driver", "name email");

    // Notify the rider that their ride was accepted
    const io = req.app.get("io");
    io.to(`rider_${ride.rider._id}`).emit("ride_accepted", {
      rideId: ride._id,
      driver: { name: req.user.name, email: req.user.email },
    });

    res.status(200).json({ success: true, message: "Ride accepted successfully.", ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Complete Ride ───────────────────────────────────────────────────────────
// PATCH /api/rides/:id/complete
// Access: DRIVER only (only the driver who accepted it)
const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found." });
    }
    if (ride.status !== "accepted") {
      return res.status(400).json({ success: false, message: "Only accepted rides can be completed." });
    }
    // Make sure only the driver who accepted this ride can complete it
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You did not accept this ride." });
    }

    ride.status = "completed";
    await ride.save();

    await ride.populate("rider", "name email");
    await ride.populate("driver", "name email");

    // Notify the rider that their ride is done
    const io = req.app.get("io");
    io.to(`rider_${ride.rider._id}`).emit("ride_completed", {
      rideId: ride._id,
      fare: ride.fare,
    });

    res.status(200).json({ success: true, message: "Ride completed.", ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Cancel Ride ─────────────────────────────────────────────────────────────
// PATCH /api/rides/:id/cancel
// Access: RIDER only (only while ride is still pending)
const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found." });
    }
    if (ride.rider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You did not book this ride." });
    }
    if (ride.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending rides can be cancelled." });
    }

    ride.status = "cancelled";
    await ride.save();

    res.status(200).json({ success: true, message: "Ride cancelled.", ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRide, getMyRides, getPendingRides, acceptRide, completeRide, cancelRide };
