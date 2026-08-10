const { prisma } = require("@remat/database");
const crypto = require("crypto");
const { upsertMaterialEmbedding, deleteMaterialEmbedding } = require("./embeddingService");

/**
 * Generate a unique material code.
 * Format: MAT-{YYMMDD}-{RANDOM_6}
 */
const generateMaterialCode = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MAT-${yy}${mm}${dd}-${rand}`;
};

/**
 * Get distributor profile ID from user ID.
 */
const getDistributorProfileId = async (userId) => {
  const profile = await prisma.distributorProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  if (!profile) {
    const err = new Error("Distributor profile not found. Please complete your profile first.");
    err.statusCode = 404;
    throw err;
  }
  return profile.id;
};

/**
 * Verify material ownership by distributor user.
 */
const verifyOwnership = async (materialId, userId) => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: { distributor: { select: { userId: true } } }
  });

  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  if (material.distributor.userId !== userId) {
    const err = new Error("You can only manage your own materials");
    err.statusCode = 403;
    throw err;
  }

  return material;
};

/**
 * List publicly visible materials (ACTIVE only) with filters.
 */
const listPublicMaterials = async (query) => {
  const {
    categoryId,
    location,
    minPrice,
    maxPrice,
    minQuantity,
    maxQuantity,
    unit,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = query;

  const where = { status: "ACTIVE" };

  if (categoryId) where.categoryId = categoryId;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (unit) where.unit = unit.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (minQuantity || maxQuantity) {
    where.quantity = {};
    if (minQuantity) where.quantity.gte = parseFloat(minQuantity);
    if (maxQuantity) where.quantity.lte = parseFloat(maxQuantity);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const allowedSort = ["createdAt", "price", "quantity", "title"];
  const orderField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
  const orderDir = sortOrder === "asc" ? "asc" : "desc";

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        distributor: {
          select: {
            id: true,
            companyName: true,
            city: true,
            isVerified: true
          }
        },
        documents: {
          where: { type: "PHOTO" },
          take: 1,
          select: { id: true, fileUrl: true }
        },
        _count: { select: { documents: true } }
      },
      orderBy: { [orderField]: orderDir },
      skip,
      take
    }),
    prisma.material.count({ where })
  ]);

  return {
    data: materials,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

/**
 * List materials owned by a distributor (all statuses).
 */
const listMyMaterials = async (userId, query) => {
  const distributorId = await getDistributorProfileId(userId);
  const { status, search, page = 1, limit = 20 } = query;

  const where = { distributorId };
  if (status) where.status = status.toUpperCase();

  // Full-text search across: title, material code, description, location,
  // and category name. Prisma `contains` + insensitive maps to ILIKE.
  if (search && String(search).trim()) {
    const q = String(search).trim();
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { materialCode: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } }
        ]
      }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        documents: { select: { id: true, type: true, fileUrl: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.material.count({ where })
  ]);

  return {
    data: materials,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

/**
 * Get a single material by ID.
 * Public users can only see ACTIVE materials.
 * Owner/admin can see any status.
 */
const getMaterialById = async (id, user) => {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      distributor: {
        select: {
          id: true,
          companyName: true,
          city: true,
          isVerified: true,
          userId: true,
          user: {
            select: {
              phone: true
            }
          }
        }
      },
      documents: true,
      _count: { select: { items: true } }
    }
  });

  if (!material) return null;

  // Public: only ACTIVE
  if (!user) {
    return material.status === "ACTIVE" ? material : null;
  }

  // Admin: see any
  if (user.role === "ADMIN") return material;

  // Owner: see own material regardless of status
  if (user.role === "DISTRIBUTOR" && material.distributor.userId === user.id) {
    return material;
  }

  // Other authenticated users: only ACTIVE
  return material.status === "ACTIVE" ? material : null;
};

/**
 * Create a new material listing.
 */
const createMaterial = async (userId, data) => {
  const distributorId = await getDistributorProfileId(userId);

  // Validate category exists
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // Generate unique material code (retry on collision)
  let materialCode;
  let attempts = 0;
  do {
    materialCode = generateMaterialCode();
    const exists = await prisma.material.findUnique({ where: { materialCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 5);

  if (attempts >= 5) {
    const err = new Error("Failed to generate unique material code. Please try again.");
    err.statusCode = 500;
    throw err;
  }

  const material = await prisma.material.create({
    data: {
      distributorId,
      categoryId: data.categoryId,
      materialCode,
      title: data.title,
      description: data.description,
      qualityGrade: data.qualityGrade || null,
      quantity: parseFloat(data.quantity),
      unit: data.unit.toUpperCase(),
      price: parseFloat(data.price),
      currency: data.currency || "IDR",
      location: data.location,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      requiresMsds: data.requiresMsds || false
      // status defaults to DRAFT via schema
    },
    include: {
      category: { select: { id: true, name: true, slug: true } }
    }
  });

  // Fire-and-forget: generate embedding for new material
  upsertMaterialEmbedding(material.id, material.title, category.name, material.description);

  return material;
};

/**
 * Update a material (owner only).
 */
const updateMaterial = async (materialId, userId, data) => {
  const material = await verifyOwnership(materialId, userId);

  // Editing is allowed in every status now (guard removed above).
  // If material was REJECTED, reset to DRAFT on edit (below).

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.qualityGrade !== undefined) updateData.qualityGrade = data.qualityGrade;
  if (data.quantity !== undefined) updateData.quantity = parseFloat(data.quantity);
  if (data.unit !== undefined) updateData.unit = data.unit.toUpperCase();
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.latitude !== undefined) updateData.latitude = parseFloat(data.latitude);
  if (data.longitude !== undefined) updateData.longitude = parseFloat(data.longitude);
  if (data.requiresMsds !== undefined) updateData.requiresMsds = data.requiresMsds;
  if (data.categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }
    updateData.categoryId = data.categoryId;
  }

  // If material was REJECTED, reset to DRAFT on edit
  if (material.status === "REJECTED") {
    updateData.status = "DRAFT";
  }

  // Editing is allowed in every status now (guard removed above).
  // For non-DRAFT/REJECTED statuses we keep the status unchanged
  // so an ACTIVE/PENDING_REVIEW listing is not silently demoted.

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      documents: true
    }
  });

  // Fire-and-forget: re-generate embedding on content change
  if (data.title !== undefined || data.description !== undefined || data.categoryId !== undefined) {
    upsertMaterialEmbedding(updated.id, updated.title, updated.category.name, updated.description);
  }

  return updated;
};

/**
 * Delete a material (owner only; any status, guarded by active transactions).
 */
const deleteMaterial = async (materialId, userId) => {
  const material = await verifyOwnership(materialId, userId);

  // Deleting a material that is part of an active (non-cancelled) transaction would
  // leave a transaction pointing at a deleted product. Guard against that, and allow
  // deletion in every other case (all statuses).
  const activeItems = await prisma.transactionItem.findFirst({
    where: {
      materialId,
      transaction: { status: { notIn: ["CANCELLED"] } }
    },
    select: { id: true }
  });

  if (activeItems) {
    const err = new Error(
      "Material tidak dapat dihapus karena masih terhubung ke transaksi yang sedang berjalan."
    );
    err.statusCode = 400;
    throw err;
  }

  // Delete embedding + material atomically. documents cascade automatically.
  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `DELETE FROM material_embeddings WHERE material_id = $1`,
      materialId
    ),
    prisma.material.delete({ where: { id: materialId } })
  ]);

  return { id: materialId };
};

/**
 * Submit material for admin review (DRAFT → PENDING_REVIEW).
 */
const submitForReview = async (materialId, userId) => {
  const material = await verifyOwnership(materialId, userId);

  if (material.status !== "DRAFT") {
    const err = new Error(`Can only submit DRAFT materials for review. Current status: "${material.status}"`);
    err.statusCode = 400;
    throw err;
  }

  return prisma.material.update({
    where: { id: materialId },
    data: { status: "PENDING_REVIEW" }
  });
};

/**
 * Admin: list materials pending review.
 */
const listPendingMaterials = async (query) => {
  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        distributor: {
          select: {
            id: true,
            companyName: true,
            city: true,
            isVerified: true,
            user: { select: { email: true, name: true } }
          }
        },
        documents: true
      },
      orderBy: { createdAt: "asc" },
      skip,
      take
    }),
    prisma.material.count({ where: { status: "PENDING_REVIEW" } })
  ]);

  return {
    data: materials,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

/**
 * Admin: approve or reject a material.
 */
const reviewMaterial = async (materialId, action) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } });

  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  if (material.status !== "PENDING_REVIEW") {
    const err = new Error(`Can only review materials in PENDING_REVIEW status. Current status: "${material.status}"`);
    err.statusCode = 400;
    throw err;
  }

  const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: { status: newStatus },
    include: { category: { select: { name: true } } }
  });

  // When approved, ensure embedding exists (may have been generated at create time)
  if (action === "approve") {
    upsertMaterialEmbedding(updated.id, updated.title, updated.category.name, updated.description);
  }

  return updated;
};

module.exports = {
  listPublicMaterials,
  listMyMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  submitForReview,
  listPendingMaterials,
  reviewMaterial
};
