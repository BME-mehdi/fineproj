// controllers/authController.js
import User from '../models/User.js';
import bcryptjs from 'bcryptjs'; // Changed to match User model
import { validationResult } from 'express-validator';

// Render signup page
export const getSignup = (req, res) => {
  res.render('signup', { errors: null });
};

// Handle signup
export const postSignup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('signup', { errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email); // Use static method
    if (existingUser) {
      return res.status(400).render('signup', { 
        errors: [{ msg: 'Un compte avec cet email existe déjà' }] 
      });
    }

    // Create new user - password hashing handled by pre-save middleware
    const user = new User({ 
      email: email.toLowerCase().trim(), 
      password: password // Will be hashed by pre-save hook
    });
    
    const savedUser = await user.save();
    
    // Set session
    req.session.userId = savedUser._id;
    
    // Update last login
    await savedUser.updateLastLogin();
    
    console.log('✅ New user registered:', savedUser.email);
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Signup error:', error);
    
    let errorMessage = 'Erreur du serveur lors de l\'inscription';
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      errorMessage = validationErrors.join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Un compte avec cet email existe déjà';
    }
    
    res.status(500).render('signup', { 
      errors: [{ msg: errorMessage }] 
    });
  }
};

// Render login page
export const getLogin = (req, res) => {
  res.render('login', { errors: null });
};

// Handle login
export const postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    // Find user by email using static method
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).render('login', { 
        errors: [{ msg: 'Email ou mot de passe incorrect' }] 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).render('login', { 
        errors: [{ msg: 'Compte désactivé. Contactez le support.' }] 
      });
    }

    // Check password using instance method
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).render('login', { 
        errors: [{ msg: 'Email ou mot de passe incorrect' }] 
      });
    }

    // Set session
    req.session.userId = user._id;
    
    // Update last login
    await user.updateLastLogin();
    
    console.log('✅ User logged in:', user.email);
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', { 
      errors: [{ msg: 'Erreur du serveur lors de la connexion' }] 
    });
  }
};

// Handle logout
export const logout = async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).send('Erreur lors de la déconnexion');
      }
      
      // Clear session cookie
      res.clearCookie('connect.sid');
      
      if (userId) {
        console.log('✅ User logged out:', userId);
      }
      
      res.redirect('/');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('Erreur lors de la déconnexion');
  }
};
