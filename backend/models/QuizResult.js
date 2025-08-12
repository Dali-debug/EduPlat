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
    question: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reponseUtilisateur: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    estCorrecte: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreTotal: {
    type: Number,
    required: true
  },
  scoreObtenu: {
    type: Number,
    required: true
  },
  tempsEcoule: {
    type: Number, // en secondes
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  tentative: {
    type: Number,
    default: 1
  },
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'abandonne'],
    default: 'termine'
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons par tentative
quizResultSchema.index({ quiz: 1, utilisateur: 1, tentative: 1 }, { unique: true });

// Méthodes du schéma
quizResultSchema.methods.calculerPourcentage = function() {
  return Math.round((this.scoreObtenu / this.scoreTotal) * 100);
};

quizResultSchema.methods.aReussi = function(seuilReussite = 70) {
  return this.score >= seuilReussite;
};

// Méthodes statiques
quizResultSchema.statics.getMeilleureScore = async function(quizId, utilisateurId) {
  const resultat = await this.findOne({
    quiz: quizId,
    utilisateur: utilisateurId
  }).sort({ score: -1 });
  
  return resultat;
};

quizResultSchema.statics.getStatistiquesQuiz = async function(quizId) {
  const stats = await this.aggregate([
    { $match: { quiz: mongoose.Types.ObjectId(quizId) } },
    {
      $group: {
        _id: null,
        nombreTentatives: { $sum: 1 },
        scoreMoyen: { $avg: '$score' },
        scoreMin: { $min: '$score' },
        scoreMax: { $max: '$score' },
        tempsEcouleMoyen: { $avg: '$tempsEcoule' }
      }
    }
  ]);
  
  return stats[0] || {
    nombreTentatives: 0,
    scoreMoyen: 0,
    scoreMin: 0,
    scoreMax: 0,
    tempsEcouleMoyen: 0
  };
};

module.exports = mongoose.model('QuizResult', quizResultSchema);
