import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      // Si l'erreur est liée à l'authentification, nettoyer et ne pas afficher d'erreur
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        // Pour les autres erreurs, on peut afficher un message
        console.warn('Erreur de connexion lors de la vérification du statut d\'authentification');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);

      localStorage.setItem('token', response.token);
      setUser(response.user);

      toast.success('Connexion réussie !');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);

      localStorage.setItem('token', response.token);
      setUser(response.user);

      toast.success('Inscription réussie !');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur d\'inscription';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      toast.success('Profil mis à jour !');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de mise à jour';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      toast.success('Mot de passe modifié !');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de modification';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Erreur refresh auth:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        toast.error('Session expirée. Veuillez vous reconnecter.');
      }
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus,
    refreshAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
