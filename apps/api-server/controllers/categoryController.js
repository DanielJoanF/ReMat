const categoryService = require("../services/categoryService");

const listCategories = async (req, res, next) => {
  try {
    const tree = req.query.tree === "true";
    const categories = await categoryService.listCategories({ tree });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: { message: "Category not found", statusCode: 404 } });
    }
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, slug, parentId } = req.body;
    const category = await categoryService.createCategory({ name, slug, parentId });
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
