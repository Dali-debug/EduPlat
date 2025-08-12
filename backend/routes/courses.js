const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Obtenir tous les cours publics
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      categorie,
      niveau,
      search,
      enseignant
    } = req.query;

    // Construire le filtre
    let filter = {};

    // Si un enseignant spécifique est demandé, on récupère tous ses cours
    // Sinon, on ne montre que les cours publiés
    if (enseignant && enseignant !== 'undefined' && enseignant !== 'null') {
      // Valider que l'ID enseignant est un ObjectId valide
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(enseignant)) {
        return res.status(400).json({
          message: 'ID enseignant invalide'
        });
      }
      filter.enseignant = enseignant;
      console.log('Recherche des cours pour l\'enseignant:', enseignant);
    } else {
      filter.status = 'publie';
    }

    if (categorie) filter.categorie = categorie;
    if (niveau) filter.niveau = niveau;

    // Recherche textuelle
    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(filter)
      .populate('enseignant', 'nom prenom avatar')
      .select('-modules.videos.url') // Ne pas exposer les URLs directes
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    console.log(`Trouvé ${courses.length} cours avec le filtre:`, filter);

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
    console.error('Erreur récupération cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des cours'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Obtenir un cours spécifique
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enseignant', 'nom prenom avatar')
      .populate('quiz')
      .populate('sessionsLive');

    if (!course) {
      return res.status(404).json({
        message: 'Cours non trouvé'
      });
    }

    if (course.status !== 'publie') {
      return res.status(403).json({
        message: 'Cours non disponible'
      });
    }

    res.json({ course });
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du cours'
    });
  }
});

// @route   POST /api/courses
// @desc    Créer un nouveau cours
// @access  Private (Enseignant/Admin)
router.post('/', auth, isTeacherOrAdmin, [
  body('titre')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('La description doit contenir entre 20 et 1000 caractères'),
  body('categorie')
    .isIn(['mathematiques', 'sciences', 'langues', 'informatique', 'arts', 'histoire', 'autre'])
    .withMessage('Catégorie invalide'),
  body('niveau')
    .isIn(['debutant', 'intermediaire', 'avance'])
    .withMessage('Niveau invalide'),
  body('dureeEstimee')
    .isInt({ min: 1 })
    .withMessage('La durée estimée doit être d\'au moins 1 heure')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const courseData = {
      ...req.body,
      enseignant: req.user._id
    };

    const course = new Course(courseData);
    await course.save();

    await course.populate('enseignant', 'nom prenom');

    res.status(201).json({
      message: 'Cours créé avec succès',
      course
    });
  } catch (error) {
    console.error('Erreur création cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la création du cours'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Mettre à jour un cours
// @access  Private (Enseignant propriétaire/Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: 'Cours non trouvé'
      });
    }

    // Vérifier les permissions
    if (course.enseignant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Non autorisé à modifier ce cours'
      });
    }

    const allowedUpdates = [
      'titre', 'description', 'categorie', 'niveau',
      'dureeEstimee', 'prix', 'imagePreview', 'modules', 'status'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('enseignant', 'nom prenom');

    res.json({
      message: 'Cours mis à jour avec succès',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Erreur mise à jour cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour du cours'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    S'inscrire à un cours
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: 'Cours non trouvé'
      });
    }

    if (course.status !== 'publie') {
      return res.status(400).json({
        message: 'Cours non disponible pour inscription'
      });
    }

    const user = await User.findById(req.user._id);

    // Vérifier si déjà inscrit
    const alreadyEnrolled = user.coursInscrits.some(
      cours => cours.coursId.toString() === req.params.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        message: 'Déjà inscrit à ce cours'
      });
    }

    // Ajouter le cours aux inscriptions
    user.coursInscrits.push({
      coursId: req.params.id,
      dateInscription: new Date(),
      progression: 0
    });

    await user.save();

    // Mettre à jour les statistiques du cours
    course.statistiques.nbEtudiants += 1;
    await course.save();

    res.json({
      message: 'Inscription réussie',
      course: {
        id: course._id,
        titre: course.titre
      }
    });
  } catch (error) {
    console.error('Erreur inscription cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// @route   GET /api/courses/:id/content
// @desc    Obtenir le contenu complet d'un cours (pour les inscrits)
// @access  Private
router.get('/:id/content', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enseignant', 'nom prenom avatar')
      .populate('quiz')
      .populate('sessionsLive');

    if (!course) {
      return res.status(404).json({
        message: 'Cours non trouvé'
      });
    }

    // Vérifier si l'utilisateur est inscrit ou est l'enseignant
    const user = await User.findById(req.user._id);
    const isEnrolled = user.coursInscrits.some(
      cours => cours.coursId.toString() === req.params.id
    );
    const isOwner = course.enseignant._id.toString() === req.user._id.toString();

    if (!isEnrolled && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès refusé. Inscription requise.'
      });
    }

    res.json({ course });
  } catch (error) {
    console.error('Erreur récupération contenu cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du contenu'
    });
  }
});

// @route   PUT /api/courses/:id/progress
// @desc    Mettre à jour la progression dans un cours
// @access  Private
router.put('/:id/progress', auth, [
  body('progression')
    .isInt({ min: 0, max: 100 })
    .withMessage('La progression doit être entre 0 et 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { progression } = req.body;
    const user = await User.findById(req.user._id);

    const coursIndex = user.coursInscrits.findIndex(
      cours => cours.coursId.toString() === req.params.id
    );

    if (coursIndex === -1) {
      return res.status(400).json({
        message: 'Non inscrit à ce cours'
      });
    }

    // Mettre à jour la progression
    user.coursInscrits[coursIndex].progression = progression;

    // Si cours terminé, mettre à jour les statistiques
    if (progression === 100) {
      user.statistiques.coursTermines += 1;
    }

    await user.save();

    res.json({
      message: 'Progression mise à jour',
      progression
    });
  } catch (error) {
    console.error('Erreur mise à jour progression:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour de la progression'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Supprimer un cours
// @access  Private (Enseignant propriétaire/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: 'Cours non trouvé'
      });
    }

    // Vérifier les permissions
    if (course.enseignant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Non autorisé à supprimer ce cours'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Cours supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression cours:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la suppression du cours'
    });
  }
});

module.exports = router;
