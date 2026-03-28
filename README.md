# 🔔 CampusHub - Notification Service (Real-time Hub)

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

> Ce microservice est le **système nerveux** de CampusHub. Il orchestre la distribution des alertes et des notifications en temps réel entre les microservices métier (Java/Spring) et l'interface utilisateur (React).

---

## 🚀 Fonctionnalités Clés

- **Ingestion RabbitMQ** : Consommateur haute performance pour les événements asynchrones.
- **Communication Temps Réel** : Serveur WebSocket (Socket.io) pour le push instantané vers les clients.
- **Canaux Sécurisés** : Authentification par Web Token (JWT) pour garantir la confidentialité des notifications.
- **Persistance des Données** : Archivage complet des notifications via Sequelize et MySQL.
- **Isolation par Utilisateur** : Système de "Rooms" privées pour une distribution ciblée des messages.

---

## 🧬 Système de Transit des Notifications

Le flux d'une notification dans CampusHub suit un parcours optimisé en 4 étapes :

1. **Émission (Microservices Java)** : Le `Support-Service` publie un message sur l'Exchange RabbitMQ `support_exchange`.
2. **Ingestion & Persistance** : Ce service capte le message, identifie les `recipientUserIds` et enregistre la notification en base de données.
3. **Distribution WebSocket** : Le service vérifie les connexions actives et "pousse" le message via Socket.io dans la room privée `user_${userId}`.
4. **Réception UI** : Le client React affiche un **Toast interactif** et rafraîchit l'interface dynamiquement.

---

## 🛠️ Installation et Configuration

### 1. Prérequis
Assurez-vous d'avoir installé les outils suivants sur votre machine :
- **Node.js** (v18.0.0 ou supérieur)
- **Docker & Docker Compose** (recommandé pour l'infrastructure)
- **MySQL 8.0**
- **RabbitMQ**

### 2. Variables d'Environnement
Créez un fichier `.env` à la racine du service ou configurez-les dans votre environnement :

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute du serveur Node.js | `3000` |
| `JWT_SECRET` | Clé secrète de signature des tokens (doit être identique à User-Service) | `c3b3f4d...` |
| `DATABASE_URL` | URL de connexion à la base de données MySQL | `mysql://root:root@localhost:3306/db` |
| `RABBITMQ_HOST` | Hôte du serveur RabbitMQ | `localhost` |
| `RABBITMQ_USER` | Utilisateur RabbitMQ | `guest` |
| `RABBITMQ_PASS` | Mot de passe RabbitMQ | `guest` |

### 3. Installation Manuelle (Développement)
Si vous souhaitez lancer le service sans Docker :

```bash
# Accéder au dossier
cd campushub-notification-service

# Installer les dépendances
npm install

# Lancer le service en mode développement
node server.js
```

### 4. Déploiement via Docker (Production / Standard)
Le service est conçu pour fonctionner dans l'écosystème Docker de CampusHub :

```bash
# Build de l'image
docker build -t campushub-notification-service .

# Lancement via Docker Compose (à la racine du projet parent)
docker compose up -d campushub-notification-service
```

---

## 📡 API & WebSockets

### Endpoints REST
- `GET /api/notifications/user/:userId` : Récupère l'historique des notifications d'un utilisateur.
- `PUT /api/notifications/mark-as-read/:userNotificationId` : Marque une notification spécifique comme lue.
- `DELETE /api/notifications/:userNotificationId` : Supprime une notification de l'utilisateur.

### Événements WebSocket (Socket.io)
- **Connexion** : Requiert un JWT valide dans le champ `auth.token`.
- **Émission (`new_notification`)** : Envoyé par le serveur vers le client.
  ```json
  {
    "id": 12,
    "userNotificationId": 45,
    "titre": "Support d'Algèbre",
    "statut": "VALIDÉ",
    "matiere": "Mathématiques",
    "createdAt": "2024-03-27T10:00:00Z"
  }
  ```

---

## 📡 Ports et Connectivité (Mapping Docker)

| Service | Port Interne | Port Externe (Host) |
| :--- | :--- | :--- |
| **Notification API & WS** | `3000` | `9095` |
| **RabbitMQ Ingestion** | `5672` | `5672` |
| **MySQL Storage** | `3306` | `3310` |

---
<p align="center">Développé avec précision pour l'écosystème CampusHub</p>
