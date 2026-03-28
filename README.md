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

### 1. Émission (Microservices Java)
Lorsqu'une action métier se produit (ex: un Doyen valide un support de cours), le service concerné (`Support-Service`) publie un message sur l'Exchange RabbitMQ `support_exchange` avec la clé de routage `support.notification`.

### 2. Ingestion & Persistance
Le service de notification, via son consommateur `amqplib`, capte le message instantanément. 
- Il extrait les données (titre, matière, statut).
- Il identifie la liste des destinataires (`recipientUserIds`).
- Il enregistre la notification en base de données pour permettre la consultation ultérieure (historique).

### 3. Distribution Temps Réel (WebSockets)
C'est ici que la magie opère. Dès que la notification est sauvegardée :
- Le service vérifie si les destinataires sont connectés au serveur WebSocket.
- Il utilise l'instance globale **Socket.io** pour émettre l'événement `new_notification`.
- Le message est envoyé uniquement dans la "Room" privée de l'utilisateur (`user_${userId}`).

### 4. Réception & UI (Front-end)
Le client React capte l'événement via le hook `useSocketNotifications`.
- Un **Toast interactif** (Sonner) apparaît instantanément à l'écran.
- L'interface se rafraîchit dynamiquement sans rechargement de page.

---

## 🛠️ Stack Technique

- **Runtime :** Node.js 18+ (Alpine Docker image)
- **Framework :** Express.js (API REST & WebSocket)
- **Messaging :** RabbitMQ (Topic Exchange)
- **Temps Réel :** Socket.io 4.7+
- **ORM :** Sequelize (Dialecte MySQL)
- **Sécurité :** JSON Web Tokens (Validation synchronisée avec User-Service)

---

## 📡 Ports et Connectivité

| Service | Port Interne | Port Externe (Host) |
| :--- | :--- | :--- |
| **API REST & WS** | `3000` | `9095` |
| **RabbitMQ** | `5672` | `5672` |
| **MySQL** | `3306` | `3310` |

---

## 🛠️ Installation & Développement

### Prérequis
- Docker & Docker Compose
- RabbitMQ en cours d'exécution

### Lancement en local
1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Variables d'environnement**
   ```env
   PORT=3000
   JWT_SECRET=c3b3f4d4a5e5b6c6d7e7f8a8b9c9d0e0f1a1b2c2d3e3f4a4b5c5d6e6f7a7b8c8
   DATABASE_URL=mysql://root:root@localhost:3310/campushub_notification_db
   RABBITMQ_HOST=localhost
   ```

3. **Démarrer le service**
   ```bash
   node server.js
   ```

---
<p align="center">Développé avec précision pour l'écosystème CampusHub</p>
