# Scalable Web Application

## Description
Une application web simple et scalable, implémentée avec Node.js, Express, MongoDB et EJS.

## Structure du projet
```
/server
├── /config
│   └── db.js
├── /controllers
│   ├── authController.js
│   └── pageController.js
├── /models
│   └── User.js
├── /routes
│   ├── authRoutes.js
│   └── pageRoutes.js
├── /middlewares
│   └── auth.js
├── /public
│   └── /css
│       └── style.css
├── /views
│   ├── home.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   └── dashboard.ejs
├── app.js
└── .env
```

## Setup
1. Installer Node.js et MongoDB.
2. Cloner le projet ou extraire le ZIP.
3. Dans le dossier `/server`, exécuter `npm install`.
4. Configurer le fichier `.env`:
   - `MONGO_URI`: URI de connexion MongoDB.
   - `SESSION_SECRET`: Clé secrète pour les sessions.
   - `PORT`: Port d'écoute (optionnel, défaut 3000).
5. Lancer le serveur:
   ```bash
   npm start
   ```
6. En production, configurer un reverse proxy (NGINX) et un store de sessions externe (Redis).

## Scalabilité
- Architecture MVC pour séparer les responsabilités.
- Variables d'environnement pour la configuration.
- Routes modulaires.
- Middleware pour logging, sécurité (Helmet), rate limiting.
- Sessions stockées dans MongoDB (ou Redis pour plus de performance).
- Support cluster Node.js pour multi-core CPU.
- NGINX en tant que reverse proxy pour la tolérance et la montée en charge.
