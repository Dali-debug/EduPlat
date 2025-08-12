import api from './api';

export const courseService = {
  // Obtenir tous les cours
  getCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/courses?${queryString}`);
  },

  // Obtenir un cours spécifique
  getCourse: async (id) => {
    return await api.get(`/courses/${id}`);
  },

  // Obtenir le contenu complet d'un cours
  getCourseContent: async (id) => {
    return await api.get(`/courses/${id}/content`);
  },

  // Créer un cours
  createCourse: async (courseData) => {
    return await api.post('/courses', courseData);
  },

  // Mettre à jour un cours
  updateCourse: async (id, courseData) => {
    return await api.put(`/courses/${id}`, courseData);
  },

  // S'inscrire à un cours
  enrollCourse: async (id) => {
    return await api.post(`/courses/${id}/enroll`);
  },

  // Mettre à jour la progression
  updateProgress: async (id, progression) => {
    return await api.put(`/courses/${id}/progress`, { progression });
  },

  // Supprimer un cours
  deleteCourse: async (id) => {
    return await api.delete(`/courses/${id}`);
  }
};