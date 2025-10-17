const express = require('express');
const shopController = require('../controllers/shopController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/items', shopController.getShopItems);
router.get('/items/:itemId', shopController.getShopItem);

// Protected routes (require authentication)
router.use(authenticate);
// Add any protected shop routes here in the future

module.exports = router;

