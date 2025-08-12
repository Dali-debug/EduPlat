import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Play,
  CheckCircle,
  Award,
  Calendar,
  User,
  ChevronRight,
  Video,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    if (user && course) {
      checkEnrollment();
    }
  }, [user, course]);

  const loadCourse = async () => {
    try {
      const response = await courseService.getCourse(id);
      setCourse(response.course);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      toast.error('Impossible de charger le cours');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = () => {
    if (user?.coursInscrits) {
      const enrolled = user.coursInscrits.some(
        c => c.coursId === id || c.coursId?._id === id
      );
      setIsEnrolled(enrolled);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour vous inscrire');
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      await courseService.enrollCourse(id);
      setIsEnrolled(true);
      toast.success('Inscription réussie !');
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartCourse = () => {
    navigate(`/course/${id}/content`);
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du cours..." />;
  }

  if (!course) {
    return (
      <div className="course-error">
        <h2>Cours non trouvé</h2>
        <p>Le cours que vous recherchez n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Aperçu', icon: <BookOpen size={16} /> },
    { key: 'curriculum', label: 'Programme', icon: <FileText size={16} /> },
    { key: 'instructor', label: 'Enseignant', icon: <User size={16} /> }
  ];

  return (
    <div className="course-detail-page">
      <div className="container">
        {/* Course Header */}
        <div className="course-header">
          <div className="course-hero">
            <div className="course-info">
              <div className="course-breadcrumb">
                <span>{course.categorie}</span>
                <ChevronRight size={16} />
                <span>{course.niveau}</span>
              </div>
              
              <h1>{course.titre}</h1>
              <p className="course-description">{course.description}</p>

              <div className="course-meta">
                <div className="meta-item">
                  <Star size={16} fill="currentColor" />
                  <span>4.8 (156 avis)</span>
                </div>
                <div className="meta-item">
                  <Users size={16} />
                  <span>{course.statistiques?.nbEtudiants || 0} étudiants</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} />
                  <span>{course.dureeEstimee} heures</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>Mis à jour le {new Date(course.derniereModification).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="course-instructor">
                <div className="instructor-avatar">
                  {course.enseignant?.avatar ? (
                    <img src={course.enseignant.avatar} alt={course.enseignant.nom} />
                  ) : (
                    <span>{course.enseignant?.nom?.charAt(0)}{course.enseignant?.prenom?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p>Enseignant</p>
                  <p className="instructor-name">
                    {course.enseignant?.nom} {course.enseignant?.prenom}
                  </p>
                </div>
              </div>
            </div>

            <div className="course-image">
              {course.imagePreview ? (
                <img src={course.imagePreview} alt={course.titre} />
              ) : (
                <div className="course-placeholder">
                  <BookOpen size={80} />
                </div>
              )}
            </div>
          </div>

          <div className="course-actions">
            <div className="price-section">
              {course.prix > 0 ? (
                <span className="course-price">{course.prix}€</span>
              ) : (
                <span className="course-free">Gratuit</span>
              )}
            </div>

            <div className="action-buttons">
              {isEnrolled ? (
                <button onClick={handleStartCourse} className="btn btn-primary btn-lg">
                  <Play size={20} />
                  Commencer le cours
                </button>
              ) : (
                <button 
                  onClick={handleEnroll} 
                  disabled={enrolling}
                  className="btn btn-primary btn-lg"
                >
                  {enrolling ? (
                    <>
                      <div className="loading-spinner"></div>
                      Inscription...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      S'inscrire au cours
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="course-includes">
              <h4>Ce cours inclut :</h4>
              <ul>
                <li>
                  <Video size={16} />
                  <span>{course.modules?.reduce((acc, module) => acc + (module.videos?.length || 0), 0) || 0} vidéos</span>
                </li>
                <li>
                  <FileText size={16} />
                  <span>Supports de cours téléchargeables</span>
                </li>
                <li>
                  <Award size={16} />
                  <span>Certificat de réussite</span>
                </li>
                <li>
                  <Users size={16} />
                  <span>Accès à la communauté</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="course-content">
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
                <div className="overview-section">
                  <h3>À propos de ce cours</h3>
                  <div className="course-long-description">
                    <p>{course.description}</p>
                    {/* Vous pouvez ajouter une description plus longue ici */}
                  </div>
                </div>

                <div className="overview-section">
                  <h3>Ce que vous apprendrez</h3>
                  <div className="learning-objectives">
                    {course.modules?.slice(0, 6).map((module, index) => (
                      <div key={index} className="learning-item">
                        <CheckCircle size={16} />
                        <span>{module.titre}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-section">
                  <h3>Prérequis</h3>
                  <ul className="prerequisites">
                    <li>Aucun prérequis spécifique</li>
                    <li>Motivation pour apprendre</li>
                    <li>Accès à un ordinateur avec connexion internet</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="curriculum-content">
                <div className="curriculum-header">
                  <h3>Programme du cours</h3>
                  <p>
                    {course.modules?.length || 0} modules • 
                    {course.modules?.reduce((acc, module) => acc + (module.videos?.length || 0), 0) || 0} leçons • 
                    {course.dureeEstimee}h de contenu
                  </p>
                </div>

                <div className="modules-list">
                  {course.modules?.map((module, index) => (
                    <div key={index} className="module-item">
                      <div className="module-header">
                        <h4>
                          <span className="module-number">{index + 1}.</span>
                          {module.titre}
                        </h4>
                        <span className="module-duration">
                          {module.videos?.length || 0} leçons
                        </span>
                      </div>
                      
                      {module.description && (
                        <p className="module-description">{module.description}</p>
                      )}

                      {module.videos && module.videos.length > 0 && (
                        <div className="module-videos">
                          {module.videos.map((video, videoIndex) => (
                            <div key={videoIndex} className="video-item">
                              <Play size={14} />
                              <span>{video.titre}</span>
                              {video.duree && (
                                <span className="video-duration">
                                  {Math.floor(video.duree / 60)}:{(video.duree % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="instructor-content">
                <div className="instructor-profile">
                  <div className="instructor-avatar-large">
                    {course.enseignant?.avatar ? (
                      <img src={course.enseignant.avatar} alt={course.enseignant.nom} />
                    ) : (
                      <span>{course.enseignant?.nom?.charAt(0)}{course.enseignant?.prenom?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="instructor-info">
                    <h3>{course.enseignant?.nom} {course.enseignant?.prenom}</h3>
                    <p className="instructor-title">Enseignant Expert</p>
                    
                    <div className="instructor-stats">
                      <div className="stat">
                        <span className="stat-number">4.9</span>
                        <span className="stat-label">Note moyenne</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">1,250</span>
                        <span className="stat-label">Étudiants</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">12</span>
                        <span className="stat-label">Cours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="instructor-bio">
                  <h4>À propos de l'enseignant</h4>
                  <p>
                    Expert reconnu dans le domaine de {course.categorie}, avec plus de 10 ans d'expérience 
                    dans l'enseignement et la formation professionnelle. Passionné par la transmission 
                    de connaissances et l'accompagnement des apprenants dans leur développement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Courses */}
        <div className="related-courses">
          <h3>Cours similaires</h3>
          <p>Découvrez d'autres cours qui pourraient vous intéresser</p>
          {/* Vous pouvez ajouter une liste de cours similaires ici */}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;