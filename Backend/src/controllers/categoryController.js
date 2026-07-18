const Category = require('../models/Category');

// @desc    List active categories, sorted for the client's home grid
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const SEED_CATEGORIES = [
  { slug: 'ac_repair',   name: 'AC Repair',   order: 1, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404734/ac_repair_qiawqi.png' },
  { slug: 'painter',     name: 'Painter',     order: 2, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404742/painter_lezvoa.png' },
  { slug: 'labour',      name: 'Labour',      order: 3, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404767/labour_asyudo.png' },
  { slug: 'plumber',     name: 'Plumber',     order: 4, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404768/plumber_yacflv.png' },
  { slug: 'maid',        name: 'Maid',        order: 5, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404773/maid_smmtn2.png' },
  { slug: 'electrician', name: 'Electrician', order: 6, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404773/electrician_cwfznw.png' },
  { slug: 'mechanic',    name: 'Mechanic',    order: 7, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404774/mechanic_wj7jr4.png' },
  { slug: 'raj_mistri',  name: 'Raj Mistri',  order: 8, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404788/raj_mistri_oresqo.png' },
  { slug: 'cook',        name: 'Cook',        order: 9, imageUrl: 'https://res.cloudinary.com/ojb7fokp/image/upload/v1784404788/cook_oeqpym.png' },
];

// @desc    Idempotent upsert of the fixed 9-category seed set, by slug —
//          safe to call repeatedly (e.g. re-run after a deploy) without
//          creating duplicates or clobbering isActive/order edits made via
//          the admin panel in between.
// @route   POST /api/v1/admin/categories/seed
// @access  Private (Admin)
exports.seedCategories = async (req, res, next) => {
  try {
    const results = await Promise.all(
      SEED_CATEGORIES.map((cat) =>
        Category.findOneAndUpdate(
          { slug: cat.slug },
          { $set: { name: cat.name, order: cat.order, imageUrl: cat.imageUrl } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );
    res.status(200).json({ success: true, message: `Seeded ${results.length} categories`, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a single category's image (for categories added later,
//          e.g. carpenter/security_guard/driver, without a full re-seed)
// @route   PATCH /api/v1/admin/categories/:slug/image
// @access  Private (Admin)
exports.updateCategoryImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    const category = await Category.findOneAndUpdate(
      { slug: req.params.slug.toLowerCase().trim() },
      { $set: { imageUrl } },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
