// Middleware pour vérifier l'authentification
export const ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
};
