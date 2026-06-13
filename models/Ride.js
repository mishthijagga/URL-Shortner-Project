const mongoose = require("mongoose");

/*
  Ride status flow:
  pending  →  accepted  →  completed
     ↓
  cancelled  (rider can cancel while pending)
*/

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null until a driver accepts
    },

    pickupLocation: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
    },

    dropLocation: {
      type: String,
      required: [true, "Drop location is required"],
      trim: true,
    },

    fare: {
      type: Number,
      required: [true, "Fare is required"],
      min: [1, "Fare must be at least 1"],
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);
