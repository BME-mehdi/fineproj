// server/routes/authRoutes.js
import express from 'express';
import { getSignup, postSignup, getLogin, postLogin, logout } from '../controllers/authController.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation arrays for better code organization
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Signup routes
router.get('/signup', getSignup);
router.post('/signup', signupValidation, postSignup);

// Login routes
router.get('/login', getLogin);
router.post('/login', loginValidation, postLogin);

// Logout
router.get('/logout', logout);

export default router;