# Plateforme d'Éducation en Ligne

Une plateforme moderne d'apprentissage en ligne avec sessions live, vidéos, quiz et exercices interactifs.

## 🚀 Fonctionnalités

- **Sessions Live** : Visioconférences en temps réel
- **Cours Vidéo** : Lecteur vidéo intégré avec suivi de progression
- **Quiz Interactifs** : Auto-correction et statistiques
- **Exercices** : Séries d'exercices avec solutions
- **Dashboard** : Suivi des progrès et statistiques
- **Authentification** : Système sécurisé avec JWT

## 🛠️ Technologies

### Frontend
- React.js 18
- React Router v6
- Axios
- CSS Modules
- Socket.io-client

### Backend
- Node.js
- Express.js
- MongoDB avec Mongoose
- JWT Authentication
- Socket.io
- bcrypt

## 📦 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/Dali-debug/plateforme-education-en-ligne.git
cd plateforme-education-en-ligne
```

2. **Installer toutes les dépendances**
```bash
npm run install:all
```

3. **Configuration de l'environnement**
```bash
# Backend
cd backend
cp .env.example .env
# Modifier les variables d'environnement

# Frontend
cd ../frontend
cp .env.example .env
```

4. **Démarrer en mode développement**
```bash
npm run dev
```

## 🌐 URLs

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **MongoDB** : mongodb://localhost:27017/education_platform

## 📁 Structure

```
├── frontend/          # Application React
├── backend/           # API Node.js/Express
├── README.md
└── package.json
```

## 🔧 Variables d'environnement

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/education_platform
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚦 Scripts disponibles

- `npm run dev` : Démarre frontend et backend
- `npm run dev:frontend` : Démarre seulement le frontend
- `npm run dev:backend` : Démarre seulement le backend
- `npm run build` : Build de production
- `npm run install:all` : Installe toutes les dépendances

## 👥 Rôles utilisateurs

- **Étudiant** : Accès aux cours, quiz, sessions live
- **Enseignant** : Création de cours, gestion des sessions
- **Admin** : Gestion complète de la plateforme

## 📚 API Documentation

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Cours
- `GET /api/courses` - Liste des cours
- `GET /api/courses/:id` - Détails d'un cours
- `POST /api/courses` - Créer un cours (Enseignant)

### Quiz
- `GET /api/quiz/:courseId` - Quiz d'un cours
- `POST /api/quiz/:id/submit` - Soumettre les réponses

## 🔒 Sécurité

- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Validation des données d'entrée
- Protection CORS

## 📱 Responsive Design

L'interface est entièrement responsive et s'adapte à tous les écrans.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

MIT License