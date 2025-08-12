const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reponses: [{
    questionId: mongoose.Schema.Types.ObjectId,
    reponseUtilisateur: String,
    estCorrect: Boolean,
    explication: String
  }],
  score: {
    type: Number,
    required: true
  },
  pourcentage: {
    type: Number,
    required: true
  },
  reussi: {
    type: Boolean,
    required: true
  },
  tempsPasse: {
    type: Number, // en secondes
    default: 0
  },
  dateCompletion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
quizResultSchema.index({ quiz: 1, utilisateur: 1 });
quizResultSchema.index({ dateCompletion: -1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);