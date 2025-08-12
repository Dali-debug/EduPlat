const express = require('express');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/dashboard
// @desc    Obtenir les données du dashboard utilisateur
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'coursInscrits.coursId',
        select: 'titre imagePreview enseignant dureeEstimee',
        populate: {
          path: 'enseignant',
          select: 'nom prenom'
        }
      });

    // Récupérer les statistiques avancées
    const statsAvancees = {
      coursEnCours: user.coursInscrits.filter(c => c.progression < 100).length,
      coursTermines: user.coursInscrits.filter(c => c.progression === 100).length,
      progressionMoyenne: user.coursInscrits.length > 0 
        ? Math.round(user.coursInscrits.reduce((acc, c) => acc + c.progression, 0) / user.coursInscrits.length)
        : 0
    };

    res.json({
      user: {
        ...user.toJSON(),
        statistiques: {
          ...user.statistiques,
          ...statsAvancees
        }
      }
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du dashboard'
    });
  }
});

// @route   GET /api/users
// @desc    Obtenir la liste des utilisateurs (Admin seulement)
// @access  Private (Admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-motDePasse')
      .sort({ dateInscription: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

module.exports = router;