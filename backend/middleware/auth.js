const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    
    if (!user) {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// Middleware pour vérifier le rôle
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Accès refusé. Privilèges insuffisants.' 
      });
    }
    next();
  };
};

// Middleware pour vérifier si c'est un enseignant ou admin
const isTeacherOrAdmin = checkRole(['enseignant', 'admin']);

// Middleware pour vérifier si c'est un admin
const isAdmin = checkRole(['admin']);

module.exports = {
  auth,
  checkRole,
  isTeacherOrAdmin,
  isAdmin
};