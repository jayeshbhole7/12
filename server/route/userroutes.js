const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controller/userController');
const { authMiddleware } = require('../middleware/middleware');

router.put('/password',authMiddleware,[
    check('currentPassword','Current password is required').exists(),
    check('newPassword','Password must be 8-16 characters with at least one uppercase letter and one special character').isLength({min:8,max:16}).matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/,'i')
],userController.updatePassword);

router.get('/me',authMiddleware,userController.getCurrentUser);

module.exports = router;