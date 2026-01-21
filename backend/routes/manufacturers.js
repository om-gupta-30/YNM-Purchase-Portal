const express = require('express');
const router = express.Router();
const {
  getManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer
} = require('../controllers/manufacturerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getManufacturers)
  .post(createManufacturer); // Allow all authenticated users (admin and employee)

router.route('/:id')
  .put(updateManufacturer) // Allow all authenticated users (admin and employee)
  .delete(deleteManufacturer); // Allow all authenticated users (admin and employee)

module.exports = router;

