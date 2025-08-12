const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🔍 Test de l\'API de connexion...');
    console.log('🌐 URL: http://localhost:5000/api/auth/login');
    console.log('📧 Email: admin@plateforme.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('');

    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@plateforme.com',
      motDePasse: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCÈS ! Connexion réussie');
    console.log('📊 Status:', response.status);
    console.log('🎫 Token reçu:', response.data.token ? 'OUI' : 'NON');
    console.log('👤 Utilisateur:', response.data.user);
    console.log('');
    console.log('🎉 L\'API fonctionne correctement !');

  } catch (error) {
    console.log('❌ ÉCHEC de la connexion');
    console.log('📊 Status:', error.response?.status || 'Pas de réponse');
    console.log('💬 Message:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('📄 Réponse complète:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('');
    console.log('🔍 Détails de l\'erreur:');
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Le serveur backend n\'est pas accessible sur http://localhost:5000');
      console.log('💡 Vérifiez que le serveur backend est démarré');
    } else if (error.response?.status === 400) {
      console.log('❌ Erreur de validation ou identifiants incorrects');
    } else if (error.response?.status === 500) {
      console.log('❌ Erreur serveur interne');
    }
  }
};

// Vérifier d'abord si le serveur répond
const checkServer = async () => {
  try {
    console.log('🔍 Vérification du serveur backend...');
    const response = await axios.get('http://localhost:5000/api');
    console.log('✅ Serveur backend accessible');
  } catch (error) {
    console.log('❌ Serveur backend non accessible');
    console.log('💡 Assurez-vous que le serveur est démarré avec: npm start');
    return false;
  }
  return true;
};

const runTests = async () => {
  const serverOk = await checkServer();
  console.log('');
  
  if (serverOk) {
    await testLogin();
  }
};

runTests();
