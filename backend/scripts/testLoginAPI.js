const http = require('http');

const testLogin = () => {
  const data = JSON.stringify({
    email: 'admin@plateforme.com',
    motDePasse: 'Admin123!'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🔍 Test de connexion API...');
  console.log('📡 URL:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('📦 Données:', data);
  console.log('');

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('');

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('📥 Réponse:', responseData);
      
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.token) {
          console.log('✅ Connexion réussie !');
          console.log('🎫 Token reçu:', parsed.token.substring(0, 20) + '...');
          console.log('👤 Utilisateur:', parsed.user);
        } else {
          console.log('❌ Échec de connexion:', parsed.message);
        }
      } catch (error) {
        console.log('❌ Erreur parsing JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur requête:', error.message);
  });

  req.write(data);
  req.end();
};

testLogin();
