import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { uploadService } from '../services/uploadService';
import toast from 'react-hot-toast';
import './AvatarUpload.css';

const AvatarUpload = ({ onAvatarChange, currentAvatar, userName = "User" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setIsUploading(true);

    try {
      console.log('Upload de l\'avatar en cours...');

      // Upload direct sans crop pour simplifier
      const response = await uploadService.uploadImage(file);
      console.log('Réponse upload:', response);

      // Construire l'URL complète
      const fullImageUrl = `http://localhost:5000${response.url}`;
      console.log('URL complète de l\'avatar:', fullImageUrl);

      setAvatarUrl(fullImageUrl);
      onAvatarChange(fullImageUrl);

      toast.success('Avatar mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur upload avatar - Détails complets:', error);

      // Plus de détails sur l'erreur
      if (error.response) {
        console.error('Status de l\'erreur:', error.response.status);
        console.error('Message d\'erreur:', error.response.data);
        toast.error(`Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur serveur'}`);
      } else if (error.request) {
        console.error('Pas de réponse du serveur:', error.request);
        toast.error('Impossible de contacter le serveur');
      } else {
        console.error('Erreur de configuration:', error.message);
        toast.error('Erreur lors de l\'upload de l\'avatar');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Obtenir les initiales
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-container" onClick={handleClick}>
        {avatarUrl ? (
          <img
            src={`${avatarUrl}?t=${Date.now()}`}
            alt="Avatar"
            className="avatar-image"
            onError={(e) => {
              console.error('Erreur chargement image:', e);
              setAvatarUrl('');
            }}
          />
        ) : (
          <div className="avatar-placeholder">
            <span className="avatar-initials">
              {getInitials(userName)}
            </span>
          </div>
        )}

        <div className="avatar-overlay">
          {isUploading ? (
            <div className="upload-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <Camera size={20} />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <p className="avatar-hint">
        Cliquez pour changer votre avatar
      </p>
    </div>
  );
};

export default AvatarUpload;
