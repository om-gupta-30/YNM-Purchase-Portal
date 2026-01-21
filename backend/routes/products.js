const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(createProduct); // Allow all authenticated users (admin and employee)

router.route('/:id')
  .put(updateProduct) // Allow all authenticated users (admin and employee)
  .delete(deleteProduct); // Allow all authenticated users (admin and employee)

module.exports = router;

