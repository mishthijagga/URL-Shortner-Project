# 🚗 Uber Lite — Backend API

A clean, beginner-friendly REST API for a ride-booking app built with **Node.js, Express, MongoDB, JWT and Socket.IO**.

---

## 📁 Folder Structure

```
uber-lite/
├── config/
│   └── db.js               # MongoDB connection
├── models/
│   ├── User.js             # name, email, password, role
│   └── Ride.js             # rider, driver, locations, fare, status
├── controllers/
│   ├── authController.js   # signup, login, getMe
│   └── rideController.js   # all ride logic
├── routes/
│   ├── authRoutes.js
│   └── rideRoutes.js
├── middlewares/
│   └── authMiddleware.js   # JWT guard + role check
├── .env.example
├── package.json
└── server.js               # entry point + Socket.IO
```

---

## ⚙️ Tech Stack

| What          | Why                                  |
|---------------|--------------------------------------|
| Node.js       | Runtime                              |
| Express.js    | HTTP framework                       |
| MongoDB       | NoSQL database                       |
| Mongoose      | MongoDB object modelling             |
| bcryptjs      | Password hashing                     |
| jsonwebtoken  | Auth tokens                          |
| Socket.IO     | Real-time ride notifications         |
| morgan        | Request logging                      |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

# 3. Start dev server
npm run dev
```

---

## 📡 API Endpoints

### Auth — `/api/auth`

| Method | Route      | Access    | Description          |
|--------|-----------|-----------|----------------------|
| POST   | /signup   | Public    | Register rider/driver|
| POST   | /login    | Public    | Login, get JWT       |
| GET    | /me       | Protected | Get my profile       |

### Rides — `/api/rides`

| Method | Route            | Access         | Description                   |
|--------|-----------------|----------------|-------------------------------|
| POST   | /               | Rider          | Create a new ride             |
| GET    | /my-rides       | Rider + Driver | View my rides                 |
| GET    | /pending        | Driver         | View all pending rides        |
| PATCH  | /:id/accept     | Driver         | Accept a ride                 |
| PATCH  | /:id/complete   | Driver         | Complete a ride               |
| PATCH  | /:id/cancel     | Rider          | Cancel a pending ride         |

---

## 🔌 Socket.IO Events

**Client connects with:**
```js
const socket = io("http://localhost:5000", {
  query: { role: "driver", userId: "abc123" }
});
```

| Event            | Direction        | Received by | Payload                          |
|-----------------|-----------------|-------------|----------------------------------|
| `new_ride`      | Server → Client | Drivers     | rideId, pickupLocation, fare     |
| `ride_accepted` | Server → Client | Rider       | rideId, driver name+email        |
| `ride_completed`| Server → Client | Rider       | rideId, fare                     |

---

## 🔐 Auth Header

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📦 Example Requests

### Signup
```json
POST /api/auth/signup
{
  "name": "Rahul",
  "email": "rahul@test.com",
  "password": "123456",
  "role": "rider"
}
```

### Create Ride
```json
POST /api/rides
Authorization: Bearer <token>
{
  "pickupLocation": "Connaught Place, Delhi",
  "dropLocation": "IGI Airport, Delhi",
  "fare": 350
}
```

### Accept Ride
```
PATCH /api/rides/<rideId>/accept
Authorization: Bearer <driver_token>
```

---

## 🔄 Ride Status Flow

```
pending  →  accepted  →  completed
   ↓
cancelled
```

---

## 🧠 Key Concepts (for interviews)

1. **Role-based access** — one User model, `role` field controls what each user can do
2. **JWT middleware** — `protect` verifies token, `allow()` checks role — used as middleware chain
3. **bcrypt** — passwords are hashed before saving via Mongoose `pre("save")` hook
4. **Socket.IO rooms** — drivers join `"drivers"` room, riders join `"rider_<id>"` — targeted notifications
5. **Active ride check** — prevents duplicate bookings using a simple `findOne` before creating

---

## 👤 Author
Built by [Mishthi Jagga] · [GitHub](https://github.com/mishthijagga)
