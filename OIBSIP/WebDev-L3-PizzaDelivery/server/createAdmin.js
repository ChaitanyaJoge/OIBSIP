
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./Admin");

async function createAdmin() {
  try {
    if (
      !process.env.MONGODB_URI ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error(
        "MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
      );
    }

    if (Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72) {
      throw new Error("Admin password must not exceed 72 UTF-8 bytes.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    await Admin.findOneAndUpdate(
      { email },
      { email, password: passwordHash },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin account created or updated for: ${email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
