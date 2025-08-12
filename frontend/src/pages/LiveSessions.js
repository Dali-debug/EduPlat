import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { liveService } from '../services/liveService';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Filter,
  Search,
  Play,
  ChevronDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import './LiveSessions.css';

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await liveService.getLiveSessions(filters);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.dateHeure);
    const sessionEnd = new Date(sessionDate.getTime() + (session.dureeEstimee * 60000));

    if (session.status === 'annule') return 'cancelled';
    if (session.status === 'termine') return 'ended';
    if (isBefore(now, sessionDate)) return 'upcoming';
    if (isAfter(now, sessionDate) && isBefore(now, sessionEnd)) return 'live';
    return 'ended';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'live': return 'En direct';
      case 'ended': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnue';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'upcoming': return 'upcoming';
      case 'live': return 'live';
      case 'ended': return 'ended';
      case 'cancelled': return 'cancelled';
      default: return 'unknown';
    }
  };

  const groupSessionsByDate = (sessions) => {
    const groups = {};
    const today = new Date();
    const tomorrow = addDays(today, 1);

    sessions.forEach(session => {
      const sessionDate = new Date(session.dateHeure);
      let groupKey;

      if (format(sessionDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        groupKey = "Aujourd'hui";
      } else if (format(sessionDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
        groupKey = "Demain";
      } else {
        groupKey = format(sessionDate, 'EEEE d MMMM yyyy', { locale: fr });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    return groups;
  };

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'planifie', label: 'À venir' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminées' }
  ];

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="live-sessions-page">
      <div className="container">
        {/* Header */}
        <div className="sessions-header">
          <div className="header-content">
            <h1>Sessions Live</h1>
            <p>Participez à des cours en direct avec vos enseignants</p>
          </div>

          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-form">
              <div className="search-input-container">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une session..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

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
                  <label>Statut</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
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

        {/* Sessions Content */}
        <div className="sessions-content">
          {loading && <LoadingSpinner text="Chargement des sessions..." />}

          {!loading && sessions.length > 0 && (
            <div className="sessions-list">
              {Object.entries(groupedSessions).map(([dateGroup, groupSessions]) => (
                <div key={dateGroup} className="sessions-group">
                  <h3 className="group-title">{dateGroup}</h3>
                  
                  <div className="sessions-grid">
                    {groupSessions.map((session) => {
                      const status = getSessionStatus(session);
                      return (
                        <div key={session._id} className="session-card">
                          <div className="session-status">
                            <span className={`status-badge ${getStatusClass(status)}`}>
                              {getStatusLabel(status)}
                            </span>
                            {status === 'live' && (
                              <div className="live-indicator">
                                <span className="live-dot"></span>
                                LIVE
                              </div>
                            )}
                          </div>

                          <div className="session-header">
                            <h4>{session.titre}</h4>
                            {session.cours && (
                              <span className="session-course">
                                {session.cours.titre}
                              </span>
                            )}
                          </div>

                          <div className="session-teacher">
                            <div className="teacher-avatar">
                              {session.enseignant?.avatar ? (
                                <img src={session.enseignant.avatar} alt={session.enseignant.nom} />
                              ) : (
                                <span>
                                  {session.enseignant?.nom?.charAt(0)}
                                  {session.enseignant?.prenom?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="teacher-name">
                                {session.enseignant?.nom} {session.enseignant?.prenom}
                              </p>
                              <p className="teacher-role">Enseignant</p>
                            </div>
                          </div>

                          <div className="session-details">
                            <div className="session-time">
                              <Calendar size={16} />
                              <span>
                                {format(new Date(session.dateHeure), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <div className="session-duration">
                              <Clock size={16} />
                              <span>{session.dureeEstimee} min</span>
                            </div>
                            <div className="session-participants">
                              <Users size={16} />
                              <span>{session.participants?.length || 0} inscrits</span>
                            </div>
                          </div>

                          {session.description && (
                            <p className="session-description">
                              {session.description}
                            </p>
                          )}

                          <div className="session-actions">
                            {status === 'live' ? (
                              <Link to={`/live/${session._id}`} className="btn btn-primary">
                                <Play size={16} />
                                Rejoindre maintenant
                              </Link>
                            ) : status === 'upcoming' ? (
                              <Link to={`/live/${session._id}`} className="btn btn-outline">
                                <Video size={16} />
                                Voir les détails
                              </Link>
                            ) : (
                              <span className="session-ended">
                                Session terminée
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && sessions.length === 0 && (
            <div className="empty-state">
              <Video size={64} />
              <h3>Aucune session trouvée</h3>
              <p>
                {filters.search || filters.status
                  ? 'Aucune session ne correspond à vos critères de recherche'
                  : 'Aucune session live programmée pour le moment'
                }
              </p>
              {(filters.search || filters.status) && (
                <button onClick={clearFilters} className="btn btn-primary">
                  Voir toutes les sessions
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSessions;