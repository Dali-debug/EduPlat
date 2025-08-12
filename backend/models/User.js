const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: {
    type: String,
    enum: ['etudiant', 'enseignant', 'admin'],
    default: 'etudiant'
  },
  avatar: {
    type: String,
    default: ''
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  dernierConnexion: {
    type: Date,
    default: Date.now
  },
  coursInscrits: [{
    coursId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    dateInscription: {
      type: Date,
      default: Date.now
    },
    progression: {
      type: Number,
      default: 0
    }
  }],
  statistiques: {
    coursTermines: {
      type: Number,
      default: 0
    },
    quizRealises: {
      type: Number,
      default: 0
    },
    tempsTotal: {
      type: Number,
      default: 0
    },
    moyenneQuiz: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    langue: {
      type: String,
      default: 'fr'
    }
  }
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

// Méthode pour obtenir les infos publiques
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.motDePasse;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);