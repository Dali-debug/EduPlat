const mongoose = require('mongoose');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/plateforme-education')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const recreateAdmin = async () => {
  try {
    console.log('🔄 Suppression de tous les admins existants...');
    
    // Supprimer tous les utilisateurs avec email contenant 'admin'
    const deletedCount = await User.deleteMany({ 
      email: { $regex: 'admin', $options: 'i' } 
    });
    console.log(`🗑️ ${deletedCount.deletedCount} admin(s) supprimé(s)`);
    
    console.log('✅ Création d\'un nouvel admin...');
    
    const admin = new User({
      nom: 'Administrateur',
      prenom: 'Super',
      email: 'admin@plateforme.com',
      motDePasse: 'admin123',
      role: 'admin'
    });
    
    await admin.save();
    console.log('✅ Admin créé avec succès !');
    console.log('');
    console.log('📋 Détails de l\'administrateur:');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Mot de passe: admin123`);
    console.log(`👤 Nom: ${admin.prenom} ${admin.nom}`);
    console.log(`🔐 Role: ${admin.role}`);
    console.log(`🆔 ID: ${admin._id}`);
    console.log('');
    
    // Vérification immédiate
    console.log('🔍 Vérification immédiate...');
    const verifyAdmin = await User.findOne({ email: 'admin@plateforme.com' });
    if (verifyAdmin) {
      console.log('✅ Admin trouvé dans la base !');
      console.log(`📧 Email vérifié: ${verifyAdmin.email}`);
      console.log(`🔐 Role vérifié: ${verifyAdmin.role}`);
    } else {
      console.log('❌ Admin NOT trouvé après création !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('');
    console.log('🔌 Connexion MongoDB fermée');
  }
};

recreateAdmin();
