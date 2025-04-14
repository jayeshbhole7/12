const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../controller/adminController');
const { authMiddleware, checkRole } = require('../middleware/middleware');

const userValidation = [
    check('name', 'Name must be between 20 and 60 characters')
        .isLength({ min: 20, max: 60 }),
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Password must be 8-16 characters with at least one uppercase letter and one special character')
        .isLength({ min: 8, max: 16 })
        .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/, 'i'),
    check('address', 'Address cannot exceed 400 characters')
        .isLength({ max: 400 }),
    check('role', 'Role is required')
        .not().isEmpty()
];

router.use(authMiddleware, checkRole(['admin']));

router.post('/users', userValidation, adminController.addUser);
router.get('/users', adminController.getUsers);

module.exports = router;