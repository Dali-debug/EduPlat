const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'La question est requise']
  },
  type: {
    type: String,
    enum: ['choix_multiple', 'vrai_faux', 'texte_libre'],
    default: 'choix_multiple'
  },
  options: [{
    texte: String,
    estCorrect: Boolean
  }],
  reponseCorrecte: String, // Pour les questions texte libre
  points: {
    type: Number,
    default: 1,
    min: [1, 'Une question doit valoir au moins 1 point']
  },
  explication: String,
  ordre: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enseignant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  dureeMax: {
    type: Number, // en minutes
    default: 30
  },
  pointsTotal: {
    type: Number,
    default: 0
  },
  notePassage: {
    type: Number,
    default: 60 // pourcentage
  },
  tentativesMax: {
    type: Number,
    default: 3
  },
  melanger: {
    type: Boolean,
    default: true
  },
  afficherResultat: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['brouillon', 'actif', 'archive'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// Calculer automatiquement le total des points
quizSchema.pre('save', function(next) {
  this.pointsTotal = this.questions.reduce((total, question) => total + question.points, 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);