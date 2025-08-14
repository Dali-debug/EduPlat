import api from './api';

export const uploadService = {
  // Upload d'une image
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      console.log('Envoi de l\'image:', file.name, 'Taille:', file.size);

      // Obtenir le token manuellement
      const token = localStorage.getItem('token');
      console.log('Token présent:', !!token);

      // Utiliser fetch au lieu d'axios pour éviter les problèmes d'interceptors
      const response = await fetch(`http://localhost:5000/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NE PAS définir Content-Type pour FormData
        },
        body: formData
      });

      console.log('Status de la réponse:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erreur serveur:', errorData);
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('Données reçues:', data);
      return data;
    } catch (error) {
      console.error('Erreur uploadService:', error);
      throw error;
    }
  },

  // Upload d'une vidéo
  uploadVideo: async (file) => {
    const formData = new FormData();
    formData.append('video', file);

    return await api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload d'un document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);

    return await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
