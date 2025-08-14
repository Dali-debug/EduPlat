import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import ImageUpload from '../components/ImageUpload';
import {
  BookOpen,
  Save,
  Plus,
  Trash2,
  Upload,
  Eye,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import './CreateCourse.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [courseData, setCourseData] = useState({
    titre: '',
    description: '',
    categorie: 'informatique',
    niveau: 'debutant',
    dureeEstimee: 1,
    prix: 0,
    imagePreview: '',
    modules: [{
      titre: '',
      description: '',
      ordre: 1,
      videos: [],
      documents: []
    }],
    status: 'brouillon'
  });

  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'mathematiques', label: 'Mathématiques' },
    { value: 'sciences', label: 'Sciences' },
    { value: 'langues', label: 'Langues' },
    { value: 'informatique', label: 'Informatique' },
    { value: 'arts', label: 'Arts' },
    { value: 'histoire', label: 'Histoire' },
    { value: 'autre', label: 'Autre' }
  ];

  const niveaux = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const steps = [
    { number: 1, title: 'Informations générales', description: 'Titre, description, catégorie' },
    { number: 2, title: 'Contenu du cours', description: 'Modules et leçons' },
    { number: 3, title: 'Paramètres', description: 'Prix, statut, publication' }
  ];

  const handleInputChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleModuleChange = (moduleIndex, field, value) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex
          ? { ...module, [field]: value }
          : module
      )
    }));
  };

  const addModule = () => {
    setCourseData(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          titre: '',
          description: '',
          ordre: prev.modules.length + 1,
          videos: [],
          documents: []
        }
      ]
    }));
  };

  const removeModule = (moduleIndex) => {
    if (courseData.modules.length <= 1) {
      toast.error('Un cours doit contenir au moins un module');
      return;
    }

    setCourseData(prev => ({
      ...prev,
      modules: prev.modules
        .filter((_, index) => index !== moduleIndex)
        .map((module, index) => ({ ...module, ordre: index + 1 }))
    }));
  };

  const addVideo = (moduleIndex) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex
          ? {
            ...module,
            videos: [
              ...module.videos,
              {
                titre: '',
                url: '',
                duree: 0,
                ordre: module.videos.length + 1
              }
            ]
          }
          : module
      )
    }));
  };

  const removeVideo = (moduleIndex, videoIndex) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex
          ? {
            ...module,
            videos: module.videos
              .filter((_, vIndex) => vIndex !== videoIndex)
              .map((video, vIndex) => ({ ...video, ordre: vIndex + 1 }))
          }
          : module
      )
    }));
  };

  const handleVideoChange = (moduleIndex, videoIndex, field, value) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, mIndex) =>
        mIndex === moduleIndex
          ? {
            ...module,
            videos: module.videos.map((video, vIndex) =>
              vIndex === videoIndex
                ? { ...video, [field]: value }
                : video
            )
          }
          : module
      )
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!courseData.titre.trim()) {
        newErrors.titre = 'Le titre est requis';
      } else if (courseData.titre.trim().length < 5) {
        newErrors.titre = 'Le titre doit contenir au moins 5 caractères';
      }

      if (!courseData.description.trim()) {
        newErrors.description = 'La description est requise';
      } else if (courseData.description.trim().length < 20) {
        newErrors.description = 'La description doit contenir au moins 20 caractères';
      }

      if (courseData.dureeEstimee < 1) {
        newErrors.dureeEstimee = 'La durée doit être d\'au moins 1 heure';
      }
    }

    if (step === 2) {
      courseData.modules.forEach((module, mIndex) => {
        if (!module.titre.trim()) {
          newErrors[`module_${mIndex}_titre`] = 'Le titre du module est requis';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    if (!validateStep(1)) return;

    setLoading(true);
    try {
      const response = await courseService.createCourse({
        ...courseData,
        status: 'brouillon'
      });
      toast.success('Brouillon sauvegardé !');
      navigate('/teacher/dashboard');
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      const response = await courseService.createCourse({
        ...courseData,
        status: 'publie'
      });
      toast.success('Cours publié avec succès !');
      navigate('/teacher/dashboard');
    } catch (error) {
      console.error('Erreur publication cours:', error);
      toast.error('Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Informations générales</h3>

            <div className="form-group">
              <label className="label">Titre du cours *</label>
              <input
                type="text"
                value={courseData.titre}
                onChange={(e) => handleInputChange('titre', e.target.value)}
                className={`input ${errors.titre ? 'error' : ''}`}
                placeholder="Ex: Introduction à React.js"
              />
              {errors.titre && <span className="error-message">{errors.titre}</span>}
            </div>

            <div className="form-group">
              <label className="label">Description *</label>
              <textarea
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`input ${errors.description ? 'error' : ''}`}
                rows={4}
                placeholder="Décrivez votre cours en détail..."
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Catégorie</label>
                <select
                  value={courseData.categorie}
                  onChange={(e) => handleInputChange('categorie', e.target.value)}
                  className="input"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Niveau</label>
                <select
                  value={courseData.niveau}
                  onChange={(e) => handleInputChange('niveau', e.target.value)}
                  className="input"
                >
                  {niveaux.map(niveau => (
                    <option key={niveau.value} value={niveau.value}>
                      {niveau.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Durée estimée (heures) *</label>
                <input
                  type="number"
                  min="1"
                  value={courseData.dureeEstimee}
                  onChange={(e) => handleInputChange('dureeEstimee', parseInt(e.target.value) || 1)}
                  className={`input ${errors.dureeEstimee ? 'error' : ''}`}
                />
                {errors.dureeEstimee && <span className="error-message">{errors.dureeEstimee}</span>}
              </div>

              <div className="form-group">
                <label className="label">Prix (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courseData.prix}
                  onChange={(e) => handleInputChange('prix', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="0 pour gratuit"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Image de prévisualisation</label>
              <ImageUpload
                onImageUploaded={(url) => handleInputChange('imagePreview', url)}
                currentImage={courseData.imagePreview}
                aspectRatio={16 / 9}
                placeholder="Cliquez pour ajouter une image de cours"
                maxSize={5 * 1024 * 1024} // 5MB
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3>Contenu du cours</h3>

            <div className="modules-section">
              {courseData.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="module-card">
                  <div className="module-header">
                    <h4>Module {moduleIndex + 1}</h4>
                    {courseData.modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(moduleIndex)}
                        className="btn btn-outline btn-sm danger"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label">Titre du module *</label>
                    <input
                      type="text"
                      value={module.titre}
                      onChange={(e) => handleModuleChange(moduleIndex, 'titre', e.target.value)}
                      className={`input ${errors[`module_${moduleIndex}_titre`] ? 'error' : ''}`}
                      placeholder="Ex: Les bases de React"
                    />
                    {errors[`module_${moduleIndex}_titre`] && (
                      <span className="error-message">{errors[`module_${moduleIndex}_titre`]}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label">Description du module</label>
                    <textarea
                      value={module.description}
                      onChange={(e) => handleModuleChange(moduleIndex, 'description', e.target.value)}
                      className="input"
                      rows={2}
                      placeholder="Description du contenu de ce module"
                    />
                  </div>

                  <div className="videos-section">
                    <div className="section-header">
                      <h5>Vidéos</h5>
                      <button
                        type="button"
                        onClick={() => addVideo(moduleIndex)}
                        className="btn btn-outline btn-sm"
                      >
                        <Plus size={14} />
                        Ajouter une vidéo
                      </button>
                    </div>

                    {module.videos.map((video, videoIndex) => (
                      <div key={videoIndex} className="video-item">
                        <div className="video-header">
                          <span>Vidéo {videoIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeVideo(moduleIndex, videoIndex)}
                            className="btn btn-outline btn-sm danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <input
                              type="text"
                              value={video.titre}
                              onChange={(e) => handleVideoChange(moduleIndex, videoIndex, 'titre', e.target.value)}
                              className="input"
                              placeholder="Titre de la vidéo"
                            />
                          </div>
                          <div className="form-group">
                            <input
                              type="number"
                              min="0"
                              value={video.duree}
                              onChange={(e) => handleVideoChange(moduleIndex, videoIndex, 'duree', parseInt(e.target.value) || 0)}
                              className="input"
                              placeholder="Durée (secondes)"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <input
                            type="url"
                            value={video.url}
                            onChange={(e) => handleVideoChange(moduleIndex, videoIndex, 'url', e.target.value)}
                            className="input"
                            placeholder="URL de la vidéo"
                          />
                        </div>
                      </div>
                    ))}

                    {module.videos.length === 0 && (
                      <p className="empty-message">Aucune vidéo ajoutée</p>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addModule}
                className="btn btn-outline add-module-btn"
              >
                <Plus size={16} />
                Ajouter un module
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3>Paramètres de publication</h3>

            <div className="publish-options">
              <div className="option-card">
                <h4>Sauvegarder comme brouillon</h4>
                <p>Enregistrez votre travail pour le terminer plus tard. Le cours ne sera pas visible par les étudiants.</p>
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="btn btn-outline"
                >
                  <Save size={16} />
                  Sauvegarder le brouillon
                </button>
              </div>

              <div className="option-card featured">
                <h4>Publier le cours</h4>
                <p>Rendez votre cours visible et accessible aux étudiants sur la plateforme.</p>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Publication...
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      Publier le cours
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="course-preview">
              <h4>Aperçu du cours</h4>
              <div className="preview-card">
                <div className="preview-image">
                  {courseData.imagePreview ? (
                    <img src={courseData.imagePreview} alt={courseData.titre} />
                  ) : (
                    <div className="placeholder">
                      <BookOpen size={32} />
                    </div>
                  )}
                </div>
                <div className="preview-content">
                  <h5>{courseData.titre || 'Titre du cours'}</h5>
                  <p>{courseData.description || 'Description du cours'}</p>
                  <div className="preview-meta">
                    <span>{courseData.categorie}</span>
                    <span>{courseData.niveau}</span>
                    <span>{courseData.dureeEstimee}h</span>
                    <span>{courseData.modules.length} modules</span>
                  </div>
                  <div className="preview-price">
                    {courseData.prix > 0 ? `${courseData.prix}€` : 'Gratuit'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-course-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button onClick={() => navigate('/teacher/dashboard')} className="back-button">
            <ArrowLeft size={16} />
            Retour au dashboard
          </button>
          <h1>Créer un nouveau cours</h1>
        </div>

        {/* Steps Navigation */}
        <div className="steps-nav">
          {steps.map(step => (
            <div
              key={step.number}
              className={`step ${activeStep === step.number ? 'active' : ''} ${activeStep > step.number ? 'completed' : ''
                }`}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-info">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-container">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {activeStep > 1 && (
              <button onClick={prevStep} className="btn btn-outline">
                <ArrowLeft size={16} />
                Précédent
              </button>
            )}

            <div className="nav-spacer"></div>

            {activeStep < 3 && (
              <button onClick={nextStep} className="btn btn-primary">
                Suivant
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
