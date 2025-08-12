import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Award
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './CourseContent.css';

const CourseContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const [completedVideos, setCompletedVideos] = useState(new Set());
  const [playing, setPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadCourseContent();
  }, [id]);

  useEffect(() => {
    if (course) {
      calculateProgress();
    }
  }, [completedVideos, course]);

  const loadCourseContent = async () => {
    try {
      const response = await courseService.getCourseContent(id);
      setCourse(response.course);
      
      // Charger la progression sauvegardée
      const userCourse = user?.coursInscrits?.find(c => c.coursId === id);
      if (userCourse) {
        setCourseProgress(userCourse.progression || 0);
      }
    } catch (error) {
      console.error('Erreur chargement contenu:', error);
      if (error.response?.status === 403) {
        toast.error('Vous devez être inscrit à ce cours pour accéder au contenu');
        navigate(`/courses/${id}`);
      } else {
        toast.error('Erreur lors du chargement du contenu');
        navigate('/courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!course?.modules) return;

    const totalVideos = course.modules.reduce((acc, module) => 
      acc + (module.videos?.length || 0), 0
    );

    if (totalVideos === 0) return;

    const progress = Math.round((completedVideos.size / totalVideos) * 100);
    setCourseProgress(progress);
  };

  const updateProgress = async (progress) => {
    try {
      await courseService.updateProgress(id, progress);
    } catch (error) {
      console.error('Erreur mise à jour progression:', error);
    }
  };

  const handleVideoProgress = (progress) => {
    setVideoProgress(progress.played * 100);
    
    // Marquer comme terminé si plus de 90% regardé
    if (progress.played > 0.9) {
      const videoKey = `${currentModule}-${currentVideo}`;
      if (!completedVideos.has(videoKey)) {
        setCompletedVideos(prev => new Set([...prev, videoKey]));
      }
    }
  };

  const handleVideoEnd = () => {
    const videoKey = `${currentModule}-${currentVideo}`;
    setCompletedVideos(prev => new Set([...prev, videoKey]));
    
    // Passer à la vidéo suivante automatiquement
    goToNextVideo();
  };

  const goToVideo = (moduleIndex, videoIndex) => {
    setCurrentModule(moduleIndex);
    setCurrentVideo(videoIndex);
    setVideoProgress(0);
    setPlaying(true);
  };

  const goToNextVideo = () => {
    const currentModuleData = course.modules[currentModule];
    
    // Vérifier s'il y a une vidéo suivante dans le module actuel
    if (currentVideo < (currentModuleData.videos?.length || 0) - 1) {
      setCurrentVideo(currentVideo + 1);
    } else {
      // Passer au module suivant
      if (currentModule < course.modules.length - 1) {
        setCurrentModule(currentModule + 1);
        setCurrentVideo(0);
      } else {
        // Cours terminé
        toast.success('Félicitations ! Vous avez terminé le cours !');
        setPlaying(false);
      }
    }
    setVideoProgress(0);
  };

  const goToPreviousVideo = () => {
    if (currentVideo > 0) {
      setCurrentVideo(currentVideo - 1);
    } else if (currentModule > 0) {
      const prevModule = course.modules[currentModule - 1];
      setCurrentModule(currentModule - 1);
      setCurrentVideo((prevModule.videos?.length || 1) - 1);
    }
    setVideoProgress(0);
  };

  const isVideoCompleted = (moduleIndex, videoIndex) => {
    return completedVideos.has(`${moduleIndex}-${videoIndex}`);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Sauvegarder la progression périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      if (courseProgress > 0) {
        updateProgress(courseProgress);
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [courseProgress]);

  if (loading) {
    return <LoadingSpinner text="Chargement du contenu..." />;
  }

  if (!course) {
    return (
      <div className="course-error">
        <h2>Contenu non disponible</h2>
        <p>Le contenu de ce cours n'est pas accessible.</p>
      </div>
    );
  }

  const currentModuleData = course.modules[currentModule];
  const currentVideoData = currentModuleData?.videos?.[currentVideo];

  return (
    <div className="course-content-page">
      {/* Video Player */}
      <div className="video-section">
        <div className="video-container">
          {currentVideoData ? (
            <ReactPlayer
              url={currentVideoData.url}
              width="100%"
              height="100%"
              playing={playing}
              onProgress={handleVideoProgress}
              onEnded={handleVideoEnd}
              controls={true}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
            />
          ) : (
            <div className="video-placeholder">
              <Play size={64} />
              <p>Sélectionnez une vidéo pour commencer</p>
            </div>
          )}
        </div>

        {/* Video Controls */}
        <div className="video-controls">
          <div className="video-info">
            <h2>{currentVideoData?.titre || 'Aucune vidéo sélectionnée'}</h2>
            <div className="video-meta">
              <span>Module {currentModule + 1}: {currentModuleData?.titre}</span>
              {currentVideoData?.duree && (
                <span>• {formatDuration(currentVideoData.duree)}</span>
              )}
            </div>
          </div>

          <div className="video-actions">
            <button 
              onClick={goToPreviousVideo}
              disabled={currentModule === 0 && currentVideo === 0}
              className="btn btn-outline"
            >
              <SkipBack size={16} />
              Précédent
            </button>
            
            <button 
              onClick={() => setPlaying(!playing)}
              className="btn btn-primary"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pause' : 'Lecture'}
            </button>
            
            <button 
              onClick={goToNextVideo}
              className="btn btn-outline"
            >
              Suivant
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="video-progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${videoProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Course Sidebar */}
      <div className={`course-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="course-title">
            <h3>{course.titre}</h3>
            <div className="course-progress-info">
              <span>{courseProgress}% terminé</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronRight className={sidebarOpen ? 'rotate' : ''} />
          </button>
        </div>

        <div className="sidebar-content">
          {course.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="module-section">
              <div className="module-header">
                <h4>
                  <span className="module-number">{moduleIndex + 1}.</span>
                  {module.titre}
                </h4>
                <span className="module-count">
                  {module.videos?.length || 0} vidéos
                </span>
              </div>

              {module.videos && (
                <div className="module-videos">
                  {module.videos.map((video, videoIndex) => (
                    <button
                      key={videoIndex}
                      onClick={() => goToVideo(moduleIndex, videoIndex)}
                      className={`video-item ${
                        currentModule === moduleIndex && currentVideo === videoIndex 
                          ? 'active' 
                          : ''
                      }`}
                    >
                      <div className="video-icon">
                        {isVideoCompleted(moduleIndex, videoIndex) ? (
                          <CheckCircle size={16} className="completed" />
                        ) : (
                          <Play size={16} />
                        )}
                      </div>
                      
                      <div className="video-details">
                        <span className="video-title">{video.titre}</span>
                        {video.duree && (
                          <span className="video-duration">
                            {formatDuration(video.duree)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {module.documents && module.documents.length > 0 && (
                <div className="module-documents">
                  <h5>Documents</h5>
                  {module.documents.map((doc, docIndex) => (
                    <a
                      key={docIndex}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-item"
                    >
                      <FileText size={16} />
                      <span>{doc.titre}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Course Completion */}
          {courseProgress === 100 && (
            <div className="course-completion">
              <Award size={32} />
              <h4>Cours terminé !</h4>
              <p>Félicitations pour avoir terminé ce cours</p>
              <button className="btn btn-primary">
                Obtenir le certificat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContent;