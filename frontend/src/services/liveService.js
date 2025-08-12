import api from './api';

export const liveService = {
  // Obtenir toutes les sessions live
  getLiveSessions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/live?${queryString}`);
  },

  // Obtenir une session live spécifique
  getLiveSession: async (id) => {
    return await api.get(`/live/${id}`);
  },

  // Créer une session live
  createLiveSession: async (sessionData) => {
    return await api.post('/live', sessionData);
  },

  // Rejoindre une session live
  joinLiveSession: async (id) => {
    return await api.post(`/live/${id}/join`);
  },

  // Démarrer une session live
  startLiveSession: async (id) => {
    return await api.post(`/live/${id}/start`);
  },

  // Terminer une session live
  endLiveSession: async (id) => {
    return await api.post(`/live/${id}/end`);
  }
};