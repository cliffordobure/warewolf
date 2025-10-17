const express = require('express');
const { body } = require('express-validator');
const gameController = require('../controllers/gameController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createGameValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Game name is required')
    .isLength({ max: 255 })
    .withMessage('Game name must be less than 255 characters'),
  body('max_players')
    .optional()
    .isInt({ min: 5, max: 12 })
    .withMessage('Max players must be between 5 and 12'),
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('is_private must be a boolean'),
  body('password')
    .optional()
    .trim()
];

const joinGameValidation = [
  body('password')
    .optional()
    .trim()
];

// Routes
router.get('/', gameController.getGames);
router.post('/', createGameValidation, validate, gameController.createGame);
router.get('/:gameId', gameController.getGame);
router.post('/:gameId/join', joinGameValidation, validate, gameController.joinGame);
router.post('/:gameId/leave', gameController.leaveGame);
router.post('/:gameId/start', gameController.startGame);

module.exports = router;

