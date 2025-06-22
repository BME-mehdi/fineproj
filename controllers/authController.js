// controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
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
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).render('signup', { 
        errors: [{ msg: 'Un compte avec cet email existe déjà' }] 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const user = new User({ 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });
    
    await user.save();
    
    // Set session
    req.session.userId = user._id;
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).render('signup', { 
      errors: [{ msg: 'Erreur du serveur lors de l\'inscription' }] 
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
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).render('login', { 
        errors: [{ msg: 'Email ou mot de passe incorrect' }] 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).render('login', { 
        errors: [{ msg: 'Email ou mot de passe incorrect' }] 
      });
    }

    // Set session
    req.session.userId = user._id;
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('login', { 
      errors: [{ msg: 'Erreur du serveur lors de la connexion' }] 
    });
  }
};

// Handle logout
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Erreur lors de la déconnexion');
    }
    
    // Clear session cookie
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};