const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  enseignant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  dateHeure: {
    type: Date,
    required: [true, 'La date et heure sont requises']
  },
  dureeEstimee: {
    type: Number, // en minutes
    default: 60
  },
  urlMeeting: {
    type: String,
    default: ''
  },
  motDePasse: {
    type: String,
    default: ''
  },
  capaciteMax: {
    type: Number,
    default: 100
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateInscription: {
      type: Date,
      default: Date.now
    },
    aAssiste: {
      type: Boolean,
      default: false
    }
  }],
  enregistrement: {
    url: String,
    disponible: {
      type: Boolean,
      default: false
    }
  },
  materiel: [{
    titre: String,
    url: String,
    type: String
  }],
  chat: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['planifie', 'en_cours', 'termine', 'annule'],
    default: 'planifie'
  }
}, {
  timestamps: true
});

// Index pour les recherches par date
liveSessionSchema.index({ dateHeure: 1, status: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);