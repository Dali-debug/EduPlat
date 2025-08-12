import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { liveService } from '../services/liveService';
import io from 'socket.io-client';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Users,
  MessageCircle,
  Send,
  Calendar,
  Clock,
  ExternalLink,
  ArrowLeft,
  Phone,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import './LiveSession.css';

const LiveSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('upcoming');

  useEffect(() => {
    loadSession();
    
    // Cleanup socket on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (session) {
      updateSessionStatus();
      const interval = setInterval(updateSessionStatus, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadSession = async () => {
    try {
      const response = await liveService.getLiveSession(id);
      setSession(response.session);
      setParticipants(response.session.participants || []);
      setChatMessages(response.session.chat || []);
    } catch (error) {
      console.error('Erreur chargement session:', error);
      toast.error('Impossible de charger la session');
      navigate('/live-sessions');
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = () => {
    if (!session) return;

    const now = new Date();
    const sessionDate = new Date(session.dateHeure);
    const sessionEnd = addMinutes(sessionDate, session.dureeEstimee);

    if (session.status === 'annule') {
      setSessionStatus('cancelled');
    } else if (session.status === 'termine') {
      setSessionStatus('ended');
    } else if (isBefore(now, sessionDate)) {
      setSessionStatus('upcoming');
    } else if (isAfter(now, sessionDate) && isBefore(now, sessionEnd)) {
      setSessionStatus('live');
    } else {
      setSessionStatus('ended');
    }
  };

  const initializeSocket = () => {
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    
    socketInstance.on('connect', () => {
      console.log('Connecté au socket');
      socketInstance.emit('join-live-session', id);
    });

    socketInstance.on('new-chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socketInstance.on('participant-joined', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    socketInstance.on('participant-left', (participantId) => {
      setParticipants(prev => prev.filter(p => p._id !== participantId));
    });

    setSocket(socketInstance);
  };

  const handleJoinSession = async () => {
    try {
      if (sessionStatus === 'upcoming') {
        // Just register for the session
        await liveService.joinLiveSession(id);
        toast.success('Inscription à la session réussie !');
        loadSession(); // Refresh session data
      } else if (sessionStatus === 'live') {
        // Join the live session
        await liveService.joinLiveSession(id);
        setIsJoined(true);
        initializeSocket();
        toast.success('Vous avez rejoint la session live !');
      }
    } catch (error) {
      console.error('Erreur rejoindre session:', error);
      toast.error('Erreur lors de la connexion à la session');
    }
  };

  const handleLeaveSession = () => {
    if (socket) {
      socket.emit('leave-live-session', id);
      socket.disconnect();
    }
    setIsJoined(false);
    toast.info('Vous avez quitté la session');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      sessionId: id,
      message: newMessage.trim(),
      userName: `${user.prenom} ${user.nom}`
    };

    socket.emit('live-chat-message', messageData);
    setNewMessage('');
  };

  const handleStartSession = async () => {
    if (user.role !== 'enseignant' && user.role !== 'admin') {
      toast.error('Seuls les enseignants peuvent démarrer une session');
      return;
    }

    try {
      await liveService.startLiveSession(id);
      toast.success('Session démarrée !');
      loadSession();
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      toast.error('Erreur lors du démarrage de la session');
    }
  };

  const handleEndSession = async () => {
    if (user.role !== 'enseignant' && user.role !== 'admin') {
      toast.error('Seuls les enseignants peuvent terminer une session');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir terminer cette session ?')) {
      return;
    }

    try {
      await liveService.endLiveSession(id);
      toast.success('Session terminée !');
      loadSession();
    } catch (error) {
      console.error('Erreur fin session:', error);
      toast.error('Erreur lors de la fin de la session');
    }
  };

  const getStatusLabel = () => {
    switch (sessionStatus) {
      case 'upcoming': return 'À venir';
      case 'live': return 'En direct';
      case 'ended': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnue';
    }
  };

  const getStatusClass = () => {
    switch (sessionStatus) {
      case 'upcoming': return 'upcoming';
      case 'live': return 'live';
      case 'ended': return 'ended';
      case 'cancelled': return 'cancelled';
      default: return 'unknown';
    }
  };

  const isTeacher = user?.role === 'enseignant' || user?.role === 'admin';
  const isSessionOwner = session?.enseignant?._id === user?._id || user?.role === 'admin';

  if (loading) {
    return <LoadingSpinner text="Chargement de la session..." />;
  }

  if (!session) {
    return (
      <div className="session-error">
        <h2>Session non trouvée</h2>
        <p>La session que vous recherchez n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="live-session-page">
      <div className="container">
        {/* Header */}
        <div className="session-header">
          <button 
            onClick={() => navigate('/live-sessions')} 
            className="back-button"
          >
            <ArrowLeft size={16} />
            Retour aux sessions
          </button>

          <div className="session-info">
            <div className="session-status-header">
              <h1>{session.titre}</h1>
              <span className={`status-badge ${getStatusClass()}`}>
                {getStatusLabel()}
              </span>
            </div>
            
            {session.description && (
              <p className="session-description">{session.description}</p>
            )}

            <div className="session-meta">
              <div className="meta-item">
                <Calendar size={16} />
                <span>
                  {format(new Date(session.dateHeure), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>{session.dureeEstimee} minutes</span>
              </div>
              <div className="meta-item">
                <Users size={16} />
                <span>{participants.length} participants</span>
              </div>
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
                <p>Enseignant</p>
                <p className="teacher-name">
                  {session.enseignant?.nom} {session.enseignant?.prenom}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="session-content">
          {/* Video/Meeting Area */}
          <div className="meeting-area">
            {!isJoined ? (
              <div className="meeting-preview">
                {sessionStatus === 'upcoming' && (
                  <div className="preview-content">
                    <Video size={64} />
                    <h3>Session programmée</h3>
                    <p>La session commencera le {format(new Date(session.dateHeure), 'd MMMM à HH:mm', { locale: fr })}</p>
                    
                    {isSessionOwner && (
                      <div className="teacher-controls">
                        <button onClick={handleStartSession} className="btn btn-primary">
                          <Video size={16} />
                          Démarrer la session
                        </button>
                      </div>
                    )}
                    
                    <button onClick={handleJoinSession} className="btn btn-outline">
                      <Users size={16} />
                      S'inscrire à la session
                    </button>
                  </div>
                )}

                {sessionStatus === 'live' && (
                  <div className="preview-content">
                    <Video size={64} />
                    <h3>Session en cours</h3>
                    <p>Rejoignez la session maintenant</p>
                    
                    <div className="join-options">
                      <button onClick={handleJoinSession} className="btn btn-primary btn-lg">
                        <Video size={20} />
                        Rejoindre la session
                      </button>
                      
                      {session.urlMeeting && (
                        <a 
                          href={session.urlMeeting}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                        >
                          <ExternalLink size={16} />
                          Ouvrir dans une nouvelle fenêtre
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {sessionStatus === 'ended' && (
                  <div className="preview-content">
                    <Video size={64} />
                    <h3>Session terminée</h3>
                    <p>Cette session s'est terminée le {format(new Date(session.dateHeure), 'd MMMM à HH:mm', { locale: fr })}</p>
                    
                    {session.enregistrement?.disponible && (
                      <a 
                        href={session.enregistrement.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        <Video size={16} />
                        Voir l'enregistrement
                      </a>
                    )}
                  </div>
                )}

                {sessionStatus === 'cancelled' && (
                  <div className="preview-content cancelled">
                    <Video size={64} />
                    <h3>Session annulée</h3>
                    <p>Cette session a été annulée</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="meeting-active">
                <div className="video-container">
                  {session.urlMeeting ? (
                    <iframe
                      src={session.urlMeeting}
                      title="Session Live"
                      className="meeting-iframe"
                      allow="camera; microphone; display-capture"
                    />
                  ) : (
                    <div className="video-placeholder">
                      <Video size={48} />
                      <p>Connexion à la session...</p>
                    </div>
                  )}
                </div>

                <div className="meeting-controls">
                  <div className="control-buttons">
                    <button className="control-btn">
                      <Mic size={20} />
                    </button>
                    <button className="control-btn">
                      <Video size={20} />
                    </button>
                    <button className="control-btn settings">
                      <Settings size={20} />
                    </button>
                  </div>

                  <div className="session-actions">
                    {isSessionOwner && sessionStatus === 'live' && (
                      <button onClick={handleEndSession} className="btn btn-danger">
                        <Phone size={16} />
                        Terminer la session
                      </button>
                    )}
                    
                    <button onClick={handleLeaveSession} className="btn btn-outline">
                      Quitter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="session-sidebar">
            {/* Participants */}
            <div className="sidebar-section">
              <h3>
                <Users size={16} />
                Participants ({participants.length})
              </h3>
              <div className="participants-list">
                {participants.map((participant, index) => (
                  <div key={index} className="participant-item">
                    <div className="participant-avatar">
                      {participant.user?.avatar ? (
                        <img src={participant.user.avatar} alt={participant.user.nom} />
                      ) : (
                        <span>
                          {participant.user?.nom?.charAt(0)}
                          {participant.user?.prenom?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="participant-name">
                      {participant.user?.nom} {participant.user?.prenom}
                      {participant.user?._id === session.enseignant?._id && (
                        <span className="teacher-badge">Enseignant</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="sidebar-section chat-section">
              <h3>
                <MessageCircle size={16} />
                Chat
              </h3>
              
              <div className="chat-messages">
                {chatMessages.map((message, index) => (
                  <div key={index} className="chat-message">
                    <div className="message-header">
                      <span className="message-author">{message.userName}</span>
                      <span className="message-time">
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <p className="message-content">{message.message}</p>
                  </div>
                ))}
              </div>

              {isJoined && sessionStatus === 'live' && (
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <div className="chat-input-container">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="chat-input"
                    />
                    <button type="submit" className="send-button">
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Materials */}
            {session.materiel && session.materiel.length > 0 && (
              <div className="sidebar-section">
                <h3>Matériel</h3>
                <div className="materials-list">
                  {session.materiel.map((material, index) => (
                    <a
                      key={index}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-item"
                    >
                      <span>{material.titre}</span>
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;