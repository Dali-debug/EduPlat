import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { courseService } from '../services/courseService';
import { liveService } from '../services/liveService';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Play,
  Calendar,
  Users,
  CheckCircle,
  BarChart3,
  Video
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboard, sessions] = await Promise.all([
        userService.getDashboard(),
        liveService.getLiveSessions({ upcoming: true, limit: 3 })
      ]);

      setDashboardData(dashboard.user);
      setUpcomingSessions(sessions.sessions);

      // Récupérer les cours récents de l'utilisateur
      if (dashboard.user.coursInscrits?.length > 0) {
        const coursesWithProgress = dashboard.user.coursInscrits
          .sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))
          .slice(0, 4);
        setRecentCourses(coursesWithProgress);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#ef4444';
    if (progress < 70) return '#f59e0b';
    return '#10b981';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <p>Erreur lors du chargement des données</p>
      </div>
    );
  }

  const stats = [
    {
      icon: <BookOpen size={24} />,
      title: 'Cours inscrits',
      value: dashboardData.coursInscrits?.length || 0,
      color: 'blue',
      link: '/courses'
    },
    {
      icon: <CheckCircle size={24} />,
      title: 'Cours terminés',
      value: dashboardData.statistiques?.coursTermines || 0,
      color: 'green'
    },
    {
      icon: <Award size={24} />,
      title: 'Quiz réalisés',
      value: dashboardData.statistiques?.quizRealises || 0,
      color: 'purple'
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Moyenne quiz',
      value: `${Math.round(dashboardData.statistiques?.moyenneQuiz || 0)}%`,
      color: 'orange'
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Bonjour, {user.prenom} !</h1>
            <p>Continuez votre apprentissage là où vous vous êtes arrêté</p>
          </div>
          <div className="header-actions">
            <Link to="/courses" className="btn btn-primary">
              <BookOpen size={16} />
              Découvrir des cours
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-title">{stat.title}</p>
                  <p className="stat-value">{stat.value}</p>
                </div>
                <div className="stat-icon">
                  {stat.icon}
                </div>
              </div>
              {stat.link && (
                <Link to={stat.link} className="stat-link">
                  Voir tout
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="dashboard-content">
          {/* Cours en cours */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Mes cours en cours</h2>
              <Link to="/courses" className="see-all">
                Voir tout
              </Link>
            </div>

            {recentCourses.length > 0 ? (
              <div className="courses-grid">
                {recentCourses.map((courseItem) => {
                  const course = courseItem.coursId;
                  if (!course) return null;

                  return (
                    <div key={course._id} className="course-card">
                      <div className="course-image">
                        {course.imagePreview ? (
                          <img src={course.imagePreview} alt={course.titre} />
                        ) : (
                          <div className="course-placeholder">
                            <BookOpen size={32} />
                          </div>
                        )}
                        <div className="course-progress-overlay">
                          <div className="progress-circle">
                            <svg viewBox="0 0 36 36">
                              <path
                                className="progress-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="progress-bar"
                                strokeDasharray={`${courseItem.progression}, 100`}
                                stroke={getProgressColor(courseItem.progression)}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span>{courseItem.progression}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="course-content">
                        <h3>{course.titre}</h3>
                        <p className="course-teacher">
                          Par {course.enseignant?.nom} {course.enseignant?.prenom}
                        </p>
                        
                        <div className="course-meta">
                          <span className="course-duration">
                            <Clock size={14} />
                            {course.dureeEstimee}h
                          </span>
                          <span className="course-level">{course.niveau}</span>
                        </div>

                        <div className="course-progress">
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${courseItem.progression}%`,
                                backgroundColor: getProgressColor(courseItem.progression)
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {courseItem.progression}% terminé
                          </span>
                        </div>

                        <Link 
                          to={`/course/${course._id}/content`}
                          className="btn btn-primary btn-sm"
                        >
                          <Play size={14} />
                          Continuer
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen size={48} />
                <h3>Aucun cours en cours</h3>
                <p>Commencez votre apprentissage en vous inscrivant à un cours</p>
                <Link to="/courses" className="btn btn-primary">
                  Découvrir des cours
                </Link>
              </div>
            )}
          </div>

          {/* Sessions live à venir */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Sessions live à venir</h2>
              <Link to="/live-sessions" className="see-all">
                Voir tout
              </Link>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="sessions-list">
                {upcomingSessions.map((session) => (
                  <div key={session._id} className="session-card">
                    <div className="session-time">
                      <Calendar size={20} />
                      <div>
                        <p className="session-date">
                          {formatDate(session.dateHeure)}
                        </p>
                        <p className="session-duration">
                          {session.dureeEstimee} min
                        </p>
                      </div>
                    </div>

                    <div className="session-info">
                      <h4>{session.titre}</h4>
                      <p>Avec {session.enseignant?.nom} {session.enseignant?.prenom}</p>
                      {session.cours && (
                        <span className="session-course">
                          {session.cours.titre}
                        </span>
                      )}
                    </div>

                    <div className="session-participants">
                      <Users size={16} />
                      <span>{session.participants?.length || 0} inscrits</span>
                    </div>

                    <Link 
                      to={`/live/${session._id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <Video size={14} />
                      Rejoindre
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Video size={48} />
                <h3>Aucune session programmée</h3>
                <p>Les prochaines sessions live apparaîtront ici</p>
                <Link to="/live-sessions" className="btn btn-primary">
                  Voir toutes les sessions
                </Link>
              </div>
            )}
          </div>

          {/* Progression globale */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Votre progression</h2>
            </div>

            <div className="progress-summary">
              <div className="progress-item">
                <div className="progress-header">
                  <span>Progression moyenne</span>
                  <span className="progress-percentage">
                    {dashboardData.statistiques?.progressionMoyenne || 0}%
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ 
                      width: `${dashboardData.statistiques?.progressionMoyenne || 0}%`,
                      backgroundColor: getProgressColor(dashboardData.statistiques?.progressionMoyenne || 0)
                    }}
                  ></div>
                </div>
              </div>

              <div className="progress-stats">
                <div className="progress-stat">
                  <BarChart3 size={20} />
                  <div>
                    <p className="stat-value">
                      {dashboardData.statistiques?.coursEnCours || 0}
                    </p>
                    <p className="stat-label">Cours en cours</p>
                  </div>
                </div>
                <div className="progress-stat">
                  <CheckCircle size={20} />
                  <div>
                    <p className="stat-value">
                      {dashboardData.statistiques?.coursTermines || 0}
                    </p>
                    <p className="stat-label">Cours terminés</p>
                  </div>
                </div>
                <div className="progress-stat">
                  <Award size={20} />
                  <div>
                    <p className="stat-value">
                      {Math.round(dashboardData.statistiques?.moyenneQuiz || 0)}%
                    </p>
                    <p className="stat-label">Moyenne quiz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;