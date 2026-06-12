const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned in queries unless explicitly asked
    },

    // Single field drives all access control — rider or driver
    role: {
      type: String,
      enum: ["rider", "driver"],
      default: "rider",
    },
  },
  { timestamps: true }
);

// Hash password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if password changed
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare plain-text password with stored hash
userSchema.methods.matchPassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model("User", userSchema);
