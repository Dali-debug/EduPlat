const mongoose = require('mongoose');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/plateforme-education')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const checkDatabase = async () => {
  try {
    console.log('🔍 Recherche de tous les utilisateurs...');
    console.log('');
    
    const users = await User.find({}, 'email nom prenom role dateInscription');
    console.log(`👥 Nombre total d'utilisateurs: ${users.length}`);
    console.log('');

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données !');
      console.log('');
    } else {
      console.log('📋 Liste des utilisateurs:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. 📧 ${user.email}`);
        console.log(`   👤 ${user.prenom} ${user.nom}`);
        console.log(`   🔐 ${user.role}`);
        console.log(`   📅 ${user.dateInscription}`);
        console.log('');
      });
    }

    console.log('🔍 Recherche spécifique admin@plateforme.com...');
    const admin = await User.findOne({ email: 'admin@plateforme.com' });
    
    if (admin) {
      console.log('✅ Admin trouvé !');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Nom: ${admin.prenom} ${admin.nom}`);
      console.log(`🔐 Role: ${admin.role}`);
      console.log(`📅 Créé le: ${admin.dateInscription}`);
      console.log(`🔒 Mot de passe hashé: ${admin.motDePasse ? 'OUI' : 'NON'}`);
    } else {
      console.log('❌ Admin admin@plateforme.com NON TROUVÉ !');
      console.log('');
      console.log('🛠️ Création d\'un nouvel administrateur...');
      
      const newAdmin = new User({
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@plateforme.com',
        motDePasse: 'admin123',
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('✅ Nouvel administrateur créé avec succès !');
      console.log('📧 Email: admin@plateforme.com');
      console.log('🔑 Mot de passe: admin123');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('');
    console.log('🔌 Connexion MongoDB fermée');
  }
};

checkDatabase();
