// server/routes/analysisRoutes.js
import express from 'express';
import { getAnalyzePage, submitTestData } from '../controllers/analysisController.js';
import { ensureAuthenticated } from '../middlewares/auth.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation pour le formulaire NFS + bio
const analyzeValidation = [
  body('age')
    .notEmpty().withMessage('Âge requis')
    .isInt({ min: 0, max: 120 }).withMessage('Âge invalide'),
  body('gender')
    .notEmpty().withMessage('Genre requis')
    .isIn(['male', 'female']).withMessage('Genre invalide'),
  body('hemoglobin')
    .notEmpty().withMessage('Hémoglobine requise')
    .isFloat({ min: 0 }).withMessage('Hémoglobine doit être un nombre positif'),
  body('hematocrit')
    .notEmpty().withMessage('Hématocrite requis')
    .isFloat({ min: 0, max: 100 }).withMessage('Hématocrite invalide'),
  body('wbc')
    .notEmpty().withMessage('Globules blancs requis')
    .isFloat({ min: 0 }).withMessage('Valeur WBC invalide'),
  body('platelets')
    .notEmpty().withMessage('Plaquettes requises')
    .isFloat({ min: 0 }).withMessage('Valeur plaquettes invalide'),
  body('glucose')
    .notEmpty().withMessage('Glucose requis')
    .isFloat({ min: 0 }).withMessage('Glucose doit être un nombre positif'),
  body('cholesterolTotal')
    .notEmpty().withMessage('Cholestérol total requis')
    .isFloat({ min: 0 }).withMessage('Cholestérol total invalide'),
  body('hdl')
    .notEmpty().withMessage('HDL requis')
    .isFloat({ min: 0 }).withMessage('HDL invalide'),
  body('ldl')
    .notEmpty().withMessage('LDL requis')
    .isFloat({ min: 0 }).withMessage('LDL invalide'),
  body('triglycerides')
    .notEmpty().withMessage('Triglycérides requis')
    .isFloat({ min: 0 }).withMessage('Triglycérides invalides')
];

// Routes
router.get('/analyze', ensureAuthenticated, getAnalyzePage);
router.post('/analyze', ensureAuthenticated, analyzeValidation, submitTestData);

export default router;