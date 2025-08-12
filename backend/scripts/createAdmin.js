const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/plateforme-education')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const createAdmin = async () => {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Un administrateur existe déjà:');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Nom: ${existingAdmin.prenom} ${existingAdmin.nom}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      return;
    }

    // Créer un administrateur par défaut
    const adminData = {
      nom: 'Administrateur',
      prenom: 'Admin',
      email: 'admin@plateforme.com',
      motDePasse: 'Admin123!',
      role: 'admin'
    };

    // Créer l'utilisateur admin
    const admin = new User(adminData);
    await admin.save();

    console.log('🎉 Administrateur créé avec succès!');
    console.log('📋 Coordonnées de l\'administrateur:');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Mot de passe: Admin123!`);
    console.log(`👤 Nom: ${adminData.prenom} ${adminData.nom}`);
    console.log(`🔐 Role: ${adminData.role}`);
    console.log('');
    console.log('🔗 Vous pouvez vous connecter sur: http://localhost:3000/login');
    console.log('📊 Dashboard admin: http://localhost:3000/admin/dashboard');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

createAdmin();
