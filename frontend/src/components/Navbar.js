import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Home, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Video,
  BarChart3,
  Settings
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'enseignant') return '/teacher/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <BookOpen size={24} />
            <span>EduPlatform</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-menu desktop-menu">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <Home size={18} />
              <span>Accueil</span>
            </Link>
            
            <Link 
              to="/courses" 
              className={`nav-link ${isActive('/courses') ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Cours</span>
            </Link>

            {user && (
              <>
                <Link 
                  to="/live-sessions" 
                  className={`nav-link ${isActive('/live-sessions') ? 'active' : ''}`}
                >
                  <Video size={18} />
                  <span>Sessions Live</span>
                </Link>

                <Link 
                  to={getDashboardPath()} 
                  className={`nav-link ${location.pathname.includes('dashboard') ? 'active' : ''}`}
                >
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="navbar-actions">
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.nom} />
                    ) : (
                      <span>{user.nom.charAt(0)}{user.prenom.charAt(0)}</span>
                    )}
                  </div>
                  <div className="user-details desktop-only">
                    <span className="user-name">{user.nom} {user.prenom}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                </div>

                <div className="dropdown">
                  <button className="dropdown-toggle">
                    <Settings size={18} />
                  </button>
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} />
                      <span>Profil</span>
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item">
                      <LogOut size={16} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <Home size={18} />
              <span>Accueil</span>
            </Link>
            
            <Link 
              to="/courses" 
              className={`mobile-nav-link ${isActive('/courses') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <BookOpen size={18} />
              <span>Cours</span>
            </Link>

            {user && (
              <>
                <Link 
                  to="/live-sessions" 
                  className={`mobile-nav-link ${isActive('/live-sessions') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <Video size={18} />
                  <span>Sessions Live</span>
                </Link>

                <Link 
                  to={getDashboardPath()} 
                  className={`mobile-nav-link ${location.pathname.includes('dashboard') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <BarChart3 size={18} />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/profile" 
                  className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <User size={18} />
                  <span>Profil</span>
                </Link>

                <button onClick={handleLogout} className="mobile-nav-link">
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </>
            )}

            {!user && (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-outline" onClick={closeMenu}>
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Inscription
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;