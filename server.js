require("dotenv").config();

const http    = require("http");
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const { Server } = require("socket.io");

const connectDB    = require("./config/db");
const authRoutes   = require("./routes/authRoutes");
const rideRoutes   = require("./routes/rideRoutes");

// ── App + HTTP server ─────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*" },
});

/*
  Socket.IO rooms:
  - Drivers join the "drivers" room → notified when a new ride is created
  - Riders join "rider_<userId>"    → notified when their ride is accepted/completed

  The client sends { role, userId } when connecting.
*/
io.on("connection", (socket) => {
  const { role, userId } = socket.handshake.query;

  if (role === "driver") {
    socket.join("drivers");
    console.log(`🚗  Driver connected: ${socket.id}`);
  }

  if (role === "rider" && userId) {
    socket.join(`rider_${userId}`);
    console.log(`🧑  Rider connected: ${userId}`);
  }

  socket.on("disconnect", () => {
    console.log(`🔌  Disconnected: ${socket.id}`);
  });
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // logs: POST /api/auth/login 200 45ms

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/rides", rideRoutes);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` })
);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  Server running → http://localhost:${PORT}`);
  console.log(`📡  Socket.IO ready\n`);
});
