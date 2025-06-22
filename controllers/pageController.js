// controllers/pageController.js
import Analysis from '../models/Analysis.js';

export const getHome = (req, res) => {
  const user = req.session.userId ? { id: req.session.userId } : null;
  res.render('home', { user });
};

export const getDashboard = async (req, res) => {
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    const userId = req.session.userId;
    // Get the 10 most recent analyses
    const analyses = await Analysis.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Pass analyses to the view
    res.render('dashboard', { 
      user: { id: userId }, 
      analyses: analyses || [] 
    });
  } catch (err) {
    console.error('Error in getDashboard:', err);
    // Even if there's an error, display dashboard without analyses
    res.render('dashboard', { 
      user: { id: req.session.userId }, 
      analyses: [] 
    });
  }
};