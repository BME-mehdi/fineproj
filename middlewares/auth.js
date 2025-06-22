// middlewares/auth.js
export const ensureAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/auth/login' 
      });
    }
    return res.redirect('/auth/login');
  }
  next();
};

export const ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
};

export const optionalAuth = (req, res, next) => {
  // Just set user info if available, don't require auth
  req.user = req.session?.userId ? { id: req.session.userId } : null;
  next();
};
