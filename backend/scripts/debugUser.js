require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

const debugUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connecté');

        // Trouver tous les utilisateurs avec le rôle enseignant
        const enseignants = await User.find({ role: 'enseignant' }).select('nom prenom email _id');
        console.log('\n--- Enseignants trouvés ---');
        enseignants.forEach(enseignant => {
            console.log(`ID: ${enseignant._id}, Nom: ${enseignant.prenom} ${enseignant.nom}, Email: ${enseignant.email}`);
        });

        // Vérifier tous les cours
        const allCourses = await Course.find({}).populate('enseignant', 'nom prenom email').select('titre enseignant status dateCreation');
        console.log('\n--- Tous les cours ---');
        allCourses.forEach(course => {
            console.log(`Cours: ${course.titre}`);
            console.log(`  Enseignant ID: ${course.enseignant?._id}`);
            console.log(`  Enseignant: ${course.enseignant?.prenom} ${course.enseignant?.nom}`);
            console.log(`  Status: ${course.status}`);
            console.log(`  Date: ${course.dateCreation}\n`);
        });

        // Pour chaque enseignant, vérifier leurs cours
        for (const enseignant of enseignants) {
            const courses = await Course.find({ enseignant: enseignant._id });
            console.log(`\n--- Cours de ${enseignant.prenom} ${enseignant.nom} (${enseignant._id}) ---`);
            console.log(`Nombre de cours: ${courses.length}`);
            courses.forEach(course => {
                console.log(`  - ${course.titre} (${course.status})`);
            });
        }

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDéconnecté de MongoDB');
    }
};

debugUser();
