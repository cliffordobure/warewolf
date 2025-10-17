const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('avatar_url')
    .optional()
    .trim()
];

// Routes (all require authentication)
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, validate, userController.updateProfile);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;

