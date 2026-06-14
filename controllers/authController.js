const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper — generate JWT
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ─── Signup ──────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Body: { name, email, password, role }
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic presence checks (keeping it simple — no extra library needed)
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required." });
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // select("+password") because schema has select:false on that field
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get profile ─────────────────────────────────────────────────────────────
// GET /api/auth/me   (protected)
const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};

module.exports = { signup, login, getMe };
