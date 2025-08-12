import api from './api';

export const quizService = {
  // Obtenir les quiz d'un cours
  getCourseQuizzes: async (courseId) => {
    return await api.get(`/quiz/course/${courseId}`);
  },

  // Obtenir un quiz spécifique
  getQuiz: async (id) => {
    return await api.get(`/quiz/${id}`);
  },

  // Créer un quiz
  createQuiz: async (quizData) => {
    return await api.post('/quiz', quizData);
  },

  // Soumettre les réponses d'un quiz
  submitQuiz: async (id, reponses, tempsPasse) => {
    return await api.post(`/quiz/${id}/submit`, { reponses, tempsPasse });
  },

  // Obtenir les résultats d'un quiz
  getQuizResults: async (id) => {
    return await api.get(`/quiz/${id}/results`);
  }
};