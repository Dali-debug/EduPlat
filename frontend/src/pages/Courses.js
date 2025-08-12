import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/courseService';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  ChevronDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    categorie: '',
    niveau: '',
    page: 1
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'mathematiques', label: 'Mathématiques' },
    { value: 'sciences', label: 'Sciences' },
    { value: 'langues', label: 'Langues' },
    { value: 'informatique', label: 'Informatique' },
    { value: 'arts', label: 'Arts' },
    { value: 'histoire', label: 'Histoire' },
    { value: 'autre', label: 'Autre' }
  ];

  const niveaux = [
    { value: '', label: 'Tous les niveaux' },
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  useEffect(() => {
    loadCourses();
  }, [filters]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses({
        ...filters,
        limit: 12
      });
      setCourses(response.courses);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCourses();
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categorie: '',
      niveau: '',
      page: 1
    });
  };

  return (
    <div className="courses-page">
      <div className="container">
        {/* Header */}
        <div className="courses-header">
          <div className="header-content">
            <h1>Catalogue de cours</h1>
            <p>Découvrez nos cours de qualité professionnelle</p>
          </div>

          {/* Search and Filters */}
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="search-input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Rechercher
              </button>
            </form>

            <button
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filtres
              <ChevronDown 
                size={16} 
                className={showFilters ? 'rotate' : ''}
              />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Catégorie</label>
                  <select
                    value={filters.categorie}
                    onChange={(e) => handleFilterChange('categorie', e.target.value)}
                    className="filter-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Niveau</label>
                  <select
                    value={filters.niveau}
                    onChange={(e) => handleFilterChange('niveau', e.target.value)}
                    className="filter-select"
                  >
                    {niveaux.map(niveau => (
                      <option key={niveau.value} value={niveau.value}>
                        {niveau.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-actions">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn btn-outline btn-sm"
                  >
                    Effacer les filtres
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="courses-content">
          {/* Results Header */}
          <div className="results-header">
            <p className="results-count">
              {pagination.total || 0} cours trouvé{pagination.total > 1 ? 's' : ''}
            </p>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner text="Chargement des cours..." />}

          {/* Courses Grid */}
          {!loading && courses.length > 0 && (
            <>
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-card">
                    <Link to={`/courses/${course._id}`} className="course-link">
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

                        <div className="course-teacher">
                          Par {course.enseignant?.nom} {course.enseignant?.prenom}
                        </div>

                        <div className="course-meta">
                          <div className="course-duration">
                            <Clock size={16} />
                            <span>{course.dureeEstimee}h</span>
                          </div>
                          <div className="course-students">
                            <Users size={16} />
                            <span>{course.statistiques?.nbEtudiants || 0}</span>
                          </div>
                          <div className="course-rating">
                            <Star size={16} fill="currentColor" />
                            <span>4.8</span>
                          </div>
                        </div>

                        <div className="course-footer">
                          {course.prix > 0 ? (
                            <span className="course-price">{course.prix}€</span>
                          ) : (
                            <span className="course-free">Gratuit</span>
                          )}
                          <span className="course-cta">Voir le cours</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-outline"
                  >
                    Précédent
                  </button>

                  <div className="pagination-info">
                    Page {pagination.page} sur {pagination.pages}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-outline"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && courses.length === 0 && (
            <div className="empty-state">
              <BookOpen size={64} />
              <h3>Aucun cours trouvé</h3>
              <p>
                {filters.search || filters.categorie || filters.niveau
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Aucun cours disponible pour le moment'
                }
              </p>
              {(filters.search || filters.categorie || filters.niveau) && (
                <button onClick={clearFilters} className="btn btn-primary">
                  Voir tous les cours
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;