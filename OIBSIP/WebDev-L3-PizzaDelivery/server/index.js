const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("./Order");
const Inventory = require("./Inventory");
require("dotenv").config();

const Admin = require("./Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("./Customer");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const MENU_PRICES = {
  Margherita: 199,
  Farmhouse: 279,
  "Paneer Delight": 299,
  "Spicy Veg": 249,
};

const BASE_PRICES = {
  "Classic Hand Tossed": 0,
  "Thin Crust": 30,
  "Whole Wheat": 40,
  "Cheese Burst": 60,
  "Pan Crust": 25,
};

const SAUCE_PRICES = {
  "Classic Tomato": 0,
  "Spicy Red": 10,
  Pesto: 20,
  "Garlic White Sauce": 20,
  "BBQ Sauce": 15,
};

const TOPPING_PRICES = {
  Onion: 20,
  Capsicum: 20,
  "Sweet Corn": 25,
  Paneer: 40,
  Olives: 30,
  Jalapenos: 25,
};

function calculateTrustedCart(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error("Your cart must contain between 1 and 20 pizzas.");
  }

  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item || typeof item.name !== "string") {
      throw new Error("Invalid pizza in your cart.");
    }

    if (item.name === "Custom Pizza") {
      const options = item.customOptions;

      if (
        !options ||
        !Object.hasOwn(BASE_PRICES, options.base) ||
        !Object.hasOwn(SAUCE_PRICES, options.sauce) ||
        typeof options.addCheese !== "boolean" ||
        !Array.isArray(options.toppings) ||
        options.toppings.length > Object.keys(TOPPING_PRICES).length ||
        !options.toppings.every((name) =>
          Object.hasOwn(TOPPING_PRICES, name)
        ) ||
        new Set(options.toppings).size !== options.toppings.length
      ) {
        throw new Error("Invalid custom pizza options.");
      }

      const price =
        199 +
        BASE_PRICES[options.base] +
        SAUCE_PRICES[options.sauce] +
        (options.addCheese ? 40 : 0) +
        options.toppings.reduce(
          (sum, name) => sum + TOPPING_PRICES[name],
          0
        );

      total += price;
      validatedItems.push({
        name: "Custom Pizza",
        description: `${options.base}, ${options.sauce}, ${
          options.toppings.length ? options.toppings.join(", ") : "No extra toppings"
        }${options.addCheese ? ", Extra cheese" : ""}`,
        customOptions: options,
        price,
        emoji: "🍕",
      });

      continue;
    }

    if (!Object.hasOwn(MENU_PRICES, item.name)) {
      throw new Error("An unknown pizza was found in your cart.");
    }

    const price = MENU_PRICES[item.name];
    total += price;
    validatedItems.push({
      name: item.name,
      price,
      emoji: "🍕",
    });
  }

  return { total, validatedItems };
}


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


function verifyCustomerToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to access your orders.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "customer" || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Customer access required.",
      });
    }

    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired customer token.",
    });
  }
}


const app = express();
app.use((req, res, next) => {
  console.log("INCOMING REQUEST:", req.method, req.originalUrl);
  next();
});
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


app.post("/api/customers/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, and password of at least 8 characters are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingCustomer = await Customer.findOne({
      email: normalizedEmail,
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const customer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Customer registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Customer registration failed.",
    });
  }
});

