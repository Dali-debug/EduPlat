const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, isTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.video, ...allowedTypes.document];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB par défaut
  }
});

// @route   POST /api/upload/image
// @desc    Upload d'une image - SIMPLE ET EFFICACE
// @access  Private
router.post('/image', auth, upload.single('image'), (req, res) => {
  console.log('=== DÉBUT UPLOAD IMAGE ===');
  console.log('User ID:', req.user?.id || req.user?._id);
  console.log('Fichier reçu:', req.file ? 'OUI' : 'NON');

  try {
    if (!req.file) {
      console.log('❌ Aucun fichier dans la requête');
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    console.log('📁 Fichier:', {
      nom: req.file.filename,
      taille: req.file.size,
      type: req.file.mimetype
    });

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('🔗 URL générée:', fileUrl);

    const response = {
      success: true,
      message: 'Image uploadée avec succès',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    };

    console.log('✅ Réponse envoyée:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'upload',
      error: error.message
    });
  }
});

// @route   POST /api/upload/video
// @desc    Upload d'une vidéo
// @access  Private (Enseignant/Admin)
router.post('/video', auth, isTeacherOrAdmin, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Aucun fichier fourni'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'Vidéo uploadée avec succès',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload vidéo:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de l\'upload'
    });
  }
});

// @route   POST /api/upload/document
// @desc    Upload d'un document
// @access  Private (Enseignant/Admin)
router.post('/document', auth, isTeacherOrAdmin, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Aucun fichier fourni'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'Document uploadé avec succès',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de l\'upload'
    });
  }
});

// Gestion des erreurs multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Fichier trop volumineux'
      });
    }
  }

  if (error.message === 'Type de fichier non autorisé') {
    return res.status(400).json({
      message: 'Type de fichier non autorisé'
    });
  }

  res.status(500).json({
    message: 'Erreur lors de l\'upload'
  });
});

module.exports = router;
