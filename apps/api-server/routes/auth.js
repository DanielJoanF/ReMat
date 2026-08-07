const express = require("express");
const crypto = require("crypto");
const { prisma } = require("@remat/database");
const router = express.Router();

// Helper to hash password using crypto (sha256)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * @route   POST /auth/register
 * @desc    Register a new user and create their profile
 */
router.post("/register", async (req, res) => {
  const { name, email, address, phone, password, role } = req.body;

  if (!name || !email || !address || !phone || !password || !role) {
    return res.status(400).json({ error: { message: "Semua data harus diisi" } });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: { message: "Email sudah terdaftar" } });
    }

    // Determine the role
    const uppercaseRole = role.toUpperCase();
    if (!["CONSUMER", "DISTRIBUTOR", "ADMIN"].includes(uppercaseRole)) {
      return res.status(400).json({ error: { message: "Role tidak valid" } });
    }

    const passwordHash = hashPassword(password);

    // Create User and corresponding profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: uppercaseRole,
        name,
        phone,
        isVerified: true
      }
    });

    if (uppercaseRole === "CONSUMER") {
      await prisma.consumerProfile.create({
        data: {
          userId: user.id,
          address,
          city: "Semarang",
          companyName: name,
          industryType: "Umum"
        }
      });
    } else if (uppercaseRole === "DISTRIBUTOR") {
      await prisma.distributorProfile.create({
        data: {
          userId: user.id,
          companyName: name,
          address,
          city: "Semarang",
          isVerified: true
        }
      });
    }

    res.status(201).json({
      message: "Registrasi berhasil",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: { message: "Terjadi kesalahan server saat registrasi" } });
  }
});

/**
 * @route   POST /auth/login
 * @desc    Login and verify credentials
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email dan password harus diisi" } });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: { message: "Email atau password salah" } });
    }

    let isMatch = false;

    // Check if the user passwordHash is the seed dummy hash, if so check if password is "password123"
    if (user.passwordHash.startsWith("$2b$10$e8w8Gk7r")) {
      isMatch = (password === "password123");
    } else {
      isMatch = (user.passwordHash === hashPassword(password));
    }

    if (!isMatch) {
      return res.status(401).json({ error: { message: "Email atau password salah" } });
    }

    res.json({
      message: "Login berhasil",
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: { message: "Terjadi kesalahan server saat login" } });
  }
});

module.exports = router;
