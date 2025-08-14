import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import { Upload, Save, X, RotateCw, RotateCcw } from 'lucide-react';
import { uploadService } from '../services/uploadService';
import toast from 'react-hot-toast';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageUpload.css';

const ImageUpload = ({
  onImageUploaded,
  currentImage = '',
  aspectRatio = null,
  minWidth = 100,
  minHeight = 100,
  maxSize = 5 * 1024 * 1024, // 5MB
  placeholder = "Cliquez pour sélectionner une image",
  showPreview = true,
  cropEnabled = true
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentImage);

  // Mettre à jour l'aperçu quand currentImage change
  useEffect(() => {
    console.log('ImageUpload currentImage changé:', currentImage);
    setImagePreview(currentImage);
  }, [currentImage]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: aspectRatio });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    // Validation de la taille
    if (file.size > maxSize) {
      toast.error(`Le fichier est trop volumineux. Taille maximale: ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    setSelectedFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      if (cropEnabled) {
        setShowCropModal(true);
      } else {
        // Si pas de crop, upload directement
        handleDirectUpload(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectUpload = async (file) => {
    setLoading(true);
    try {
      const response = await uploadService.uploadImage(file);
      const imageUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${response.url}`;
      setImagePreview(imageUrl);
      onImageUploaded(imageUrl);
      toast.success('Image uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setLoading(false);
    }
  };

  const getCroppedImg = useCallback((image, crop, fileName) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!crop || !ctx || !completedCrop?.width || !completedCrop?.height) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.imageSmoothingQuality = 'high';

    // Appliquer la rotation si nécessaire
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          blob.name = fileName;
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop, rotation]);

  const handleCropSave = async () => {
    if (!imageRef.current || !completedCrop?.width || !completedCrop?.height) {
      toast.error('Veuillez ajuster le cadrage');
      return;
    }

    setLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageRef.current,
        completedCrop,
        selectedFile.name
      );

      if (croppedImageBlob) {
        // Créer un nouveau fichier à partir du blob
        const croppedFile = new File([croppedImageBlob], selectedFile.name, {
          type: 'image/jpeg',
        });

        // Upload du fichier cropé
        const response = await uploadService.uploadImage(croppedFile);
        const imageUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${response.url}`;

        setImagePreview(imageUrl);
        onImageUploaded(imageUrl);
        setShowCropModal(false);
        toast.success('Image uploadée avec succès !');
      }
    } catch (error) {
      console.error('Erreur crop et upload:', error);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = (direction) => {
    setRotation(prev => prev + (direction === 'left' ? -90 : 90));
  };

  const resetCrop = () => {
    setCrop({ unit: '%', width: 90, aspect: aspectRatio });
    setRotation(0);
  };

  return (
    <div className="image-upload-container">
      <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
        {showPreview && imagePreview ? (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <div className="image-overlay">
              <Upload size={24} />
              <span>Changer l'image</span>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <Upload size={48} />
            <p>{placeholder}</p>
            <small>PNG, JPG, GIF jusqu'à {Math.round(maxSize / (1024 * 1024))}MB</small>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Modal de crop */}
      {showCropModal && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h3>Ajuster l'image</h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="close-button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="crop-modal-body">
              <div className="crop-controls">
                <button
                  onClick={() => handleRotate('left')}
                  className="btn btn-outline btn-sm"
                  title="Rotation gauche"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => handleRotate('right')}
                  className="btn btn-outline btn-sm"
                  title="Rotation droite"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={resetCrop}
                  className="btn btn-outline btn-sm"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="crop-container">
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  aspect={aspectRatio}
                  minWidth={minWidth}
                  minHeight={minHeight}
                >
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Crop preview"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      maxHeight: '400px',
                      maxWidth: '100%'
                    }}
                  />
                </ReactCrop>
              </div>
            </div>

            <div className="crop-modal-footer">
              <button
                onClick={() => setShowCropModal(false)}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={handleCropSave}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Upload...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas caché pour le crop */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;
