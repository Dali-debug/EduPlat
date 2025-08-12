const express = require('express');
const { body, validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { auth, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Modèle pour les résultats de quiz
const QuizResult = require('../models/QuizResult');

// @route   GET /api/quiz/course/:courseId
// @desc    Obtenir tous les quiz d'un cours
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.find({ 
      cours: req.params.courseId,
      status: 'actif'
    }).populate('enseignant', 'nom prenom');

    res.json({ quiz });
  } catch (error) {
    console.error('Erreur récupération quiz:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des quiz'
    });
  }
});

// @route   GET /api/quiz/:id
// @desc    Obtenir un quiz spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('enseignant', 'nom prenom')
      .populate('cours', 'titre');

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz non trouvé'
      });
    }

    // Pour les étudiants, ne pas révéler les bonnes réponses
    if (req.user.role === 'etudiant') {
      quiz.questions.forEach(question => {
        question.options.forEach(option => {
          delete option.estCorrect;
        });
        delete question.reponseCorrecte;
      });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Erreur récupération quiz:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du quiz'
    });
  }
});

// @route   POST /api/quiz
// @desc    Créer un nouveau quiz
// @access  Private (Enseignant/Admin)
router.post('/', auth, isTeacherOrAdmin, [
  body('titre')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('cours')
    .isMongoId()
    .withMessage('ID de cours invalide'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Au moins une question est requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const quizData = {
      ...req.body,
      enseignant: req.user._id
    };

    const quiz = new Quiz(quizData);
    await quiz.save();

    await quiz.populate('enseignant', 'nom prenom');

    res.status(201).json({
      message: 'Quiz créé avec succès',
      quiz
    });
  } catch (error) {
    console.error('Erreur création quiz:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la création du quiz'
    });
  }
});

// @route   POST /api/quiz/:id/submit
// @desc    Soumettre les réponses d'un quiz
// @access  Private
router.post('/:id/submit', auth, [
  body('reponses')
    .isArray()
    .withMessage('Les réponses doivent être un tableau')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz non trouvé'
      });
    }

    const { reponses } = req.body;
    let score = 0;
    let bonnesReponses = 0;
    const corrections = [];

    // Corriger chaque question
    quiz.questions.forEach((question, index) => {
      const reponseUtilisateur = reponses[index];
      let estCorrect = false;

      if (question.type === 'choix_multiple') {
        const bonneOption = question.options.find(opt => opt.estCorrect);
        estCorrect = reponseUtilisateur === bonneOption.texte;
      } else if (question.type === 'vrai_faux') {
        const bonneReponse = question.options.find(opt => opt.estCorrect);
        estCorrect = reponseUtilisateur === bonneReponse.texte;
      } else if (question.type === 'texte_libre') {
        // Comparaison simple (peut être améliorée)
        estCorrect = reponseUtilisateur?.toLowerCase().trim() === 
                    question.reponseCorrecte?.toLowerCase().trim();
      }

      if (estCorrect) {
        score += question.points;
        bonnesReponses++;
      }

      corrections.push({
        questionId: question._id,
        reponseUtilisateur,
        estCorrect,
        explication: question.explication
      });
    });

    const pourcentage = Math.round((score / quiz.pointsTotal) * 100);
    const reussi = pourcentage >= quiz.notePassage;

    // Sauvegarder le résultat
    const resultat = new QuizResult({
      quiz: quiz._id,
      utilisateur: req.user._id,
      reponses: corrections,
      score,
      pourcentage,
      reussi,
      tempsPasse: req.body.tempsPasse || 0
    });

    await resultat.save();

    // Mettre à jour les statistiques utilisateur
    const user = await User.findById(req.user._id);
    user.statistiques.quizRealises += 1;
    
    // Recalculer la moyenne
    const totalQuiz = user.statistiques.quizRealises;
    const ancienneMoyenne = user.statistiques.moyenneQuiz;
    user.statistiques.moyenneQuiz = 
      ((ancienneMoyenne * (totalQuiz - 1)) + pourcentage) / totalQuiz;

    await user.save();

    res.json({
      message: 'Quiz soumis avec succès',
      resultat: {
        score,
        pourcentage,
        bonnesReponses,
        totalQuestions: quiz.questions.length,
        reussi,
        corrections: quiz.afficherResultat ? corrections : null
      }
    });
  } catch (error) {
    console.error('Erreur soumission quiz:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la soumission du quiz'
    });
  }
});

// @route   GET /api/quiz/:id/results
// @desc    Obtenir les résultats d'un quiz
// @access  Private
router.get('/:id/results', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz non trouvé'
      });
    }

    let filter = { quiz: req.params.id };

    // Si étudiant, ne voir que ses propres résultats
    if (req.user.role === 'etudiant') {
      filter.utilisateur = req.user._id;
    }

    const resultats = await QuizResult.find(filter)
      .populate('utilisateur', 'nom prenom email')
      .sort({ dateCompletion: -1 });

    res.json({ resultats });
  } catch (error) {
    console.error('Erreur récupération résultats:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des résultats'
    });
  }
});

module.exports = router;