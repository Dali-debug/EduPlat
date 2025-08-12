const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const LiveSession = require('../models/LiveSession');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
router.use(auth, isAdmin);

// @route   GET /api/admin/users
// @desc    Obtenir tous les utilisateurs (Admin seulement)
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      role, 
      status,
      search 
    } = req.query;

    let filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    // Recherche par nom, prénom ou email
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-motDePasse') // Ne pas exposer les mots de passe
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
    console.error('Erreur récupération utilisateurs (admin):', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

// @route   GET /api/admin/courses
// @desc    Obtenir tous les cours (Admin seulement)
// @access  Private (Admin)
router.get('/courses', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status,
      categorie,
      search 
    } = req.query;

    let filter = {};
    
    if (status) filter.status = status;
    if (categorie) filter.categorie = categorie;
    
    // Recherche par titre
    if (search) {
      filter.titre = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(filter)
      .populate('enseignant', 'nom prenom email')
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération cours (admin):', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des cours'
    });
  }
});

// @route   PUT /api/admin/users/:id/password
// @desc    Changer le mot de passe d'un utilisateur
// @access  Private (Admin)
router.put('/users/:id/password', [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { newPassword } = req.body;
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification du mot de passe d'un autre admin
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Impossible de modifier le mot de passe d\'un autre administrateur'
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(userId, {
      motDePasse: hashedPassword
    });

    // Log de l'action
    console.log(`Admin ${req.user.email} a changé le mot de passe de l'utilisateur ${user.email}`);

    res.json({
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      message: 'Erreur serveur lors du changement de mot de passe'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Mettre à jour le statut d'un utilisateur
// @access  Private (Admin)
router.put('/users/:id/status', [
  body('status')
    .isIn(['actif', 'suspendu', 'inactif'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { status } = req.body;
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suspension d'un autre admin
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Impossible de modifier le statut d\'un autre administrateur'
      });
    }

    // Mettre à jour le statut
    await User.findByIdAndUpdate(userId, { status });

    // Log de l'action
    console.log(`Admin ${req.user.email} a mis à jour le statut de ${user.email} vers ${status}`);

    res.json({
      message: `Statut mis à jour vers ${status}`,
      user: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        status
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression d'un autre admin
    if (user.role === 'admin') {
      return res.status(403).json({
        message: 'Impossible de supprimer un administrateur'
      });
    }

    // Empêcher l'auto-suppression
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message: 'Impossible de supprimer votre propre compte'
      });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    // Log de l'action
    console.log(`Admin ${req.user.email} a supprimé l'utilisateur ${user.email}`);

    res.json({
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la suppression'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Obtenir les statistiques de la plateforme
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalSessions,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'etudiant' }),
      User.countDocuments({ role: 'enseignant' }),
      Course.countDocuments(),
      LiveSession.countDocuments(),
      User.find()
        .select('nom prenom email role dateInscription')
        .sort({ dateInscription: -1 })
        .limit(10)
    ]);

    // Statistiques par mois (exemple simple)
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    
    const newUsersThisMonth = await User.countDocuments({
      dateInscription: { $gte: lastMonth }
    });

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCourses,
        totalSessions,
        newUsersThisMonth
      },
      recentUsers
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
