const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const storeController = require('../controller/storeController');
const { authMiddleware, checkRole } = require('../middleware/middleware');

const storeValidation = [
    check('name', 'Name must be between 20 and 60 characters').isLength({ min: 20, max: 60 }),
    check('email', 'Please include a valid email').isEmail(),
    check('address', 'Address cannot exceed 400 characters').isLength({ max: 400 })
];

router.post('/', authMiddleware, checkRole(['admin']), storeValidation, storeController.addStore);
router.get('/', authMiddleware, storeController.getAllStores);

module.exports = router;