import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { courseService } from '../services/courseService';
import { adminService } from '../services/adminService';
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  TrendingUp,
  UserCheck,
  Eye,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  Key,
  Lock
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    users: [],
    courses: [],
    stats: {
      totalUsers: 0,
      totalCourses: 0,
      totalStudents: 0,
      totalTeachers: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    userRole: '',
    courseStatus: '',
    search: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fonction pour charger les données du dashboard
  const loadDashboardData = async () => {
    try {
      const [usersResponse, coursesResponse] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        courseService.getCourses({ limit: 100 })
      ]);

      const users = usersResponse.users || [];
      const courses = coursesResponse.courses || [];

      const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalStudents: users.filter(user => user.role === 'etudiant').length,
        totalTeachers: users.filter(user => user.role === 'enseignant').length
      };

      setDashboardData({
        users,
        courses,
        stats
      });
    } catch (error) {
      console.error('Erreur chargement dashboard admin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Vérification du rôle admin
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        setIsAdminVerified(true);
      } else {
        setIsAdminVerified(false);
        setLoading(false);
      }
    } else if (!authLoading && !user) {
      setIsAdminVerified(false);
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est vérifié comme admin
    if (isAdminVerified && !authLoading) {
      loadDashboardData();
    }
  }, [isAdminVerified, authLoading]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      toast.success('Utilisateur supprimé avec succès');
      loadDashboardData();
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await adminService.changeUserPassword(selectedUser._id, newPassword);
      toast.success(`Mot de passe mis à jour pour ${selectedUser.prenom} ${selectedUser.nom}`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error('Erreur lors du changement de mot de passe');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'actif' ? 'suspendu' : 'actif';
      await adminService.updateUserStatus(userId, newStatus);
      toast.success(`Utilisateur ${newStatus === 'actif' ? 'activé' : 'suspendu'}`);
      loadDashboardData();
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      toast.success('Cours supprimé avec succès');
      loadDashboardData();
    } catch (error) {
      console.error('Erreur suppression cours:', error);
      toast.error('Erreur lors de la suppression du cours');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'enseignant': return 'blue';
      case 'etudiant': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'publie': return 'green';
      case 'brouillon': return 'yellow';
      case 'archive': return 'gray';
      default: return 'gray';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const filteredUsers = dashboardData.users.filter(user => {
    if (filters.userRole && user.role !== filters.userRole) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        user.nom.toLowerCase().includes(searchLower) ||
        user.prenom.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredCourses = dashboardData.courses.filter(course => {
    if (filters.courseStatus && course.status !== filters.courseStatus) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return course.titre.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Affichage du loader pendant la vérification d'authentification ou de rôle
  if (authLoading || (user && !isAdminVerified && loading)) {
    return <LoadingSpinner text="Vérification des permissions admin..." />;
  }

  // Si pas d'utilisateur ou pas admin
  if (!user || !isAdminVerified) {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>Accès refusé</h2>
          <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Affichage du loader pendant le chargement des données admin
  if (loading) {
    return <LoadingSpinner text="Chargement du dashboard admin..." />;
  }

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 size={16} /> },
    { key: 'users', label: 'Utilisateurs', icon: <Users size={16} /> },
    { key: 'courses', label: 'Cours', icon: <BookOpen size={16} /> },
    { key: 'settings', label: 'Paramètres', icon: <Settings size={16} /> }
  ];

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard Administrateur</h1>
            <p>Gérez la plateforme et surveillez l'activité</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <Settings size={16} />
              Paramètres système
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Utilisateurs totaux</p>
                <p className="stat-value">{dashboardData.stats.totalUsers}</p>
              </div>
              <div className="stat-icon">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Étudiants</p>
                <p className="stat-value">{dashboardData.stats.totalStudents}</p>
              </div>
              <div className="stat-icon">
                <UserCheck size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Enseignants</p>
                <p className="stat-value">{dashboardData.stats.totalTeachers}</p>
              </div>
              <div className="stat-icon">
                <Shield size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Cours</p>
                <p className="stat-value">{dashboardData.stats.totalCourses}</p>
              </div>
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="overview-cards">
                <div className="overview-card">
                  <div className="card-header">
                    <h3>Activité récente</h3>
                    <TrendingUp size={20} />
                  </div>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-dot green"></div>
                      <span>Nouvel utilisateur inscrit</span>
                      <span className="activity-time">Il y a 2h</span>
                    </div>
                    <div className="activity-item">
                      <div className="activity-dot blue"></div>
                      <span>Nouveau cours publié</span>
                      <span className="activity-time">Il y a 4h</span>
                    </div>
                    <div className="activity-item">
                      <div className="activity-dot orange"></div>
                      <span>Cours modifié</span>
                      <span className="activity-time">Il y a 1j</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h3>Alertes système</h3>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="alerts-list">
                    <div className="alert-item warning">
                      <AlertTriangle size={16} />
                      <span>Espace disque faible (85% utilisé)</span>
                    </div>
                    <div className="alert-item info">
                      <Shield size={16} />
                      <span>Mise à jour de sécurité disponible</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="charts-section">
                <div className="chart-card">
                  <h3>Croissance des utilisateurs</h3>
                  <div className="chart-placeholder">
                    <BarChart3 size={48} />
                    <p>Graphique des inscriptions par mois</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-content">
              <div className="section-header">
                <h3>Gestion des utilisateurs ({filteredUsers.length})</h3>
                <div className="filters">
                  <select
                    value={filters.userRole}
                    onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">Tous les rôles</option>
                    <option value="etudiant">Étudiants</option>
                    <option value="enseignant">Enseignants</option>
                    <option value="admin">Administrateurs</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Inscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.nom} />
                              ) : (
                                <span>{user.nom.charAt(0)}{user.prenom.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="user-name">{user.nom} {user.prenom}</p>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.dateInscription)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPasswordModal(true);
                              }}
                              className="btn btn-outline btn-sm"
                              title="Changer le mot de passe"
                            >
                              <Key size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.status || 'actif')}
                              className="btn btn-outline btn-sm"
                              title={user.status === 'suspendu' ? 'Activer' : 'Suspendre'}
                            >
                              <Shield size={14} />
                            </button>
                            <button className="btn btn-outline btn-sm">
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-outline btn-sm">
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn btn-outline btn-sm danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-content">
              <div className="section-header">
                <h3>Gestion des cours ({filteredCourses.length})</h3>
                <div className="filters">
                  <select
                    value={filters.courseStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, courseStatus: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="publie">Publié</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="archive">Archivé</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="courses-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Enseignant</th>
                      <th>Statut</th>
                      <th>Étudiants</th>
                      <th>Création</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map(course => (
                      <tr key={course._id}>
                        <td>
                          <div className="course-info">
                            <div className="course-image">
                              {course.imagePreview ? (
                                <img src={course.imagePreview} alt={course.titre} />
                              ) : (
                                <BookOpen size={16} />
                              )}
                            </div>
                            <div>
                              <p className="course-title">{course.titre}</p>
                              <p className="course-category">{course.categorie}</p>
                            </div>
                          </div>
                        </td>
                        <td>{course.enseignant?.nom} {course.enseignant?.prenom}</td>
                        <td>
                          <span className={`status-badge ${getStatusColor(course.status)}`}>
                            {course.status}
                          </span>
                        </td>
                        <td>{course.statistiques?.nbEtudiants || 0}</td>
                        <td>{formatDate(course.dateCreation)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-outline btn-sm">
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-outline btn-sm">
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="btn btn-outline btn-sm danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-content">
              <div className="settings-section">
                <h3>Paramètres de la plateforme</h3>
                <div className="settings-grid">
                  <div className="setting-card">
                    <h4>Général</h4>
                    <div className="setting-item">
                      <label>Nom de la plateforme</label>
                      <input type="text" className="input" defaultValue="EduPlatform" />
                    </div>
                    <div className="setting-item">
                      <label>Email de contact</label>
                      <input type="email" className="input" defaultValue="contact@eduplatform.com" />
                    </div>
                  </div>

                  <div className="setting-card">
                    <h4>Sécurité</h4>
                    <div className="setting-item">
                      <label>Tentatives de connexion max</label>
                      <input type="number" className="input" defaultValue="5" />
                    </div>
                    <div className="setting-item">
                      <label>Durée de session (minutes)</label>
                      <input type="number" className="input" defaultValue="480" />
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary">
                  <Settings size={16} />
                  Sauvegarder les paramètres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Lock size={20} />
                Changer le mot de passe
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="user-avatar">
                  {selectedUser?.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.nom} />
                  ) : (
                    <span>
                      {selectedUser?.nom?.charAt(0)}{selectedUser?.prenom?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h4>{selectedUser?.prenom} {selectedUser?.nom}</h4>
                  <p>{selectedUser?.email}</p>
                  <span className={`role-badge ${getRoleColor(selectedUser?.role)}`}>
                    {selectedUser?.role}
                  </span>
                </div>
              </div>

              <div className="password-form">
                <div className="form-group">
                  <label htmlFor="newPassword">Nouveau mot de passe</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisissez le nouveau mot de passe"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez le nouveau mot de passe"
                    className="form-control"
                  />
                </div>

                <div className="password-requirements">
                  <p>Exigences du mot de passe :</p>
                  <ul>
                    <li className={newPassword.length >= 6 ? 'valid' : ''}>
                      Au moins 6 caractères
                    </li>
                    <li className={newPassword === confirmPassword && newPassword ? 'valid' : ''}>
                      Les mots de passe correspondent
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                className="btn btn-primary"
                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                <Key size={16} />
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
