import api from './api';

export const authService = {
  // Connexion
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  // Inscription
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Obtenir le profil
  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    return await api.put('/auth/profile', profileData);
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    return await api.post('/auth/change-password', passwordData);
  },

  // Vérifier si le token est valide
  verifyToken: async () => {
    return await api.get('/auth/profile');
  }
};