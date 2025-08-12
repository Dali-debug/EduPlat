import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { 
  BookOpen, 
  Users, 
  Award, 
  Play, 
  Star,
  Clock,
  ChevronRight,
  Video,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0
  });

  useEffect(() => {
    loadFeaturedCourses();
  }, []);

  const loadFeaturedCourses = async () => {
    try {
      const response = await courseService.getCourses({ 
        limit: 6, 
        page: 1 
      });
      setFeaturedCourses(response.courses);
      
      // Simuler des statistiques (vous pouvez créer un endpoint dédié)
      setStats({
        totalCourses: response.pagination.total,
        totalStudents: 1250,
        totalTeachers: 89
      });
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Video size={32} />,
      title: "Sessions Live",
      description: "Participez à des cours en direct avec vos enseignants et interagissez en temps réel."
    },
    {
      icon: <BookOpen size={32} />,
      title: "Cours Interactifs",
      description: "Accédez à une vaste bibliothèque de cours avec des exercices pratiques."
    },
    {
      icon: <Award size={32} />,
      title: "Quiz & Évaluations",
      description: "Testez vos connaissances avec des quiz auto-corrigés et obtenez des certificats."
    },
    {
      icon: <Users size={32} />,
      title: "Communauté",
      description: "Échangez avec d'autres apprenants et bénéficiez du support des enseignants."
    }
  ];

  if (loading) {
    return <LoadingSpinner text="Chargement de la page d'accueil..." />;
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Apprenez sans limites avec notre 
                <span className="text-primary"> plateforme éducative</span>
              </h1>
              <p className="hero-description">
                Découvrez des milliers de cours en ligne, participez à des sessions live 
                et développez vos compétences à votre rythme avec les meilleurs enseignants.
              </p>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{stats.totalCourses}+</span>
                  <span className="stat-label">Cours disponibles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.totalStudents}+</span>
                  <span className="stat-label">Étudiants actifs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.totalTeachers}+</span>
                  <span className="stat-label">Enseignants experts</span>
                </div>
              </div>

              <div className="hero-buttons">
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary btn-lg">
                    <Play size={20} />
                    Continuer l'apprentissage
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Commencer maintenant
                    </Link>
                    <Link to="/courses" className="btn btn-outline btn-lg">
                      Explorer les cours
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hero-image">
              <div className="hero-card">
                <div className="card-header">
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    Session Live
                  </div>
                </div>
                <div className="card-content">
                  <h3>Mathématiques Avancées</h3>
                  <p>Avec Prof. Martin Dubois</p>
                  <div className="participants">
                    <Users size={16} />
                    <span>156 participants</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Pourquoi choisir notre plateforme ?</h2>
            <p>Des outils modernes pour un apprentissage efficace</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2>Cours populaires</h2>
            <p>Découvrez nos cours les plus appréciés</p>
            <Link to="/courses" className="view-all-link">
              Voir tous les cours
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="courses-grid">
            {featuredCourses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  {course.imagePreview ? (
                    <img src={course.imagePreview} alt={course.titre} />
                  ) : (
                    <div className="course-placeholder">
                      <BookOpen size={40} />
                    </div>
                  )}
                  <div className="course-level">{course.niveau}</div>
                </div>

                <div className="course-content">
                  <div className="course-category">{course.categorie}</div>
                  <h3>{course.titre}</h3>
                  <p>{course.description}</p>

                  <div className="course-meta">
                    <div className="course-teacher">
                      <span>Par {course.enseignant?.nom} {course.enseignant?.prenom}</span>
                    </div>
                    <div className="course-duration">
                      <Clock size={16} />
                      <span>{course.dureeEstimee}h</span>
                    </div>
                  </div>

                  <div className="course-stats">
                    <div className="course-rating">
                      <Star size={16} fill="currentColor" />
                      <span>4.8</span>
                    </div>
                    <div className="course-students">
                      <Users size={16} />
                      <span>{course.statistiques?.nbEtudiants || 0} étudiants</span>
                    </div>
                  </div>

                  <div className="course-actions">
                    <Link 
                      to={`/courses/${course._id}`} 
                      className="btn btn-primary"
                    >
                      Découvrir
                    </Link>
                    {course.prix > 0 && (
                      <span className="course-price">{course.prix}€</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Prêt à commencer votre apprentissage ?</h2>
              <p>
                Rejoignez des milliers d'apprenants et développez vos compétences 
                avec nos cours de qualité professionnelle.
              </p>
              <div className="cta-benefits">
                <div className="benefit">
                  <CheckCircle size={20} />
                  <span>Accès illimité aux cours</span>
                </div>
                <div className="benefit">
                  <CheckCircle size={20} />
                  <span>Sessions live interactives</span>
                </div>
                <div className="benefit">
                  <CheckCircle size={20} />
                  <span>Certificats de réussite</span>
                </div>
              </div>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-lg">
                  S'inscrire gratuitement
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;