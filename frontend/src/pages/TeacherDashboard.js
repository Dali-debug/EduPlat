import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { liveService } from '../services/liveService';
import {
  BookOpen,
  Users,
  BarChart3,
  Plus,
  Clock,
  Calendar,
  Video,
  Edit,
  Eye,
  Trash2,
  Award,
  TrendingUp
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    liveSessions: [],
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      totalSessions: 0,
      averageRating: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Chargement des données pour l\'utilisateur:', user);
      
      if (!user || !user._id) {
        console.error('Utilisateur non connecté ou ID manquant');
        toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }

      // Charger les cours de cet enseignant
      let courses = [];
      try {
        console.log('Chargement des cours pour l\'enseignant:', user._id);
        const coursesResponse = await courseService.getCourses({ enseignant: user._id });
        console.log('Réponse courses:', coursesResponse);
        courses = coursesResponse.courses || [];
      } catch (coursesError) {
        console.error('Erreur chargement cours:', coursesError);
        // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de cours
        if (coursesError.response?.status !== 404) {
          toast.error('Erreur lors du chargement des cours');
        }
      }

      // Charger les sessions live de cet enseignant
      let sessions = [];
      try {
        console.log('Chargement des sessions pour l\'enseignant:', user._id);
        const sessionsResponse = await liveService.getLiveSessions({ enseignant: user._id });
        console.log('Réponse sessions:', sessionsResponse);
        sessions = sessionsResponse.sessions || [];
      } catch (sessionsError) {
        console.error('Erreur chargement sessions:', sessionsError);
        // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de sessions
        if (sessionsError.response?.status !== 404) {
          toast.error('Erreur lors du chargement des sessions');
        }
      }

      // Calculer les statistiques
      const totalStudents = courses.reduce((acc, course) => 
        acc + (course.statistiques?.nbEtudiants || 0), 0
      );

      const stats = {
        totalCourses: courses.length,
        totalStudents,
        totalSessions: sessions.length,
        averageRating: 4.8 // Simulé pour la démo
      };

      setDashboardData({
        courses,
        liveSessions: sessions,
        stats
      });
    } catch (error) {
      console.error('Erreur chargement dashboard enseignant:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      toast.success('Cours supprimé avec succès');
      loadDashboardData(); // Recharger les données
    } catch (error) {
      console.error('Erreur suppression cours:', error);
      toast.error('Erreur lors de la suppression du cours');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.dateHeure);
    
    if (session.status === 'termine') return 'Terminée';
    if (session.status === 'annule') return 'Annulée';
    if (sessionDate > now) return 'À venir';
    return 'En cours';
  };

  const getStatusClass = (session) => {
    const status = getSessionStatus(session);
    switch (status) {
      case 'À venir': return 'upcoming';
      case 'En cours': return 'live';
      case 'Terminée': return 'ended';
      case 'Annulée': return 'cancelled';
      default: return 'unknown';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du dashboard enseignant..." />;
  }

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 size={16} /> },
    { key: 'courses', label: 'Mes cours', icon: <BookOpen size={16} /> },
    { key: 'sessions', label: 'Sessions live', icon: <Video size={16} /> }
  ];

  return (
    <div className="teacher-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard Enseignant</h1>
            <p>Bienvenue, {user.prenom} ! Gérez vos cours et sessions</p>
          </div>
          <div className="header-actions">
            <Link to="/teacher/create-course" className="btn btn-primary">
              <Plus size={16} />
              Nouveau cours
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Cours créés</p>
                <p className="stat-value">{dashboardData.stats.totalCourses}</p>
              </div>
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Étudiants totaux</p>
                <p className="stat-value">{dashboardData.stats.totalStudents}</p>
              </div>
              <div className="stat-icon">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Sessions live</p>
                <p className="stat-value">{dashboardData.stats.totalSessions}</p>
              </div>
              <div className="stat-icon">
                <Video size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-title">Note moyenne</p>
                <p className="stat-value">{dashboardData.stats.averageRating}/5</p>
              </div>
              <div className="stat-icon">
                <Award size={24} />
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
              {/* Recent Activity */}
              <div className="overview-section">
                <h3>Activité récente</h3>
                <div className="activity-list">
                  {dashboardData.courses.slice(0, 3).map(course => (
                    <div key={course._id} className="activity-item">
                      <div className="activity-icon">
                        <BookOpen size={16} />
                      </div>
                      <div className="activity-content">
                        <p><strong>{course.titre}</strong></p>
                        <p className="activity-meta">
                          {course.statistiques?.nbEtudiants || 0} étudiants inscrits
                        </p>
                      </div>
                      <div className="activity-date">
                        {formatDate(course.dateCreation)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="overview-section">
                <h3>Prochaines sessions</h3>
                {dashboardData.liveSessions.length > 0 ? (
                  <div className="sessions-preview">
                    {dashboardData.liveSessions
                      .filter(session => new Date(session.dateHeure) > new Date())
                      .slice(0, 3)
                      .map(session => (
                        <div key={session._id} className="session-preview-item">
                          <div className="session-time">
                            <Calendar size={16} />
                            {formatDate(session.dateHeure)}
                          </div>
                          <div className="session-info">
                            <h4>{session.titre}</h4>
                            <p>{session.participants?.length || 0} inscrits</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="empty-message">Aucune session programmée</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-content">
              <div className="section-header">
                <h3>Mes cours ({dashboardData.courses.length})</h3>
                <Link to="/teacher/create-course" className="btn btn-primary">
                  <Plus size={16} />
                  Nouveau cours
                </Link>
              </div>

              {dashboardData.courses.length > 0 ? (
                <div className="courses-grid">
                  {dashboardData.courses.map(course => (
                    <div key={course._id} className="course-card">
                      <div className="course-image">
                        {course.imagePreview ? (
                          <img src={course.imagePreview} alt={course.titre} />
                        ) : (
                          <div className="course-placeholder">
                            <BookOpen size={32} />
                          </div>
                        )}
                        <div className="course-status">
                          <span className={`status-badge ${course.status}`}>
                            {course.status}
                          </span>
                        </div>
                      </div>

                      <div className="course-content">
                        <h4>{course.titre}</h4>
                        <p className="course-description">{course.description}</p>

                        <div className="course-stats">
                          <div className="stat">
                            <Users size={14} />
                            <span>{course.statistiques?.nbEtudiants || 0} étudiants</span>
                          </div>
                          <div className="stat">
                            <Clock size={14} />
                            <span>{course.dureeEstimee}h</span>
                          </div>
                          <div className="stat">
                            <TrendingUp size={14} />
                            <span>4.8/5</span>
                          </div>
                        </div>

                        <div className="course-actions">
                          <Link 
                            to={`/courses/${course._id}`}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye size={14} />
                            Voir
                          </Link>
                          <Link 
                            to={`/teacher/courses/${course._id}/edit`}
                            className="btn btn-outline btn-sm"
                          >
                            <Edit size={14} />
                            Modifier
                          </Link>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            className="btn btn-outline btn-sm danger"
                          >
                            <Trash2 size={14} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen size={64} />
                  <h3>Aucun cours créé</h3>
                  <p>Commencez par créer votre premier cours</p>
                  <Link to="/teacher/create-course" className="btn btn-primary">
                    <Plus size={16} />
                    Créer un cours
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="sessions-content">
              <div className="section-header">
                <h3>Sessions live ({dashboardData.liveSessions.length})</h3>
                <button className="btn btn-primary">
                  <Plus size={16} />
                  Nouvelle session
                </button>
              </div>

              {dashboardData.liveSessions.length > 0 ? (
                <div className="sessions-list">
                  {dashboardData.liveSessions.map(session => (
                    <div key={session._id} className="session-card">
                      <div className="session-status">
                        <span className={`status-badge ${getStatusClass(session)}`}>
                          {getSessionStatus(session)}
                        </span>
                      </div>

                      <div className="session-info">
                        <h4>{session.titre}</h4>
                        {session.description && (
                          <p className="session-description">{session.description}</p>
                        )}
                        
                        <div className="session-meta">
                          <div className="meta-item">
                            <Calendar size={16} />
                            <span>{formatDate(session.dateHeure)}</span>
                          </div>
                          <div className="meta-item">
                            <Clock size={16} />
                            <span>{session.dureeEstimee} min</span>
                          </div>
                          <div className="meta-item">
                            <Users size={16} />
                            <span>{session.participants?.length || 0} inscrits</span>
                          </div>
                        </div>
                      </div>

                      <div className="session-actions">
                        <Link 
                          to={`/live/${session._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          <Eye size={14} />
                          Voir
                        </Link>
                        <button className="btn btn-outline btn-sm">
                          <Edit size={14} />
                          Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Video size={64} />
                  <h3>Aucune session programmée</h3>
                  <p>Créez votre première session live</p>
                  <button className="btn btn-primary">
                    <Plus size={16} />
                    Créer une session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;