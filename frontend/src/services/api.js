import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration de base d'Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      console.log('Token invalide détecté, nettoyage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Ne rediriger vers la page de connexion que si on n'y est pas déjà
      // et si on n'est pas sur la page d'accueil
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') &&
        !currentPath.includes('/register') &&
        !currentPath.includes('/') &&
        currentPath !== '/') {

        // Ajouter un petit délai pour éviter les redirections multiples
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    // Gestion des erreurs réseau
    if (!error.response) {
      console.error('Erreur réseau:', error.message);
      return Promise.reject({
        response: {
          data: {
            message: 'Erreur de connexion au serveur'
          }
        }
      });
    }

    return Promise.reject(error);
  }
);

export default api;
