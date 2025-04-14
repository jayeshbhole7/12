const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const ratingController = require('../controller/ratingController');
const { authMiddleware, checkRole } = require('../middleware/middleware');

router.post('/', authMiddleware, checkRole(['user']), [
    check('store_id', 'Store ID is required').not().isEmpty(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 })
], ratingController.submitRating);
router.get('/store/:store_id', authMiddleware, ratingController.getStoreRatings);
router.get('/', authMiddleware, checkRole(['admin']), ratingController.getAllRatings);

module.exports = router;