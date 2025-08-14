import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SimpleAvatarUpload from '../components/SimpleAvatarUpload';
import {
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    avatar: user?.avatar || ''
  });

  // Synchroniser profileForm avec les données user mises à jour
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        nom: user.nom || '',
        prenom: user.prenom || '',
        avatar: user.avatar || ''
      }));
    }
  }, [user]);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmMotDePasse: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    notifications: user?.preferences?.notifications ?? true,
    langue: user?.preferences?.langue || 'fr'
  });

  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirm: false
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAvatarUpdate = async (avatarUrl) => {
    console.log('🔄 Mise à jour avatar avec URL:', avatarUrl);

    try {
      // Préparer les données de profil avec le nouvel avatar
      const updatedProfile = {
        nom: user.nom,
        prenom: user.prenom,
        avatar: avatarUrl,
        preferences: user.preferences || preferences
      };

      console.log('📤 Envoi mise à jour profil:', updatedProfile);

      // Mettre à jour via le service auth
      const result = await updateProfile(updatedProfile);

      if (result.success) {
        console.log('✅ Profil mis à jour avec succès');

        // Mettre à jour l'état local
        setProfileForm(prev => ({
          ...prev,
          avatar: avatarUrl
        }));

        return true;
      } else {
        console.error('❌ Erreur mise à jour profil:', result.error);
        throw new Error(result.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur handleAvatarUpdate:', error);
      throw error;
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileForm.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (profileForm.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!profileForm.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    } else if (profileForm.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.ancienMotDePasse) {
      newErrors.ancienMotDePasse = 'L\'ancien mot de passe est requis';
    }

    if (!passwordForm.nouveauMotDePasse) {
      newErrors.nouveauMotDePasse = 'Le nouveau mot de passe est requis';
    } else if (passwordForm.nouveauMotDePasse.length < 6) {
      newErrors.nouveauMotDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!passwordForm.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'Veuillez confirmer le mot de passe';
    } else if (passwordForm.nouveauMotDePasse !== passwordForm.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    setLoading(true);
    const result = await updateProfile({
      ...profileForm,
      preferences
    });

    if (result.success) {
      toast.success('Profil mis à jour avec succès !');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setLoading(true);
    const result = await changePassword(passwordForm);

    if (result.success) {
      setPasswordForm({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmMotDePasse: ''
      });
      toast.success('Mot de passe modifié avec succès !');
    }
    setLoading(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { key: 'profile', label: 'Profil', icon: <User size={16} /> },
    { key: 'security', label: 'Sécurité', icon: <Lock size={16} /> },
    { key: 'preferences', label: 'Préférences', icon: <Settings size={16} /> }
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Mon profil</h1>
          <p>Gérez vos informations personnelles et vos préférences</p>
        </div>

        <div className="profile-content">
          {/* Profile Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar-section">
              <SimpleAvatarUpload
                currentAvatar={user?.avatar}
                onAvatarUpdate={handleAvatarUpdate}
                userName={`${user?.prenom || ''} ${user?.nom || ''}`.trim()}
              />
              <div className="profile-basic-info">
                <h3>{user?.nom} {user?.prenom}</h3>
                <p>{user?.email}</p>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>

            <nav className="profile-navigation">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Main Content */}
          <div className="profile-main">
            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Informations personnelles</h2>
                  <p>Mettez à jour vos informations de profil</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nom" className="label">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={profileForm.nom}
                        onChange={handleProfileChange}
                        className={`input ${errors.nom ? 'error' : ''}`}
                        disabled={loading}
                      />
                      {errors.nom && (
                        <span className="error-message">{errors.nom}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="prenom" className="label">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={profileForm.prenom}
                        onChange={handleProfileChange}
                        className={`input ${errors.prenom ? 'error' : ''}`}
                        disabled={loading}
                      />
                      {errors.prenom && (
                        <span className="error-message">{errors.prenom}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      className="input"
                      disabled
                    />
                    <small className="form-help">
                      L'email ne peut pas être modifié
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="role" className="label">
                      Rôle
                    </label>
                    <input
                      type="text"
                      id="role"
                      value={user?.role || ''}
                      className="input"
                      disabled
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Sauvegarder
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Sécurité</h2>
                  <p>Modifiez votre mot de passe</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <div className="form-group">
                    <label htmlFor="ancienMotDePasse" className="label">
                      Ancien mot de passe
                    </label>
                    <div className="password-input">
                      <input
                        type={showPasswords.ancien ? 'text' : 'password'}
                        id="ancienMotDePasse"
                        name="ancienMotDePasse"
                        value={passwordForm.ancienMotDePasse}
                        onChange={handlePasswordChange}
                        className={`input ${errors.ancienMotDePasse ? 'error' : ''}`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('ancien')}
                        disabled={loading}
                      >
                        {showPasswords.ancien ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.ancienMotDePasse && (
                      <span className="error-message">{errors.ancienMotDePasse}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="nouveauMotDePasse" className="label">
                      Nouveau mot de passe
                    </label>
                    <div className="password-input">
                      <input
                        type={showPasswords.nouveau ? 'text' : 'password'}
                        id="nouveauMotDePasse"
                        name="nouveauMotDePasse"
                        value={passwordForm.nouveauMotDePasse}
                        onChange={handlePasswordChange}
                        className={`input ${errors.nouveauMotDePasse ? 'error' : ''}`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('nouveau')}
                        disabled={loading}
                      >
                        {showPasswords.nouveau ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.nouveauMotDePasse && (
                      <span className="error-message">{errors.nouveauMotDePasse}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmMotDePasse" className="label">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="password-input">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        id="confirmMotDePasse"
                        name="confirmMotDePasse"
                        value={passwordForm.confirmMotDePasse}
                        onChange={handlePasswordChange}
                        className={`input ${errors.confirmMotDePasse ? 'error' : ''}`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility('confirm')}
                        disabled={loading}
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmMotDePasse && (
                      <span className="error-message">{errors.confirmMotDePasse}</span>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          Modification...
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          Modifier le mot de passe
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Préférences</h2>
                  <p>Personnalisez votre expérience</p>
                </div>

                <div className="preferences-form">
                  <div className="preference-group">
                    <div className="preference-header">
                      <Bell size={20} />
                      <div>
                        <h3>Notifications</h3>
                        <p>Gérez vos notifications par email</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="preference-group">
                    <div className="preference-header">
                      <Globe size={20} />
                      <div>
                        <h3>Langue</h3>
                        <p>Choisissez votre langue préférée</p>
                      </div>
                    </div>
                    <select
                      value={preferences.langue}
                      onChange={(e) => handlePreferenceChange('langue', e.target.value)}
                      className="preference-select"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      onClick={handleProfileSubmit}
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="loading-spinner"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Sauvegarder les préférences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
