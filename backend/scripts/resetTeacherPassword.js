require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const resetTeacherPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté');

        // Trouver l'enseignant
        const teacher = await User.findOne({ email: 'mouhamed.boubakri@esprim.tn' });

        if (!teacher) {
            console.log('Enseignant non trouvé');
            return;
        }

        // Mettre à jour le mot de passe
        teacher.motDePasse = 'password123';
        await teacher.save();

        console.log('✅ Mot de passe de l\'enseignant mis à jour: password123');
        console.log(`Email: ${teacher.email}`);
        console.log(`Nom: ${teacher.prenom} ${teacher.nom}`);
        console.log(`Role: ${teacher.role}`);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Déconnecté de MongoDB');
    }
};

resetTeacherPassword();
