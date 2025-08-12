const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/plateforme-education')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const testAdmin = async () => {
  try {
    const email = 'admin@plateforme.com';
    const motDePasse = 'Admin123!';

    console.log('🔍 Test de connexion admin...');
    console.log(`📧 Email recherché: ${email}`);
    console.log(`🔑 Mot de passe testé: ${motDePasse}`);
    console.log('');

    // 1. Rechercher l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log(`👤 Nom: ${user.prenom} ${user.nom}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔐 Role: ${user.role}`);
    console.log(`🗓️ Créé le: ${user.dateInscription}`);
    console.log(`🔒 Mot de passe hashé: ${user.motDePasse}`);
    console.log('');

    // 2. Tester la comparaison du mot de passe
    console.log('🔍 Test de comparaison du mot de passe...');
    
    // Test direct avec bcrypt
    const directMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    console.log(`🔍 Comparaison directe bcrypt: ${directMatch ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

    // Test avec la méthode du modèle
    const methodMatch = await user.comparePassword(motDePasse);
    console.log(`🔍 Méthode comparePassword: ${methodMatch ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);

    // 3. Test avec différents mots de passe pour déboguer
    console.log('');
    console.log('🔍 Tests supplémentaires...');
    
    const testPasswords = ['Admin123!', 'admin123!', 'Admin123', 'admin@plateforme.com'];
    for (const testPass of testPasswords) {
      const match = await user.comparePassword(testPass);
      console.log(`🔍 Test avec "${testPass}": ${match ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

testAdmin();
