// Test de l'API de cours pour vérifier la récupération des cours d'un enseignant
require('dotenv').config();
const axios = require('axios');

const testCourseRetrieval = async () => {
    try {
        const API_URL = 'http://localhost:5000/api';

        // 1. Se connecter comme enseignant
        console.log('1. Connexion en tant qu\'enseignant...');

        // Essayer plusieurs mots de passe possibles
        const possiblePasswords = ['password123', 'Password123', 'password', '123456', 'admin123'];
        let loginResponse = null;
        let token = null;
        let enseignantId = null;

        for (const password of possiblePasswords) {
            try {
                console.log(`Tentative avec le mot de passe: ${password}`);
                loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    email: 'mouhamed.boubakri@esprim.tn',
                    password: password
                });

                token = loginResponse.data.token;
                enseignantId = loginResponse.data.user.id;
                console.log('✅ Connexion réussie!');
                break;
            } catch (error) {
                console.log(`❌ Échec avec ${password}:`, error.response?.data?.message || error.message);
            }
        }

        if (!token) {
            console.log('❌ Impossible de se connecter avec les mots de passe testés');
            return;
        }

        // 2. Récupérer le profil
        console.log('\n2. Récupération du profil...');
        const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Profil récupéré:', JSON.stringify(profileResponse.data.user, null, 2));

        // 3. Récupérer les cours de cet enseignant
        console.log('\n3. Récupération des cours...');
        const coursesResponse = await axios.get(`${API_URL}/courses?enseignant=${enseignantId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Nombre de cours trouvés:', coursesResponse.data.courses.length);
        coursesResponse.data.courses.forEach(course => {
            console.log(`- ${course.titre} (${course.status})`);
        });

    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
    }
};

testCourseRetrieval();
