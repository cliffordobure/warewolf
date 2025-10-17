const express = require('express');
const shopController = require('../controllers/shopController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/items', shopController.getShopItems);
router.get('/items/:itemId', shopController.getShopItem);

module.exports = router;

