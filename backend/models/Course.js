const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  enseignant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['mathematiques', 'sciences', 'langues', 'informatique', 'arts', 'histoire', 'autre']
  },
  niveau: {
    type: String,
    required: [true, 'Le niveau est requis'],
    enum: ['debutant', 'intermediaire', 'avance']
  },
  dureeEstimee: {
    type: Number, // en heures
    required: true,
    min: [1, 'La durée doit être d\'au moins 1 heure']
  },
  prix: {
    type: Number,
    default: 0,
    min: [0, 'Le prix ne peut pas être négatif']
  },
  imagePreview: {
    type: String,
    default: ''
  },
  modules: [{
    titre: {
      type: String,
      required: true
    },
    description: String,
    ordre: {
      type: Number,
      required: true
    },
    videos: [{
      titre: String,
      url: String,
      duree: Number, // en secondes
      ordre: Number
    }],
    documents: [{
      titre: String,
      url: String,
      type: String // pdf, doc, etc.
    }]
  }],
  quiz: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  sessionsLive: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession'
  }],
  statistiques: {
    nbEtudiants: {
      type: Number,
      default: 0
    },
    notemoyenne: {
      type: Number,
      default: 0
    },
    nbAvis: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['brouillon', 'publie', 'archive'],
    default: 'brouillon'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  derniereModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour la recherche
courseSchema.index({
  titre: 'text',
  description: 'text',
  categorie: 1,
  niveau: 1
});

// Middleware pour mettre à jour la date de modification
courseSchema.pre('save', function(next) {
  this.derniereModification = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);