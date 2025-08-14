import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import './SimpleAvatarUpload.css';

const SimpleAvatarUpload = ({ currentAvatar, onAvatarUpdate, userName = "User" }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(currentAvatar);
    const fileInputRef = useRef(null);

    // Mettre à jour l'aperçu quand currentAvatar change
    React.useEffect(() => {
        console.log('🔄 currentAvatar mis à jour:', currentAvatar);
        setAvatarPreview(currentAvatar);
    }, [currentAvatar]);

    // Fonction pour obtenir l'URL complète de l'avatar via la route API
    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;

        // Si c'est déjà une URL complète, la retourner telle quelle
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }

        // Utiliser la route API spéciale pour les images avec CORS
        if (avatar.startsWith('uploads/')) {
            const filename = avatar.replace('uploads/', '');
            return `http://localhost:5000/api/images/${filename}`;
        }

        // Si c'est juste un nom de fichier
        return `http://localhost:5000/api/images/${avatar}`;
    };

    const getInitials = (name) => {
        if (!name || name === "User") return 'U';
        const parts = name.split(' ').filter(part => part.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const uploadToServer = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Non authentifié');
        }

        const response = await fetch('http://localhost:5000/api/upload/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        return await response.json();
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image trop volumineuse (max 5MB)');
            return;
        }

        setIsUploading(true);

        try {
            console.log('🔄 Upload en cours...', file.name);

            // Upload vers le serveur
            const result = await uploadToServer(file);
            console.log('✅ Upload réussi:', result);

            // Construire l'URL complète
            const fullUrl = `http://localhost:5000${result.url}`;
            console.log('🖼️ URL de l\'avatar:', fullUrl);

            // Mettre à jour l'aperçu local
            setAvatarPreview(fullUrl);

            // Notifier le parent avec l'URL
            if (onAvatarUpdate) {
                await onAvatarUpdate(fullUrl);
            }

            toast.success('Avatar mis à jour !');
        } catch (error) {
            console.error('❌ Erreur upload:', error);
            toast.error(error.message || 'Erreur lors de l\'upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="simple-avatar-upload">
            <div
                className={`avatar-circle ${isUploading ? 'uploading' : ''}`}
                onClick={handleClick}
            >
                {avatarPreview ? (
                    <img
                        src={`${getAvatarUrl(avatarPreview)}?t=${Date.now()}`}
                        alt="Avatar"
                        className="avatar-img"
                        onError={() => setAvatarPreview('')}
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
                        <div className="spinner"></div>
                    ) : (
                        <Camera size={24} />
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

            <p className="avatar-text">Cliquez pour changer</p>
        </div>
    );
};

export default SimpleAvatarUpload;
