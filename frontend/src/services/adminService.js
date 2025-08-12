import api from './api';

export const adminService = {
  // Obtenir tous les utilisateurs
  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/admin/users?${queryString}`);
  },

  // Obtenir tous les cours
  getAllCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/admin/courses?${queryString}`);
  },

  // Changer le mot de passe d'un utilisateur
  changeUserPassword: async (userId, newPassword) => {
    return await api.put(`/admin/users/${userId}/password`, { 
      newPassword 
    });
  },

  // Mettre à jour le statut d'un utilisateur
  updateUserStatus: async (userId, status) => {
    return await api.put(`/admin/users/${userId}/status`, { 
      status 
    });
  },

  // Supprimer un utilisateur
  deleteUser: async (userId) => {
    return await api.delete(`/admin/users/${userId}`);
  },

  // Obtenir les statistiques de la plateforme
  getPlatformStats: async () => {
    return await api.get('/admin/stats');
  },

  // Obtenir les logs d'activité
  getActivityLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/admin/logs?${queryString}`);
  },

  // Mettre à jour les paramètres de la plateforme
  updatePlatformSettings: async (settings) => {
    return await api.put('/admin/settings', settings);
  },

  // Obtenir les paramètres de la plateforme
  getPlatformSettings: async () => {
    return await api.get('/admin/settings');
  }
};
