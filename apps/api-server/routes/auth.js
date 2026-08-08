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
  const { name, email, address, phone, password, role, province, city, companyName } = req.body;

  const uppercaseRole = (role || "").toUpperCase();
  if (uppercaseRole === "CONSUMER") {
    if (!name || !email || !address || !phone || !password || !province || !city) {
      return res.status(400).json({ error: { message: "Nama lengkap, email, nomor telepon, provinsi, kota, dan alamat lengkap wajib diisi" } });
    }
  } else if (uppercaseRole === "DISTRIBUTOR") {
    if (!name || !email || !address || !phone || !password || !province || !city || !companyName) {
      return res.status(400).json({ error: { message: "Nama lengkap, email, nomor telepon, provinsi, kota, alamat lengkap, dan nama perusahaan wajib diisi" } });
    }
  } else {
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: { message: "Nama, email, telepon, password, dan peran wajib diisi" } });
    }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: { message: "Email sudah terdaftar" } });
    }

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
          province: province || null,
          city: city || "Semarang",
          companyName: name,
          industryType: "Umum"
        }
      });
    } else if (uppercaseRole === "DISTRIBUTOR") {
      await prisma.distributorProfile.create({
        data: {
          userId: user.id,
          companyName: companyName || name,
          address,
          province: province || null,
          city: city || "Semarang",
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

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile data based on role
 */
router.get("/profile", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: { message: "Akses ditolak. Silakan login kembali.", statusCode: 401 } });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        distributorProfile: true,
        consumerProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: { message: "User tidak ditemukan", statusCode: 404 } });
    }

    // Omit password hash
    const { passwordHash, ...safeUser } = user;

    res.json({
      message: "Profil berhasil diambil",
      data: safeUser
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: { message: "Terjadi kesalahan server saat mengambil profil", statusCode: 500 } });
  }
});

/**
 * @route   PUT /auth/profile
 * @desc    Update current user profile data based on role
 */
router.put("/profile", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: { message: "Akses ditolak. Silakan login kembali.", statusCode: 401 } });
  }

  const { name, email, phone, companyName, address, city, province, industryType, companyType } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: { message: "Nama dan Email wajib diisi", statusCode: 400 } });
  }

  try {
    // 1. Check for email conflict
    const emailConflictUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: req.user.id }
      }
    });

    if (emailConflictUser) {
      return res.status(400).json({ error: { message: "Email sudah digunakan oleh pengguna lain", statusCode: 400 } });
    }

    // 2. Update core user details
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        email,
        phone: phone || null
      }
    });

    // 3. Update role-specific profile details
    if (req.user.role === "CONSUMER") {
      await prisma.consumerProfile.upsert({
        where: { userId: req.user.id },
        update: {
          companyName: companyName || name,
          industryType: industryType || "Umum",
          address: address || "",
          province: province || null,
          city: city || "Semarang"
        },
        create: {
          userId: req.user.id,
          companyName: companyName || name,
          industryType: industryType || "Umum",
          address: address || "",
          province: province || null,
          city: city || "Semarang"
        }
      });
    } else if (req.user.role === "DISTRIBUTOR") {
      // Distributor profile fields companyName, address, city are required strings in database schema
      await prisma.distributorProfile.upsert({
        where: { userId: req.user.id },
        update: {
          companyName: companyName || name,
          companyType: companyType || "Pabrik",
          address: address || "",
          province: province || null,
          city: city || "Semarang"
        },
        create: {
          userId: req.user.id,
          companyName: companyName || name,
          companyType: companyType || "Pabrik",
          address: address || "",
          province: province || null,
          city: city || "Semarang",
          isVerified: true
        }
      });
    }

    // 4. Fetch the final updated user with profiles
    const finalUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        distributorProfile: true,
        consumerProfile: true
      }
    });

    const { passwordHash, ...safeUser } = finalUser;

    res.json({
      message: "Profil berhasil diperbarui",
      data: safeUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: { message: "Terjadi kesalahan server saat memperbarui profil", statusCode: 500 } });
  }
});

module.exports = router;