app.post("/api/customers/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const customer = await Customer.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (
      !customer ||
      !(await bcrypt.compare(password, customer.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: customer._id.toString(),
        role: "customer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Customer login successful.",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Customer login failed.",
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


app.get("/api/customers/orders", verifyCustomerToken, async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.customer.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Customer order history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch your orders.",
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



// Create a pending order and a Razorpay test/live-mode order.
app.post("/api/payments/create-order", verifyCustomerToken, async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured on the server.",
      });
    }

    const { total, validatedItems } = calculateTrustedCart(req.body.items);

    // Check current stock before creating the payment.
    const quantities = {};
    for (const item of validatedItems) {
      if (item.name !== "Custom Pizza") {
        quantities[item.name] = (quantities[item.name] || 0) + 1;
      }
    }

    for (const [name, quantity] of Object.entries(quantities)) {
      const stockItem = await Inventory.findOne({ name });
      if (stockItem && stockItem.stock < quantity) {
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${name}. Available: ${stockItem.stock}.`,
        });
      }
    }

    const receipt = `pz_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt,
    });

    const order = await Order.create({
      orderId: `PZ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: req.customer.id,
      items: validatedItems,
      total,
      status: "Order Received",
      paymentStatus: "Pending",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created.",
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Could not create payment order.",
    });
  }
});


// Verify Razorpay signature and deduct stock only once.
app.post("/api/payments/verify", verifyCustomerToken, async (req, res) => {
  let order;
  let deducted = [];

  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are incomplete.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    // Confirm payment status and amount directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    const savedOrder = await Order.findOne({
      razorpayOrderId,
      customerId: req.customer.id,
    });

    if (!savedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this customer.",
      });
    }

    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== Math.round(savedOrder.total * 100) ||
      payment.currency !== "INR" ||
      payment.status !== "captured" ||
      payment.captured !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or does not match the order amount.",
      });
    }

    // Claim a pending order atomically. Duplicate verification cannot claim it again.
    order = await Order.findOneAndUpdate(
      {
        razorpayOrderId,
        customerId: req.customer.id,
        paymentStatus: "Pending",
      },
      {
        $set: {
          paymentStatus: "Processing",
          razorpayPaymentId,
        },
      },
      { new: true }
    );

    if (!order) {
      const existing = await Order.findOne({
        razorpayOrderId,
        customerId: req.customer.id,
      });

      if (
        existing?.paymentStatus === "Paid" &&
        existing.razorpayPaymentId === razorpayPaymentId
      ) {
        return res.json({
          success: true,
          message: "Payment already verified.",
          order: existing,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Order is already being processed or cannot be verified.",
      });
    }

    const quantities = {};
    for (const item of order.items) {
      if (item.name !== "Custom Pizza") {
        quantities[item.name] = (quantities[item.name] || 0) + 1;
      }
    }

    const stockUpdates = [];
    for (const [name, quantity] of Object.entries(quantities)) {
      const stockItem = await Inventory.findOne({ name });

      // Items not tracked in inventory are intentionally skipped.
      if (!stockItem) continue;

      if (stockItem.stock < quantity) {
        throw new Error(`Insufficient stock for ${name} after payment. Manual refund may be required.`);
      }

      stockUpdates.push({ name, quantity });
    }

    for (const update of stockUpdates) {
      const result = await Inventory.updateOne(
        {
          name: update.name,
          stock: { $gte: update.quantity },
        },
        {
          $inc: { stock: -update.quantity },
          $set: { updatedAt: new Date() },
        }
      );

      if (result.modifiedCount !== 1) {
        throw new Error(`Stock changed for ${update.name}. Manual refund may be required.`);
      }

      deducted.push(update);
    }

    order.paymentStatus = "Paid";
    await order.save();

    return res.json({
      success: true,
      message: "Payment verified and order confirmed.",
      order,
    });
  } catch (error) {
    // Restore stock if order confirmation failed.
    for (const previous of deducted) {
      try {
        await Inventory.updateOne(
          { name: previous.name },
          {
            $inc: { stock: previous.quantity },
            $set: { updatedAt: new Date() },
          }
        );
      } catch (rollbackError) {
        console.error("Inventory rollback error:", rollbackError.message);
      }
    }

    let responseStatus = 400;
    let responseMessage = error.message || "Could not verify payment.";

    if (order && order.paymentStatus === "Paid") {
      // The database save may have failed after stock was deducted.
      // Do not automatically refund or reset an order in this uncertain state.
      responseStatus = 500;
      responseMessage =
        "Order confirmation needs manual review. Do not retry payment; contact support.";
    } else if (order && req.body.razorpay_payment_id) {
      try {
        const payment = await razorpay.payments.fetch(
          req.body.razorpay_payment_id
        );

        if (
          payment.order_id === order.razorpayOrderId &&
          payment.amount === Math.round(order.total * 100) &&
          payment.currency === "INR" &&
          payment.status === "captured" &&
          payment.captured === true
        ) {
          // Attempt a full refund if a captured payment cannot be fulfilled.
          await razorpay.payments.refund(payment.id, {
            amount: payment.amount,
            notes: {
              reason: "Order confirmation failed; manual review may be needed",
              internal_order_id: order.orderId,
            },
          });

          order.paymentStatus = "Failed";
          order.status = "Refund Requested";
          await order.save();

          responseStatus = 409;
          responseMessage =
            "Payment was captured but the order could not be confirmed. A refund has been requested; check payment status before retrying.";
        } else if (payment.status === "failed") {
          order.paymentStatus = "Failed";
          order.set("razorpayPaymentId", undefined);
          await order.save();

          responseStatus = 400;
          responseMessage = "Payment failed. You may try again.";
        } else {
          // Keep the order in Processing for manual reconciliation.
          responseStatus = 500;
          responseMessage =
            "Payment status is uncertain. Do not retry payment; contact support.";
          await order.save();
        }
      } catch (refundError) {
        console.error(
          "Payment/refund reconciliation error:",
          refundError.message
        );

        // Never mark a potentially captured payment as Pending.
        responseStatus = 500;
        responseMessage =
          "Payment or refund needs manual review. Do not retry payment; contact support.";

        await order.save().catch(() => {});
      }
    } else if (order) {
      order.paymentStatus = "Pending";
      order.set("razorpayPaymentId", undefined);
      await order.save().catch(() => {});
    }

    console.error("Payment verification error:", error.message);
    return res.status(responseStatus).json({
      success: false,
      message: responseMessage,
    });
  }
});

app.post("/api/orders", (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Direct orders are disabled. Please use Razorpay checkout.",
  });
});


// Get inventory and identify low-stock items (admin only)
app.get("/api/inventory", verifyAdminToken, async (req, res) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });

    const lowStockItems = items.filter(
      (item) => item.stock <= item.lowStockThreshold
    );

    res.json({
      success: true,
      inventory: items,
      lowStockItems,
    });
  } catch (error) {
    console.error("Fetch inventory error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch inventory.",
    });
  }
});

// Create or update inventory stock (admin only)
app.put("/api/inventory/:name", verifyAdminToken, async (req, res) => {
  try {
    const name = req.params.name.trim();
    const { stock, lowStockThreshold = 10 } = req.body;

    if (
      !name ||
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      typeof lowStockThreshold !== "number" ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, non-negative integer stock, and valid threshold are required.",
      });
    }

    const item = await Inventory.findOneAndUpdate(
      { name },
      {
        $set: {
          stock,
          lowStockThreshold,
          updatedAt: new Date(),
        },
        $setOnInsert: { name },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Inventory saved successfully.",
      item,
      lowStock: item.stock <= item.lowStockThreshold,
    });
  } catch (error) {
    console.error("Update inventory error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not update inventory.",
    });
  }
});
 
console.log(
  "REGISTERED ROUTES:",
  app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }))
);


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
