import express from 'express';
import { getHome, getDashboard } from '../controllers/pageController.js';
import { ensureAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getHome);

// Protected routes
router.get('/dashboard', ensureAuthenticated, getDashboard);

export default router;