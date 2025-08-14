import React, { useState, useRef, useCallback } from 'react';
import { Camera, Crop, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './AvatarUploadWithCrop.css';

const AvatarUploadWithCrop = ({ currentAvatar, onAvatarUpdate, userName = "User" }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(currentAvatar);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [crop, setCrop] = useState({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        aspect: 1, // Carré pour avatar
    });
    const [completedCrop, setCompletedCrop] = useState(null);

    const fileInputRef = useRef(null);
    const imageRef = useRef(null);

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

    // Fonction pour cropper l'image
    const getCroppedImg = useCallback((image, crop) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            canvas.width = crop.width * scaleX;
            canvas.height = crop.height * scaleY;

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width * scaleX,
                crop.height * scaleY
            );

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    }, []);

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

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('L\'image doit faire moins de 5MB');
            return;
        }

        // Créer un URL pour l'aperçu
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setShowCropModal(true);
            // Reset crop
            setCrop({
                unit: '%',
                width: 100,
                height: 100,
                x: 0,
                y: 0,
                aspect: 1,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async () => {
        if (!completedCrop || !imageRef.current) {
            toast.error('Veuillez ajuster le crop');
            return;
        }

        try {
            setIsUploading(true);

            // Obtenir l'image croppée
            const croppedBlob = await getCroppedImg(imageRef.current, completedCrop);

            // Créer un fichier à partir du blob
            const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

            console.log('📤 Upload de l\'avatar croppé...');
            const result = await uploadToServer(croppedFile);

            console.log('✅ Résultat upload:', result);

            if (result.success && result.url) {
                const fullUrl = result.url.startsWith('http')
                    ? result.url
                    : `http://localhost:5000${result.url}`;

                console.log('🖼️ URL finale:', fullUrl);
                setAvatarPreview(fullUrl);

                if (onAvatarUpdate) {
                    await onAvatarUpdate(fullUrl);
                }

                toast.success('Avatar mis à jour !');
                setShowCropModal(false);
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('❌ Erreur upload:', error);
            toast.error(error.message || 'Erreur lors de l\'upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCompletedCrop(null);
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        const size = Math.min(width, height);
        const x = (width - size) / 2;
        const y = (height - size) / 2;

        setCrop({
            unit: 'px',
            width: size,
            height: size,
            x: x,
            y: y,
            aspect: 1,
        });
    }, []);

    return (
        <>
            <div className="avatar-upload-with-crop">
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

            {/* Modal de crop */}
            {showCropModal && selectedImage && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal">
                        <div className="crop-modal-header">
                            <h3>Ajuster votre avatar</h3>
                            <div className="crop-modal-actions">
                                <button
                                    onClick={handleCropCancel}
                                    className="crop-btn crop-btn-cancel"
                                    disabled={isUploading}
                                >
                                    <X size={18} />
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCropConfirm}
                                    className="crop-btn crop-btn-confirm"
                                    disabled={isUploading || !completedCrop}
                                >
                                    {isUploading ? (
                                        <div className="btn-spinner"></div>
                                    ) : (
                                        <Check size={18} />
                                    )}
                                    Confirmer
                                </button>
                            </div>
                        </div>

                        <div className="crop-container">
                            <ReactCrop
                                crop={crop}
                                onChange={setCrop}
                                onComplete={setCompletedCrop}
                                aspect={1}
                                circularCrop
                            >
                                <img
                                    ref={imageRef}
                                    src={selectedImage}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="crop-image"
                                />
                            </ReactCrop>
                        </div>

                        <div className="crop-modal-footer">
                            <p className="crop-help">Ajustez la zone de crop pour votre avatar</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AvatarUploadWithCrop;
