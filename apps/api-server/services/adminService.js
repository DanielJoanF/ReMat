/**
 * Admin Service — Moderation & Circular Economy Reports
 *
 * All functions are restricted to ADMIN role.
 */
const { prisma } = require("@remat/database");

/**
 * Suspend an active material that violates rules.
 */
const suspendMaterial = async (materialId, reason) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: {
      status: "REJECTED",
      description: reason ? `[SUSPENDED BY ADMIN: ${reason}] ${material.description}` : material.description
    }
  });

  return updated;
};

/**
 * Admin hard delete material.
 */
const deleteMaterialAdmin = async (materialId) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.material.delete({ where: { id: materialId } });
  return { id: materialId, deleted: true };
};

module.exports = {
  suspendMaterial,
  deleteMaterialAdmin
};
