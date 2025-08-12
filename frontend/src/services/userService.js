import api from './api';

export const userService = {
  // Obtenir les données du dashboard
  getDashboard: async () => {
    return await api.get('/users/dashboard');
  },

  // Obtenir la liste des utilisateurs (Admin)
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/users?${queryString}`);
  }
};