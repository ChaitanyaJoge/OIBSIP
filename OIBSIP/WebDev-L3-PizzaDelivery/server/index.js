const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Order = require("./Order");
require("dotenv").config();

const Admin = require("./Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Admin token required.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin" || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}


const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());


app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Admin login failed.",
    });
  }
});


app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Pizza Delivery API is running!",
  });
});

app.get("/api/orders", verifyAdminToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch orders.",
    });
  }
});

app.patch("/api/orders/:id/status", verifyAdminToken, async (req, res) => {
  try {
    const allowedStatuses = [
      "Order Received",
      "Preparing",
      "Out for Delivery",
      "Delivered",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not update order status.",
    });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your order must contain at least one pizza.",
      });
    }

    if (
      typeof total !== "number" ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid order total is required.",
      });
    }

    const order = new Order({
      orderId: `PZ-${Date.now()}`,
      items,
      total,
      status: "Order Received",
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order saved successfully!",
      order,
    });
  } catch (error) {
    console.error("Order save error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not save your order. Please try again.",
    });
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
