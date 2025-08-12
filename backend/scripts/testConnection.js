const axios = require('axios');

const testConnection = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Serveur accessible:', response.data);
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        console.error('Code:', error.code);
    }
};

testConnection();
