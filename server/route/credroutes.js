const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { signupUser, loginUser } = require('../controller/authController');

router.post('/signup', [
    check('name').isLength({ min: 20, max: 60 }).withMessage('Name must be 20-60 characters'),
    check('email').isEmail().withMessage('Please enter a valid email'),
    check('password').matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/).withMessage('Password must be 8-16 characters with uppercase and special char'),
    check('address').isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters')
], signupUser);

router.post('/login', [
    check('email',).isEmail(),
    check('password',).exists()
], loginUser);

module.exports = router;
