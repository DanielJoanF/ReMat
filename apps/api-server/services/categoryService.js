const { prisma } = require("@remat/database");

/**
 * List all categories, optionally as a flat list or a nested tree.
 */
const listCategories = async ({ tree = false } = {}) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { materials: true } }
    },
    orderBy: { name: "asc" }
  });

  if (!tree) return categories;

  // Build tree structure
  const map = {};
  const roots = [];
  for (const cat of categories) {
    map[cat.id] = { ...cat, children: [] };
  }
  for (const cat of categories) {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  }
  return roots;
};

/**
 * Get a single category by ID with its children.
 */
const getCategoryById = async (id) => {
  return prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      parent: true,
      _count: { select: { materials: true } }
    }
  });
};

/**
 * Create a new category.
 */
const createCategory = async ({ name, slug, parentId }) => {
  // Check slug uniqueness
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    const err = new Error(`Category with slug "${slug}" already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Validate parent exists if provided
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      const err = new Error("Parent category not found");
      err.statusCode = 404;
      throw err;
    }
  }

  return prisma.category.create({
    data: { name, slug, parentId: parentId || null }
  });
};

/**
 * Update a category.
 */
const updateCategory = async (id, data) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // If slug changed, check uniqueness
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      const err = new Error(`Category with slug "${data.slug}" already exists`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Prevent setting parent to self
  if (data.parentId === id) {
    const err = new Error("Category cannot be its own parent");
    err.statusCode = 400;
    throw err;
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.parentId !== undefined && { parentId: data.parentId || null })
    }
  });
};

/**
 * Delete a category (only if no materials are linked).
 */
const deleteCategory = async (id) => {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { materials: true, children: true } } }
  });

  if (!existing) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing._count.materials > 0) {
    const err = new Error(`Cannot delete category with ${existing._count.materials} linked material(s). Remove or reassign materials first.`);
    err.statusCode = 409;
    throw err;
  }

  if (existing._count.children > 0) {
    const err = new Error(`Cannot delete category with ${existing._count.children} sub-category(ies). Remove sub-categories first.`);
    err.statusCode = 409;
    throw err;
  }

  return prisma.category.delete({ where: { id } });
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
