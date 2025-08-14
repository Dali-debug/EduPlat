const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Route pour servir les images avec les bons headers CORS
router.get('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const imagePath = path.join(__dirname, '../uploads', filename);

        console.log('📸 Tentative de servir l\'image:', filename);
        console.log('📁 Chemin complet:', imagePath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Image non trouvée:', filename);
            return res.status(404).json({ error: 'Image non trouvée' });
        }

        // Headers CORS spécifiques pour les images
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        res.header('Cross-Origin-Opener-Policy', 'cross-origin');
        res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

        // Déterminer le type MIME
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.webp':
                contentType = 'image/webp';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
        }

        res.header('Content-Type', contentType);
        res.header('Cache-Control', 'public, max-age=86400'); // Cache 24h

        console.log('✅ Envoi de l\'image avec headers CORS:', filename);

        // Envoyer le fichier
        res.sendFile(imagePath);

    } catch (error) {
        console.error('❌ Erreur lors du service de l\'image:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route OPTIONS pour preflight CORS
router.options('/:filename', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.status(200).send();
});

module.exports = router;
