const express = require('express');
const { body, validationResult } = require('express-validator');
const LiveSession = require('../models/LiveSession');
const { auth, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/live
// @desc    Obtenir toutes les sessions live
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, upcoming, enseignant } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (enseignant && enseignant !== 'undefined') {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(enseignant)) {
        return res.status(400).json({
          message: 'ID enseignant invalide'
        });
      }
      filter.enseignant = enseignant;
    }

    if (upcoming === 'true') {
      filter.dateHeure = { $gte: new Date() };
      filter.status = { $in: ['planifie', 'en_cours'] };
    }

    console.log('Filtre sessions live:', filter);

    const sessions = await LiveSession.find(filter)
      .populate('enseignant', 'nom prenom avatar')
      .populate('cours', 'titre imagePreview')
      .sort({ dateHeure: 1 });

    console.log('Sessions trouvées:', sessions.length);

    res.json({ sessions });
  } catch (error) {
    console.error('Erreur récupération sessions live:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des sessions'
    });
  }
});

// @route   GET /api/live/:id
// @desc    Obtenir une session live spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('enseignant', 'nom prenom avatar')
      .populate('cours', 'titre description')
      .populate('participants.user', 'nom prenom avatar');

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    res.json({ session });
  } catch (error) {
    console.error('Erreur récupération session:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération de la session'
    });
  }
});

// @route   POST /api/live
// @desc    Créer une nouvelle session live
// @access  Private (Enseignant/Admin)
router.post('/', auth, isTeacherOrAdmin, [
  body('titre')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('dateHeure')
    .isISO8601()
    .withMessage('Date et heure invalides'),
  body('dureeEstimee')
    .isInt({ min: 15, max: 300 })
    .withMessage('La durée doit être entre 15 et 300 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    // Vérifier que la date est dans le futur
    const sessionDate = new Date(req.body.dateHeure);
    if (sessionDate <= new Date()) {
      return res.status(400).json({
        message: 'La date de la session doit être dans le futur'
      });
    }

    const sessionData = {
      ...req.body,
      enseignant: req.user._id,
      urlMeeting: req.body.urlMeeting || `https://meet.jit.si/session-${Date.now()}`
    };

    const session = new LiveSession(sessionData);
    await session.save();

    await session.populate('enseignant', 'nom prenom');

    res.status(201).json({
      message: 'Session live créée avec succès',
      session
    });
  } catch (error) {
    console.error('Erreur création session live:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la création de la session'
    });
  }
});

// @route   POST /api/live/:id/join
// @desc    Rejoindre une session live
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Vérifier si la session n'est pas complète
    if (session.participants.length >= session.capaciteMax) {
      return res.status(400).json({
        message: 'Session complète'
      });
    }

    // Vérifier si déjà inscrit
    const alreadyJoined = session.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({
        message: 'Déjà inscrit à cette session'
      });
    }

    // Ajouter le participant
    session.participants.push({
      user: req.user._id,
      dateInscription: new Date()
    });

    await session.save();

    res.json({
      message: 'Inscription à la session réussie',
      urlMeeting: session.urlMeeting,
      motDePasse: session.motDePasse
    });
  } catch (error) {
    console.error('Erreur inscription session:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de l\'inscription à la session'
    });
  }
});

// @route   POST /api/live/:id/start
// @desc    Démarrer une session live
// @access  Private (Enseignant propriétaire)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Vérifier les permissions
    if (session.enseignant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Non autorisé à démarrer cette session'
      });
    }

    session.status = 'en_cours';
    await session.save();

    // Ici, vous pourriez envoyer des notifications aux participants
    // via Socket.io ou email

    res.json({
      message: 'Session démarrée',
      session
    });
  } catch (error) {
    console.error('Erreur démarrage session:', error);
    res.status(500).json({
      message: 'Erreur serveur lors du démarrage de la session'
    });
  }
});

// @route   POST /api/live/:id/end
// @desc    Terminer une session live
// @access  Private (Enseignant propriétaire)
router.post('/:id/end', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: 'Session non trouvée'
      });
    }

    // Vérifier les permissions
    if (session.enseignant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Non autorisé à terminer cette session'
      });
    }

    session.status = 'termine';
    
    // Marquer tous les participants comme ayant assisté
    session.participants.forEach(participant => {
      participant.aAssiste = true;
    });

    await session.save();

    res.json({
      message: 'Session terminée',
      session
    });
  } catch (error) {
    console.error('Erreur fin session:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la fin de la session'
    });
  }
});

module.exports = router;